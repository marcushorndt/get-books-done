<purpose>
Verify the manuscript against the story bible and produce a severity-classified
CONTINUITY.md in `.book/reviews/`. Confirms the bible exists, checks the config gate,
scopes the manuscript (range/--scope → chapter glob; default whole book), spawns the
gbd-continuity-checker agent (which ALWAYS reads the full bible), commits the artifact, and
presents results.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting —
conventions.md (markers, naming, the THREADS setup/payoff ledger), craft-fiction.md (the
causation/knowledge-state discipline the checker enforces), git-conventions.md.
</required_reading>

<available_agent_types>
- gbd-continuity-checker: Verifies manuscript vs bible/{CHARACTERS,WORLD,TIMELINE,THREADS}.md.
  Emits `## CONTINUITY COMPLETE`.
</available_agent_types>

<process>

<step name="initialize">
Parse the optional range argument and flags.
```bash
GBD="node $HOME/.claude/get-books-done/engine/bin/gbd-tools.cjs"
gbd(){ command -v node >/dev/null 2>&1 && [ -f "$HOME/.claude/get-books-done/engine/bin/gbd-tools.cjs" ] || return 1; o=$($GBD "$@" 2>/dev/null) || return 1; case "$o" in @file:*) cat "${o#@file:}";; *) printf '%s' "$o";; esac; }

RANGE_ARG="${1}"
SCOPE_OVERRIDE=""
for arg in "$@"; do
  case "$arg" in
    --scope=*) SCOPE_OVERRIDE="${arg#--scope=}" ;;
  esac
done
```
`RANGE_ARG` may be empty (whole book), a single chapter (`03`), or a range (`1-5`).
If present, validate it matches `^[0-9]+(-[0-9]+)?$`; otherwise warn and treat as whole book.
</step>

<step name="check_bible">
The bible is the ground truth — it must exist.
```bash
BIBLE_FILES=$(ls .book/bible/{CHARACTERS,WORLD,TIMELINE,THREADS}.md 2>/dev/null)
if [ -z "$BIBLE_FILES" ]; then
  echo "No story bible found under .book/bible/. Run /gbd-map-manuscript to build it first."
  exit 0
fi
```
Note which of the four core files exist; pass only existing ones to the agent.
</step>

<step name="check_config_gate">
```bash
# Preferred: engine reads the toggle; literal default true if unset/unavailable.
CONTINUITY_ENABLED=$(gbd config-get workflow.continuity_review --raw); [ -n "$CONTINUITY_ENABLED" ] || CONTINUITY_ENABLED=true
# Fallback (engine/node absent): read .book/config.json directly.
#   node -e "try{console.log(require('./.book/config.json').workflow.continuity_review)}catch(e){console.log('true')}"
```
If "false": print `Continuity review skipped (workflow.continuity_review=false in config).` and exit.
Default true — skip on explicit false only. Runs AFTER the bible check.
</step>

<step name="compute_manuscript_scope">
Resolve the in-scope manuscript prose. The bible is ALWAYS read in full — cross-references
reach backward and forward, so the checker needs the whole bible even for a single chapter.

Prefer the engine to enumerate chapters when scoping: `gbd chapter.list` returns each
chapter's dir/slug, which keys the manuscript glob precisely. If the engine is unavailable,
glob `manuscript/` directly as below.
```bash
# Preferred: engine enumerates chapters to scope from (dir + slug per chapter).
CH_LIST=$(gbd chapter.list)   # JSON; use its slugs to target manuscript/<slug>/ globs

SCOPE="${SCOPE_OVERRIDE:-${RANGE_ARG:+chapter}}"   # default book when no range/flag
SCOPE="${SCOPE:-book}"

MANUSCRIPT_SCENES=()
if [ "$SCOPE" = "book" ]; then
  while IFS= read -r f; do MANUSCRIPT_SCENES+=("$f"); done < <(find manuscript -name '*.md' -type f | sort)
  REVIEW_LABEL="book"
else
  # Expand RANGE_ARG (single "03" or range "1-5") into padded chapter prefixes,
  # then glob each chapter's manuscript directory/files.
  START="${RANGE_ARG%%-*}"; END="${RANGE_ARG##*-}"
  for n in $(seq "$START" "$END"); do
    P=$(printf '%02d' "$n")
    while IFS= read -r f; do MANUSCRIPT_SCENES+=("$f"); done < <(ls manuscript/${P}-*/*.md manuscript/${P}-*.md 2>/dev/null | sort)
  done
  REVIEW_LABEL=$(printf '%02d' "$START")
  [ "$START" != "$END" ] && REVIEW_LABEL="${REVIEW_LABEL}-$(printf '%02d' "$END")"
fi
```
Filter non-prose, dedupe, sort.
</step>

