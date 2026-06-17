---
name: gbd-plan-chapter
description: "Use when a chapter has a CONTEXT.md and the author wants beat sheets / scene cards to draft from. Triggers: \"plan chapter 3\", \"break this chapter into scenes\", \"plan the gap fixes\", \"how should this chapter go\"."
argument-hint: "[chapter] [--research | --skip-research] [--gaps] [--view]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Agent
  - WebFetch
  - WebSearch
  - AskUserQuestion
---

<objective>
Create executable beat sheets (`NN-NN-PLAN.md` files) for a chapter, with optional research and a plan-quality revision loop.

**Default flow:** Research (if enabled) → Plan → Verify (plan-checker) → Done

**Orchestrator role:** Parse arguments, validate the chapter has a CONTEXT.md, optionally spawn `gbd-chapter-researcher` (writes `NN-RESEARCH.md`), spawn `gbd-planner` (writes `NN-NN-PLAN.md` beat sheets), verify with `gbd-plan-checker`, iterate until pass or max 3 iterations (ref revision-loop.md), commit, present results.

**After this command:** Run `/gbd:draft-chapter NN`.
</objective>

<execution_context>
@$HOME/.claude/get-books-done/workflows/plan-chapter.md
@$HOME/.claude/get-books-done/references/conventions.md
@$HOME/.claude/get-books-done/references/revision-loop.md
@$HOME/.claude/get-books-done/references/promise-backward.md
@$HOME/.claude/get-books-done/references/mode-fiction-vs-nonfiction.md
@$HOME/.claude/get-books-done/templates/beat-sheet.md
</execution_context>

<context>
Chapter number: $ARGUMENTS (optional — auto-detects the next scoped-but-unplanned chapter if omitted)

**Flags:**
- `--research` — Force re-research even if `NN-RESEARCH.md` exists.
- `--skip-research` — Skip research, go straight to planning.
- `--gaps` — Gap-closure mode: read `NN-VERIFICATION.md` and plan ONLY the PARTIAL/MISSING gap fixes (skips research). Gap plans get `gap_closure: true` in frontmatter.
- `--view` — Print existing `NN-NN-PLAN.md` files read-only; spawn nothing.
</context>

<process>
**MANDATORY:** Read the workflow file BEFORE acting.
Execute end-to-end. Preserve the revision loop (max 3, escalate on stall), the `confirm_chapter_plan` gate, the `chore(book)` commit, gap-closure mode, and routing to `/gbd:draft-chapter`.
</process>
