---
status: "testing"        # testing | complete | needs_revision
chapter: "{{NN}}"
checks_total: 0
checks_passed: 0
---

# Read-Through — Chapter {{NN}}

> Conversational verification (= GSD UAT). Persists across /clear. The author (or a
> beta reader) reacts to the drafted chapter; results route gaps to
> /gbd-plan-chapter --gaps.

## Promise-backward checks
> One per `must_land` item, derived from the PLAN.md.

### Check 01 — {{the beat/turn/reveal expected}}
- **Expected:** {{what should land}}
- **Reader reaction:** {{awaiting / quote of where it landed / what fell flat}}
- **Result:** pass | partial | miss

## Beta reader notes
| Reader | Chapter felt… | Specific note | Action |
|--------|---------------|---------------|--------|

## Verdict
{{passed -> write VERIFICATION.md; needs_revision -> gap plans}}
