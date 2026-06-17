# Style sheet enforcement (the "lint" of prose)

The single highest-leverage GBD feature with no code analog. `bible/STYLE.md` is the
canonical style sheet; the editor and drafter both honor it, and editorial-review
flags violations the way a linter flags lint.

## What STYLE.md holds

- **Spelling locale** — US/UK; "gray"/"grey", "-ize"/"-ise".
- **Name spellings & capitalization** — proper nouns, invented terms, honorifics.
- **Number style** — spell out under 100? numerals for ages/times/measurements?
- **Punctuation** — em-dash spacing, serial comma, ellipsis style, dialogue quotes.
- **Formatting** — chapter heading style, scene-break glyph (e.g. `* * *`),
  italics conventions (thoughts, emphasis, titles, foreign words).
- **Voice rules** — tense, POV distance, contraction policy, profanity level.
- **Recurring decisions** — hyphenation of invented compounds, how time/dates render.

## How it is used

- `gbd-drafter` reads STYLE.md before writing and conforms.
- `gbd-editor` runs a dedicated copy pass against STYLE.md, emitting `edit` findings.
- When a NEW recurring decision is made mid-draft (e.g. "spell it 'grey'"), the editor
  or drafter appends it to STYLE.md and commits `bible: style sheet — 'grey' (UK)`.

A style sheet that grows as the book grows is the goal. Inconsistency caught early is
the cheapest fix in publishing.
