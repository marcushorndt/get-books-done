# Promise-backward verification (= GSD goal-backward)

Every chapter plan declares `must_land` criteria in its PLAN.md frontmatter. These
are the prose analog of GSD's `must_haves` (truths / artifacts / links). After a
chapter is drafted, `gbd-verifier` reads the actual prose in `manuscript/` and checks
that each criterion is delivered — not merely that words were written.

## Schema (PLAN.md frontmatter)

```yaml
must_land:
  beats:            # plot/argument beats that MUST occur, observable in the prose
    - "Mara discovers the letter and chooses to hide it"
    - "The cost of the choice is shown, not stated"
  turn:             # the single emotional/argumentative turn the chapter exists for
    "Reader shifts from trusting Mara to fearing for her"
  reveals:          # information the reader must now hold
    - "The estate is bankrupt"
  plants:           # hooks/setups that pay off later (link to PROMISE.md ids)
    - "Gun on the mantel introduced  -> PAYOFF-07"
  promises:         # PROMISE.md ids this chapter advances
    - "ARC-02"
    - "HOOK-01"
```

For nonfiction, `beats` → argument moves, `turn` → the shift in the reader's
understanding, `reveals` → key facts/claims established, `plants` → forward references.

## Verifier procedure

1. Read the drafted chapter prose from `manuscript/`.
2. For each `must_land` item, locate textual evidence (quote the line/passage).
3. Mark COVERED / PARTIAL / MISSING with the evidence or the gap.
4. Cross-check `promises` against PROMISE.md — is each advanced item actually moved?
5. Write `NN-VERIFICATION.md`: status `passed` | `needs_review`, item-by-item table.
6. PARTIAL/MISSING items become gap-closure plans routed to `/gbd:plan-chapter --gaps`.

Verification checks delivery of MEANING, not word count. "Wrote 2500 words" is never
a pass. "The turn lands because of the line on p.4" is.
