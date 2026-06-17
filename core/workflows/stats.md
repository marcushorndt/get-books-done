<purpose>
Display book statistics: word counts (drafted vs target), chapters drafted/verified, reader
promises delivered vs outstanding, writing velocity, and the timeline from git. Numbers only.
</purpose>

<required_reading>
Read the invoking skill's execution_context (conventions.md — artifact tree).
</required_reading>

<process>

<step name="gather">
```bash
test -d .book || { echo "No .book/ — run /gbd:new-book first."; exit 1; }

# Prose word count (the "source code"): the manuscript itself
WORDS=$(cat manuscript/*.md 2>/dev/null | wc -w | tr -d ' ')

# Chapters: total, drafted (>=1 SUMMARY), verified (passing VERIFICATION)
CH_TOTAL=$(ls -d .book/chapters/*/ 2>/dev/null | wc -l | tr -d ' ')
CH_DRAFTED=$(for d in .book/chapters/*/; do ls "$d"*-SUMMARY.md >/dev/null 2>&1 && echo 1; done | wc -l | tr -d ' ')
CH_VERIFIED=$(for d in .book/chapters/*/; do n=$(basename "$d"|grep -oE '^[0-9]+'); test -f "$d$n-VERIFICATION.md" && echo 1; done | wc -l | tr -d ' ')

# Promises: total vs delivered (the Delivered ledger in PROMISE.md)
PROM_TOTAL=$(grep -cE '^\s*[A-Z]+-[0-9]+' .book/PROMISE.md 2>/dev/null || echo 0)
PROM_DELIV=$(awk '/^## Delivered/{f=1} f&&/^\| [A-Z]+-[0-9]+/{c++} END{print c+0}' .book/PROMISE.md 2>/dev/null)

# Timeline + velocity from git
FIRST=$(git log --reverse --format=%ad --date=short 2>/dev/null | head -1)
LAST=$(git log -1 --format=%ad --date=short 2>/dev/null)
DRAFT_COMMITS=$(git log --oneline 2>/dev/null | grep -cE '^[a-f0-9]+ (draft|revise)\(')
```
Read `.book/BOOK.md` / `.book/OUTLINE.md` for the **word-count target** and the current
`**Draft:**`. Read `.book/STATE.md` for the recorded Velocity line.
</step>

<step name="velocity">
Compute words/day: `WORDS / (days between FIRST and LAST)` when git history exists. Also
report scenes-per-session from the count of `draft(` commits across the active span. Prefer the
git-derived figure; fall back to STATE.md's Velocity line if git is unavailable.
</step>

<step name="present">
```
# Book Statistics — {TITLE}  ·  {draft} draft

## Words
{WORDS} / {target}   ({pct}%)
[████████░░]

## Chapters
Drafted:  {CH_DRAFTED}/{CH_TOTAL}
Verified: {CH_VERIFIED}/{CH_TOTAL}
| Ch | Title | Status | Words |   (from OUTLINE progress table)

## Promises to the reader
Delivered: {PROM_DELIV}/{PROM_TOTAL}
Outstanding: {list the not-yet-delivered ids}

## Velocity
~{words}/day   ·   {scenes}/session   ·   trend: {from STATE.md}

## Timeline
Started: {FIRST}   ·   Last activity: {LAST}   ·   Age: {N} days
Prose commits (draft+revise): {DRAFT_COMMITS}
```
If no `.book/` exists, tell the author to run `/gbd:new-book` first.
</step>

</process>
