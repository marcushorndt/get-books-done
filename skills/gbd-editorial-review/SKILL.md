---
name: gbd-editorial-review
description: "Use when the author has drafted a chapter's prose and wants an editorial pass — developmental + line/voice — before moving on, or asks to \"edit\", \"review the writing\", \"give me notes on\", or \"polish\" a chapter. Triggers: a chapter has SUMMARY.md (it has been drafted) and the author wants editorial feedback or to apply it."
argument-hint: "<chapter-number> [--depth=quick|standard|deep] [--scenes scene1,scene2,...] [--fix [--all] [--auto]]"
allowed-tools:
  - Read
  - Bash
  - Glob
  - Grep
  - Write
  - Agent
  - AskUserQuestion
---

<objective>
Editorially review the drafted prose of a chapter and produce a severity-classified
REVIEW.md in the chapter's review tree. The editor runs TWO passes: a developmental
pass (craft-fiction failure-modes rubric, naming the broken reward channel + a specific
fix) and a line/voice copy pass against `bible/STYLE.md` under the minimal-edit
contract. For nonfiction chapters the developmental pass adds craft-nonfiction
soundness/citation flags.

Spawns the `gbd-editor` agent at the requested depth. Produces
`.book/reviews/{padded_chapter}-REVIEW.md`. With `--fix`, spawns `gbd-edit-applier`
to apply findings to `manuscript/` prose in atomic commits, optionally iterating in a
bounded revision loop (max 3, per references/revision-loop.md).

Arguments:
- Chapter number (required) — which chapter's drafted prose to review (e.g. "3" or "03").
- `--depth=quick|standard|deep` (optional) — overrides `workflow.editorial_review_depth`.
  - quick: line/voice copy pass against STYLE.md only (~2 min).
  - standard (default): developmental + line/voice over the whole chapter (~10-20 min).
  - deep: standard plus cross-scene arc/causation and setup/payoff tracing (~20-40 min).
- `--scenes=s1,s2,...` (optional) — explicit scene/draft-file list; highest scoping precedence.
- `--fix` (optional) — after review (or if REVIEW.md exists), spawn gbd-edit-applier. Sub-flags:
  - `--all` — include Suggestion-severity findings in fix scope (default: Critical + Should-fix).
  - `--auto` — enable the apply + re-review revision loop, capped at 3 iterations.

Output: `{padded_chapter}-REVIEW.md` in `.book/reviews/` + an inline summary of findings.
</objective>

<execution_context>
@$HOME/.claude/get-books-done/workflows/editorial-review.md
@$HOME/.claude/get-books-done/references/conventions.md
@$HOME/.claude/get-books-done/references/craft-fiction.md
@$HOME/.claude/get-books-done/references/craft-nonfiction.md
@$HOME/.claude/get-books-done/references/style-sheet.md
@$HOME/.claude/get-books-done/references/revision-loop.md
@$HOME/.claude/get-books-done/references/git-conventions.md
</execution_context>

<context>
Chapter: $ARGUMENTS (first positional argument is the chapter number)

Optional flags parsed from $ARGUMENTS:
- `--depth=VALUE` — depth override (quick|standard|deep). Overrides `workflow.editorial_review_depth`.
- `--scenes=s1,s2,...` — explicit scene/draft-file list. Highest scoping precedence; skips SUMMARY/manuscript scoping.
- `--fix [--all] [--auto]` — apply findings via gbd-edit-applier after the review.

Context files (BOOK.md, the chapter's CONTEXT.md / SUMMARY.md, bible/STYLE.md, bible/VOICE.md)
are resolved inside the workflow and delegated to the agent via `<files_to_read>` pointers —
never pasted into orchestrator context.
</context>

<process>
This command is a thin dispatch layer. It parses arguments and delegates to the workflow.

Execute end-to-end.

The workflow (not this command) enforces these gates:
- Chapter validation (drafted? SUMMARY.md present?) before the config gate.
- Config gate check (`workflow.editorial_review`).
- Scene scoping (--scenes override > SUMMARY.md scenes > manuscript chapter glob).
- Empty-scope check (skip if no drafted prose).
- book_type resolution (fiction | nonfiction | general) — passed to the editor to swap the rubric.
- Agent spawning (gbd-editor), result commit (`chore(book): editorial review chapter NN`).
- Result presentation (inline summary + next steps).
- `--fix`: spawn gbd-edit-applier; with `--auto`, run the bounded revision loop and escalate
  to the author via AskUserQuestion after 3 iterations or a stalled issue count.
</process>
