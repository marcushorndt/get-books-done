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

Mode routing:
- **default** (no flag): Add a new integer chapter at the end of the current act → add-chapter
- **--insert**: Insert work as a decimal/split chapter (e.g. 3.1) after an existing chapter → insert-chapter
- **--remove**: Remove a future (unplanned) chapter and renumber subsequent integer chapters → remove-chapter
- **--edit**: Edit any field of an existing chapter in place → edit-chapter
- **--view**: Print the outline + progress table, read-only → view-outline
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

Parse the first token of $ARGUMENTS:
- `--insert` → strip the flag, pass remainder (`<after-chapter-number> <description>`) to insert-chapter
- `--remove` → strip the flag, pass remainder (chapter number) to remove-chapter
- `--edit` → strip the flag, pass remainder (`<chapter-number>`) to edit-chapter
- `--view` → view-outline (no further args needed)
- Otherwise → pass all of $ARGUMENTS (chapter description) to add-chapter
</context>

<process>
1. Parse the leading flag (if any) from $ARGUMENTS.
2. Load and execute the matching workflow section end-to-end.
3. Preserve the IMMUTABILITY gate (refuse to renumber or rewrite scoped chapters; split instead) and the `outline` commit.
</process>