<step name="check_empty_scope">
If `MANUSCRIPT_SCENES` is empty:
```
No drafted manuscript prose found in scope. Skipping continuity review.
```
Exit workflow. Do NOT spawn the agent.
</step>

<step name="spawn_checker">
```bash
if [ "$REVIEW_LABEL" = "book" ]; then
  CONTINUITY_PATH=".book/reviews/book-CONTINUITY.md"
else
  CONTINUITY_PATH=".book/reviews/${REVIEW_LABEL}-CONTINUITY.md"
fi
mkdir -p .book/reviews
```

**Setup/payoff ledger (engine-sourced):** before spawning, pull the continuity graph's
ledger so the checker's setup/payoff pass starts from deterministic data instead of
re-parsing the bible. Pass these to the agent as a `<ledger>` hint alongside the pointers.
```bash
# Preferred: engine reports graph status + the unpaid (open) setups.
INTEL_STATUS=$(gbd intel.status)        # JSON: counts, freshness, contradiction tally
OPEN_SETUPS=$(gbd intel.open-setups)    # JSON: setups opened but not yet paid off
```
If the engine is unavailable (or no graph has been built), this hint is simply omitted —
the checker still derives the ledger from `bible/THREADS.md` as before (the documented
fallback). Run `/gbd-story-bible build` to populate the graph for the engine-sourced path.

Spawn `gbd-continuity-checker` with POINTERS only. Include a `<required_reading>` block listing
every existing `bible/{CHARACTERS,WORLD,TIMELINE,THREADS}.md` file AND every in-scope
manuscript scene, plus a `<config>` block:
```
<config>
scope: <book | chapter>
review_label: <book | NN | NN-MM>
continuity_path: <CONTINUITY_PATH>
bible_files:
  - .book/bible/CHARACTERS.md
  - .book/bible/WORLD.md
  - .book/bible/TIMELINE.md
  - .book/bible/THREADS.md
manuscript_scenes:
  - <path/to/scene.md>
ledger:                         # engine-sourced hint; omit entirely if no graph/engine
  open_setups: <from gbd intel.open-setups>
  graph_status: <from gbd intel.status>
</config>
```

Wait for the agent. Detect `## CONTINUITY COMPLETE`. If absent, report failure and surface
the agent output; do not commit a partial artifact.
</step>

<step name="commit_review">
```bash
# Preferred: engine stages + commits deterministically.
gbd commit "chore(book): continuity review ${REVIEW_LABEL}" "$CONTINUITY_PATH" \
  || git add "$CONTINUITY_PATH" && git commit -m "chore(book): continuity review ${REVIEW_LABEL}" || true
```
(Skip if `config.planning.commit_docs=false`.)
</step>

<step name="present_results">
Parse CONTINUITY.md frontmatter (`findings.blocker/should_fix/note/total`, `status`).
Print an inline summary grouped by severity (physical-fact / timeline / knowledge-state /
ledger). Then:
- `status: clean`: report consistent; suggest proceeding.
- BLOCKER findings present: list them and route the author to correction —
  `/gbd-editorial-review NN --fix` (the applier can apply `fix(...)` corrections) or manual edit,
  then re-run `/gbd-continuity-review`.
</step>

</process>

<success_criteria>
- [ ] Bible presence confirmed before any agent spawn; only existing bible files passed.
- [ ] Config gate honored (skip on explicit false only).
- [ ] Manuscript scope computed (range/--scope → glob; default whole book); empty scope skips.
- [ ] Full bible ALWAYS passed regardless of manuscript scope.
- [ ] gbd-continuity-checker spawned with POINTERS only; `## CONTINUITY COMPLETE` detected.
- [ ] Artifact committed `chore(book): continuity review NN` (unless commit_docs=false).
- [ ] BLOCKER findings routed to a correction path; results summarized inline.
</success_criteria>
