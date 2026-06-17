---
name: gbd-draft-chapter
description: "Use when a chapter has PLAN.md beat sheets and the author wants the prose written. Triggers: \"draft chapter 3\", \"write the scenes\", \"turn the beats into prose\", \"execute this chapter\"."
argument-hint: "<chapter> [--wave N] [--gaps-only]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Agent
  - AskUserQuestion
---

<objective>
Draft a chapter by turning its beat sheets into prose, using wave-based parallelization.

Orchestrator stays lean: discover the chapter's `NN-NN-PLAN.md` files, group them by their `wave` frontmatter, spawn one `gbd-drafter` per plan (in parallel within a wave), collect each `NN-NN-SUMMARY.md` + the per-scene `draft(...)` commits, optionally spawn `gbd-verifier`, update the OUTLINE.md progress table, and route forward.

Each `gbd-drafter` loads its own plan, writes prose to `manuscript/`, commits one scene at a time, and writes its SUMMARY.md. The orchestrator does not write prose itself.

**After this command:** Run `/gbd-read-through NN`.
</objective>

<execution_context>
@$HOME/.claude/get-books-done/workflows/draft-chapter.md
@$HOME/.claude/get-books-done/references/conventions.md
@$HOME/.claude/get-books-done/references/promise-backward.md
@$HOME/.claude/get-books-done/references/git-conventions.md
@$HOME/.claude/get-books-done/references/mode-fiction-vs-nonfiction.md
@$HOME/.claude/get-books-done/templates/summary.md
</execution_context>

<context>
Chapter: $ARGUMENTS

**Available optional flags (active only when the literal token appears in $ARGUMENTS):**
- `--wave N` — Draft only wave `N`. Use to pace work or stay inside usage limits. Chapter verification/completion only runs once no incomplete plans remain.
- `--gaps-only` — Draft only gap-closure plans (`gap_closure: true` in frontmatter). Use after a read-through created fix plans.
</context>

<process>
**MANDATORY:** Read the workflow file BEFORE acting.
Execute end-to-end. Preserve wave grouping, parallel spawn limits, SUMMARY.md + commit collection, the optional verifier spawn, the OUTLINE.md progress update, and routing to `/gbd-read-through`.
</process>
