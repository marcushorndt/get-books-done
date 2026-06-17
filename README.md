# Get Books Done (GBD)

**A structured, agent-driven framework for writing books — with the discipline of a
software workflow.**

GBD is a faithful port of [GSD ("Get Shit Done")](https://github.com/open-gsd/get-shit-done-redux),
a meta-prompting framework for AI coding agents, retargeted from **code** to
**manuscripts**. It keeps GSD's proven spine — gather deep context → structure the work
→ discuss before committing → plan before doing → produce → verify against the original
intent → review for quality → ship — and applies it to the messy, long-haul reality of
writing a book.

It runs as a set of [Claude Code](https://claude.com/claude-code) skills and subagents,
backed by a small deterministic engine (`gbd-tools`) and packaged for other CLIs through
adapters. It works for **fiction, nonfiction, or general** writing via a `book_type`
switch that swaps templates and verification rubrics.

> Status: **v0.2.0** — 18 skills, 13 subagents, full core, plus the `gbd-tools` Node
> engine and an agent-agnostic adapter layer (Claude Code shipped; Gemini CLI + Codex
> generated, beta). Internally consistent and engine-tested; not yet battle-tested on a
> finished manuscript. See [Architecture](#architecture).

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

Requires [Claude Code](https://claude.com/claude-code) and Node (for the engine + build).

```sh
git clone https://github.com/marcushorndt/get-books-done.git
cd get-books-done
./install.sh                 # claude-code (default)
```

This installs the engine and generates skills/agents/core into `~/.claude` (backing up
any prior GBD install to `~/.claude/backups/`):

```
engine/  → ~/.claude/get-books-done/engine/   the gbd-tools deterministic engine
core/    → ~/.claude/get-books-done/           templates, references, workflows, VERSION
skills/  → ~/.claude/skills/                    the /gbd- commands
agents/  → ~/.claude/agents/                    the gbd-* subagents
```

Set `CLAUDE_HOME` to install somewhere else. For other CLIs, see
[Install targets](#install-targets) (`./install.sh gemini-cli` / `codex`, beta).

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

## Architecture

GBD has three layers — a portable core, a deterministic engine, and per-CLI adapters:

```
core/        agent-neutral source of truth: references, templates, workflows, VERSION
engine/      gbd-tools — a dependency-free Node engine for deterministic state
commands/    manifest.json — the single registry of skills + agents (agent-neutral)
adapters/    per-CLI generators that package the same definitions natively
  claude-code/   → ~/.claude skills + subagents   (primary, fully supported)
  gemini-cli/    → .gemini TOML commands           (generated, beta)
  codex/         → ~/.codex prompts + AGENTS.md     (generated, beta)
skills/ agents/  the canonical prompt bodies the adapters package
```

**The engine (`gbd-tools`).** Like GSD's `gsd-tools`, this is a small Node CLI (built-ins
only, no npm) that workflows call for *deterministic* state — config, outline/promise/
chapter parsing, progress, verification — instead of re-parsing files by hand each turn.
One call returns structured JSON:

```sh
gbd-tools init.progress           # whole-project snapshot in one call
gbd-tools promise.coverage        # which reader-promises are covered / delivered / open
gbd-tools chapter.state 3         # artifacts, plan index, must_land for chapter 3
```

It's an optimization, not a hard dependency — workflows fall back to plain file reads if
Node isn't present. See [engine/README.md](engine/README.md) for the full verb surface.

**Agent-agnostic by adapter.** A skill is a portable prose *body* plus CLI-specific
*packaging* (frontmatter, tool names, how subagents spawn, how the user is asked). The
bodies and the `core/` are plain Markdown; each adapter regenerates native packaging
from `commands/manifest.json` + bodies. The Claude Code adapter round-trips to the exact
files shipped here; the Gemini CLI and Codex adapters are generated from the same source
and documented honestly as **beta** (subagents / interactive questions are emulated where
the host CLI lacks them — see each adapter's README).

### Install targets

```sh
./install.sh                # claude-code (default): engine + skills + agents → ~/.claude
./install.sh gemini-cli     # generate Gemini CLI commands (→ ~/.gemini or adapters/gemini-cli/dist)
./install.sh codex          # generate Codex prompts + AGENTS.md (→ ~/.codex or adapters/codex/dist)
```

Claude Code is the only adapter exercised end-to-end so far; the others produce real
output but haven't been battle-tested on their host CLIs.

---

## Roadmap

- [ ] Battle-test the full loop on a real manuscript end-to-end.
- [x] `gbd-tools` Node engine for deterministic state, config & schema validation.
- [x] Agent-agnostic core + per-CLI adapters (Claude Code shipped; Gemini CLI, Codex beta).
- [ ] Harden + field-test the Gemini CLI and Codex adapters on their host CLIs.
- [x] Migrate the workflows to call `gbd-tools` throughout (all 16 stateful workflows, engine-first with file-read fallback).
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
