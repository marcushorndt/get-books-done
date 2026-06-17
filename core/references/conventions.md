# GBD Conventions (shared by all skills and agents)

Get Books Done (GBD) is a structural port of the GSD framework from software to
manuscript writing. The orchestrator→subagent pattern, stage-gated state machine,
goal-backward verification, artifact tree, and atomic commits are preserved; the
domain is books, not code.

## Namespace & layout

- Commands: `/gbd-<name>` (skills live in `~/.claude/skills/gbd-<name>/SKILL.md`)
- Agents: `~/.claude/agents/gbd-<name>.md`
- Core: `~/.claude/get-books-done/` (templates/, references/, workflows/, VERSION)
- Per-book planning tree: `.book/` (mirror of GSD `.planning/`)
- Prose deliverable: `manuscript/` (the "source code" — what the reader reads)

## The artifact tree (`.book/`)

```
.book/
  BOOK.md        # vision: premise, genre, audience, comps, POV/tense, themes  (= PROJECT.md)
  OUTLINE.md     # acts → chapters; the phase structure + progress table        (= ROADMAP.md)
  PROMISE.md     # the promise to the reader: checkable payoffs                  (= REQUIREMENTS.md)
  STATE.md       # current position, velocity, decisions digest (<100 lines)     (= STATE.md)
  config.json    # workflow toggles, book_type, prose defaults
  bible/         # story bible (built by map-manuscript)                         (= codebase/)
    CHARACTERS.md WORLD.md TIMELINE.md THREADS.md VOICE.md STYLE.md
  research/      # comps, genre conventions, subject research                    (= research/)
  reviews/       # editorial + continuity + sensitivity findings                 (= review/)
  graphs/        # continuity-graph.json                                         (= graphs/)
  chapters/
    01-opening/
      01-CONTEXT.md         # what this chapter must accomplish (decisions D-01…) (= CONTEXT.md)
      01-RESEARCH.md        # optional, from gbd-chapter-researcher              (= RESEARCH.md)
      01-01-PLAN.md         # beat sheet / scene cards                           (= PLAN.md)
      01-01-SUMMARY.md      # post-draft: scenes written, word counts, deviations (= SUMMARY.md)
      01-VERIFICATION.md    # did the prose land the promise?                    (= VERIFICATION.md)
      01-READTHROUGH.md     # conversational read-through state (persistent)     (= UAT.md)
```

A **chapter** is the phase unit (= GSD phase). A **scene** within a chapter is the
plan/task unit. A **draft** (zero → first → revision → polish) is the milestone unit
(= GSD milestone).

## Naming

- Chapter dirs: `NN-slug` (e.g. `03-the-betrayal`), slug from OUTLINE.md.
- Plans (scene groups): `{chapter}-{plan}-PLAN.md` → `03-01-PLAN.md`.
- Decisions in CONTEXT.md: `D-01`, `D-02`, … (immutable once locked).
- Promise items in PROMISE.md: `[CATEGORY]-NN` e.g. `PAYOFF-01`, `ARC-02`, `THESIS-01`.

## Completion markers (orchestrators detect these in agent output)

| Agent | Marker on success | Marker on block |
|---|---|---|
| gbd-book-researcher | `## RESEARCH COMPLETE` | `## RESEARCH BLOCKED` |
| gbd-chapter-researcher | `## RESEARCH COMPLETE` | `## RESEARCH BLOCKED` |
| gbd-outliner | `## OUTLINE COMPLETE` | — |
| gbd-planner | `## PLANNING COMPLETE` | — |
| gbd-plan-checker | `## VERIFICATION PASSED` | `## ISSUES FOUND` |
| gbd-drafter | (orchestrator detects SUMMARY.md + commits) | — |
| gbd-verifier | `## Verification Complete` | — |
| gbd-editor | `## REVIEW COMPLETE` | — |
| gbd-edit-applier | (orchestrator detects commits) | — |
| gbd-continuity-checker | `## CONTINUITY COMPLETE` | — |
| gbd-sensitivity-reader | `## SENSITIVITY COMPLETE` | — |
| gbd-bible-mapper | (writes bible/ files directly) | — |

## Orchestrator → subagent rules

- Skills are THIN dispatch layers. They discover state, spawn agents, collect
  results, gate on the user, commit. They do not write prose or beats themselves.
- Pass agents POINTERS to files (`@.book/chapters/03-…/03-CONTEXT.md`), never
  pasted file contents — keep orchestrator context lean.
- Agents read what they need, write their artifact, emit their completion marker.

## Revision loop (plan-check, editorial)

Max 3 iterations. Producer → checker. If PASSED or info-only, accept. If blockers,
re-spawn producer with issues inlined. After 3 iterations OR if issue count fails to
drop, escalate to the user via AskUserQuestion (Proceed anyway / Adjust approach).

## Decision fidelity

Locked decisions in CONTEXT.md (D-01…) and the reader promises in PROMISE.md flow
downstream and constrain research → planning → drafting. Agents NEVER silently drop
or simplify a locked decision or a promised payoff. If scope overflows a chapter,
SPLIT the chapter (3 → 3.1, 3.2) — do not cut the promise.

## Atomic commits

One commit per scene drafted (and per applied edit). Format:
`{type}({chapter}-{plan}): {scene-name}`
Types: `draft` (new prose), `revise` (rework), `edit` (line/copy), `fix` (continuity),
`outline`, `bible`, `chore`. `.book/` metadata commits use `chore(book):`.

## Book type modes

`config.book_type` is `fiction` | `nonfiction` | `general`. It swaps templates and
verifier rubrics (see references/mode-fiction-vs-nonfiction.md). Fiction thinks in
scenes/arcs/beats; nonfiction thinks in theses/evidence/takeaways. `general` keeps
both vocabularies available and lets the user steer per chapter.
