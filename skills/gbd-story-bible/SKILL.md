---
name: gbd-story-bible
description: "Use when the author wants the continuity graph built, queried, or inspected — the machine-readable index of who/what/where and which setups are still unpaid. Triggers: \"build the continuity graph\", \"where does <character> appear\", \"what setups are open\", \"is anything contradicted\", \"story bible status\", \"inspect the graph\"."
argument-hint: "[build|query <entity>|status|inspect]"
allowed-tools:
  - Read
  - Bash
  - Glob
  - Grep
  - Agent
---

<objective>
Build, query, and inspect the continuity graph at `.book/graphs/continuity-graph.json` — the machine-readable index of the story's canon, derived from `manuscript/` prose and the `.book/bible/` documents.

The graph captures:
- **Nodes:** `character`, `place`, `item`, `fact`, `setup`
- **Edges:** `appears-in` (entity → chapter), `knows` (character → fact), `located-at` (entity → place), `sets-up` → `pays-off` (setup → payoff chapter), `contradicts` (node ↔ node where the prose disagrees with itself or the bible)

It answers the questions a continuity editor asks: where does a character appear, what does each character know by which chapter, which setups are still open (Chekhov's guns un-fired), and where the prose contradicts itself. Where the bible is the human-readable contract, the graph is its queryable index — the drafter and continuity checker hit the graph for fast answers instead of re-reading the whole manuscript.

The build/rebuild work is done by the `gbd-intel-updater` agent, which reads the prose + bible and writes the JSON directly. The skill is the thin dispatch + query layer.
</objective>

<execution_context>
@$HOME/.claude/get-books-done/workflows/story-bible.md
@$HOME/.claude/get-books-done/references/conventions.md
@$HOME/.claude/get-books-done/references/craft-fiction.md
</execution_context>

<subcommands>
| Argument | Mode | Runs |
|----------|------|------|
| `build` | (Re)build the graph from manuscript + bible | spawns `gbd-intel-updater`, then commits |
| `query <entity>` | Look up one entity's nodes + edges (appearances, knowledge, open setups) | inline |
| `status` | Graph freshness + node/edge counts + STALE/FRESH vs. manuscript | inline |
| `inspect` | Full structural report: all open setups, contradictions, orphan nodes, knowledge-state table | inline |
| (none / unknown) | Show usage | inline |
</subcommands>

<context>
Arguments: $ARGUMENTS

Parse the first token of $ARGUMENTS:
- `build` → build mode (spawn agent).
- `query` → strip the token, treat the remainder as the entity name → inline query.
- `status` → inline status.
- `inspect` → inline inspect.
- anything else / empty → print the usage block below and STOP.

**Usage block:**
```
GBD > STORY BIBLE (continuity graph)

Usage: /gbd:story-bible <mode>

Modes:
  build              Build or rebuild .book/graphs/continuity-graph.json
  query <entity>     Show an entity's appearances, knowledge, and open setups
  status             Graph freshness and node/edge counts
  inspect            Open setups, contradictions, orphans, knowledge-state table
```

**Prerequisites (build mode):** `manuscript/` must contain prose AND `.book/bible/` should exist (run `/gbd:map-manuscript` first). If the bible is missing, build can still proceed from prose alone but is less reliable — warn the author, then continue. If `manuscript/` is empty, STOP.
</context>

<when_to_use>
**Use story-bible for:**
- Building the continuity index after `/gbd:map-manuscript` so downstream agents can query canon fast.
- Checking which setups are still open before a chapter that should pay one off (`inspect`).
- Confirming a character could not yet know a fact at a given chapter (`query <character>` → knowledge state).
- Finding where the prose contradicts the bible or itself (`inspect` → contradictions).

**Skip story-bible for:**
- Writing the human-readable bible — that is `/gbd:map-manuscript` (this skill indexes what that produces).
- Greenfield books with no prose — there is nothing to index.
- Editing canon — fix the prose or the bible, then re-`build`. Never hand-edit the JSON (it is regenerated and your edit will be lost).
</when_to_use>

<process>
1. Parse the leading token (see <context>). Unknown/empty → print usage, STOP.
2. **query / status / inspect** run inline: read `.book/graphs/continuity-graph.json`. If it does not exist, tell the author to run `/gbd:story-bible build` first and STOP.
   - **query <entity>:** find nodes whose name matches `<entity>` (case-insensitive). Report node type, `appears-in` chapters, `knows` facts (with the chapter each was learned), `located-at` places, and any `sets-up`/`pays-off` or `contradicts` edges. If no match: `No graph node matches '<entity>'.`
   - **status:** report `_meta.built_at`, node/edge counts by type, and STALE vs. FRESH (compare newest `manuscript/` mtime to `_meta.built_at`).
   - **inspect:** print four sections — Open setups (`sets-up` with no matching `pays-off`), Contradictions (`contradicts` edges), Orphan nodes (no edges), and the per-character knowledge-state table.
3. **build** mode:
   a. Verify prerequisites (prose present; warn if bible absent).
   b. `mkdir -p .book/graphs`.
   c. Spawn ONE `gbd-intel-updater` agent with pointers to `manuscript/`, `.book/bible/`, the target JSON path, `book_type`, and today's date. It reads and writes the JSON directly.
   d. Wait for the `## INTEL UPDATE COMPLETE` marker (or `## INTEL UPDATE FAILED` → surface the reason, STOP).
   e. Verify `.book/graphs/continuity-graph.json` exists and is valid JSON (`node -e 'JSON.parse(require("fs").readFileSync(...))'` or `python3 -m json.tool`).
   f. Commit: `bible: build continuity graph (<N> nodes, <M> edges)`.
   g. Report counts and any contradictions/open setups the agent flagged.
</process>

<anti_patterns>
1. DO NOT hand-edit `.book/graphs/continuity-graph.json` — it is regenerated by the agent; edits are lost. Fix the prose or bible and re-build.
2. DO NOT spawn an agent for query/status/inspect — those are inline reads. Only `build` spawns.
3. DO NOT pull the full graph JSON into orchestrator context during build — collect the agent's confirmation marker + counts only.
4. DO NOT build over an empty manuscript — there is nothing to index.
5. DO NOT skip JSON validation after build — a malformed graph silently breaks every downstream query.
</anti_patterns>

<self_qc>
- [ ] Mode parsed; usage shown for unknown/empty.
- [ ] Inline modes never spawned an agent; missing-graph case routed to build.
- [ ] build verified prerequisites and produced VALID JSON on disk.
- [ ] Only the completion marker + counts collected from the agent.
- [ ] Committed with `bible:` prefix when the graph changed.
</self_qc>
