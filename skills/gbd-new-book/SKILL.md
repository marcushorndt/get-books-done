---
name: gbd-new-book
description: "Use when the author wants to start a new book, set up a fresh `.book/` workspace, or onboard an existing manuscript into GBD. Triggers: \"start a book\", \"new book\", \"set up GBD here\", \"I have a draft manuscript\"."
argument-hint: "[--auto] [@idea-or-pitch.md]"
allowed-tools:
  - Read
  - Bash
  - Write
  - Glob
  - Grep
  - Agent
  - AskUserQuestion
---

<objective>
Initialize a new book through a unified flow: adaptive questioning → config → vision artifacts → optional research → outline. The most leveraged moment in the whole book — deep questioning here yields better chapters, drafts, and verification downstream.

**Creates (in `.book/`):**
- `BOOK.md` — premise, genre, audience, comps, POV/tense, themes (the vision)
- `config.json` — workflow toggles, `book_type`, prose defaults
- `PROMISE.md` — the checkable promises to the reader
- `STATE.md` — project memory digest
- `research/` — comps/genre/subject research (optional)
- `OUTLINE.md` — act → chapter structure with progress table

**After this command:** Run `/gbd-discuss-chapter 1` to scope the opening chapter.
</objective>

<execution_context>
@$HOME/.claude/get-books-done/workflows/new-book.md
@$HOME/.claude/get-books-done/references/questioning.md
@$HOME/.claude/get-books-done/references/conventions.md
@$HOME/.claude/get-books-done/references/git-conventions.md
@$HOME/.claude/get-books-done/references/mode-fiction-vs-nonfiction.md
@$HOME/.claude/get-books-done/templates/book.md
@$HOME/.claude/get-books-done/templates/promise.md
@$HOME/.claude/get-books-done/templates/state.md
@$HOME/.claude/get-books-done/templates/config.json
</execution_context>

<context>
Arguments: $ARGUMENTS

**Flags:**
- `--auto` — Hands-off mode. Once the config questions are answered, carry through research and outline on sensible defaults without pausing for more input. An idea or pitch document (via @ reference or pasted text) is required.
</context>

<process>
Execute the workflow end-to-end.
Preserve all workflow gates (`confirm_book`, `confirm_outline`), the brownfield offer, the `git init` offer, agent spawns, commits, and routing to `/gbd-discuss-chapter 1`.
</process>
