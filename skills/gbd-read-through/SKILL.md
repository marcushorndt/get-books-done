---
name: gbd-read-through
description: "Use when a chapter is drafted and the author wants to check the prose actually landed its promises. Triggers: \"read through chapter 3\", \"does this chapter work\", \"verify the chapter\", \"did the turn land\"."
argument-hint: "[chapter] [--resume]"
allowed-tools:
  - Read
  - Bash
  - Glob
  - Grep
  - Edit
  - Write
  - Agent
  - AskUserQuestion
---

<objective>
Validate a drafted chapter through conversational, promise-backward verification — does the actual prose in `manuscript/` deliver each `must_land` beat, turn, and reveal, and advance the promised PROMISE.md items? Not "were words written" but "did the meaning land".

Purpose: walk the author (or a beta reader) through one check at a time, plain-text reactions, no interrogation. State persists in `NN-READTHROUGH.md` so the session survives a `/clear` and can resume.

**Routing on completion:**
- gaps found (PARTIAL/MISSING) → route to `/gbd:plan-chapter NN --gaps`
- pass → write `NN-VERIFICATION.md` (`status: passed`) and route to `/gbd:progress`

**Output:** `NN-READTHROUGH.md` tracking every check; on pass, `NN-VERIFICATION.md`.
</objective>

<execution_context>
@$HOME/.claude/get-books-done/workflows/read-through.md
@$HOME/.claude/get-books-done/references/conventions.md
@$HOME/.claude/get-books-done/references/promise-backward.md
@$HOME/.claude/get-books-done/references/mode-fiction-vs-nonfiction.md
@$HOME/.claude/get-books-done/templates/read-through.md
</execution_context>

<context>
Chapter: $ARGUMENTS (optional)
- If provided: read through that chapter.
- If omitted: resume the most recent in-progress READTHROUGH.md, else prompt for a chapter.

**Flags:**
- `--resume` — Force-resume an in-progress `NN-READTHROUGH.md` from where it left off.
</context>

<process>
**MANDATORY:** Read the workflow file BEFORE acting.
Execute end-to-end. Preserve session resume, one-check-at-a-time presentation, promise-backward evidence (quote the prose), the gap → `--gaps` route, and the pass → VERIFICATION.md + `/gbd:progress` route.
</process>
