---
name: gbd-beta-readers
description: "Use when the author wants to run a beta / ARC reader round — assemble a reader packet, hand it out, log per-reader feedback, and roll it up into actionable revision items. Triggers: \"send to beta readers\", \"make an ARC packet\", \"log beta feedback\", \"what did the readers say\", \"start a beta round\", \"close the beta round\"."
argument-hint: "[--packet | --log <reader> | --rollup | --status] [round-name]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
Manage beta/ARC reader rounds end to end. Four modes:
- **--packet** (default): assemble a reader packet — synopsis + the chapters in scope +
  targeted questions *derived from PROMISE.md* (each promise becomes a "did this land?" prompt).
- **--log <reader>**: record one reader's feedback against the packet questions, structured so
  it can be rolled up.
- **--rollup**: aggregate all readers' feedback for the round into ranked, actionable items
  and feed them into `/gbd-read-through` (and surface continuity/sensitivity flags).
- **--status**: show the round — who has the packet, who has responded, what is outstanding.

**Writes to:** `.book/distribution/beta/<round>/` — `PACKET.md`, `questions.md`,
`responses/<reader>.md`, `ROLLUP.md`, `round.json` (roster + status).
</objective>

<routing>

| Flag | Action | Workflow section |
|------|--------|------------------|
| (none) / --packet | Build the reader packet for a round | build-packet |
| --log `<reader>` | Record one reader's feedback | log-feedback |
| --rollup | Aggregate feedback → ranked items → feed read-through | rollup |
| --status | Show roster + response status for the round | status |

</routing>

<execution_context>
@$HOME/.claude/get-books-done/workflows/beta-readers.md
@$HOME/.claude/get-books-done/references/conventions.md
@$HOME/.claude/get-books-done/references/promise-backward.md
@$HOME/.claude/get-books-done/references/revision-loop.md
</execution_context>

<context>
Arguments: $ARGUMENTS

Parse the first token:
- `--log` → strip it; next token is the reader name/id, run log-feedback
- `--rollup` → run rollup
- `--status` → run status
- `--packet` or no flag → run build-packet
Remaining token (any mode) is the round name (default: next round number, e.g. `round-1`).

**Source files:**
- `.book/PROMISE.md` — the reader promises that BECOME the targeted questions
- `.book/OUTLINE.md` — chapter list + the synopsis source
- `.book/manuscript/` or `manuscript/` — the prose chapters to include
- `.book/distribution/beta/<round>/round.json` — roster + per-reader status
</context>

<process>
1. Parse the leading flag (default --packet) and round name from $ARGUMENTS.
2. Load and execute @$HOME/.claude/get-books-done/workflows/beta-readers.md for that mode.
3. Preserve the **questions-from-PROMISE rule** (every targeted question traces to a
   PROMISE.md item or a chapter goal — no generic "did you like it?"), the
   **one-file-per-reader** logging structure, and the **rollup → /gbd-read-through** handoff.
</process>

<success_criteria>
- Packet mode: `PACKET.md` (synopsis + in-scope chapters) and `questions.md` exist, with every
  question traceable to a PROMISE.md id or chapter goal; `round.json` lists the roster.
- Log mode: `responses/<reader>.md` written in the structured response shape; `round.json`
  status for that reader set to `responded`.
- Rollup mode: `ROLLUP.md` ranks issues by frequency × severity, tags each with the affected
  chapter(s) and promise(s), and routes confirmed prose problems into `/gbd-read-through`
  (continuity/sensitivity flags routed to those reviews).
- Status mode: a clear roster table (reader · has-packet · responded · notes).
</success_criteria>

<critical_rules>
- **Questions derive from PROMISE.md.** Each targeted question maps to a promise id or a
  chapter goal so feedback is checkable against what the book promised — never a generic survey.
- **No prose fabrication.** This skill assembles existing manuscript chapters and records
  reader words verbatim; it does not invent feedback or rewrite prose.
- **One file per reader.** Keep each reader's raw response isolated so the rollup is auditable.
- **Rollup feeds read-through, it doesn't fix.** The skill ranks and routes; actual revision
  happens through `/gbd-read-through` → `/gbd-plan-chapter` → `/gbd-draft-chapter`.
- **Spoiler discipline.** The packet synopsis stops before the climax unless the round is a
  full-manuscript ARC; note the scope explicitly in PACKET.md.
</critical_rules>
