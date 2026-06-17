<purpose>
Display the complete GBD command reference, grouped by lifecycle stage. Print the reference
below exactly as written — no preamble, no extra commentary, no invented next-steps. Skip the
book-specific analysis and the git/file context too.
</purpose>

<reference>
# GBD Command Reference

**GBD** (Get Books Done) is a structural port of GSD to book authoring. It runs a
stage-gated workflow over a `.book/` planning tree and a `manuscript/` deliverable, using
orchestrator skills that spawn subagents, gate on you, and commit atomically.

A **chapter** is the phase unit. A **scene** is the plan/task unit. A **draft**
(zero → first → revision → polish) is the milestone unit.

## The lifecycle (happy path)

```
new-book → outline → [per chapter: discuss → plan → draft → read-through]
        → editorial/continuity/sensitivity review → map-manuscript/story-bible
        → complete-draft → (repeat next draft) → distribute → beta-readers
```

## Set up the book

**`/gbd-new-book [--auto] [@idea.md]`**
Initialize a new book (or onboard an existing manuscript): questioning → config → BOOK.md,
PROMISE.md, STATE.md, optional research, then the outline.

**`/gbd-outline [--insert|--remove|--edit|--view] <chapter>`**
CRUD the chapter structure in OUTLINE.md. Chapters are immutable once scoped — split (3 → 3.1)
rather than rewrite.

## Write a chapter (repeat per chapter)

**`/gbd-discuss-chapter <N>`**
Scope a chapter before planning — lock what it must accomplish, POV, what's revealed
(CONTEXT.md, decisions D-01…).

**`/gbd-plan-chapter <N>`**
Turn the scoped CONTEXT.md into beat sheets / scene cards (PLAN.md) to draft from.

**`/gbd-draft-chapter <N>`**
Write the prose for a chapter's planned scenes; produces SUMMARY.md and commits per scene.

**`/gbd-read-through <N>`**
Conversational verification that the drafted prose actually landed its promises
(VERIFICATION.md / READTHROUGH.md).

## Review & quality

**`/gbd-editorial-review <N>`**
Developmental + line/voice editorial pass on a drafted chapter, with notes you can apply.

**`/gbd-continuity-review`**
Check the manuscript against the story bible — physical facts, timeline, who-knows-what,
unpaid setups / unsupported payoffs.

**`/gbd-sensitivity-review`**
Sensitivity / authenticity read — representation, stereotype, factual/libel, cultural-accuracy
flags with constructive notes.

## Story bible & maps

**`/gbd-map-manuscript`**
Reverse-engineer (or refresh) the story bible from the prose — characters, world, timeline,
threads, voice, style.

**`/gbd-story-bible`**
Build, query, and inspect the continuity graph — who/what/where and which setups are unpaid.

## Close a draft

**`/gbd-complete-draft [zero|first|revision|polish]`**
Close the current draft cycle and open the next: archive the cycle's OUTLINE phases, move
delivered PROMISE items to the delivered ledger, update BOOK.md + STATE.md, tag the manuscript.

## Ship it

**`/gbd-distribute [blurb|query|logline|platform|all]`**
Generate distribution copy. Locks the brief first (confirmation gate), uses the right framework
per artifact, marks missing proof as placeholders, gives 2–3 rationale'd variants, ends with a
4-step QC. Writes to `.book/distribution/`.

**`/gbd-beta-readers [--packet|--log <reader>|--rollup|--status] [round]`**
Run beta/ARC rounds: assemble a packet (synopsis + chapters + PROMISE-derived questions), log
per-reader feedback, and roll it up into ranked items that feed `/gbd-read-through`.

## Situational / utility

**`/gbd-progress [--next | --do "intent"]`**
Where the book stands + the recommended next command. `--next` auto-advances; `--do "…"`
dispatches freeform intent to the right command.

**`/gbd-resume-work`**
Restore full context after a break — draft/chapter position, last artifact, incomplete work,
next step.

**`/gbd-stats`**
The numbers: word counts, chapters drafted/verified, promises delivered, velocity, timeline.

**`/gbd-help`**
This reference.

**`/gbd-update`**
Update your installed GBD to the latest released version (pulls the source repo and re-runs the installer). The yellow "update available" banner at session start points here.
</reference>
