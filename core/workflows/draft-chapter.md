<purpose>
Draft a chapter by turning its beat sheets into prose, using wave-based parallel execution. Orchestrator stays lean — it discovers plans, groups them into waves, spawns one `gbd-drafter` per plan, collects SUMMARY.md + commits, optionally verifies, and updates progress. The chapter-level analog of GSD execute-phase.
</purpose>

<required_reading>
@$HOME/.claude/get-books-done/references/conventions.md
@$HOME/.claude/get-books-done/references/promise-backward.md
@$HOME/.claude/get-books-done/references/git-conventions.md
@$HOME/.claude/get-books-done/references/mode-fiction-vs-nonfiction.md
@$HOME/.claude/get-books-done/templates/summary.md
</required_reading>

<core_principle>
Orchestrator coordinates, does NOT write prose. Each `gbd-drafter` loads the full context for its one plan, writes prose into `manuscript/`, commits one scene at a time (`draft(NN-NN): scene-name`), and writes its `NN-NN-SUMMARY.md`. The orchestrator verifies progress via the filesystem and git, never by trusting a claim.
</core_principle>

<available_agent_types>
Spawn via the Agent tool with `subagent_type` (exact names; fall back to `general-purpose` + inline brief only if unregistered):
- gbd-drafter — drafts one plan's prose, commits per scene, writes NN-NN-SUMMARY.md (orchestrator detects SUMMARY.md + commits as the completion signal)
- gbd-verifier — promise-backward check of the drafted chapter → writes NN-VERIFICATION.md, emits `## Verification Complete`
</available_agent_types>

<process>

## 1. Resolve chapter & discover plans

```bash
CH="$1"
test -f .book/OUTLINE.md || { echo "Run /gbd:new-book first."; exit 1; }
```
- Resolve `.book/chapters/NN-slug/`. Glob `NN-NN-PLAN.md`. **If none:** error — `Chapter NN isn't planned. Run /gbd:plan-chapter NN.` Stop.
- Read `.book/config.json`: `workflow.verifier`, `gates.confirm_draft`, `parallelization.{enabled,max_concurrent_agents,min_units_for_parallel}`, `prose.manuscript_dir`, `commit_docs`, `book_type`.
- Parse active flags from `$ARGUMENTS` (active ONLY if the literal token is present): `--wave N` → `WAVE_FILTER`; `--gaps-only` → restrict to plans with `gap_closure: true` in frontmatter.

```bash
mkdir -p "${MANUSCRIPT_DIR:-manuscript}"
```

## 2. Build waves

Read each plan's frontmatter `wave` and `depends_on`. Group plans by `wave` (ascending). Within a wave, plans are independent and may run in parallel; a later wave may depend on earlier waves via `depends_on`.

- Determine which plans are already drafted (a matching `NN-NN-SUMMARY.md` exists AND its scenes have `draft(...)` commits) and EXCLUDE them — drafting is resumable.
- If `WAVE_FILTER` is set, restrict to that wave. If `--gaps-only`, restrict to gap-closure plans.
- If nothing remains to draft, report the chapter is already drafted and skip to Step 5.

## 3. Draft each wave

For each wave in order:

1. Determine concurrency: if `parallelization.enabled` AND the wave has `>= min_units_for_parallel` plans, spawn up to `max_concurrent_agents` `gbd-drafter` agents IN PARALLEL (multiple Agent tool calls in ONE message). Otherwise spawn sequentially.

