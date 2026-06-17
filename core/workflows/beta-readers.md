<purpose>
Run beta/ARC reader rounds: assemble a packet (synopsis + in-scope chapters + targeted
questions derived from PROMISE.md), log each reader's feedback in a structured, auditable
shape, and roll the round up into ranked, actionable revision items that feed
`/gbd:read-through`. Lives under `.book/distribution/beta/<round>/`.
</purpose>

<required_reading>
Read the invoking skill's execution_context — especially promise-backward.md (promises are
checkable payoffs; they become the reader questions) and revision-loop.md.
</required_reading>

<process>

<step name="preflight">
```bash
test -d .book || { echo "No .book/ — run /gbd:new-book first."; exit 1; }
ROUND="${ROUND:-round-1}"   # from $ARGUMENTS; default to next unused round-N
mkdir -p ".book/distribution/beta/${ROUND}/responses"
```
Initialize `round.json` if absent: `{ "round": "<round>", "created": "<date>", "scope": "",
"readers": [] }` where each reader is `{ "id", "name", "has_packet", "responded", "notes" }`.
</step>

<recipe name="build-packet">
1. **Scope.** Ask the author which chapters are in this round (single chapter, an act, or the
   full manuscript ARC) and the deadline. Record `scope` in round.json.
2. **Synopsis.** Build a short synopsis from OUTLINE.md (Arc/Throughline + per-chapter goals).
   If scope is partial or pre-climax, STOP the synopsis before the climax and note
   "spoiler-safe synopsis — ends at chapter N" in PACKET.md. Full ARC → full synopsis allowed.
3. **Targeted questions — derive from PROMISE.md.** For each PROMISE.md item that the in-scope
   chapters advance, write a checkable question:
   - payoff/arc promise → "Did {payoff} land? Where did you first feel it / doubt it?"
   - thesis promise (nonfiction) → "Were you convinced of {thesis}? What was missing?"
   Add per-chapter goal questions from OUTLINE "Goal" fields, plus the standard read-experience
   probes (where did you stop / skim / get confused / get pulled out). Every question carries a
   tag: `[PROMISE-id]` or `[ch NN goal]`. Write these to `questions.md`.
4. **Assemble PACKET.md:** header (round, scope, deadline, spoiler note) → synopsis → reading
   instructions → the in-scope chapters (link or inline from `manuscript/`) → `questions.md`.
5. **Roster.** Ask for reader names/ids, append to round.json with `has_packet=true`,
   `responded=false`. Offer a per-reader copy of the packet.
6. Report the packet path and the roster. No prose is written or altered.
</recipe>

<recipe name="log-feedback">
Reader id comes from $ARGUMENTS. Capture the reader's feedback (pasted or dictated) and
structure it into `responses/<reader>.md` mapping answers back to the packet questions:

```markdown
# Beta response — {reader} · {round} · {date}
## Per-question
| Q tag | Question | Verdict (landed / partial / missed) | Quote / note |
|-------|----------|--------------------------------------|--------------|
| PAYOFF-01 | … | partial | "I saw it coming by ch 9" |
## Stop / skim points
- ch NN: {what made them stop or skim}
## Continuity / sensitivity flags
- {anything the reader flagged as inconsistent or insensitive}
## Overall
- one-paragraph gestalt, in the reader's words
```

Record reader words verbatim — never paraphrase into something they didn't say, never invent.
Set `responded=true` for that reader in round.json.
</recipe>

<recipe name="rollup">
1. Read every `responses/*.md` for the round. Refuse to roll up if fewer than the author's
   expected minimum have responded (warn, then ask whether to proceed).
2. Aggregate per-question verdicts. Rank issues by **frequency × severity** (how many readers
   hit it, how badly). Tag each ranked item with the affected chapter(s) and promise(s).
3. Write `ROLLUP.md`:

```markdown
# Beta rollup — {round} · {n} readers · {date}
## Ranked issues
| # | Issue | Readers | Severity | Chapters | Promises |
|---|-------|---------|----------|----------|----------|
| 1 | payoff telegraphed | 3/4 | high | 08,09 | PAYOFF-01 |
## Promise scorecard (from PROMISE.md questions)
| Promise | landed | partial | missed |
## Continuity flags  → route to /gbd:continuity-review
## Sensitivity flags → route to /gbd:sensitivity-review
## Recommended read-through targets
- ch 08, ch 09 (telegraphed payoff)
```

4. **Feed `/gbd:read-through`.** For each confirmed prose problem, name the chapter and write a
   pointer the author can hand to `/gbd:read-through <ch>` (the rollup item becomes a
   read-through focus). Route continuity flags to `/gbd:continuity-review`, sensitivity flags to
   `/gbd:sensitivity-review`. This skill ranks and routes; it does not edit prose itself.
</recipe>

<recipe name="status">
Read round.json and `responses/`. Print a roster table: reader · has-packet · responded ·
notes, plus a one-line summary (e.g. "3/4 responded, ready to roll up" or "awaiting 2 readers,
deadline {date}").
</recipe>

</process>

<failure_modes>
- *Generic "did you like it?" questions → unactionable feedback* → build-packet derives every
  question from a PROMISE.md id or chapter goal.
- *Synopsis spoils the ending of a partial round → biased reads* → spoiler-safe synopsis stops
  before the climax unless it's a full ARC.
- *Paraphrasing readers into the notes you wanted → false signal* → log verbatim; never invent.
- *Rollup quietly fixes prose → unreviewed changes* → rollup only ranks and routes to
  read-through / continuity / sensitivity.
- *Rolling up on one response → noise treated as signal* → require a minimum response count or
  explicit author override.
</failure_modes>
