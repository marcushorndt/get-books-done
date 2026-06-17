# Revision loop (check → revise → escalate)

Shared by plan-chapter (planner ↔ plan-checker) and editorial-review (editor ↔ author).

```
iteration = 0
loop:
  spawn producer (gbd-planner | gbd-editor)
  spawn checker  (gbd-plan-checker | re-read)
  if PASSED or info-only findings:
      accept, exit
  iteration += 1
  if iteration > 3:               escalate to user
  if new_issue_count >= prev:     escalate (loop stalled)
  re-spawn producer with the findings inlined
```

## Escalation

Present via AskUserQuestion:
- **Proceed anyway** — accept the artifact with the noted findings.
- **Adjust approach** — discuss a different strategy, then re-enter the loop.

Never loop silently more than 3 times. Surface the remaining findings verbatim.