2. Each `gbd-drafter` gets POINTERS only: `@…/NN-NN-PLAN.md` (its plan), `@…/NN-CONTEXT.md`, `@.book/BOOK.md`, `@.book/PROMISE.md`, `@…/NN-RESEARCH.md` (if any), relevant `@.book/bible/*` (VOICE.md, STYLE.md, CHARACTERS.md), and the target `manuscript/` path. Pass `book_type`/`mode`, `prose.pov`/`tense`, `target_words`. Instruct it to:
   - Draft prose for each scene/section in the plan, honoring every locked decision and landing every `must_land` beat/turn/reveal; plant the `plants`.
   - Fiction: scene craft (goal/conflict/disaster, sensory grounding, subtext, voice; dramatize, don't summarize). Nonfiction: claim → evidence → implication, signposting, worked examples, citation hygiene against research/.
   - Write into `manuscript/` (append/section per the plan's `key_files`).
   - Commit ONE scene per commit: `draft(NN-NN): scene-name` (or `revise(NN-NN): …` for gap/revise plans).
   - Write `NN-NN-SUMMARY.md` from `templates/summary.md`: scenes drafted table (with commit hashes + word counts), deviations from the beat sheet (with rationale), new STYLE.md decisions, setups/threads touched, and a PASSED/NEEDS-REVIEW self-check.

3. **Collect & verify the wave via filesystem + git** (do not trust agent prose): confirm each plan now has a SUMMARY.md and that `git log` shows the expected `draft(...)`/`revise(...)` commits and the manuscript file grew. If a plan produced no SUMMARY.md or no commits, re-spawn it ONCE; if it still fails, surface the failure to the author and stop before the next wave.

Do not start wave N+1 until wave N is collected and verified.

## 4. GATE — confirm_draft (default off)

Only if `gates.confirm_draft` is true: present the drafted scenes + word counts + any NEEDS-REVIEW self-checks and STOP for the author to confirm before verification. (Default config has this false — skip.)

## 5. Optional verifier

**Skip if** `workflow.verifier` is false, OR a `--wave` filter left incomplete plans (verify only the whole chapter), OR `--gaps-only` (gap closure routes back through read-through).

Spawn `gbd-verifier` with pointers: the chapter's PLAN.md files, the drafted `manuscript/` file(s), `@.book/PROMISE.md`. Instruct it to run the promise-backward procedure (ref promise-backward.md): for each `must_land` item, locate textual evidence in the actual prose (quote it), mark COVERED/PARTIAL/MISSING, cross-check `promises` against PROMISE.md, and write `NN-VERIFICATION.md` (`status: passed | needs_review`). Emit `## Verification Complete`.

This verifier is the automated pre-check; the conversational read-through (`/gbd:read-through`) is the authoritative human gate.

## 6. Update OUTLINE.md progress & commit metadata

Update the chapter's Progress row: `Status` → `drafted` (or `verified` if the verifier returned `passed`), `Words` → summed from the SUMMARY.md tables, keep Promises. Update STATE.md (position, word counts, Last activity `drafted chapter ${CH}`, Resume file → READTHROUGH-to-be or the manuscript).

Respecting `commit_docs`, commit the metadata (the prose itself is already committed per-scene by the drafters):
```bash
git add .book/OUTLINE.md .book/STATE.md ".book/chapters/${PADDED}-${SLUG}/" 2>/dev/null
git commit -q -m "chore(book): chapter ${CH} drafted — update progress" || true
```

## 7. Route

```
Chapter ${CH} drafted — ${SCENES} scenes, ${WORDS} words across ${WAVES} wave(s).
Next: /gbd:read-through ${CH}
```
If a `--wave` filter left waves remaining, instead report the remaining waves and suggest re-running without the filter (or with the next wave).

</process>

<success_criteria>
- Every non-excluded plan has prose in manuscript/, per-scene draft/revise commits, and a SUMMARY.md — verified via filesystem + git, not agent claims.
- Waves ran in dependency order; parallel only within a wave and within max_concurrent_agents.
- Verifier (if enabled) wrote NN-VERIFICATION.md from actual prose evidence.
- OUTLINE.md Progress and STATE.md updated; metadata committed (unless commit_docs=false); routed to /gbd:read-through.
- --wave / --gaps-only honored only when their literal tokens were present.
</success_criteria>
