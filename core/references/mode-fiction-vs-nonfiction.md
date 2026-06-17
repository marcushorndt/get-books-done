# Book-type modes

`config.book_type` ∈ { `fiction`, `nonfiction`, `general` }. It selects vocabulary,
templates, and verifier rubrics. Analogous to GSD's granularity / mvp_mode toggles.
Resolution precedence: CLI flag > OUTLINE.md chapter `**Mode:**` > config.json > `general`.

## Vocabulary map

| Concept | fiction | nonfiction |
|---|---|---|
| Chapter exists to… | turn an arc / escalate | advance an argument |
| Plan unit | scene / beat | section / claim |
| `must_land.beats` | plot beats | argument moves |
| `must_land.turn` | emotional turn | shift in reader's understanding |
| `must_land.reveals` | story info revealed | facts/claims established |
| Bible: CHARACTERS | characters | key people / sources / case studies |
| Bible: WORLD | setting, rules | domain model, definitions |
| Bible: THREADS | plot threads | argument threads / running examples |
| Promise items | ARC, HOOK, PAYOFF, MYSTERY | THESIS, TAKEAWAY, CLAIM, EVIDENCE |
| Verify question | "does it move me?" | "is it persuasive and sound?" |

## Drafting differences

- Fiction drafter prioritizes scene craft: goal/conflict/disaster, sensory grounding,
  subtext, voice. Avoids summarizing what should be dramatized.
- Nonfiction drafter prioritizes claim → evidence → implication, signposting,
  worked examples, and citation hygiene (track sources in research/).

## general mode

Keeps both vocabularies live. discuss-chapter asks per chapter whether this unit is
scene-driven or argument-driven and tags CONTEXT.md accordingly.
