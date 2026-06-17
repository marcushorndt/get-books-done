---
name: gbd-map-manuscript
description: "Use when an existing manuscript needs a story bible reverse-engineered from the prose, or the bible is stale after drafting. Triggers: \"build the story bible\", \"map the manuscript\", \"map characters/timeline/threads\", \"refresh the bible\", \"what does the bible say about <X>\", \"diff the bible against the prose\"."
argument-hint: "[--query <term>|status|diff|refresh] [focus: characters|world|timeline|threads|voice]"
allowed-tools:
  - Read
  - Bash
  - Glob
  - Grep
  - Write
  - Agent
---

<objective>
Reverse-engineer a story bible into `.book/bible/` from the prose already written in `manuscript/`, using parallel `gbd-bible-mapper` agents.

Each mapper agent takes ONE focus area, reads the prose, and **writes the matching `.book/bible/*.md` file directly** with chapter-level EVIDENCE. The orchestrator only collects confirmations (never file contents), verifies the files exist, and commits — keeping its own context lean.

The bible is the continuity contract: the drafter consults it for voice and per-chapter knowledge state; the continuity checker and verifier consult it to catch contradictions. It is built FROM the prose, so it always reflects what is actually on the page, not what the outline intended.

Output: `.book/bible/` with six documents — CHARACTERS.md, WORLD.md, TIMELINE.md, THREADS.md, VOICE.md, STYLE.md.
</objective>

<execution_context>
@$HOME/.claude/get-books-done/workflows/map-manuscript.md
@$HOME/.claude/get-books-done/references/conventions.md
@$HOME/.claude/get-books-done/references/craft-fiction.md
@$HOME/.claude/get-books-done/references/mode-fiction-vs-nonfiction.md
</execution_context>

<flags>
- **(no flag)**: Maps everything at once — launches 5 `gbd-bible-mapper` agents (one per focus area) that together (re)build all six bible documents from `manuscript/`.
- **<focus>**: A single bare focus word (`characters`, `world`, `timeline`, `threads`, `voice`) maps just that area — spawns one agent, refreshes only its document(s).
- **--query <term>**: Bible lookup mode. Greps the existing `.book/bible/` for the term and reports which characters/places/threads/setups mention it, with chapter refs. Runs inline; spawns no agent.
- **--query status**: Report bible freshness — which documents exist, their line counts, and whether the manuscript has advanced past the last map (compares newest `manuscript/` mtime against newest `bible/` mtime).
- **--query diff**: Show what changed in `manuscript/` since the bible was last built (chapters added/modified), so the author can decide whether to refresh.
- **--query refresh**: Re-run the full parallel map over the current prose, overwriting the existing bible. Equivalent to the no-flag run but explicit and non-interactive (skips the "already exists" prompt).
</flags>

<context>
Arguments: $ARGUMENTS

Look at the leading token of $ARGUMENTS:
- `--query`: remove the flag and run the query workflow, treating the remaining token(s) as the subcommand (`<term>`, `status`, `diff`, or `refresh`).
- One of `characters|world|timeline|threads|voice`: map that single area and nothing else.
- Empty: map all six documents together in parallel.

**Load book state if it exists:**
Read `.book/config.json` for `book_type` (`fiction|nonfiction|general`) and `.book/STATE.md` for current position. `book_type` selects the mapper rubric (characters vs. key people/sources; threads vs. argument threads) per `mode-fiction-vs-nonfiction.md`. If `.book/` does not exist, the manuscript has no planning tree yet — tell the author to run `/gbd-new-book` first, then STOP.

**Prerequisite:** `manuscript/` must contain prose. If it is empty or missing, there is nothing to map — report that and STOP (the bible is built FROM prose, not invented).
</context>

<when_to_use>
**Use map-manuscript for:**
- An imported or in-progress manuscript that has no `.book/bible/` yet (reverse-engineer the continuity contract).
- Refreshing the bible after several chapters were drafted and the canon drifted from the outline.
- A single focus refresh (e.g. `timeline`) after a chapter changed the chronology.
- Looking up what the canon says about an entity (`--query <name>`).

**Skip map-manuscript for:**
- A book with no prose yet (greenfield) — there is nothing to read. Plan and draft first.
- Inventing new canon — this command DESCRIBES what is on the page, it does not author. To create new bible facts, draft the prose, then re-map.
- Building the continuity GRAPH — that is `/gbd-story-bible build` (this skill produces the human-readable bible Markdown that the graph indexes).
</when_to_use>

<process>
1. Parse the leading token (see <context>) to pick mode: full | single-focus | query.
2. Verify prerequisites: `.book/` exists (else route to `/gbd-new-book`); `manuscript/` has prose (else STOP).
3. **Query modes** (`--query …`) run inline — grep/stat the existing bible, report, STOP. Never spawn an agent for query/status/diff.
4. **Map modes:**
   a. If `.book/bible/` already exists and this is a no-flag run, ask: Refresh / Single-focus / Skip. `--query refresh` skips this prompt.
   b. `mkdir -p .book/bible`.
   c. Spawn `gbd-bible-mapper` agents IN PARALLEL (one Agent block, multiple tool calls), one per focus area, each given: the `manuscript/` path, its focus, `book_type`, today's date, and POINTERS to the conventions + craft refs. Full run = 5 agents; single-focus = 1.
   d. Wait for all agents; collect their confirmation lines only (focus + files written + line counts). Do NOT read the bible contents into orchestrator context.
   e. Verify every expected `.book/bible/*.md` file exists and is non-empty (Bash `wc -l`). If any is missing, re-spawn that one mapper once.
5. Commit: `bible: map manuscript → CHARACTERS/WORLD/TIMELINE/THREADS/VOICE/STYLE` (or the single document mapped). Metadata-only changes use `chore(book):`.
6. Offer next steps: `/gbd-story-bible build` (index the bible into the continuity graph), or `/gbd-plan-chapter` for the next chapter.
</process>

<self_qc>
Before reporting done:
- [ ] Correct mode selected from the leading token.
- [ ] `.book/` and `manuscript/` prerequisites verified (routed/STOPPED if absent).
- [ ] Agents spawned in PARALLEL with pointers, not pasted prose.
- [ ] Only confirmations collected — bible contents never pulled into orchestrator context.
- [ ] Every expected `bible/*.md` verified present and non-empty on disk.
- [ ] Committed with `bible:` (content) or `chore(book):` (metadata) prefix.
- [ ] `book_type` rubric honored (fiction vs. nonfiction vocabulary).
</self_qc>
