<purpose>
Close the current draft cycle (zero → first → revision → polish) and open the next. A draft
is the GBD milestone unit. Closing one creates a historical record in `.book/drafts/`,
moves delivered reader promises to a delivered ledger, refreshes the vision (BOOK.md) and
memory (STATE.md), tags the manuscript, and opens the next cycle so OUTLINE.md and PROMISE.md
stay constant-size.
</purpose>

<required_reading>
Read every file in the invoking skill's execution_context before starting — especially
conventions.md (drafts = milestones; never drop a promise) and revision-loop.md.
</required_reading>

<draft_progression>
The cycle ladder and what opening the next stage means:

| Closing | Opens next | What the next pass is for |
|---------|-----------|---------------------------|
| `zero`     | `first`    | first complete readable draft — fill gaps, finish stub scenes |
| `first`    | `revision` | structural/developmental rework against editorial + read-through notes |
| `revision` | `polish`   | line/copy/voice pass; continuity + sensitivity sign-off |
| `polish`   | — (book is draft-complete) | route to `/gbd-distribute` and `/gbd-beta-readers` |

The next pass resets each chapter's progress-table status to its starting state for that
pass (e.g. opening `revision` sets drafted chapters to `needs-revision`).
</draft_progression>

<process>

<step name="resolve_draft">
Determine which draft is being closed.

```bash
test -f .book/OUTLINE.md || { echo "No .book/OUTLINE.md — run /gbd-new-book first."; exit 1; }
```

Read the `**Draft:**` marker from `.book/OUTLINE.md`. If $ARGUMENTS names a draft, it MUST
match the current marker — if it does not, STOP and report the mismatch (the author may be
trying to close a draft that is not active). If $ARGUMENTS is empty, use the marker value.

Set `DRAFT` (e.g. `first`) and `NEXT` from the progression table. If `DRAFT` is `polish`,
there is no next cycle — note that and skip the "open next" steps.
</step>

<step name="readiness_gate">
**Hard gate. Do NOT proceed past this step until it passes.**

For every chapter row in the OUTLINE.md progress table, verify on disk:
- a SUMMARY.md exists for each of the chapter's plans
  (`.book/chapters/<NN-slug>/<NN>-<PP>-SUMMARY.md`)
- a VERIFICATION.md exists and its verdict is passing
  (`.book/chapters/<NN-slug>/<NN>-VERIFICATION.md`)

```bash
for d in .book/chapters/*/; do
  ls "$d"*-SUMMARY.md >/dev/null 2>&1 || echo "MISSING SUMMARY: $d"
  test -f "$d"$(basename "$d" | grep -oE '^[0-9]+')-VERIFICATION.md || echo "MISSING VERIFICATION: $d"
done
```

If any chapter is missing a SUMMARY.md or a passing VERIFICATION.md, present the list and STOP:

```
⚠ Draft "{DRAFT}" is not ready to close. Outstanding chapters:
- {NN-slug}: {missing summary | verification failing | not verified}

Finish these (draft → read-through → verify) before closing, or run
/gbd-read-through and /gbd-editorial-review on the gaps.
```

Only continue when every chapter is drafted and verified.
</step>

<step name="gather_stats">
Compute the cycle's stats for the archive and the announcement:
- chapters in the cycle, total words drafted (sum SUMMARY word counts / `wc -w manuscript`)
- git commit range and date span for the cycle (since the previous `draft-*` tag, if any)
- deviations / splits recorded in SUMMARY.md files

```bash
git -C . log --oneline "$(git describe --tags --match 'draft-*' --abbrev=0 2>/dev/null)..HEAD" 2>/dev/null | wc -l
```

Present the cycle summary and pause for confirmation before writing anything.
</step>

<step name="reconcile_promises">
Open `.book/PROMISE.md`. For each promise item (`[CATEGORY]-NN`), decide delivered vs carried:
- A promise is **delivered** when the chapter(s) that advance it are drafted AND their
  VERIFICATION.md confirms the payoff landed. Cross-check against the OUTLINE "Promises
  advanced" fields and chapter VERIFICATION.md.
