---
name: gbd-sensitivity-review
description: "Use when the author wants a sensitivity / authenticity read of the manuscript — representation, stereotype, factual-or-libel, and cultural-accuracy concerns flagged with constructive notes. Triggers: \"sensitivity read\", \"check representation\", \"is this respectful/accurate\", \"authenticity read\", \"am I stereotyping\", \"libel check\"."
argument-hint: "[chapter-range, e.g. 1-5 or 03] [--focus=representation|culture|factual|all]"
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
Run a sensitivity / authenticity read over the manuscript and surface representation,
stereotype, factual/libel, and cultural-accuracy concerns. Spawns the
`gbd-sensitivity-reader` agent over the in-scope `manuscript/` prose (and the bible for
character/world grounding). Produces `.book/reviews/{padded_chapter}-SENSITIVITY.md`
(or `book-SENSITIVITY.md` for a whole-book pass) with severity-classified, constructive,
passage-cited notes — never prescriptive rewrites.

Arguments:
- Chapter range (optional) — `03`, `1-5`, or omit for the whole book. Default scope = book.
- `--focus=representation|culture|factual|all` (optional) — narrow the lens. Default = all:
  - representation: identity portrayal, stereotype, tokenism, harmful tropes.
  - culture: cultural-accuracy and authenticity of practices, language, settings.
  - factual: real-person/place references, defamation/libel exposure, real-event accuracy.

Output: `{padded_chapter}-SENSITIVITY.md` (or `book-SENSITIVITY.md`) in `.book/reviews/`
+ an inline summary.
</objective>

<execution_context>
@$HOME/.claude/get-books-done/workflows/sensitivity-review.md
@$HOME/.claude/get-books-done/references/conventions.md
@$HOME/.claude/get-books-done/references/craft-fiction.md
@$HOME/.claude/get-books-done/references/git-conventions.md
</execution_context>

<context>
Range: $ARGUMENTS (first positional argument is an optional chapter or range)

Optional flags parsed from $ARGUMENTS:
- `--focus=representation|culture|factual|all` — lens override. Default = all.

Context files (the in-scope manuscript chapters, bible/CHARACTERS.md and bible/WORLD.md
for grounding) are resolved inside the workflow and delegated to the agent via
`<files_to_read>` pointers — never pasted into orchestrator context.
</context>

<process>
This command is a thin dispatch layer. It parses arguments and delegates to the workflow.

Execute end-to-end.

The workflow (not this command) enforces these gates:
- Config gate check (`workflow.sensitivity_review`).
- Manuscript scoping (range/default → chapter glob; default = whole book).
- Empty-scope check (skip if no drafted prose in range).
- Agent spawning (gbd-sensitivity-reader), result commit (`chore(book): sensitivity review NN`).
- Result presentation (inline summary + next steps). Sensitivity findings are advisory —
  they are NEVER auto-applied; the author decides on each note.
</process>
