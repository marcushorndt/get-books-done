---
name: gbd-continuity-review
description: "Use when the author wants the manuscript checked against the story bible for contradictions — physical facts, timeline/ordering, who-knows-what, and unpaid setups or unsupported payoffs. Triggers: \"check continuity\", \"did I break anything\", \"are the facts consistent\", \"continuity pass\", \"check the timeline\"."
argument-hint: "[chapter-range, e.g. 1-5 or 03] [--scope=book|chapter]"
allowed-tools:
  - Read
  - Bash
  - Glob
  - Grep
  - Write
  - Agent
  - AskUserQuestion
---

<objective>
Verify the manuscript against the story bible and surface every continuity defect.
Spawns the `gbd-continuity-checker` agent over `bible/{CHARACTERS,WORLD,TIMELINE,THREADS}.md`
plus the in-scope `manuscript/` prose. Produces `.book/reviews/{padded_chapter}-CONTINUITY.md`
(or `book-CONTINUITY.md` for a whole-book pass) with severity-classified findings.

Detects: physical-fact contradictions (eye color, geography, object state), timeline /
ordering errors, knowledge-state leaks (a character or the narration knowing something
not yet learned in-story), and ledger defects — setups opened but not paid, payoffs
that arrive without setup (THREADS setup/payoff ledger).

Arguments:
- Chapter range (optional) — `03`, `1-5`, or omit for the whole book. Default scope = book.
- `--scope=book|chapter` (optional) — override; `chapter` restricts the manuscript scope to
  the named chapter(s) but ALWAYS reads the full bible (cross-references reach backward and forward).

Output: `{padded_chapter}-CONTINUITY.md` (or `book-CONTINUITY.md`) in `.book/reviews/`
+ an inline summary.
</objective>

<execution_context>
@$HOME/.claude/get-books-done/workflows/continuity-review.md
@$HOME/.claude/get-books-done/references/conventions.md
@$HOME/.claude/get-books-done/references/craft-fiction.md
@$HOME/.claude/get-books-done/references/git-conventions.md
</execution_context>

<context>
Range: $ARGUMENTS (first positional argument is an optional chapter or range)

Optional flags parsed from $ARGUMENTS:
- `--scope=book|chapter` — manuscript scope override. The bible is always read in full.

Context files (the bible/ files and the in-scope manuscript chapters) are resolved inside
the workflow and delegated to the agent via `<files_to_read>` pointers — never pasted into
orchestrator context.
</context>

<process>
This command is a thin dispatch layer. It parses arguments and delegates to the workflow.

Execute end-to-end.

The workflow (not this command) enforces these gates:
- Bible presence check (if `bible/` is missing/empty, instruct the author to run map-manuscript first).
- Config gate check (`workflow.continuity_review`).
- Manuscript scoping (range/--scope → chapter glob; default = whole book).
- Empty-scope check (skip if no drafted prose in range).
- Agent spawning (gbd-continuity-checker), result commit (`chore(book): continuity review NN`).
- Result presentation (inline summary + next steps; BLOCKER findings route to fixes via
  `/gbd:editorial-review NN --fix` or manual correction).
</process>