- A promise is **carried** otherwise.

Present the proposed delivered/carried split and **pause for author confirmation** — never
auto-mark a promise delivered without the author agreeing it landed. Undelivered promises
ALWAYS carry forward into the next cycle; they are never dropped.
</step>

<step name="archive">
**Archive before rewriting.** Create the drafts directory and copy the current cycle artifacts:

```bash
mkdir -p .book/drafts
cp .book/OUTLINE.md  ".book/drafts/${DRAFT}-OUTLINE.md"
cp .book/PROMISE.md  ".book/drafts/${DRAFT}-PROMISE.md"
```

Prepend a header to each archive file recording: draft name, date, chapter count, word count,
git range, and the cycle summary (key decisions, deviations, splits, deferred ideas). Mark the
archived OUTLINE phases as closed for this cycle.
</step>

<step name="record_delivered">
In the live `.book/PROMISE.md`, move every confirmed-delivered item into a `## Delivered`
ledger with the draft it landed in and the date:

```markdown
## Delivered
| Promise | Delivered in | Date | Evidence |
|---------|--------------|------|----------|
| PAYOFF-01 | first draft | 2026-06-17 | ch 12 VERIFICATION.md |
```

Leave carried promises in their active section unchanged.
</step>

<step name="open_next">
Skip this step if `DRAFT == polish`.

In `.book/OUTLINE.md`:
- set the `**Draft:**` marker to `NEXT`
- reset each chapter's progress-table `Status` to its starting state for the next pass
  (per draft_progression: e.g. opening `revision` → `needs-revision`)
- keep all chapter structure intact (chapters are immutable; never renumber)
</step>

<step name="update_vision_and_state">
**BOOK.md** — add or update a `## Draft history` section:

```markdown
## Draft history
- **{DRAFT} draft** — completed {date} · {N} chapters · {W} words · {delivered}/{total} promises delivered.
  Archive: `.book/drafts/{DRAFT}-OUTLINE.md`.
```

**STATE.md** — rewrite the Position block for the new cycle (Draft: NEXT, Chapter: 1 of Y,
Last activity: closed {DRAFT} draft, Resume file: first chapter to rework). Keep under 100
lines per the template. If `DRAFT == polish`, set Position to "draft-complete — ready for
distribution."
</step>

<step name="commit_and_tag">
Stage the archive files, PROMISE.md, OUTLINE.md, BOOK.md, STATE.md and commit:

```bash
git add .book/drafts/${DRAFT}-OUTLINE.md .book/drafts/${DRAFT}-PROMISE.md \
        .book/PROMISE.md .book/OUTLINE.md .book/BOOK.md .book/STATE.md
git commit -m "chore(book): complete ${DRAFT} draft, open ${NEXT} draft"
```

(Honor `config.planning.commit_docs=false` — if metadata commits are suppressed, skip the
commit but still write the files.)

If the book is a git repo and tagging is enabled, tag the manuscript and offer to push:

```bash
git tag -a "draft-${DRAFT}" -m "{cycle summary one-liner}"
```
</step>

<step name="offer_next">
Announce completion and route:
- if `DRAFT != polish`: `/gbd-progress` to see the {NEXT}-pass position, then
  `/gbd-plan-chapter` / `/gbd-draft-chapter` on the first chapter needing rework.
- if `DRAFT == polish`: the book is draft-complete →
  `/gbd-distribute all` (blurb/query/logline/platform) and `/gbd-beta-readers` for ARC rounds.
</step>

</process>

<failure_modes>
- *Closes a draft with unverified chapters → ships gaps as "done"* → the readiness_gate is a
  hard STOP; never bypass it.
- *Auto-marks promises delivered to make the numbers look clean → readers get unkept promises*
  → reconcile_promises pauses for explicit author confirmation; carry anything unproven.
- *Rewrites OUTLINE.md before archiving → cycle history lost* → archive step always runs first.
- *Renumbers or rewrites chapters when opening the next pass → breaks immutability* → only the
  Status column and the Draft marker change; structure is untouched.
</failure_modes>
