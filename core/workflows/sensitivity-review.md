<purpose>
Run a sensitivity / authenticity read over the manuscript and produce a severity-classified
SENSITIVITY.md in `.book/reviews/`. Checks the config gate, scopes the manuscript
(range/default → chapter glob; default whole book), spawns the gbd-sensitivity-reader agent,
commits the artifact, and presents results. Findings are advisory and never auto-applied.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting —
conventions.md (markers, naming), craft-fiction.md (representation/voice context),
git-conventions.md.
</required_reading>

<available_agent_types>
- gbd-sensitivity-reader: Flags representation, stereotype, factual/libel, and cultural-accuracy
  concerns with constructive, passage-cited notes. Emits `## SENSITIVITY COMPLETE`.
</available_agent_types>

<process>

<step name="initialize">
Parse the optional range argument and the focus flag.
```bash
GBD="node $HOME/.claude/get-books-done/engine/bin/gbd-tools.cjs"
gbd(){ command -v node >/dev/null 2>&1 && [ -f "$HOME/.claude/get-books-done/engine/bin/gbd-tools.cjs" ] || return 1; o=$($GBD "$@" 2>/dev/null) || return 1; case "$o" in @file:*) cat "${o#@file:}";; *) printf '%s' "$o";; esac; }

RANGE_ARG="${1}"
FOCUS="all"
for arg in "$@"; do
  case "$arg" in
    --focus=*) FOCUS="${arg#--focus=}" ;;
  esac
done
case "$FOCUS" in
  representation|culture|factual|all) ;;
  *) echo "Warning: invalid --focus '${FOCUS}'. Using 'all'."; FOCUS="all" ;;
esac
```
`RANGE_ARG` may be empty (whole book), `03`, or `1-5`. If present, validate
`^[0-9]+(-[0-9]+)?$`; otherwise warn and treat as whole book.
</step>

<step name="check_config_gate">
```bash
# Preferred: engine reads the toggle; literal default true if unset/unavailable.
SENS_ENABLED=$(gbd config-get workflow.sensitivity_review --raw); [ -n "$SENS_ENABLED" ] || SENS_ENABLED=true
# Also resolve book_type for grounding (fiction|nonfiction|general); default general.
BOOK_TYPE=$(gbd config-get book_type --raw); [ -n "$BOOK_TYPE" ] || BOOK_TYPE=general
# Fallback (engine/node absent): read .book/config.json directly.
#   node -e "try{console.log(require('./.book/config.json').workflow.sensitivity_review)}catch(e){console.log('true')}"
#   node -e "try{console.log(require('./.book/config.json').book_type)}catch(e){console.log('general')}"
```
If "false": print `Sensitivity review skipped (workflow.sensitivity_review=false in config).` and exit.
Default true — skip on explicit false only.
</step>

<step name="compute_manuscript_scope">
Prefer the engine to enumerate chapters when scoping: `gbd chapter.list` returns each
chapter's dir/slug to key the manuscript glob. If the engine is unavailable, glob
`manuscript/` directly as below.
```bash
# Preferred: engine enumerates chapters to scope from (dir + slug per chapter).
CH_LIST=$(gbd chapter.list)   # JSON; use its slugs to target manuscript/<slug>/ globs
if [ -z "$RANGE_ARG" ]; then
  MANUSCRIPT_SCENES=(); REVIEW_LABEL="book"
  while IFS= read -r f; do MANUSCRIPT_SCENES+=("$f"); done < <(find manuscript -name '*.md' -type f | sort)
else
  START="${RANGE_ARG%%-*}"; END="${RANGE_ARG##*-}"
  MANUSCRIPT_SCENES=()
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
No drafted manuscript prose found in scope. Skipping sensitivity review.
```
Exit workflow. Do NOT spawn the agent.
</step>

<step name="spawn_reader">
```bash
if [ "$REVIEW_LABEL" = "book" ]; then
  SENS_PATH=".book/reviews/book-SENSITIVITY.md"
else
  SENS_PATH=".book/reviews/${REVIEW_LABEL}-SENSITIVITY.md"
fi
mkdir -p .book/reviews
```

Spawn `gbd-sensitivity-reader` with POINTERS only. Include a `<required_reading>` block (the
in-scope manuscript scenes, plus `bible/CHARACTERS.md` and `bible/WORLD.md` for grounding if
they exist) and a `<config>` block:
```
<config>
focus: <representation | culture | factual | all>
review_label: <book | NN | NN-MM>
sensitivity_path: <SENS_PATH>
manuscript_scenes:
  - <path/to/scene.md>
grounding:
  - .book/bible/CHARACTERS.md
  - .book/bible/WORLD.md
</config>
```

Wait for the agent. Detect `## SENSITIVITY COMPLETE`. If absent, report failure and surface
output; do not commit a partial artifact.
</step>

<step name="commit_review">
```bash
# Preferred: engine stages + commits deterministically.
gbd commit "chore(book): sensitivity review ${REVIEW_LABEL}" "$SENS_PATH" \
  || git add "$SENS_PATH" && git commit -m "chore(book): sensitivity review ${REVIEW_LABEL}" || true
```
(Skip if `config.planning.commit_docs=false`.)
</step>

<step name="present_results">
Parse SENSITIVITY.md frontmatter (`findings.high/medium/note/total`, `status`).
Print an inline summary grouped by category (representation / culture / factual-libel).
State clearly that these notes are ADVISORY — GBD never auto-applies sensitivity findings.
The author reviews each note and decides. For factual/libel HIGH findings, recommend
verifying real-person/place references before publication.
</step>

</process>

<success_criteria>
- [ ] Config gate honored (skip on explicit false only).
- [ ] Focus flag validated; manuscript scope computed (range/default → glob); empty scope skips.
- [ ] gbd-sensitivity-reader spawned with POINTERS only; `## SENSITIVITY COMPLETE` detected.
- [ ] Artifact committed `chore(book): sensitivity review NN` (unless commit_docs=false).
- [ ] Results summarized inline; findings explicitly marked advisory (never auto-applied).
</success_criteria>
