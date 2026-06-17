<purpose>
Gather a chapter's context through adaptive conversation and lock it into `NN-CONTEXT.md` before any research or planning. Locked decisions (D-01…) flow downstream to the researcher, planner, and drafter and are never silently dropped. This is the chapter-level analog of GSD discuss-phase.
</purpose>

<required_reading>
@$HOME/.claude/get-books-done/references/questioning.md
@$HOME/.claude/get-books-done/references/conventions.md
@$HOME/.claude/get-books-done/references/mode-fiction-vs-nonfiction.md
@$HOME/.claude/get-books-done/templates/context.md
</required_reading>

<core_principle>
No subagents. The orchestrator converses with the author and writes one artifact. Capture decisions that CONSTRAIN the work (POV, what changes, what must be revealed, pacing). Park everything else under Deferred Ideas so nothing is lost without bloating scope. Do not re-ask anything already decided in BOOK.md or an upstream chapter's CONTEXT.md.
</core_principle>

<process>

## 1. Resolve & load context

```bash
CH="$1"                     # chapter number, e.g. 3 or 3.1
test -f .book/OUTLINE.md || { echo "Run /gbd:new-book first."; exit 1; }
```

- Find this chapter's block in `.book/OUTLINE.md` (Goal, Promises advanced, Dependencies, Mode). If not found, error with the available chapters and suggest `/gbd:outline`.
- Resolve the chapter dir slug from OUTLINE.md → `.book/chapters/NN-slug/`. Create it if absent:
```bash
mkdir -p ".book/chapters/${PADDED}-${SLUG}"
```
- Read for context (POINTERS, lean): `.book/BOOK.md`, `.book/PROMISE.md`, `.book/STATE.md`, the OUTLINE.md entry, the CONTEXT.md + SUMMARY.md of any chapter in this chapter's `Dependencies`, and any relevant `.book/bible/*` entries.
- Resolve `book_type` from `.book/config.json`.

**If `NN-CONTEXT.md` already exists:** offer **View** / **Revise** (re-open the conversation, then rewrite) / **Keep & route to plan**. Don't silently overwrite.

## 2. Mode (general book_type only)

If `book_type == general` AND OUTLINE.md doesn't already fix this chapter's Mode, ask via AskUserQuestion:
- header `Mode`, question "Is this chapter scene-driven or argument-driven?"
- options: "Scene-driven — dramatize it (goal/conflict/turn)" / "Argument-driven — advance a claim (claim/evidence/implication)" / "Let me explain".

Record the answer; it tags CONTEXT.md and selects the vocabulary for the rest of the conversation (ref mode-fiction-vs-nonfiction.md). For pure `fiction`/`nonfiction`, the mode is implied — skip this question.

## 3. Adaptive questioning

Follow `references/questioning.md`. Open with the chapter's job, framed in the resolved vocabulary:
- Fiction / scene-driven: "What does this chapter need to DO — what's different about the reader by the end? Whose scene is it? What do they want, what's in the way, what does it cost?"
- Nonfiction / argument-driven: "What does the reader understand or believe after this chapter that they didn't before? What's the move — claim, evidence, implication?"

Then drill the load-bearing decisions, offering 2–4 concrete options to react against:
- **The turn** — the single emotional/argumentative shift the chapter exists for.
- **POV / whose chapter** (fiction) or **stance/voice** (nonfiction), if not fixed in BOOK.md.
- **What is revealed** vs. withheld — information the reader must now hold.
- **What gets planted** — setups that pay off later (tie to PROMISE.md ids).
- **Pacing / scope** — how much real estate, where it starts and stops.

Rules:
- Challenge vagueness ("gripping how? for whom?"). Make it concrete ("walk me through it as the reader experiences it").
- When the author picks "Let me explain" or goes freeform, STOP using menus, listen, then resume structured questions only if useful.
- **Scope creep:** when a good idea surfaces that belongs to a different chapter or a later draft, acknowledge it and write it to Deferred Ideas — do NOT turn it into a decision for this chapter.

Stop a thread the moment its decision is made; lock it as `D-0k`.

## 4. Write NN-CONTEXT.md

Write `.book/chapters/${PADDED}-${SLUG}/${PADDED}-CONTEXT.md` from `templates/context.md`, filling every section:
- **Boundary** — what this chapter IS and is NOT (the scope anchor from OUTLINE.md + the conversation).
- **Mode** — `scene-driven` / `argument-driven` (general only; omit the line otherwise).
- **What this chapter must accomplish** — the turn, what changes, what the reader feels/understands by the end.
- **Decisions (locked)** — `D-01…`, each tagged with its area (POV / pacing / reveal / plant / voice). These are immutable once written.
- **Author's discretion** — areas the author explicitly handed to the drafter ("you decide").
- **Promises advanced** — the PROMISE.md ids this chapter moves (must be a subset/consistent with OUTLINE.md; if the conversation revealed it advances a new promise, update OUTLINE.md's row too).
- **Canonical references** — full paths to the BOOK.md sections, `.book/bible/*` entries, and prior chapters that constrain this one.
- **Deferred ideas** — everything parked in Step 3.

No literal `{{placeholders}}` may remain.

## 5. Commit & route

Respecting `commit_docs`:
```bash
git add ".book/chapters/${PADDED}-${SLUG}/${PADDED}-CONTEXT.md" .book/OUTLINE.md 2>/dev/null
git commit -q -m "chore(book): lock chapter ${CH} context decisions" || true
```

Update `.book/STATE.md`: position → this chapter, Last activity → `scoped chapter ${CH}`, Resume file → the CONTEXT.md path; append the new `D-` ids under Recent decisions.

Route:
```
Chapter ${CH} scoped — ${count} decisions locked.
Next: /gbd:plan-chapter ${CH}
```

</process>

<success_criteria>
- NN-CONTEXT.md exists with locked D-01… decisions, the chapter's job, promises advanced, author's discretion, canonical refs, and deferred ideas — no placeholders.
- In general mode, the chapter is tagged scene-driven or argument-driven and the conversation used that vocabulary.
- No upstream-decided question was re-asked; scope creep landed under Deferred Ideas, not as a decision.
- Committed as `chore(book)` (unless commit_docs=false); routed to /gbd:plan-chapter.
</success_criteria>
