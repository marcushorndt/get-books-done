---
name: gbd-progress
description: "Use when the author wants to know where the book stands and what to do next — position in the draft, chapter progress, and the recommended next GBD command. Triggers: \"where are we\", \"what's next\", \"book status\", \"progress\", \"what should I do now\"."
argument-hint: "[--next | --do \"freeform intent\"]"
allowed-tools:
  - Read
  - Bash
  - Grep
  - Glob
  - SlashCommand
  - AskUserQuestion
---

<objective>
The unified situational command for a book. Reports draft/chapter position from STATE.md plus
the OUTLINE.md progress table, then routes to the next GBD action.

Three modes:
- **default**: progress report + intelligent route recommendation (which `/gbd:` command to
  run next), surfaced as a choice — does not act without confirmation.
- **--next**: auto-advance to the next logical step (scans for incomplete chapter work first),
  no manual route selection.
- **--do "intent"**: match freeform natural language to the best `/gbd:` command, confirm the
  match, and hand off — never does the work itself.
</objective>

<flags>
- **--next**: detect current position and invoke the next logical GBD step automatically.
- **--do "…"**: smart dispatcher — match freeform intent to a `/gbd:` command, confirm, hand off.
- **(no flag)**: progress report + routed next-action recommendation.
</flags>

<execution_context>
@$HOME/.claude/get-books-done/workflows/progress.md
@$HOME/.claude/get-books-done/references/conventions.md
</execution_context>

<process>
Arguments: $ARGUMENTS
Parse the first token:
- `--next` → strip it, run the next-step routine (pass through remaining flags e.g. --force).
- `--do` → strip it, pass the remainder as freeform intent to the dispatcher routine.
- otherwise → run the progress report + routing routine end-to-end.

Preserve all routing rules in the workflow. Recommend, then confirm — never silently start
heavy work in default mode.
</process>
