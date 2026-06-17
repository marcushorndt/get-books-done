<purpose>
Create executable beat sheets (`NN-NN-PLAN.md` files) for a scoped chapter, with optional research and a plan-quality revision loop. Default flow: Research (if enabled) → Plan → Verify → Done. Orchestrates `gbd-chapter-researcher`, `gbd-planner`, and `gbd-plan-checker` with a revision loop (max 3 iterations). This is the chapter-level analog of GSD plan-phase.
</purpose>

<required_reading>
@$HOME/.claude/get-books-done/references/conventions.md
@$HOME/.claude/get-books-done/references/revision-loop.md
@$HOME/.claude/get-books-done/references/promise-backward.md
@$HOME/.claude/get-books-done/references/mode-fiction-vs-nonfiction.md
@$HOME/.claude/get-books-done/templates/beat-sheet.md
</required_reading>

<core_principle>
Orchestrator coordinates; agents produce. The orchestrator discovers state, spawns the planner/checker, runs the revision loop, gates on the author, and commits. It NEVER writes beats itself. Agents receive POINTERS to files (`@.book/chapters/NN-…/NN-CONTEXT.md`), never pasted content.
</core_principle>

<available_agent_types>
Spawn via the Agent tool with `subagent_type` (exact names; fall back to `general-purpose` + inline brief only if unregistered):
- gbd-chapter-researcher — researches this chapter's specifics → writes `NN-RESEARCH.md`, emits `## RESEARCH COMPLETE` / `## RESEARCH BLOCKED`
- gbd-planner — writes `NN-NN-PLAN.md` beat sheets → emits `## PLANNING COMPLETE`
- gbd-plan-checker — goal-backward review of the plans → emits `## VERIFICATION PASSED` / `## ISSUES FOUND`
</available_agent_types>

<process>

## 1. Parse args & resolve chapter

Extract from `$ARGUMENTS`: chapter number (integer or decimal), flags `--research`, `--skip-research`, `--gaps`, `--view`.

```bash
test -f .book/OUTLINE.md || { echo "Run /gbd-new-book first."; exit 1; }

# Prefer the engine for deterministic state; fall back to file reads (see conventions.md → engine).
GBD="node $HOME/.claude/get-books-done/engine/bin/gbd-tools.cjs"
gbd(){ command -v node >/dev/null 2>&1 && [ -f "$HOME/.claude/get-books-done/engine/bin/gbd-tools.cjs" ] || return 1; o=$($GBD "$@" 2>/dev/null) || return 1; case "$o" in @file:*) cat "${o#@file:}";; *) printf '%s' "$o";; esac; }

# One compound call for the whole planning context: config flags
# (workflow.research/plan_check, gates.confirm_chapter_plan, granularity, book_type,
# commit_docs, prose.*), chapter state (CONTEXT present, existing plans, mode), and the
# chapter's promises. Read fields straight from this JSON.
INFO=$(gbd init.plan-chapter "$CH") && echo "$INFO"
```

- **No chapter number:** detect the next chapter that has a CONTEXT.md but no PLAN.md files.
- Resolve the chapter dir `.book/chapters/NN-slug/`. **If no `NN-CONTEXT.md`:** error — `Chapter NN isn't scoped. Run /gbd-discuss-chapter NN first.` and stop.
- Read the planning context from `$INFO`: `workflow.research`, `workflow.plan_check`, `gates.confirm_chapter_plan`, `granularity`, `book_type`, `commit_docs`, `prose.*`, the chapter's `mode`, existing artifacts (`NN-RESEARCH.md`, `NN-NN-PLAN.md` count, `NN-VERIFICATION.md`), and the promises this chapter advances. Resolve `mode` (CLI > CONTEXT.md/OUTLINE.md `Mode` > config > general). For an individual flag you can also call e.g. `gbd config-get workflow.plan_check --raw` (with a literal default if empty).
- **If the engine is unavailable** (`$INFO` empty): read `.book/config.json` directly for the same flags, and detect existing artifacts (`NN-RESEARCH.md`, `NN-NN-PLAN.md` count, `NN-VERIFICATION.md`) by globbing the chapter dir.

## 2. --view (cheap, no spawn)

If `--view`: print every `NN-NN-PLAN.md` in the chapter dir (frontmatter + scenes). If none exist, say so and suggest dropping `--view`. Stop.

## 3. --gaps (gap-closure mode)

If `--gaps`:
- Require `NN-VERIFICATION.md`. If absent: error — `No verification for chapter NN. Run /gbd-read-through NN first.` Stop.
- Read VERIFICATION.md; collect every item marked PARTIAL or MISSING with its gap note.
- Skip research. Skip to Step 5 (planning) but instruct the planner to produce ONLY gap-closure plans: new `NN-NN-PLAN.md` files (next free plan numbers) whose `must_land` are exactly the unmet criteria, each with `gap_closure: true` and `type: revise` in frontmatter, and a tight scene set targeting the gap. Do not re-plan landed beats.
- Continue through the revision loop and commit as normal.

## 4. Research

**Skip if** `--skip-research`, OR (`workflow.research` false AND not `--research`), OR `--gaps`.

If `NN-RESEARCH.md` exists and `--research` is NOT set: offer **update / view / skip**. With `--research`: force re-spawn unconditionally.

Spawn `gbd-chapter-researcher` with pointers: `@.book/chapters/NN-…/NN-CONTEXT.md`, `@.book/BOOK.md`, `@.book/PROMISE.md`, the book-level `@.book/research/` if present, resolved `book_type`/`mode`. Instruct it to write `NN-RESEARCH.md` (factual grounding, period/domain detail, source notes for nonfiction citation hygiene) and emit `## RESEARCH COMPLETE` / `## RESEARCH BLOCKED`.
- On BLOCKED: surface the gap, ask the author, re-spawn once, else note and continue.

