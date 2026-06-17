# Get Books Done (GBD)

**A structured, agent-driven framework for writing books — with the discipline of a
software workflow.**

GBD is a faithful port of [GSD ("Get Shit Done")](https://github.com/open-gsd/get-shit-done-redux),
a meta-prompting framework for AI coding agents, retargeted from **code** to
**manuscripts**. It keeps GSD's proven spine — gather deep context → structure the work
→ discuss before committing → plan before doing → produce → verify against the original
intent → review for quality → ship — and applies it to the messy, long-haul reality of
writing a book.

It runs as a set of [Claude Code](https://claude.com/claude-code) skills and subagents.
It works for **fiction, nonfiction, or general** writing via a `book_type` switch that
swaps templates and verification rubrics.

> Status: **v0.1.0** — initial port. The spine is complete and internally consistent
> (18 skills, 13 subagents, full core). Not yet battle-tested on a finished manuscript.
> It is a **prompt-layer port targeting Claude Code** — see
> [Scope, architecture & portability](#scope-architecture--portability) for what that
> does and doesn't include.

---

## Why this exists

Most AI writing tools help you write *a passage*. They don't help you write *a book* —
they lose the thread across chapters, forget what a character knows, contradict
established facts, and never check whether a chapter actually does its job. GBD treats a
book the way GSD treats a codebase: as a long-lived project with structure, state, a
living "bible," and verification at every step.

The core reframing:

> **GSD's milestones become drafts.** Zero draft → first draft → revision → polish are
> milestone cycles. Everything else follows from that.

### The mapping

| GSD (software) | GBD (books) |
|---|---|
| project → `PROJECT.md` | book → `BOOK.md` (premise, comps, POV/tense, themes) |
| requirements | `PROMISE.md` — the **checkable promise to the reader** |
| roadmap / phases | `OUTLINE.md` — acts → chapters (the unit of work) |
| discuss-phase → `CONTEXT.md` | `discuss-chapter` — what this chapter must accomplish |
| plan-phase → `PLAN.md` | `plan-chapter` — **beat sheets / scene cards** |
| execute-phase | `draft-chapter` — the prose, one commit per scene |
| verify (goal-backward) | `read-through` — does the prose **land its promise**? |
| code-review | `editorial-review` — developmental + line/voice |
| security-review | `sensitivity-review` |
| map-codebase / intel graph | `map-manuscript` / `story-bible` — the continuity bible |
| complete-milestone | `complete-draft` |
| ship / deploy | `distribute` — blurb, query letter, logline, platform |

**Promise-backward verification** is the heart of it: every chapter plan declares
`must_land` beats (the turn it makes, what's revealed, what's set up). After drafting,
the verifier reads the *actual prose* and checks each one is delivered — not merely that
words were written. "Wrote 2,500 words" is never a pass; "the turn lands because of the
line on page 4" is.

---

## Install

Requires [Claude Code](https://claude.com/claude-code).

```sh
git clone https://github.com/marcushorndt/get-books-done.git
cd get-books-done
./install.sh
```

`install.sh` deploys into `~/.claude` (backing up any prior GBD install to
`~/.claude/backups/`):

```
core/    → ~/.claude/get-books-done/   templates, references, workflows, VERSION
skills/  → ~/.claude/skills/           the /gbd- commands
agents/  → ~/.claude/agents/           the gbd-* subagents
```

Set `CLAUDE_HOME` to install somewhere else.

---

## Quickstart

In the folder where your book will live:

```
/gbd-new-book          # interview → BOOK.md, PROMISE.md, OUTLINE.md, .book/ workspace
/gbd-discuss-chapter 1 # lock what chapter 1 must do
/gbd-plan-chapter 1    # beat sheet / scene cards
/gbd-draft-chapter 1   # prose, one commit per scene
/gbd-read-through 1    # did it land its promises?
```

Already have a draft? `/gbd-new-book` will onboard it, then:

```
/gbd-map-manuscript    # reverse-engineer the story bible from your prose
/gbd-story-bible build # build the continuity graph
```

Lost? `/gbd-progress` tells you where you are and what to do next. `/gbd-help` lists
every command.

---

## Command reference

Grouped by lifecycle stage. Full help: `/gbd-help`.

### Setup & structure
| Command | Does |
|---|---|
| `/gbd-new-book` | Interview the author; create `BOOK.md`, `PROMISE.md`, `OUTLINE.md`, `config.json`, `.book/`. Onboards an existing manuscript. |
| `/gbd-outline` | Add / insert / remove / edit / view chapters in `OUTLINE.md` (chapters are immutable once scoped — split 3 → 3.1, 3.2). |

### The chapter loop
| Command | Does |
|---|---|
| `/gbd-discuss-chapter <n>` | Adaptive questioning → `CONTEXT.md` with locked decisions and the promises this chapter advances. |
| `/gbd-plan-chapter <n>` | (optional research →) beat sheets / scene cards with `must_land` criteria; plan-checker revision loop. |
| `/gbd-draft-chapter <n>` | Spawn the drafter per scene-group; prose into `manuscript/`, atomic commits; optional verify. |
| `/gbd-read-through <n>` | Conversational, promise-backward verification with persistent state; routes gaps back to planning. |

### Quality gates
| Command | Does |
|---|---|
| `/gbd-editorial-review <n>` | Developmental pass (Four Reward Channels + failure modes) + line/voice copy pass against the style sheet. `--fix` applies edits. |
| `/gbd-continuity-review <n>` | Check the prose against the bible: physical facts, timeline, who-knows-what, unpaid setups. |
| `/gbd-sensitivity-review <n>` | Representation, stereotype, factual/libel, and cultural-accuracy notes (advisory). |

### The story bible
| Command | Does |
|---|---|
| `/gbd-map-manuscript` | Parallel agents reverse-engineer `bible/` (characters, world, timeline, threads, voice, style) from the prose. |
| `/gbd-story-bible` | Build / query / inspect the continuity graph (who/what/where, which setups are still unpaid). |

### Drafts & shipping
| Command | Does |
|---|---|
| `/gbd-complete-draft` | Close a draft cycle (zero/first/revision/polish), archive it, open the next. |
| `/gbd-distribute [blurb\|query\|logline\|platform\|all]` | Sales/pitch copy via a brief-lock gate, the right framework per artifact, no fabrication, variants + rationale. |
| `/gbd-beta-readers` | Assemble reader packets, log per-reader feedback, roll it up into revision items. |

### Situational
| Command | Does |
|---|---|
| `/gbd-progress` | Where the book stands and the recommended next command. |
| `/gbd-resume-work` | Restore context after a break. |
| `/gbd-stats` | Word counts, chapters drafted/verified, promises delivered, velocity. |
| `/gbd-help` | The full command list. |

---

## The `.book/` workspace

GBD keeps planning artifacts in `.book/` (like GSD's `.planning/`) and your prose in
`manuscript/` (the deliverable — the "source code"):

```
.book/
  BOOK.md  OUTLINE.md  PROMISE.md  STATE.md  config.json
  bible/        CHARACTERS · WORLD · TIMELINE · THREADS · VOICE · STYLE
  research/     comps, genre conventions, verified source packs
  reviews/      editorial · continuity · sensitivity findings
  graphs/       continuity-graph.json
  chapters/NN-slug/   CONTEXT · RESEARCH · NN-NN-PLAN · NN-NN-SUMMARY · VERIFICATION · READTHROUGH
manuscript/     chNN.md   ← the prose
```

---

## What makes it more than a wrapper

The craft lives in `core/references/`. These are the distilled, opinionated heart —
the difference between a generic "write me a chapter" prompt and a system that knows the
job:

- **`craft-fiction.md`** — arc beat sequences with a mandatory midpoint shift and a
  competing-values crisis; the four-field scene record; psychic distance and free
  indirect discourse; the **Four Reward Channels** flatness diagnosis; banned "stock
  tells"; and an honest caveat that AI-tell word-lists are *triggers, not proof*.
- **`craft-nonfiction.md`** — chapter theses, the claim→evidence **strength ladder**,
  AXES paragraphs, three-layer citation verification, and the iron rule: *never
  fabricate a citation — verify it or mark a placeholder.*
- **`craft-distribution.md`** — copywriting frameworks (PAS/AIDA/BAB/FAB/4 U's), a
  brief-lock gate, awareness-stage routing, and a no-fabrication discipline for blurbs.
- **`skill-authoring.md`** — how GBD's own skills are written (one skill = one job,
  match-form-to-failure, hard gates, named failure modes).

These distill techniques from a number of excellent community writing skills — see
[CREDITS.md](CREDITS.md).

---

## Modes

`config.book_type` is `fiction`, `nonfiction`, or `general`. It swaps vocabulary and
rubrics: fiction thinks in scenes/arcs/beats and emotional turns; nonfiction thinks in
theses/evidence/takeaways. `general` keeps both available and lets you steer per chapter.

---

## Scope, architecture & portability

GBD is a **prompt-layer port** of GSD, and it's worth being precise about what that means.

GSD ships *two* layers: a methodology expressed as skills/prompts, **and** a Node.js
engine (`gsd-tools` / `gsd-sdk` — ~30 modules under `bin/`) that orchestrators call for
**deterministic** state: config parsing, roadmap analysis, command routing, schema
validation — done in code, without spending model tokens or trusting the model to parse
files correctly.

**GBD v0.1 ports the methodology layer only.** There is no bespoke binary; workflows
discover state with plain shell + `Read` (and the occasional `node`/`python` one-liner
to read `config.json`). The trade:

- **Lighter** — no build step, no dependencies, trivial to read and fork.
- **Less deterministic** — state handling lives in prose + shell rather than a tested
  SDK; no schema validation or token accounting yet. A small `gbd-tools` helper is the
  natural next step if the framework sees real use.

### Requirements & portability

GBD currently targets **[Claude Code](https://claude.com/claude-code)**. It relies on
Claude-Code-native mechanisms — the `SKILL.md` skill format, `.claude/agents/`
subagents, the `Agent` / `AskUserQuestion` tools, and `@file` includes — none of which
are cross-agent standards. So **it does not run as-is on other CLIs** (Gemini CLI,
Cursor, Codex, …).

The *substance*, however, is portable: the craft references, templates, the `.book/`
artifact model, and the lifecycle are plain Markdown any capable agent could drive. Only
the wiring is Claude-specific. (GSD reaches multiple front-ends partly *through* its
shared Node engine; GBD traded that abstraction for simplicity — re-adding it is the
path to agent-agnostic support.)

---

## Roadmap

- [ ] Battle-test the full loop on a real manuscript end-to-end.
- [ ] `gbd-tools` helper (Node or Python) for deterministic state, config & schema validation.
- [ ] Agent-agnostic core + thin per-CLI adapters (Gemini CLI, Codex, …).
- [ ] Export/format pipeline (EPUB / print-ready) in `distribute`.
- [ ] Submission tracker for the query/agent pipeline.
- [ ] Package as an installable Claude Code plugin.

Issues and ideas welcome.

---

## Acknowledgments

GBD would not exist without **[GSD (Get Shit Done)](https://github.com/open-gsd/get-shit-done-redux)**
by the open-gsd project (MIT) — it is GBD's architectural parent, and the entire
workflow spine is adapted from it. The craft references distill ideas from the
creative-writing, academic-writing, and copywriting skills credited in
[CREDITS.md](CREDITS.md). No upstream code or prose was copied; GBD is an independent
reimplementation that borrows architecture and distilled craft, with thanks.

## License

[MIT](LICENSE) © 2026 Marcus Horndt.
