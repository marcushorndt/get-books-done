<purpose>
Editorially review a chapter's drafted prose and produce a severity-classified REVIEW.md
in `.book/reviews/`. Computes scene scope (--scenes override > SUMMARY.md scenes >
manuscript chapter glob), checks the config gate, resolves book_type and depth, spawns the
gbd-editor agent, commits REVIEW.md, and presents results. With --fix, spawns
gbd-edit-applier (optionally in a bounded revision loop) to apply findings to manuscript prose.
</purpose>

<required_reading>
Open each file named in the invoking prompt's `<execution_context>` before acting — they define how this step is meant to run;
especially conventions.md (markers, naming, commit format), craft-fiction.md and
craft-nonfiction.md (the rubrics the editor applies), style-sheet.md (the copy-pass target),
and revision-loop.md (the --auto loop contract).
</required_reading>

<available_agent_types>
- gbd-editor: Two-pass editorial review (developmental + line/voice). Emits `## REVIEW COMPLETE`.
- gbd-edit-applier: Applies REVIEW.md findings to manuscript prose; one atomic commit per finding.
</available_agent_types>

<process>

<step name="initialize">
Parse arguments and locate the chapter.

```bash
GBD="node $HOME/.claude/get-books-done/engine/bin/gbd-tools.cjs"
gbd(){ command -v node >/dev/null 2>&1 && [ -f "$HOME/.claude/get-books-done/engine/bin/gbd-tools.cjs" ] || return 1; o=$($GBD "$@" 2>/dev/null) || return 1; case "$o" in @file:*) cat "${o#@file:}";; *) printf '%s' "$o";; esac; }

CH_ARG="${1}"
# Normalize to padded form (e.g. "3" -> "03", "3.1" -> "03.1")
if ! [[ "$CH_ARG" =~ ^[0-9]+(\.[0-9]+)?$ ]]; then
  echo "Error: Invalid chapter number format: '${CH_ARG}'. Expected digits (e.g., 03, 03.1)."
  exit 1
fi
PADDED_CH=$(printf '%02d' "${CH_ARG%%.*}")
[[ "$CH_ARG" == *.* ]] && PADDED_CH="${PADDED_CH}.${CH_ARG#*.}"

# Resolve the chapter directory under .book/chapters/ by its NN-slug prefix.
CH_DIR=$(ls -d .book/chapters/${PADDED_CH}-* 2>/dev/null | head -1)
```

**Chapter validation (before config gate):**
If `CH_DIR` is empty, report and exit:
```
Error: Chapter ${CH_ARG} not found under .book/chapters/. Run /gbd-outline to see chapters.
```

**Drafted check (before config gate):**
A chapter is reviewable only once drafted — it must have at least one `*-SUMMARY.md`.
Ask the engine for the chapter's artifact state first; fall back to a disk glob if the
engine is unavailable.
```bash
# Preferred: engine confirms the chapter is drafted (SUMMARY present) and reports scenes.
CH_STATE=$(gbd chapter.state "${CH_ARG%%.*}")
if [ -n "$CH_STATE" ]; then
  # $CH_STATE is JSON: artifacts present + plan index. Treat SUMMARY-present as drafted.
  case "$CH_STATE" in *'"summary"'*|*SUMMARY*) DRAFTED=true ;; *) DRAFTED=false ;; esac
else
  # Fallback (engine/node absent): glob the chapter dir directly.
  SUMMARIES=$(ls "${CH_DIR}"/*-SUMMARY.md 2>/dev/null)
  [ -n "$SUMMARIES" ] && DRAFTED=true || DRAFTED=false
fi
if [ "$DRAFTED" != "true" ]; then
  echo "Chapter ${CH_ARG} has no SUMMARY.md — it has not been drafted yet."
  echo "Run /gbd-draft-chapter ${CH_ARG} first, then return for editorial review."
  exit 0
fi
```
When the engine returned `$CH_STATE`, prefer its scene list to scope scenes in
<step name="compute_scene_scope"> (Tier 2 below) instead of re-parsing SUMMARY.md by hand.

Parse optional flags from $ARGUMENTS:

```bash
DEPTH_OVERRIDE=""
SCENES_OVERRIDE=""
FIX=false; FIX_ALL=false; FIX_AUTO=false
for arg in "$@"; do
  case "$arg" in
    --depth=*)  DEPTH_OVERRIDE="${arg#--depth=}" ;;
    --scenes=*) SCENES_OVERRIDE="${arg#--scenes=}" ;;
    --fix)      FIX=true ;;
    --all)      FIX_ALL=true ;;
    --auto)     FIX_AUTO=true ;;
  esac
done
```
</step>

