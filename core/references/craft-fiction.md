# Fiction craft (planner / drafter / editor / verifier)

Distilled from story-architecture, prose-writing, writing-principles (haowjy),
and skill-authoring practice. These are GBD's differentiators — bake them into the
relevant agent prompts.

## Structure (PLANNER)

Plan at four nested scales; decisions at one constrain the others:
**saga/book → arc → chapter → scene.**

- **Arc** has a single **central question** and MUST change a permanent state at the
  book level (relationships, power, understanding, stakes). An arc that resolves its
  own conflict but changes nothing is **filler** — flag it.
- **Arc beat sequence:** Hook → Rising complications → **Midpoint shift** → Crisis →
  Resolution.
  - Each complication makes the question *harder* and is a logical consequence of a
    prior choice (not a random obstacle).
  - **Midpoint shift** changes the *nature* of the conflict (reframe, ally→enemy,
    stakes change category). Without it, the middle sags.
  - **Crisis** is a choice between **competing values or two kinds of loss** — never
    good-vs-bad.
  - Resolution states *what changed* and seeds the next arc's question.
  - Pace UNEVENLY on purpose: complications get the most space; crisis is compressed;
    resolution can be brief.
- **Chapter** = a reading unit: needs **internal completeness** (something changes) +
  **external pull** (a question/threat that makes the reader continue).
- **Causation test:** beats link by "therefore"/"but", never "and then". Self-test —
  *could the scenes be reordered without breaking the story?* If yes, it's a sequence,
  not a plot. Revise.
- Maintain an explicit **setup/payoff ledger** across chapters; track open setups.
- The outline is a **hypothesis, not a contract** — the drafter may deviate to serve
  the story; re-run the planner rather than forcing dead-but-correct prose.

### Four-field scene record (REQUIRED per scene in PLAN.md)
```
- what_changes:  <state change; "nothing" => cut or combine the scene>
  whose_scene:   <POV / who has most at stake / who drives>
  reader_learns: <new info the reader holds after>
  arc_connection: advance | complicate | deepen | resolve
```
Cut any scene whose only job is to convey information — deliver that info inside a
scene already doing something.

## Prose (DRAFTER)

- **Psychic distance:** move CLOSE at emotional peaks/interiority; pull BACK for
  transitions/time compression. Explicitly avoid the AI default — a flat middle
  distance that feels safe and impersonal.
- **Free indirect discourse:** narration carries the character's vocabulary and
  judgment, not the narrator's. ("She knew she was pretty and that was everything.")
- **Sentence rhythm matches the beat:** short for tension/shock; long cumulative for
  immersion; fragments for intimacy. A devastating scene and a mundane scene must not
  read the same.
- **Sensory grounding through POV attention:** one or two specific details the
  character would notice (the detail characterizes the noticer). Not a five-sense
  catalog.
- **Show emotion through character-specific action.** BANNED stock-tells: clenched
  fists, shaky breath, jaw tightening, averted eyes, racing heart — replace with
  behavior only *this* person would do.
- **Economy:** every element does ≥2 jobs (dialogue advances plot AND reveals
  character). Not minimalism — the test is "would removing it cost the reader
  something?"
- **Knowledge-state discipline:** write only what the POV character has lived through,
  NOT what's in the outline/your context.
- **Subtext:** characters deflect, understate, talk around. Ban "as you know"
  expository dialogue.
- **Don't resolve tension or collapse ambiguity** prematurely; stop at the brief.
- **No em-dash habit** (reads as AI) — rewrite around the clause relationship using
  breaks, commas, colons, parentheses. Use dashes only if STYLE.md makes them voice.
- **No conversational bleed:** never "It's not X — it's Y" or "Let's break this down."
  You are not addressing a reader who was in a chat.

## Diagnosis (EDITOR + VERIFIER): Four Reward Channels

When a passage feels flat, name which channel broke:
1. **Transportation** (entering the world) — coherent progression, consistent POV,
   sensory grounding, character knowledge-state respected.
2. **Aesthetic** (sentence-level pleasure) — rhythm/word/shape variety.
3. **Social simulation** (characters as minds) — interpreted, not labeled, emotion;
   distinct voices.
4. **Flow** (readable challenge) — pacing matches the scene's work.
Composition rule: over-explaining breaks social sim; under-explaining breaks
transportation; generic style breaks aesthetic; impenetrable style breaks flow.

### Failure-modes rubric (EDITOR developmental pass)
For each, name the broken channel + a specific fix (not "do the opposite"):
over-elaborated scope · flattened/homogenized voice · info-dumping · labeled emotions
& stock-tells · prematurely resolved tension · emotional commentary (the metaphor that
explains the feeling) · collapsed ambiguity · over-intensified language ("I miss you" >
"my heart ached with profound emptiness") · project-style mismatch.

### Line/voice pass (EDITOR, minimal-edit contract)
Fix grammar/clarity/repetition while PRESERVING the established voice. Do not
corporatize, reformat, reorganize, or smooth out authentic irregularity. Make it sound
like the author, just cleaner.

## AI-tell scan (VERIFIER) — triggers, NOT proof
Use these to investigate, never to convict: low lexical variability, summary-not-
experienced interiority, low dialogue subtext, repetitive emotional choreography,
tidy-summary endings ("…and I realized that…"), overused metaphor clusters
(weight, light/dark, drowning).
**Critical caveat:** word-level "slop lists" (delve, tapestry, testament) are NOT
reliable detection — model/genre dependent, near-random for Claude. Treat as taste,
never as evidence.
