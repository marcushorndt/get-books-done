<purpose>
Initialize a new book through a unified flow: adaptive questioning → config → vision artifacts → optional research → outline. No single step pays off more than this one — the harder you dig with questions now, the sharper the chapters, the cleaner the drafts, and the more verifiable the promises become later. One workflow takes the author from idea to ready-to-scope-chapter-1.
</purpose>

<required_reading>
Open each file named in the invoking prompt's `<execution_context>` before acting — they define how this step is meant to run.
@$HOME/.claude/get-books-done/references/questioning.md
@$HOME/.claude/get-books-done/references/conventions.md
@$HOME/.claude/get-books-done/references/git-conventions.md
@$HOME/.claude/get-books-done/references/mode-fiction-vs-nonfiction.md
</required_reading>

<available_agent_types>
Spawn these via the Agent tool with `subagent_type` (use exact names; do not fall back to `general-purpose`). If a `gbd-*` subagent type is not registered in this runtime, spawn `general-purpose` and paste the agent's role brief inline:
- gbd-book-researcher — researches comps, genre conventions, subject matter → writes `.book/research/*.md`, emits `## RESEARCH COMPLETE` or `## RESEARCH BLOCKED`
- gbd-outliner — produces `.book/OUTLINE.md` from BOOK.md + PROMISE.md, emits `## OUTLINE COMPLETE`
- gbd-bible-mapper — (brownfield only) reverse-engineers `.book/bible/` from an existing `manuscript/`
</available_agent_types>

<process>

## 0. Auto-mode detection

Check `$ARGUMENTS` for `--auto`.

**If `--auto`:**
- Require an idea document (an `@file` reference or pasted pitch text). If none is present, error: `Auto mode needs an idea document. Re-run: /gbd:new-book --auto @pitch.md` and stop.
- Skip the open questioning loop — extract premise/genre/audience/comps from the document.
- Ask config questions FIRST (Step 2) but with smart defaults pre-selected.
- Skip the brownfield offer (assume greenfield) and the `git init` prompt (init silently if not a repo).
- Run research → outline with: research = yes, both gates auto-approved.

## 1. Pre-flight: already-initialized & brownfield checks

```bash
ROOT="$(pwd)"
test -f .book/BOOK.md && echo "EXISTS" || echo "FRESH"
test -d manuscript && echo "HAS_MANUSCRIPT" || echo "NO_MANUSCRIPT"
test -d .git && echo "IS_REPO" || echo "NO_REPO"
```

- **If `.book/BOOK.md` already exists:** Stop. Tell the author the book is already initialized and point them at `/gbd:progress`. Do not overwrite.
- **If a `manuscript/` directory exists with prose in it (brownfield):** Note this for Step 4 — offer to map it into a story bible.

## 2. Config questions (gather BEFORE doing the work)

Use AskUserQuestion (or a numbered text list if `--text`/remote). Ask these, with the template `config.json` values as defaults:

1. **book_type** — `fiction` / `nonfiction` / `general`. (Drives templates and verifier rubrics — ref mode-fiction-vs-nonfiction.md.)
2. **granularity** — `lean` (few large chapters, light planning) / `standard` / `detailed` (many scenes, heavy plan-checking).
3. **POV / tense** — e.g. `third-limited, past` (fiction) or `first-person, present` (memoir). For nonfiction, ask narrative stance (`instructional` / `authoritative` / `conversational`) instead and store under `prose.pov`.
4. **research** — run a book-level research pass now? (comps, genre conventions, subject matter)
5. **git** — if `NO_REPO`: offer `git init`. (Skip in `--auto`; init silently.)

Hold the answers; do not write config yet — Step 3 writes all artifacts together.

## 3. Open questioning → BOOK.md + PROMISE.md

**Skip the open loop in `--auto`** (extract from the document instead).

Otherwise run adaptive questioning per `references/questioning.md`:
- Start open: "What's the book?"
- Follow the author's energy; challenge vagueness ("gripping how? for whom?"); make it concrete.
- Offer 2–4 concrete options to react against for the load-bearing decisions (premise, the core promise/payoff, primary reader, comps, structure model, themes).
- Stop each thread when the decision is made.

When you have enough to fill the vision:

1. Create the tree and write `BOOK.md` from `templates/book.md`, filling every `{{…}}` from the conversation. Leave nothing as a literal placeholder; if unknown, write a best inference and flag it `(assumed)`.
2. Write `PROMISE.md` from `templates/promise.md`. Seed 3–8 promise items using the category set for the chosen `book_type` (fiction: ARC/HOOK/MYSTERY/PAYOFF; nonfiction: THESIS/TAKEAWAY/CLAIM/EVIDENCE; general: pick what fits). Each gets a stable id (`ARC-01`, `THESIS-01`, …). Fill the traceability table with `Status: open`.
3. Write `config.json` from `templates/config.json` with the Step 2 answers applied (`book_type`, `granularity`, `prose.pov`, `prose.tense`, `workflow.research`).

