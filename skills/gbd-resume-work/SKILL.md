---
name: gbd-resume-work
description: "Use when the author returns to a book after a break and needs context restored — what draft/chapter we're in, what was last done, and where to pick up. Triggers: \"resume\", \"continue\", \"where were we\", \"pick up where I left off\", \"what was I doing\"."
allowed-tools:
  - Read
  - Bash
  - Write
  - Glob
  - Grep
  - AskUserQuestion
  - SlashCommand
---

<objective>
Restore full book context after a break so "where were we?" has an immediate, complete answer.

Handles:
- STATE.md loading (or reconstruction from OUTLINE.md + chapter artifacts + git log if missing)
- last-artifact detection (the Resume file in STATE.md, or the most recently touched chapter)
- incomplete-work detection (a PLAN.md with no SUMMARY.md; a SUMMARY.md with no passing
  VERIFICATION.md)
- a concise status presentation
- context-aware routing to the next `/gbd:` command
</objective>

<execution_context>
@$HOME/.claude/get-books-done/workflows/resume-work.md
@$HOME/.claude/get-books-done/references/conventions.md
</execution_context>

<process>
Execute the workflow end-to-end. If STATE.md is missing, offer to reconstruct it before
routing. Restore context, then recommend the next action — do not start heavy work without
confirmation.
</process>
