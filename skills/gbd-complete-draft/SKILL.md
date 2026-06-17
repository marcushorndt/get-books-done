---
name: gbd-complete-draft
description: "Use when the author wants to close out a draft cycle and open the next one — finish the zero/first/revision/polish pass and move to the next stage. Triggers: \"complete the first draft\", \"close this draft\", \"the revision is done\", \"start the polish pass\", \"finish draft\"."
argument-hint: "[zero | first | revision | polish]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
Close the current draft cycle (the milestone unit) and open the next. A draft progresses
zero → first → revision → polish; completing one archives that cycle's chapter OUTLINE
phases, moves delivered PROMISE.md items to a delivered ledger, refreshes BOOK.md + STATE.md,
tags the manuscript, and opens the next draft (e.g. first → revision).

Purpose: create a historical record of the shipped draft, keep OUTLINE.md and PROMISE.md
constant-size per cycle, and prepare the book for the next pass.

**Output:** draft archived to `.book/drafts/<draft>-OUTLINE.md` + `<draft>-PROMISE.md`,
delivered promises recorded, BOOK.md + STATE.md updated, git tagged `draft-<name>`, next
cycle opened in OUTLINE.md / PROMISE.md.

**After this command:** Run `/gbd-progress` to see the next-pass position, or `/gbd-distribute`
once the polish draft closes.
</objective>

<execution_context>
@$HOME/.claude/get-books-done/workflows/complete-draft.md
@$HOME/.claude/get-books-done/references/conventions.md
@$HOME/.claude/get-books-done/references/git-conventions.md
@$HOME/.claude/get-books-done/references/revision-loop.md
@$HOME/.claude/get-books-done/templates/state.md
</execution_context>

<context>
Arguments: $ARGUMENTS

**Draft name** (optional, first token): `zero` | `first` | `revision` | `polish`.
If omitted, the workflow reads the current draft from `.book/OUTLINE.md` (the `**Draft:**`
line) and closes that one.

**Book files:**
- `.book/OUTLINE.md` — chapters (phases) + progress table; carries the `**Draft:**` marker
- `.book/PROMISE.md` — checkable reader promises
- `.book/BOOK.md` — vision
- `.book/STATE.md` — project memory digest
- `.book/chapters/*/` — per-chapter CONTEXT / PLAN / SUMMARY / VERIFICATION
</context>

<process>
1. Parse the leading draft name (if any) from $ARGUMENTS; otherwise read the current draft
   from OUTLINE.md.
2. Load and execute @$HOME/.claude/get-books-done/workflows/complete-draft.md end-to-end.
3. Preserve every gate: the **readiness gate** (every chapter in the cycle must have a
   SUMMARY.md and a passing VERIFICATION.md — STOP and refuse to close otherwise), the
   **promise-delivery confirmation** gate, and the **archive-before-rewrite** rule.
</process>

<success_criteria>
- Current draft archived to `.book/drafts/<draft>-OUTLINE.md` and `<draft>-PROMISE.md`.
- Delivered promises moved to the `## Delivered` ledger in PROMISE.md with the draft + date.
- OUTLINE.md `**Draft:**` advanced to the next stage; progress table statuses reset for the
  next pass (drafted → needs-revision etc. per the next stage).
- BOOK.md gains/updates a `## Draft history` entry; STATE.md Position reflects the new cycle.
- Manuscript tagged `draft-<name>` (if the book is a git repo and tagging is enabled).
- `chore(book):` commit recorded.
- Author knows the next step.
</success_criteria>

<critical_rules>
- **Load the workflow first.** Read complete-draft.md before doing anything.
- **Readiness is a hard gate.** Do NOT close a draft while any chapter in the cycle lacks a
  SUMMARY.md or has a failing/missing VERIFICATION.md. Name the offenders and STOP.
- **Archive before you rewrite.** Always write `.book/drafts/<draft>-*` archive files before
  mutating OUTLINE.md / PROMISE.md.
- **Never drop an undelivered promise.** Promises not yet delivered carry forward into the
  next cycle — they are never silently dropped (conventions.md: split, don't cut).
- **Constant size.** OUTLINE.md and PROMISE.md stay one-cycle-sized; history lives in
  `.book/drafts/`.
</critical_rules>