<step name="check_config_gate">
```bash
# Preferred: engine reads the toggle; literal default true if unset/unavailable.
EDITORIAL_ENABLED=$(gbd config-get workflow.editorial_review --raw); [ -n "$EDITORIAL_ENABLED" ] || EDITORIAL_ENABLED=true
# Fallback (engine/node absent): read .book/config.json directly.
#   node -e "try{console.log(require('./.book/config.json').workflow.editorial_review)}catch(e){console.log('true')}"
```
If `EDITORIAL_ENABLED` is "false":
```
Editorial review skipped (workflow.editorial_review=false in config).
```
Exit workflow. The flag defaults to true; bail out only when it is set explicitly to false.
This check runs AFTER the chapter/drafted validation so user errors surface first.
</step>

<step name="resolve_book_type">
Resolve the rubric mode the editor will apply.
```bash
# Preferred: engine reads book_type; literal default general if unset/unavailable.
BOOK_TYPE=$(gbd config-get book_type --raw); [ -n "$BOOK_TYPE" ] || BOOK_TYPE=general
# Fallback (engine/node absent): read .book/config.json directly.
#   node -e "try{console.log(require('./.book/config.json').book_type)}catch(e){console.log('general')}"
```
Valid: `fiction` | `nonfiction` | `general`. Invalid → warn and default to `general`.
For `general`, the editor runs the fiction developmental rubric AND the nonfiction
soundness/citation flags where applicable.
</step>

<step name="resolve_depth">
Pick the depth in this order of precedence: the --depth flag wins, then config
`workflow.editorial_review_depth`, and failing both, fall back to `standard`.
```bash
REVIEW_DEPTH="$DEPTH_OVERRIDE"
if [ -z "$REVIEW_DEPTH" ]; then
  # Preferred: engine reads the configured depth; literal default standard if unset/unavailable.
  CFG_DEPTH=$(gbd config-get workflow.editorial_review_depth --raw)
  # Fallback (engine/node absent): read .book/config.json directly.
  #   node -e "try{console.log(require('./.book/config.json').workflow.editorial_review_depth||'')}catch(e){console.log('')}"
  REVIEW_DEPTH="${CFG_DEPTH:-standard}"
fi
case "$REVIEW_DEPTH" in
  quick|standard|deep) ;;
  *) echo "Warning: invalid depth '${REVIEW_DEPTH}'. Using 'standard'."; REVIEW_DEPTH="standard" ;;
esac
```
</step>

<step name="compute_scene_scope">
Three-tier scoping with explicit precedence.

**Tier 1 — --scenes override (highest precedence):**
If `SCENES_OVERRIDE` is set, split on commas. Each entry is either a draft file path
(e.g. `manuscript/03-the-betrayal/02-confrontation.md`) or a scene slug. Validate each path
is inside the repo and exists on disk; warn-and-skip the rest. Skip Tiers 2–3 entirely.

**Tier 2 — SUMMARY.md scenes (primary):**
If --scenes not provided, prefer the scene list from the engine's `$CH_STATE`
(`gbd chapter.state`, captured in <step name="initialize">) — its plan index already
enumerates the drafted scenes + their manuscript paths. If the engine was unavailable,
fall back to reading each `*-SUMMARY.md` in `CH_DIR` and extracting the drafted scene files
it lists (the SUMMARY records scenes written + their manuscript paths). Collect into
`REVIEW_SCENES`.

**Tier 3 — manuscript chapter glob (fallback):**
If no scenes were extracted from SUMMARY, glob the chapter's prose directly:
```bash
CH_SLUG=$(basename "$CH_DIR")               # e.g. 03-the-betrayal
REVIEW_SCENES=( manuscript/${CH_SLUG}/*.md )
[ -e "${REVIEW_SCENES[0]}" ] || REVIEW_SCENES=( manuscript/${PADDED_CH}-*.md )
```

**Post-processing (all tiers):** filter non-prose (`.book/`, notes, READMEs), drop files
missing on disk, deduplicate, sort. Log the final scope and the tier it came from.
</step>

<step name="check_empty_scope">
If `REVIEW_SCENES` is empty:
```
No drafted prose found for chapter ${CH_ARG}. Skipping editorial review.
```
Exit workflow. Do NOT spawn the agent or create REVIEW.md.
</step>

<step name="spawn_editor">
Resolve the output path and spawn gbd-editor.
```bash
REVIEW_PATH=".book/reviews/${PADDED_CH}-REVIEW.md"
mkdir -p .book/reviews
```

