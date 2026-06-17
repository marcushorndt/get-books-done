<purpose>
Build, query, and inspect the continuity graph at `.book/graphs/continuity-graph.json` — the
machine-readable index of the story's canon (characters, places, items, facts, setups and the
edges between them).

`build` spawns ONE `gbd-intel-updater` agent that reads `manuscript/` + `.book/bible/` and writes
the JSON directly. `query`, `status`, and `inspect` are inline reads of the existing graph — they
never spawn an agent. This keeps the orchestrator lean: it dispatches the build, validates the
JSON, and commits.
</purpose>

<available_agent_types>
Valid GBD subagent type for this workflow:
- gbd-intel-updater — builds/updates `.book/graphs/continuity-graph.json` and answers entity queries
</available_agent_types>

<graph_schema>
The agent writes (and inline modes read) this shape:
```json
{
  "_meta": { "built_at": "ISO-8601", "version": 1, "book_type": "fiction", "chapters_indexed": ["01","02"] },
  "nodes": [
    { "id": "char:mara",  "type": "character", "name": "Mara",        "attrs": { "locked": ["green eyes (ch01)"] } },
    { "id": "place:dock", "type": "place",     "name": "The Dock",    "attrs": {} },
    { "id": "item:knife", "type": "item",      "name": "Bone knife",  "attrs": {} },
    { "id": "fact:f1",    "type": "fact",      "name": "Mara's father drowned", "attrs": {} },
    { "id": "setup:s1",   "type": "setup",     "name": "Bone knife on the mantel", "attrs": { "promise": "SETUP-01" } }
  ],
  "edges": [
    { "type": "appears-in", "from": "char:mara",  "to": "ch:03" },
    { "type": "knows",      "from": "char:mara",  "to": "fact:f1", "since": "ch:02" },
    { "type": "located-at", "from": "char:mara",  "to": "place:dock", "at": "ch:03" },
    { "type": "sets-up",    "from": "setup:s1",   "to": "ch:03" },
    { "type": "pays-off",   "from": "setup:s1",   "to": "ch:19" },
    { "type": "contradicts","from": "char:mara",  "to": "fact:f2", "note": "ch12 says blue eyes vs ch01 green" }
  ]
}
```
- An **open setup** = a `setup` node with a `sets-up` edge but NO `pays-off` edge.
- A **contradiction** = any `contradicts` edge (prose vs. prose, or prose vs. bible).
- An **orphan** = a node referenced by zero edges.
</graph_schema>

<process>

<step name="parse_mode" priority="first">
Parse the first token of the arguments:
| Token | Mode |
|-------|------|
| `build` | <step name="build"> (spawns agent) |
| `query` | <step name="query"> with remainder as entity (inline) |
| `status` | <step name="status"> (inline) |
| `inspect` | <step name="inspect"> (inline) |
| else/empty | print usage (below), STOP |

**Usage:**
```
GBD > STORY BIBLE (continuity graph)

Usage: /gbd:story-bible <mode>
  build              Build or rebuild .book/graphs/continuity-graph.json
  query <entity>     An entity's appearances, knowledge, open setups
  status             Freshness + node/edge counts
  inspect            Open setups, contradictions, orphans, knowledge-state table
```
</step>

<step name="init_context">
```bash
test -d .book || { echo "No .book/ — run /gbd:new-book first."; exit 1; }
BOOK_TYPE=$(node -e 'try{process.stdout.write((require("./.book/config.json").book_type)||"general")}catch(e){process.stdout.write("general")}')
GRAPH=.book/graphs/continuity-graph.json
DATE=$(date +%F)
```
</step>

<step name="status">
```bash
test -f "$GRAPH" || { echo "No graph yet. Run /gbd:story-bible build first."; exit 0; }
```
Read `$GRAPH`. Report:
- `_meta.built_at`, `_meta.book_type`, `_meta.chapters_indexed`.
- Node counts by type (character / place / item / fact / setup).
- Edge counts by type.
- Open-setup count, contradiction count.
- STALE if any `manuscript/` file is newer than `_meta.built_at` (`find manuscript -newermt "<built_at>"`), else FRESH.
STOP.
</step>