## 5. Plan (spawn gbd-planner)

Spawn `gbd-planner` with POINTERS: `@…/NN-CONTEXT.md`, `@.book/BOOK.md`, `@.book/PROMISE.md`, `@…/NN-RESEARCH.md` (if any), the OUTLINE.md entry, and (when context budget allows) the 1–2 most recent prior chapters' CONTEXT.md + SUMMARY.md plus any chapter named in this chapter's Dependencies. Pass: `book_type`, `mode`, `granularity`, `prose.pov`/`tense`/`chapter_target_words`, and (if `--gaps`) the gap list with `gap_closure: true` instruction.

Instruct the planner to:
- Break the chapter into plans (scene groups). Granularity drives count: `lean` → often 1 plan; `standard` → 1–3; `detailed` → finer. Group plans into `wave`s — a plan in wave 2 may depend on a wave-1 plan via `depends_on`; independent plans share a wave for parallel drafting.
- Write each `NN-NN-PLAN.md` from `templates/beat-sheet.md`, filling the REQUIRED `must_land` frontmatter (`beats`, `turn`, `reveals`, `plants`, `promises`) and the per-scene four-field records (`what_changes`, `whose_scene`, `reader_learns`, `arc_connection`, `beats`, setups/payoffs).
- Carry EVERY locked decision (D-01…) and EVERY promise this chapter advances into the beats. If scope overflows the chapter, recommend a SPLIT (`/gbd-outline --insert`) rather than dropping a promise.
- Run the causation check ("therefore"/"but", not "and then") and write Success criteria feeding promise-backward verification.
- Emit `## PLANNING COMPLETE`.

Detect `## PLANNING COMPLETE`. Collect the written plan file paths.

After the planner returns, run a fast structural check on the written plans (frontmatter completeness, `must_land` fields, wave/`depends_on` sanity) before the goal-backward checker:
```bash
# Engine structural pre-check; harmless no-op if the engine is unavailable.
PSTRUCT=$(gbd verify.plan-structure "$CH"); [ -n "$PSTRUCT" ] && echo "$PSTRUCT"
```
If `$PSTRUCT` flags missing/empty `must_land` frontmatter or a malformed wave graph, fold those findings into the plan-checker pass below (or re-spawn the planner to fix them). If the engine is unavailable, rely on the plan-checker for structure.

## 6. Revision loop (plan-check)

**Skip if** `workflow.plan_check` is false → accept plans, go to Step 7.

Run the loop from `references/revision-loop.md` (max 3):
```
iteration = 0
loop:
  spawn gbd-plan-checker (pointers: the NN-NN-PLAN.md files, NN-CONTEXT.md, PROMISE.md)
    -> it does goal-backward analysis: will these beats land the chapter's turn and
       advance every promised id? are decisions honored? is causation tight? does any
       scene fail "what_changes"? -> emits ## VERIFICATION PASSED or ## ISSUES FOUND
  if ## VERIFICATION PASSED (or only info-only findings):  accept, exit loop
  iteration += 1
  if iteration > 3:                 escalate
  if new_issue_count >= prev_count: escalate   # loop stalled
  re-spawn gbd-planner with the findings inlined; collect updated plans
```
**Escalate** via AskUserQuestion, surfacing the remaining findings verbatim: **Proceed anyway** (accept with noted findings) / **Adjust approach** (discuss a different strategy, then re-enter the loop). Never loop silently past 3.

## 7. GATE — confirm_chapter_plan

HARD when `gates.confirm_chapter_plan` is true (default). Present a compact summary: plan count, waves, each plan's `turn` and `must_land.beats`, promises advanced, and any plan-checker findings accepted.

**STOP. Do NOT commit until the author confirms the plan.** Offer: **Confirm** / **Revise** (re-spawn planner with the author's note) / **Split the chapter** (route to `/gbd-outline --insert NN`). Loop on Revise.

## 8. Commit & route

Respecting `commit_docs`:
```bash
MSG="chore(book): plan chapter ${CH} — ${PLAN_COUNT} plan(s)$( [ -n "$GAPS" ] && echo ' (gap closure)')"
# Prefer the engine's commit helper; fall back to plain git if unavailable.
gbd commit "$MSG" ".book/chapters/${PADDED}-${SLUG}/" \
  || { git add ".book/chapters/${PADDED}-${SLUG}/" 2>/dev/null; git commit -q -m "$MSG" || true; }
```

Update OUTLINE.md Progress row → `planned`; update STATE.md (position, Last activity `planned chapter ${CH}`, Resume file → first PLAN.md). Commit those with the same message if not already staged.

Route:
```
Chapter ${CH} planned — ${PLAN_COUNT} plan(s) across ${WAVE_COUNT} wave(s).
Next: /gbd-draft-chapter ${CH}
```

</process>

<success_criteria>
- One or more NN-NN-PLAN.md files exist, each with complete `must_land` frontmatter and four-field scene records, grouped into waves.
- Every locked decision and every promised PROMISE.md id is reflected in the beats — none dropped (split recommended if scope overflowed).
- Plan-checker loop ran (if enabled), capped at 3, escalated on stall/cap with findings shown verbatim.
- confirm_chapter_plan gate honored; committed as chore(book); routed to /gbd-draft-chapter.
- --gaps planned only the unmet VERIFICATION.md criteria with gap_closure:true; --view spawned nothing.
</success_criteria>
