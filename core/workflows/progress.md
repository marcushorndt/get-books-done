<purpose>
Report where the book stands (draft, chapter, plan, word count) from STATE.md and the
OUTLINE.md progress table, then route to the next GBD action. Three modes: default (report +
recommend), --next (auto-advance), --do (dispatch freeform intent). Get your bearings on the
project before you pick the work back up.
</purpose>

<required_reading>
Open each file named in the invoking prompt's `<execution_context>` before acting — they
define how this step is meant to run (conventions.md covers the lifecycle stages and the
artifact tree).
</required_reading>

<process>

<step name="init">
```bash
test -d .book || { echo "No .book/ found. Run /gbd-new-book to start."; exit 1; }
test -f .book/STATE.md   || echo "WARN: STATE.md missing — recommend /gbd-resume-work to reconstruct."
test -f .book/OUTLINE.md || echo "WARN: OUTLINE.md missing — recommend /gbd-outline."

# Preferred: one deterministic call for the whole picture (see conventions.md → engine).
GBD="node $HOME/.claude/get-books-done/engine/bin/gbd-tools.cjs"
if command -v node >/dev/null 2>&1 && [ -f "$HOME/.claude/get-books-done/engine/bin/gbd-tools.cjs" ]; then
  PROG=$($GBD init.progress 2>/dev/null); [ "${PROG#@file:}" != "$PROG" ] && PROG=$(cat "${PROG#@file:}")
  echo "$PROG"   # config, outline analysis, promise coverage, chapter states, stats — parse this
fi
```
If the engine produced `$PROG`, read the report straight from that JSON (it already
bundles config `book_type`, the outline + progress table, promise coverage, per-chapter
artifact state, and word-count stats). **Fallback** (engine/node absent): read
`.book/STATE.md` (Position, Word count, Velocity, Open threads), `.book/OUTLINE.md` (the
`**Draft:**` marker, Arc, `## Progress` table), and `.book/config.json` (`book_type`)
directly.
</step>

<step name="default_report_and_route">
**Report** (the standard block):

```
# Book Progress — {TITLE}  ·  {draft} draft

## Position
{Chapter X of Y} · {Plan A of B} · last: {STATE last activity}

## Chapters
[progress bar over the OUTLINE progress table]
| Ch | Title | Status | Words | Promises |
| .. | ..    | planned/drafted/verified/needs-revision | .. | .. |

## Words
{drafted} / {target}   ·   this chapter {n}/{target}

## Open threads
- {from STATE.md}
```

**Route.** Apply the routing matrix to the current chapter's artifact state, then present the
recommended next command via AskUserQuestion (recommend, do not auto-run):

| Current state of the active chapter | Recommended next |
|-------------------------------------|------------------|
| No CONTEXT.md | /gbd-discuss-chapter <N> — scope it |
| CONTEXT.md, no PLAN.md | /gbd-plan-chapter <N> — beat sheet |
| PLAN.md, no SUMMARY.md | /gbd-draft-chapter <N> — write the prose |
| SUMMARY.md, no/failing VERIFICATION.md | /gbd-read-through <N> — did promises land |
| Verified, more chapters remain | next chapter → /gbd-discuss-chapter <N+1> |
| All chapters drafted+verified, draft not closed | /gbd-complete-draft |
| In revision/polish with editorial/continuity owed | /gbd-editorial-review / /gbd-continuity-review / /gbd-sensitivity-review |
| Polish draft closed | /gbd-distribute all then /gbd-beta-readers |
| Bible stale vs prose | /gbd-map-manuscript / /gbd-story-bible |
</step>

<step name="next_mode">  <!-- --next -->
Scan ALL chapters for incomplete work before routing (not just the active one): any chapter
with a PLAN but no SUMMARY, or a SUMMARY but no passing VERIFICATION, is "incomplete" and takes
priority. Route to the FIRST incomplete chapter using the matrix above and invoke that
/gbd- command via SlashCommand. With `--force`, bypass the soft safety prompts (still respect
hard gates owned by the target skill). If nothing is incomplete, advance to the next chapter or
to /gbd-complete-draft.
</step>

<step name="do_mode">  <!-- --do "intent" -->
Match the freeform intent to a single /gbd- command using the trigger phrases in each skill's
description (e.g. "fix the timeline" → continuity-review; "write the back cover" → distribute
blurb; "send to readers" → beta-readers; "pitch to agents" → distribute query). Confirm the
match with the author, then hand off via SlashCommand. NEVER do the work inline — match,
confirm, dispatch only.
</step>

</process>

<failure_modes>
- *Reports position but gives no next step → author stuck* → default mode always ends with a
  routed recommendation.
- *--next silently runs heavy drafting → surprise work/commits* → --next routes to the next
  command but respects the target skill's hard gates; default mode only recommends.
- *--do does the task itself → bypasses the proper skill's gates* → --do only matches, confirms,
  and dispatches.
</failure_modes>
