# Get Books Done (GBD)

A structured, agent-driven framework for writing books — a faithful port of the
[GSD](https://git.marcushorndt.de) "Get Shit Done" software workflow, retargeted from
code to **manuscripts**. Same disciplined spine: gather deep context → structure into
units → discuss before committing → plan before doing → draft → verify against the
original promise → review for quality → ship. The domain is books, not code.

It works for **fiction, nonfiction, or general** (a `book_type` switch swaps templates
and verifier rubrics).

## The core idea

GSD's *milestones* become **drafts** (zero → first → revision → polish). Everything
else follows:

| GSD (code) | GBD (books) |
|---|---|
| project → `PROJECT.md` | book → `BOOK.md` (premise, comps, POV/tense, themes) |
| requirements | `PROMISE.md` — the checkable promise to the reader |
| roadmap / phases | `OUTLINE.md` — acts → chapters (the unit of work) |
| discuss-phase | `discuss-chapter` — what this chapter must accomplish |
| plan-phase → `PLAN.md` | `plan-chapter` — beat sheets / scene cards |
| execute-phase | `draft-chapter` — the prose, one commit per scene |
| verify (goal-backward) | `read-through` — does the prose land its promise? |
| code-review | `editorial-review` — developmental + line/voice |
| security-review | `sensitivity-review` |
| map-codebase / intel graph | `map-manuscript` / `story-bible` — the continuity bible |
| complete-milestone | `complete-draft` |
| ship / deploy | `distribute` — blurb, query letter, logline, platform |

**Promise-backward verification:** every chapter plan declares `must_land` beats; the
verifier reads the actual prose and checks they're delivered — not just that words
exist.

## Layout

```
core/      → installs to ~/.claude/get-books-done/  (templates, references, workflows, VERSION)
skills/    → installs to ~/.claude/skills/          (the /gbd: commands)
agents/    → installs to ~/.claude/agents/          (the gbd-* subagents)
```

The `references/craft-*.md` files are the heart: distilled craft for fiction prose,
nonfiction argument/citation discipline, distribution copywriting, and how the agents
themselves are authored.

## Install

```sh
./install.sh          # copies into ~/.claude (backs up any existing gbd-* first)
```

Then in any book folder:

```
/gbd:new-book         # set up .book/ and onboard or start a manuscript
/gbd:help             # full command list, grouped by lifecycle stage
```

## Lifecycle at a glance

```
new-book → outline → discuss-chapter → plan-chapter → draft-chapter → read-through
        ↘ (quality)  editorial-review · continuity-review · sensitivity-review
        ↘ (bible)    map-manuscript · story-bible
        ↘ (ship)     complete-draft · distribute · beta-readers
        situational: progress · resume-work · stats
```

## Status

`v0.1.0` — initial port. 18 skills, 13 agents, full core. Not yet battle-tested on a
real manuscript; the spine is complete and internally consistent.
