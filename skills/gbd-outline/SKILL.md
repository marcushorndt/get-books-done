---
name: gbd-outline
description: "Use when the author wants to change the chapter structure in OUTLINE.md — add, insert, remove, edit, or view a chapter. Triggers: \"add a chapter\", \"split chapter 3\", \"reorder\", \"drop the epilogue\", \"show the outline\"."
argument-hint: "[--insert | --remove | --edit | --view] <chapter-name-or-number>"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
CRUD for chapters in `.book/OUTLINE.md` with a single consolidated command. Chapters are the phase unit and are IMMUTABLE once scoped — to break one apart, SPLIT it (3 → 3.1, 3.2) rather than rewriting 3.

How the flags route:
- **default** (no flag): Append a fresh integer chapter to the tail of the current act → add-chapter
- **--insert**: Slot a decimal/split chapter (e.g. 3.1) in after some existing chapter → insert-chapter
- **--remove**: Drop a not-yet-planned future chapter and renumber the integer chapters that follow → remove-chapter
- **--edit**: Change one or more fields on an existing chapter without moving it → edit-chapter
- **--view**: Show the outline and progress table without writing anything → view-outline
</objective>

<routing>

| Flag | Action | Workflow section |
|------|--------|------------------|
| (none) | Add new integer chapter at end of act | add-chapter |
| --insert | Insert decimal/split chapter (e.g. 3.1) after specified chapter | insert-chapter |
| --remove | Remove future chapter, renumber subsequent | remove-chapter |
| --edit | Edit fields of an existing chapter in place | edit-chapter |
| --view | Print outline read-only | view-outline |

</routing>

<execution_context>
@$HOME/.claude/get-books-done/workflows/outline.md
@$HOME/.claude/get-books-done/references/conventions.md
@$HOME/.claude/get-books-done/templates/outline.md
</execution_context>

<context>
Arguments: $ARGUMENTS

Inspect the leading token of $ARGUMENTS:
- `--insert` → drop the flag and forward what's left (`<after-chapter-number> <description>`) to insert-chapter
- `--remove` → drop the flag and forward what's left (chapter number) to remove-chapter
- `--edit` → drop the flag and forward what's left (`<chapter-number>`) to edit-chapter
- `--view` → view-outline (nothing more to pass)
- Anything else → forward the entire $ARGUMENTS (chapter description) to add-chapter
</context>

<process>
1. Read off the leading flag, if there is one, from $ARGUMENTS.
2. Run the workflow section that flag maps to, all the way through.
3. Hold the IMMUTABILITY gate (never renumber or rewrite a scoped chapter — split it instead) and the `outline` commit.
</process>