Spawn the `gbd-editor` agent. Pass POINTERS, never file contents. Include a
`<required_reading>` block (BOOK.md, the chapter CONTEXT.md, bible/STYLE.md, bible/VOICE.md,
and the in-scope scene files), and a `<config>` block:

```
<config>
chapter: <PADDED_CH>-<slug>
chapter_dir: <CH_DIR>
review_path: <REVIEW_PATH>
depth: <REVIEW_DEPTH>          # quick | standard | deep
book_type: <BOOK_TYPE>         # fiction | nonfiction | general
scenes:
  - <path/to/scene1.md>
  - <path/to/scene2.md>
</config>
```

Wait for the agent to return. Detect the `## REVIEW COMPLETE` marker. If absent, report the
agent failed and surface its output; do not commit a partial REVIEW.md.
</step>

<step name="commit_review">
Commit the artifact unless `config.planning.commit_docs=false`:
```bash
# Preferred: engine stages + commits deterministically.
gbd commit "chore(book): editorial review chapter ${PADDED_CH}" "$REVIEW_PATH" \
  || git add "$REVIEW_PATH" && git commit -m "chore(book): editorial review chapter ${PADDED_CH}" || true
```
</step>

<step name="present_results">
Parse REVIEW.md frontmatter (`findings.critical/should_fix/suggestion/total`, `status`).
Print an inline summary grouped by severity with finding IDs and one-line titles. Then:
- If `status: clean` and not `--fix`: report clean, suggest `/gbd-continuity-review ${CH_ARG}`.
- If issues and not `--fix`: show counts; offer `/gbd-editorial-review ${CH_ARG} --fix`.
- If `--fix`: proceed to apply_fixes.
</step>

<step name="apply_fixes" condition="FIX == true">
Resolve fix scope: `critical_shouldfix` by default, `all` if `--fix --all`.

Spawn `gbd-edit-applier`. Pass a `<required_reading>` block (REVIEW.md, bible/STYLE.md, the
scene files referenced by findings) and a `<config>` block:
```
<config>
chapter: <PADDED_CH>-<slug>
chapter_dir: <CH_DIR>
review_path: <REVIEW_PATH>
fix_scope: <critical_shouldfix | all>
fix_report_path: .book/reviews/<PADDED_CH>-REVIEW-FIX.md
padded_chapter: <PADDED_CH>
</config>
```

The applier runs in an isolated git worktree, applies one atomic commit per finding
(`edit({chapter}-{plan}): …` for line/voice, `fix({chapter}-{plan}): …` for continuity/fact
corrections it is asked to make), appends recurring style decisions to `bible/STYLE.md`
(committed `bible: style sheet — …`), and writes REVIEW-FIX.md. The ORCHESTRATOR detects
the applier's commits via `git log` — there is no completion marker for the applier.

**Non-auto:** after the applier returns, report fixed/skipped counts from REVIEW-FIX.md and stop.

**--auto (bounded revision loop, max 3 — per references/revision-loop.md):**
```
iteration = 1
loop:
  re-spawn gbd-editor over the same scenes (now edited)   # fresh REVIEW.md
  if status == clean OR only Suggestion-severity remain:  accept, exit
  prev = issue_count(previous REVIEW.md)
  curr = issue_count(this REVIEW.md)
  iteration += 1
  if iteration > 3:        escalate (AskUserQuestion)
  if curr >= prev:         escalate (loop stalled)
  re-spawn gbd-edit-applier on the new REVIEW.md
```
**Escalation (AskUserQuestion):** surface the remaining findings verbatim and offer:
- "Proceed anyway" — accept the prose with the noted findings.
- "Adjust approach" — discuss a different strategy, then re-enter the loop.
Never loop silently more than 3 times.
</step>

</process>

<success_criteria>
- [ ] Chapter validated and confirmed drafted (SUMMARY.md present) before any agent spawn.
- [ ] Config gate honored (skip on explicit false only).
- [ ] book_type and depth resolved and passed to the editor.
- [ ] Scene scope computed with --scenes > SUMMARY > manuscript-glob precedence; empty scope skips.
- [ ] gbd-editor spawned with POINTERS only; `## REVIEW COMPLETE` detected before committing.
- [ ] REVIEW.md committed `chore(book): editorial review chapter NN` (unless commit_docs=false).
- [ ] --fix spawns gbd-edit-applier; commits detected via git log; REVIEW-FIX.md reported.
- [ ] --auto loop bounded at 3 with stall-detection and AskUserQuestion escalation.
</success_criteria>
