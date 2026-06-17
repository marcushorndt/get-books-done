---
name: gbd-help
description: "Use when the author wants the list of available GBD commands and how to use them. Triggers: \"gbd help\", \"what commands are there\", \"how does GBD work\", \"list the book commands\", \"what can I do\"."
allowed-tools:
  - Read
---

<objective>
Display the complete GBD command reference, grouped by lifecycle stage.

Output ONLY the reference content from the workflow. Do NOT add:
- book-specific analysis or status
- git/file context
- next-step suggestions
- any commentary beyond the reference
</objective>

<execution_context>
@$HOME/.claude/get-books-done/workflows/help.md
</execution_context>

<process>
Execute end-to-end. Display the reference content directly — no additions or modifications.
</process>