```bash
mkdir -p .book/research .book/chapters
```

## 4. Brownfield offer (skip in --auto)

**Only if a non-empty `manuscript/` exists.** Offer via AskUserQuestion: "I see an existing manuscript. Reverse-engineer a story bible from it before we outline?" — **Yes** (spawn `gbd-bible-mapper`, which routes to `/gbd:map-manuscript`) / **No, outline fresh**.

If yes, spawn `gbd-bible-mapper` with a pointer to `manuscript/` and `@.book/BOOK.md`. Let it write `.book/bible/*` directly. Continue once it returns.

## 5. GATE — confirm_book

This gate is HARD when `config.gates.confirm_book` is true (default). Present a tight summary of `BOOK.md` (premise, type, POV/tense, comps, themes) and the seeded `PROMISE.md` ids.

**STOP. Do NOT proceed to research or outline until the author confirms the book vision.** Offer: **Confirm** / **Revise** (edit and re-show) / **Add a promise**. Loop on Revise.

In `--auto`, auto-confirm and print the summary for the record.

## 6. Research (optional)

**Skip if** `workflow.research` is false (Step 2 answer) or `--auto` with research disabled.

Spawn `gbd-book-researcher` with pointers (NOT pasted content): `@.book/BOOK.md`, `@.book/PROMISE.md`, and the resolved `book_type`. Instruct it to write `.book/research/comps.md`, `.book/research/genre.md` (fiction) or `.book/research/subject.md` (nonfiction), and to emit `## RESEARCH COMPLETE` (or `## RESEARCH BLOCKED` with what it needs).

- On `## RESEARCH BLOCKED`: surface what's missing, ask the author, then re-spawn once. Do not block the outline indefinitely — if still blocked, note it and continue.
- On `## RESEARCH COMPLETE`: continue.

## 7. Outline

Spawn `gbd-outliner` with pointers: `@.book/BOOK.md`, `@.book/PROMISE.md`, the research dir if it exists (`@.book/research/`), `book_type`, `granularity`, and the structure model from BOOK.md. Instruct it to:
- Produce `.book/OUTLINE.md` from `templates/outline.md`: acts → chapters, each with Goal / Promises advanced / Dependencies / (Mode, in general type) / Plans.
- Map every committed PROMISE.md id to at least one chapter (no orphan promises).
- Fill the Progress table (all chapters `Status: planned`-pending → use `—`/`planned`).
- Emit `## OUTLINE COMPLETE`.

Detect `## OUTLINE COMPLETE` in the agent's output before continuing.

## 8. GATE — confirm_outline

HARD when `config.gates.confirm_outline` is true (default). Show the act/chapter list and the promise→chapter coverage.

**STOP. Do NOT commit until the author confirms the outline.** Offer: **Confirm** / **Edit a chapter** (route to `/gbd:outline --edit N`, then re-show) / **Add/split a chapter** (`/gbd:outline`). Loop until confirmed.

In `--auto`, auto-confirm.

## 9. STATE.md + commit + route

1. Write `STATE.md` from `templates/state.md`: Draft = `zero`, Chapter = `1 of {N}`, Last activity = `book initialized; outline drafted`, Resume file = `.book/OUTLINE.md`, word counts 0 / target.

2. If `NO_REPO` and the author accepted `git init` (or `--auto`):
```bash
git init -q
printf '%s\n' '.DS_Store' >> .gitignore 2>/dev/null || true
```

3. Commit the whole initialization as one metadata commit (respect `config.planning.commit_docs`; if false, skip the commit and tell the author the artifacts are written but uncommitted):
```bash
git add .book .gitignore 2>/dev/null
git commit -q -m "chore(book): initialize book — vision, promises, outline" || true
```

4. Route:
```
Book initialized. Next: scope your opening chapter.

  /gbd:discuss-chapter 1

(or edit structure first: /gbd:outline --view)
```

</process>

<success_criteria>
- BOOK.md, PROMISE.md, config.json, STATE.md, OUTLINE.md all written with no literal `{{placeholders}}` left.
- Every committed PROMISE.md id is advanced by at least one chapter in OUTLINE.md.
- Both hard gates (`confirm_book`, `confirm_outline`) honored unless `--auto`.
- Brownfield offer made iff a manuscript exists; `git init` offered iff not a repo.
- One `chore(book)` commit (unless `commit_docs=false`); routed to `/gbd:discuss-chapter 1`.
</success_criteria>
