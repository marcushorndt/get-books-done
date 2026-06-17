<purpose>
Validate a drafted chapter through conversational, promise-backward verification with persistent state. Confirm the actual prose in `manuscript/` delivers each `must_land` beat, turn, and reveal and advances the promised PROMISE.md ids — meaning, not word count. One check at a time, plain-text reactions, resumable across `/clear`. The chapter-level analog of GSD verify-work.
</purpose>

<required_reading>
@$HOME/.claude/get-books-done/references/conventions.md
@$HOME/.claude/get-books-done/references/promise-backward.md
@$HOME/.claude/get-books-done/references/mode-fiction-vs-nonfiction.md
@$HOME/.claude/get-books-done/templates/read-through.md
</required_reading>

<core_principle>
Verification checks delivery of MEANING. "Wrote 2500 words" is never a pass; "the turn lands because of the line on p.4" is. State persists in `NN-READTHROUGH.md` so the session survives interruption. Gaps route to gap-closure planning; a clean pass writes VERIFICATION.md. The orchestrator runs the conversation; it may spawn `gbd-verifier` once to pre-locate evidence, but the author's reaction is authoritative.
</core_principle>

<process>

## 1. Resolve session (resume support)

Parse `$ARGUMENTS` for a chapter number and `--resume`.

```bash
test -f .book/OUTLINE.md || { echo "Run /gbd-new-book first."; exit 1; }
```

- **Chapter given:** resolve `.book/chapters/NN-slug/`.
- **No chapter (or --resume):** glob `.book/chapters/*/NN-READTHROUGH.md` with frontmatter `status: testing`; if exactly one, resume it; if several, list them and ask which; if none, prompt for a chapter.
- **If the resolved chapter has no SUMMARY.md / no prose in `manuscript/`:** error — `Chapter NN isn't drafted. Run /gbd-draft-chapter NN.` Stop.

Read `.book/config.json` (`workflow.verifier`, `commit_docs`, `book_type`). Resolve `mode`.

## 2. Build or resume the check list

**If `NN-READTHROUGH.md` exists** and `status: testing`: read it, find the first check whose Result is still `awaiting`, and resume there. Replay a one-line recap of checks already passed so the author has context.

**Else (new session):** create `NN-READTHROUGH.md` from `templates/read-through.md`. Build one **Check** per `must_land` item across all of the chapter's `NN-NN-PLAN.md` files:
- one per `beats` entry, one for the `turn`, one per `reveals` entry, and one per `plants` entry (does the setup actually appear?).
- Each check records **Expected** (what should land, in the resolved vocabulary) and a blank **Reader reaction** with **Result: awaiting**.

Optionally spawn `gbd-verifier` ONCE (if `workflow.verifier`) to pre-locate candidate textual evidence per check (quotes + line refs) so you can show the author "here's where I think it lands" — but the author's reaction sets the Result, not the agent.

## 3. Walk the checks — one at a time

For each `awaiting` check, in order:

1. Read the relevant passage from `manuscript/` (use the verifier's pre-located quote if available).
2. Present ONE check in plain text: what was supposed to land, and the passage where it should land. Ask the author for their reaction — does it land, fall flat, or partly work? Keep it conversational, never an interrogation; accept freeform answers.
3. Record in the check: **Reader reaction** (their words, or your quote of where it landed) and **Result** = `pass` / `partial` / `miss`.
4. Persist `NN-READTHROUGH.md` after EACH check (update `checks_passed`/`checks_total` in frontmatter) so the session is always resumable. Optionally commit each update as `chore(book)` if `commit_docs`.

Also capture any **Beta reader notes** the author relays into that table with an Action.

If the author wants to stop mid-way: leave `status: testing`, tell them `/gbd-read-through NN --resume` picks up here. Stop cleanly.

## 4. Verdict

When every check has a Result:

- **Any `miss` or `partial`** → `status: needs_revision`. Write the Verdict section listing each gap (check id, expected, what fell flat). Then route to gap closure:
```
Chapter ${CH} has ${G} gap(s). Close them with:
  /gbd-plan-chapter ${CH} --gaps
(reads this READTHROUGH/VERIFICATION and plans only the unmet beats)
```
Also write/refresh `NN-VERIFICATION.md` with `status: needs_review` and the item-by-item table so `--gaps` can read it (per promise-backward.md the gap list lives in VERIFICATION.md).

- **All `pass`** → `status: complete`. Write `NN-VERIFICATION.md` with `status: passed`: the item-by-item COVERED table with the author-confirmed evidence, and the promise cross-check (mark advanced PROMISE.md ids and update PROMISE.md's traceability Status → `advancing`/`delivered`).

## 5. Commit & route

Update OUTLINE.md Progress row → `verified` on pass. Update STATE.md (Last activity, Resume file, mark the promises advanced). Respecting `commit_docs`:
```bash
git add ".book/chapters/${PADDED}-${SLUG}/" .book/OUTLINE.md .book/PROMISE.md .book/STATE.md 2>/dev/null
git commit -q -m "chore(book): read-through chapter ${CH} — $( [ "$VERDICT" = pass ] && echo passed || echo 'gaps found' )" || true
```

Route:
- pass → `Chapter ${CH} verified. Next: /gbd-progress`
- gaps → the `/gbd-plan-chapter ${CH} --gaps` line from Step 4.

</process>

<success_criteria>
- NN-READTHROUGH.md persists one check per must_land item, each with the author's reaction and a pass/partial/miss Result; the session is resumable at every step.
- Evidence is grounded in actual manuscript prose (quoted), never word count.
- Promises advanced are cross-checked against PROMISE.md and its traceability updated.
- Gaps → status needs_revision + VERIFICATION.md(needs_review) + route to /gbd-plan-chapter --gaps. Pass → VERIFICATION.md(passed) + OUTLINE progress=verified + route to /gbd-progress.
- Committed as chore(book) unless commit_docs=false.
</success_criteria>
