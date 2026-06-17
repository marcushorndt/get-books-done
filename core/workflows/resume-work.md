<purpose>
Instantly restore full book context after a break so the author can pick up where they left
off. Load STATE.md (or reconstruct it), reopen the last artifact, detect any half-finished
chapter work, present a tight status, and route to the next GBD command.
</purpose>

<required_reading>
Read the invoking skill's execution_context (conventions.md — artifact tree + completion
markers).
</required_reading>

<process>

<step name="initialize">
```bash
test -d .book || { echo "No .book/ — this isn't a GBD book yet. Run /gbd-new-book."; exit 1; }
STATE_OK=$(test -f .book/STATE.md && echo yes || echo no)

GBD="node $HOME/.claude/get-books-done/engine/bin/gbd-tools.cjs"
gbd(){ command -v node >/dev/null 2>&1 && [ -f "$HOME/.claude/get-books-done/engine/bin/gbd-tools.cjs" ] || return 1; o=$($GBD "$@" 2>/dev/null) || return 1; case "$o" in @file:*) cat "${o#@file:}";; *) printf '%s' "$o";; esac; }

# Preferred: one deterministic call restores the whole position in one shot (see conventions.md → engine).
PROG=$(gbd init.progress) || PROG=""
```
If `$PROG` is non-empty, restore the position straight from that JSON — it bundles config,
the outline + progress table, per-chapter artifact state, promise coverage, and stats, so
load_state can read Position / draft / chapter directly from it. **FALLBACK** (engine
unavailable): use the per-file reads in the steps below.

- STATE.md present → go to load_state.
- STATE.md absent but OUTLINE.md/BOOK.md present → go to reconstruct_state.
- Neither → route to `/gbd-new-book`.
</step>

<step name="load_state">
Read `.book/STATE.md` and `.book/BOOK.md`.
From STATE.md extract: Position (draft, chapter, plan), Last activity, **Resume file**, Word
count, Velocity, Recent decisions, Open threads/blockers, Deferred ideas.
From BOOK.md extract: premise, genre/audience, POV/tense, themes, Draft history (if present).
</step>

<step name="reconstruct_state">
STATE.md is missing. Offer to rebuild it:
```bash
ls -t .book/chapters/*/*-SUMMARY.md 2>/dev/null | head -1     # most recent drafted scene
git log --oneline -10 2>/dev/null                              # recent prose/metadata commits
# Current draft cycle — prefer the engine (outline.analyze surfaces the `**Draft:**` marker),
# fall back to a direct grep; $PROG supplies the position/chapter detail.
DRAFT=$(gbd outline.analyze --pick draft --raw); [ -n "$DRAFT" ] || DRAFT=$(grep -m1 'Draft:' .book/OUTLINE.md 2>/dev/null)
```
Infer Position from `$PROG`/the OUTLINE progress table + the newest SUMMARY/PLAN on disk; infer
Last activity from git log. Write a fresh `.book/STATE.md` from the state.md template, then commit
(prefer the engine, fall back to plain git):
```bash
gbd commit "chore(book): reconstruct STATE.md" .book/STATE.md || {
  git add .book/STATE.md 2>/dev/null
  git commit -q -m "chore(book): reconstruct STATE.md" || true
}
```
Continue to detect_incomplete.
</step>

<step name="detect_incomplete">
Scan chapter dirs for half-finished work (highest-priority resume target):
```bash
for d in .book/chapters/*/; do
  n=$(basename "$d" | grep -oE '^[0-9]+')
  ls "$d"*-PLAN.md     >/dev/null 2>&1 && ! ls "$d"*-SUMMARY.md >/dev/null 2>&1 && echo "DRAFTING UNFINISHED: $d"
  ls "$d"*-SUMMARY.md  >/dev/null 2>&1 && ! test -f "$d$n-VERIFICATION.md"      && echo "UNVERIFIED: $d"
done
```
Also check for an explicit handoff/checkpoint note in STATE.md (Open threads / "paused at").
</step>

<step name="present_status">
```
# Resuming — {TITLE}  ·  {draft} draft

Last time: {STATE last activity}
Position:  Chapter {X of Y} · Plan {A of B}
Resume at: {Resume file or most-recent artifact}

Open threads:
- {…}

Incomplete work detected:
- {DRAFTING UNFINISHED / UNVERIFIED chapter, if any}
```
</step>

<step name="route">
Recommend the next command (confirm before running heavy work), using the same matrix as
progress.md:
- unfinished drafting → `/gbd-draft-chapter <N>`
- unverified draft → `/gbd-read-through <N>`
- scoped, unplanned chapter → `/gbd-plan-chapter <N>`
- clean stopping point → `/gbd-progress` for the full picture, or the next chapter's
  `/gbd-discuss-chapter <N+1>`
Hand off via SlashCommand only after the author confirms.
</step>

</process>

<failure_modes>
- *No STATE.md → resume gives up* → reconstruct_state rebuilds it from OUTLINE + disk + git.
- *Resumes at the wrong place, ignoring a half-drafted chapter* → detect_incomplete prioritizes
  unfinished/unverified chapters over the nominal Position.
- *Dumps every file to "restore context" → bloats the session* → present a tight status block;
  reopen only the single resume artifact.
</failure_modes>
