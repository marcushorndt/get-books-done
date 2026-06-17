---
name: gbd-discuss-chapter
description: "Use when the author wants to scope a chapter before planning it — lock down what it must accomplish, POV, what's revealed. Triggers: \"let's talk through chapter 3\", \"discuss the next chapter\", \"what should this chapter do\"."
argument-hint: "<chapter> [--text]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
Gather chapter context through adaptive conversation and lock it into `NN-CONTEXT.md` before planning. The locked decisions (D-01…) flow downstream to the researcher, planner, and drafter and are never silently dropped.

**How it works:**
1. Load prior context (BOOK.md, PROMISE.md, STATE.md, the chapter's OUTLINE.md entry, prior CONTEXT.md files, any bible/ entries)
2. In `general` book_type, ask whether this chapter is scene-driven or argument-driven and tag CONTEXT.md
3. Identify the open questions for this chapter — skip anything already decided upstream
4. Adaptive deep-dive on each until the author is satisfied (ref questioning.md)
5. Capture scope creep as Deferred Ideas, not new decisions
6. Write `NN-CONTEXT.md` with locked decisions, promises advanced, author's discretion

**Output:** `.book/chapters/NN-slug/NN-CONTEXT.md` — decisions concrete enough that downstream agents act without re-asking the author.

**After this command:** Run `/gbd:plan-chapter NN`.
</objective>

<execution_context>
@$HOME/.claude/get-books-done/workflows/discuss-chapter.md
@$HOME/.claude/get-books-done/references/questioning.md
@$HOME/.claude/get-books-done/references/conventions.md
@$HOME/.claude/get-books-done/references/mode-fiction-vs-nonfiction.md
@$HOME/.claude/get-books-done/templates/context.md
</execution_context>

<context>
Chapter number: $ARGUMENTS (required)

**Flags:**
- `--text` — Use plain-text numbered lists instead of AskUserQuestion menus (for remote sessions).
</context>

<process>
**MANDATORY:** Read the workflow file BEFORE taking any action — the objective above is a summary; the workflow holds the full step-by-step with all interaction patterns.
Execute end-to-end. Preserve adaptive questioning, the deferred-ideas redirect for scope creep, decision locking, the `chore(book)` commit, and routing to `/gbd:plan-chapter`.
</process>
