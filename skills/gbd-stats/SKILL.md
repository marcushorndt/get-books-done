---
name: gbd-stats
description: "Use when the author wants the numbers — word counts, chapters drafted/verified, promises delivered, writing velocity, and the timeline. Triggers: \"stats\", \"word count\", \"how many chapters done\", \"how fast am I writing\", \"how far along am I\", \"book metrics\"."
allowed-tools:
  - Read
  - Bash
  - Glob
  - Grep
---

<objective>
Display comprehensive book statistics: word counts (drafted vs target), chapters drafted /
verified, reader promises delivered vs outstanding, writing velocity, and the project
timeline from git history.
</objective>

<execution_context>
@$HOME/.claude/get-books-done/workflows/stats.md
@$HOME/.claude/get-books-done/references/conventions.md
</execution_context>

<process>
Execute the workflow end-to-end. Report numbers only — no routing, no next-step commentary
(that is `/gbd-progress`'s job).
</process>