<step name="query">
Entity = the token(s) after `query`.
```bash
test -f "$GRAPH" || { echo "No graph yet. Run /gbd:story-bible build first."; exit 0; }
```
Read `$GRAPH`. Find nodes whose `name` matches the entity case-insensitively. For each match report:
- Node id, type, and locked attrs.
- `appears-in` → list of chapters.
- `knows` → each fact + the `since` chapter (the knowledge-state answer: "Mara knows f1 since ch02").
- `located-at` → places + the chapter.
- `sets-up`/`pays-off` → whether the setup is paid (and where) or OPEN.
- `contradicts` → any contradiction notes.
If no node matches: `No graph node matches '<entity>'.`
STOP.

> A `build` may also delegate a query to `gbd-intel-updater` for very large graphs, but the
> default is this inline read.
</step>

<step name="inspect">
```bash
test -f "$GRAPH" || { echo "No graph yet. Run /gbd:story-bible build first."; exit 0; }
```
Read `$GRAPH`. Print four sections:
1. **Open setups** — `setup` nodes with a `sets-up` edge and NO `pays-off` edge, each with its
   setup chapter and `promise` id. These are unfired Chekhov's guns.
2. **Contradictions** — every `contradicts` edge with its `note`.
3. **Orphan nodes** — nodes referenced by zero edges (likely under-indexed or vestigial).
4. **Knowledge-state table** — per character: facts known and the chapter each was learned
   (`knows`/`since`), so the drafter never lets a POV character act on a fact too early.
STOP.
</step>

<step name="build">
a. Prerequisites:
```bash
ls manuscript/ >/dev/null 2>&1 || { echo "manuscript/ is empty — nothing to index."; exit 1; }
test -d .book/bible || echo "WARN: no .book/bible/ — building from prose alone (less reliable). Consider /gbd:map-manuscript first."
mkdir -p .book/graphs
```
b. Display: `GBD > Building continuity graph...`
c. Spawn ONE `gbd-intel-updater` agent with pointers (no pasted content):
```
You are gbd-intel-updater building the continuity graph.

<required_reading>
- @$HOME/.claude/get-books-done/references/conventions.md
- @$HOME/.claude/get-books-done/references/craft-fiction.md
</required_reading>

Manuscript: ./manuscript/   (read every chapter)
Bible:      ./.book/bible/  (CHARACTERS/WORLD/TIMELINE/THREADS — use as ground truth)
Write:      .book/graphs/continuity-graph.json   (full rebuild)
Book type:  <BOOK_TYPE>
Today:      <DATE>

Extract nodes (character|place|item|fact|setup) and edges
(appears-in|knows|located-at|sets-up|pays-off|contradicts) per the schema in your agent
spec. Flag every open setup and every place the prose contradicts itself or the bible.
End with ## INTEL UPDATE COMPLETE (or ## INTEL UPDATE FAILED + reason).
```
d. Wait for the marker. On `## INTEL UPDATE FAILED`, surface the reason and STOP (do not commit).
e. Validate the JSON:
```bash
node -e 'JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));console.log("valid")' "$GRAPH" \
  || { echo "Graph JSON is malformed — not committing."; exit 1; }
```
f. Read counts for the commit message (node count, edge count). Do NOT pull the full graph body
   into context — just the counts and any open-setup/contradiction tallies the agent reported.
g. Commit:
```bash
git add "$GRAPH"
git commit -m "bible: build continuity graph (<N> nodes, <M> edges)"
```
h. Report node/edge counts, open-setup count, and contradiction count. If contradictions > 0,
   recommend `/gbd:continuity-review`. Offer `/gbd:story-bible inspect` to view details.
</step>

</process>

<anti_patterns>
1. DO NOT hand-edit `continuity-graph.json` — rebuild from prose/bible; edits are overwritten.
2. DO NOT spawn an agent for query/status/inspect — inline reads only.
3. DO NOT commit a malformed graph — validate JSON first; on failure keep the prior graph.
4. DO NOT pull the whole graph into orchestrator context during build — counts + markers only.
5. DO NOT build over an empty manuscript.
</anti_patterns>
