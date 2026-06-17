<purpose>
Orchestrate parallel `gbd-bible-mapper` agents to reverse-engineer a story bible into
`.book/bible/` from the prose in `manuscript/`.

Each agent has fresh context, takes ONE focus area, reads the relevant prose, and **writes
its bible document(s) directly** with chapter-level evidence. The orchestrator only receives
confirmations + line counts, then verifies the files and commits.

Output: `.book/bible/` with six documents — CHARACTERS.md, WORLD.md, TIMELINE.md,
THREADS.md, VOICE.md, STYLE.md — each grounded in chapter references from the actual prose.
</purpose>

<available_agent_types>
The one GBD subagent type this workflow uses (spawn it by its exact name; reach for 'general-purpose' only if that type is not registered):
- gbd-bible-mapper — reads prose for one focus area and writes the matching bible document(s)
</available_agent_types>

<philosophy>
**What dedicated mapper agents buy us:**
- A clean context window for each focus area — characters, timeline, and voice never bleed into one another.
- Each agent writes its bible document on its own, so nothing has to be handed back up to the orchestrator.
- The orchestrator merely notes what got produced, which keeps its context light.
- Every focus area is mapped at the same time rather than one after another.

**The bible is DESCRIPTIVE, built FROM prose.**
Every fact in the bible must cite the chapter(s) it comes from. The mapper never invents
canon — if the prose does not establish a character's eye colour, the bible records it as
"not yet established", not a guess. The bible reflects what is on the page.

**Always cite evidence:**
Bible entries are reference material for the drafter and continuity checker. Each locked
fact, voice note, timeline row, and setup/payoff entry carries a `(ch NN)` reference so a
contradiction can be traced back to its source.
</philosophy>

<process>

<step name="parse_mode" priority="first">
Parse the first token of the arguments:
- `--query` → run the <query_workflow> with the remaining token(s). STOP after.
- One of `characters|world|timeline|threads|voice` → single-focus map (one agent for that area).
- empty → full parallel map (5 agents).

Resolve `FOCUS_SET`:
- full: `characters world timeline threads voice`
- single: just the named focus

Focus → document mapping:
| Focus | Documents written |
|-------|-------------------|
| characters | CHARACTERS.md |
| world | WORLD.md |
| timeline | TIMELINE.md |
| threads | THREADS.md |
| voice | VOICE.md, STYLE.md |
</step>

<step name="init_context" priority="first">
Load book state:
```bash
test -d .book || { echo "No .book/ — run /gbd-new-book first."; exit 1; }
BOOK_TYPE=$(node -e 'try{process.stdout.write((require("./.book/config.json").book_type)||"general")}catch(e){process.stdout.write("general")}')
DATE=$(date +%F)
ls manuscript/ 2>/dev/null | head -5
```
- If `.book/` is absent: tell the author to run `/gbd-new-book` and STOP.
- If `manuscript/` is empty or missing: there is no prose to map — report and STOP.
- `BOOK_TYPE` (`fiction|nonfiction|general`) is passed to every agent; it selects the
  mapper's rubric per `references/mode-fiction-vs-nonfiction.md`.
</step>

<step name="check_existing">
Only for a no-flag full run (skip this prompt when invoked via `--query refresh` or a single focus):

If `.book/bible/` already exists with documents:
```
.book/bible/ already exists:
[list files + line counts]

What's next?
1. Refresh   - remap all six documents from current prose (overwrites)
2. Focus     - remap a single area (characters|world|timeline|threads|voice)
3. Skip      - keep the existing bible as-is
```
Wait for the author.
- Refresh → continue (overwrite).
- Focus → ask which, narrow `FOCUS_SET`, continue.
- Skip → exit workflow.

If `.book/bible/` does not exist: continue.
</step>

<step name="create_structure">
```bash
mkdir -p .book/bible
```
</step>

<step name="spawn_agents">
Spawn `gbd-bible-mapper` agents IN PARALLEL — one Agent tool block containing one tool call
per focus in `FOCUS_SET` (so they run simultaneously). Each agent prompt contains POINTERS,
never pasted prose:

```
You are gbd-bible-mapper. Reverse-engineer one focus area of the story bible from the prose.

<required_reading>
- @$HOME/.claude/get-books-done/references/conventions.md
- @$HOME/.claude/get-books-done/references/craft-fiction.md
- @$HOME/.claude/get-books-done/references/mode-fiction-vs-nonfiction.md
- The bible template for your focus: @$HOME/.claude/get-books-done/templates/bible/<DOC>.md
</required_reading>

Focus: <focus>
Book type: <BOOK_TYPE>
Today's date: <DATE>
Manuscript path: ./manuscript/   (read every chapter file under it)
Write to: .book/bible/<DOC>.md   (and STYLE.md too, if focus = voice)

Read the prose, then write your document(s) directly per the template, with (ch NN)
evidence on every locked fact. Return only a confirmation (focus + files + line counts).
```

Map each focus to its document(s) using the table in <step name="parse_mode">.
</step>

<step name="collect_and_verify">
Wait for all agents. Collect ONLY their confirmation lines (focus, files written, line
counts). Do NOT read the bible contents into orchestrator context.

Verify every expected document exists and is non-empty:
```bash
for f in $EXPECTED_DOCS; do
  test -s ".book/bible/$f" && wc -l ".book/bible/$f" || echo "MISSING: $f"
done
```
If a document is MISSING or empty, re-spawn ONLY that focus's mapper once. If it is still
missing after the retry, report the failure to the author and STOP before committing.
</step>

<step name="commit">
```bash
git add .book/bible/
git commit -m "bible: map manuscript → <list of documents written>"
```
- Use `bible:` for content changes.
- If nothing changed (re-map produced identical files), skip the commit and say so.
</step>

<step name="next_steps">
Report a one-line summary per document (line counts only) and offer:
- `/gbd-story-bible build` — index the bible into the continuity graph.
- `/gbd-plan-chapter <N>` — plan the next chapter against the fresh bible.
- `/gbd-continuity-review` — check the prose against the freshly mapped canon.
</step>

</process>

<query_workflow>
Runs inline. Never spawns an agent.

**`--query <term>`** — bible lookup:
```bash
test -d .book/bible || { echo "No bible yet. Run /gbd-map-manuscript first."; exit 0; }
grep -rin "<term>" .book/bible/ | head -40
```
Report which documents and which entries mention the term, with their `(ch NN)` refs.
If nothing matches: `No bible entry mentions '<term>'.`

**`--query status`** — freshness:
```bash
ls -1 .book/bible/*.md 2>/dev/null | while read f; do wc -l "$f"; done
NEWEST_MS=$(find manuscript -type f -newer .book/bible -print -quit 2>/dev/null)
```
Report which of the six documents exist, their line counts, and STALE (manuscript has files
newer than the bible) vs. FRESH. If `.book/bible/` is absent, say so and suggest a full map.

**`--query diff`** — what changed in prose since the last map:
```bash
find manuscript -type f -newer .book/bible 2>/dev/null
```
List the manuscript files modified since the bible was last built. If any, recommend
`/gbd-map-manuscript --query refresh`. If none, report the bible is up to date.

**`--query refresh`** — full remap: jump to <step name="create_structure"> with
`FOCUS_SET = characters world timeline threads voice`, skipping the check_existing prompt
(overwrite without asking).
</query_workflow>
