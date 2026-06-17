# Credits & Attribution

Get Books Done (GBD) stands on the work of others. It is an **independent
reimplementation** — no upstream code or prose was copied; the files here were written
from scratch. What GBD borrows is *architecture* and *distilled craft*, and the people
below deserve the credit for it.

## Primary influence — Get Shit Done (GSD)

GBD is a faithful structural port of **GSD ("Get Shit Done" / GSD Core)**, a
meta-prompting and context-engineering framework for AI coding agents.

- **Project:** GSD Core — https://github.com/open-gsd/get-shit-done-redux
- **Author:** the `open-gsd` project
- **License:** MIT
- **What GBD takes from it:** the entire workflow spine and orchestration model —
  the stage-gated lifecycle (init → discuss → plan → execute → verify → complete),
  the thin-skill-orchestrates-subagent pattern, goal-backward verification, the
  `.planning/` artifact tree, atomic commits, adaptive questioning, the revision loop,
  and milestone cycles. GBD retargets all of this from code to manuscripts and renames
  the concepts (milestones → drafts, phases → chapters, goal-backward → promise-backward,
  `.planning/` → `.book/`, and so on).

If you find GBD useful, please also look at — and credit — GSD.

### Suggested citation

> Get Books Done (GBD) is an independent port of the GSD ("Get Shit Done") framework
> by the open-gsd project (https://github.com/open-gsd/get-shit-done-redux, MIT),
> adapting its workflow architecture from software engineering to book authoring.

```bibtex
@software{gbd,
  title  = {Get Books Done (GBD)},
  author = {Horndt, Marcus},
  year   = {2026},
  url    = {https://github.com/marcushorndt/get-books-done},
  note   = {An independent port of the GSD framework (open-gsd,
            https://github.com/open-gsd/get-shit-done-redux, MIT),
            adapted from software engineering to book authoring.}
}
```

## Craft sources

GBD's `core/references/craft-*.md` files distill techniques (not text) from a set of
community writing skills. Credit to their authors:

### Fiction craft — `craft-fiction.md`
- **haowjy / creative-writing-skills** (Apache-2.0) —
  https://github.com/haowjy/creative-writing-skills — story architecture (nested
  scales, arc beat sequence, the four-field scene record), prose technique (psychic
  distance, free indirect discourse), the Four Reward Channels diagnostic, failure
  modes, and the "AI-tells are triggers not proof / slop-lists are unreliable" caveat.
- **obra / superpowers — writing-skills** — the meta-craft of authoring skills
  themselves (match-form-to-failure, RED-GREEN-REFACTOR, description-field rules),
  which shaped `craft-fiction.md`'s editor/verifier framing and `skill-authoring.md`.
- **different-ai / agent-bank — writing-style** — the minimal-edit / preserve-voice
  line-editing contract.

### Nonfiction craft — `craft-nonfiction.md`
- **bahayonghang / academic-writing-skills (latex-paper-en)** — the claim→evidence
  strength ladder, the three-layer citation-verification discipline, and the de-AI
  removal categories.
- **master-cai / research-paper-writing-skills** — argument templates, AXES paragraph
  model, reverse outlining, and the adversarial rejection-risk review.
- **jamditis / claude-skills-journalism — academic-writing** — research design (FINER),
  IMRaD structures, sourcing ethics, attribution/hedging discipline, and the
  verify-before-asserting rule.

### Distribution craft — `craft-distribution.md`
- **kostja94 / marketing-skills — copywriting** — the framework reference (PAS, AIDA,
  BAB, FAB, 4 U's) and headline formulas.
- **sickn33 / antigravity-awesome-skills — copywriting & copywriting-psychologist** —
  the brief-lock gate, awareness-stage/emotional-state routing, and mechanism-first copy.
- **skills.volces.com — copywriting** — the 4-step pass/fail QC.

### Skill-authoring craft — `skill-authoring.md`
- **obra / superpowers — writing-skills** (see above).
- **trailofbits / skills — harness-writing** — the SKILL.md document spine, "one skill =
  one job," explicit "when to skip" scope, and anti-pattern/troubleshooting tables.

Where an upstream is Apache-2.0 (haowjy) or MIT (GSD), GBD's MIT license is compatible.
GBD distills ideas rather than redistributing these works; please consult and credit
the originals directly if you build on them.
