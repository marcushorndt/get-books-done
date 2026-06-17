<purpose>
Generate book distribution copy — blurb, query letter, logline, platform — from one
orchestrator. Lock the brief first (hard gate), route the subcommand to the right recipe,
apply the correct framework per artifact, keep every proof claim non-fabricated, ship 2–3
rationale'd variants, and close each artifact with the volces 4-step QC. Writes to
`.book/distribution/`.
</purpose>

<required_reading>
Read everything in the invoking skill's execution_context — especially
craft-distribution.md (frameworks, awareness routing, no-fabrication, volces QC) and
config.json's `book_type` (selects fiction vs nonfiction frameworks).
</required_reading>

<process>

<step name="preflight">
```bash
test -d .book || { echo "No .book/ — run /gbd:new-book first."; exit 1; }
mkdir -p .book/distribution
BOOK_TYPE=$(grep -oE '"book_type"[^,}]*' .book/config.json 2>/dev/null | grep -oE 'fiction|nonfiction|general' | head -1)
```
Read `.book/BOOK.md` and `.book/PROMISE.md` for the brief inputs. Note `BOOK_TYPE`
(default `general` → ask the author per-artifact which framing to use).
</step>

<step name="brief_lock_gate">
**MANDATORY HARD GATE — run first, every time, for every subcommand. STOP for confirmation.**

Assemble the brief from BOOK.md + PROMISE.md (+ existing `.book/distribution/BRIEF.md` if
present). Lock these fields:
- **Metadata:** title, word count, genre/category, format.
- **Target reader:** who buys this; their awareness stage and emotional state.
- **Comp titles:** the 2–3 nearest comparables (REQUIRED — query letters need them).
- **The ONE transformation/promise:** the single payoff this book sells on.
- **Tone:** voice the copy must match.
- **Proof:** credentials, prior sales, endorsements, platform — or `[PLACEHOLDER]` where absent.

Present as 4–6 bullets, then a separate **Assumptions** list (anything inferred, not stated).
Then STOP:

```
This is the brief I'll write from. Confirm or correct before I generate any copy.
Do NOT proceed until the author confirms.
```

On confirmation, write the agreed brief to `.book/distribution/BRIEF.md` (overwrite/refresh).
Only then continue. If `book_type` is `general`, also confirm fiction-vs-nonfiction framing here.
</step>

<step name="route">
From $ARGUMENTS: `blurb` | `query` | `logline` | `platform` run one recipe; `all`/empty runs
all four in order (blurb → query → logline → platform). Each recipe writes its own file and
ends with the volces QC. Carry the locked BRIEF into every recipe.
</step>

<recipe name="blurb-recipe" out=".book/distribution/BLURB.md">
Reader: a browsing buyer, problem-aware → lead with hook + stakes/curiosity.
Framework by book_type:
- **fiction** → BAB or stakes-driven AIDA: hook line → protagonist + want → the disruption →
  the cost/stakes question. **END ON TENSION, never on resolution.**
- **nonfiction** → PAS or FAB: reader's problem → agitation → "this book is the bridge" →
  3–4 outcome bullets.
Pick ONE dominant mechanism (curiosity-gap / aspiration / relief / identity) and label which
job each sentence does. Differentiation: state explicitly what this promises that the comps
do not. Output: framework + rationale → 2–3 hook-line variants (each rationale'd) → the body →
assumptions → an A/B suggestion → volces QC.
</recipe>

<recipe name="query-recipe" out=".book/distribution/QUERY.md">
Reader: an agent/editor with low category-trust → lead with comps, craft signal, market fit,
proof. Fixed 3 beats (craft-distribution.md):
1. **Hook + metadata line** — title, word count, genre, 2 comps.
2. **Body paragraph** — PAS (nonfiction) or BAB (fiction): the book's engine and stakes.
3. **Author bio with proof** — credentials/platform; mark missing proof `[PLACEHOLDER]`.
Place proof at the resistance point (the bio + comps), not as an afterthought. Output:
2–3 hook-line + 2–3 bio variants (each rationale'd) → assembled letter → assumptions →
A/B suggestion → volces QC.
</recipe>

<recipe name="logline-recipe" out=".book/distribution/LOGLINE.md">
Reader: anyone, likely unaware → must be ultra-specific. Framework: the **4 U's** (Useful,
Urgent, Unique, Ultra-specific) and the "The [adjective] [noun] for [audience]" frame.
Output: 3 logline variants (each scored against the 4 U's in one line) → a recommended pick
with rationale → assumptions → volces QC. Keep each under ~25 words.
</recipe>

<recipe name="platform-recipe" out=".book/distribution/PLATFORM.md">
Reader: existing followers/list, mixed awareness → mechanism = identity/belonging; close with
a low-friction, autonomy-preserving CTA (no fake scarcity, no invented urgency). Produce:
- **Subject lines / titles** — 2–3 each via the 6 headline formulas, front-loaded keywords,
  <60 chars.
- **Launch post** (social) — hook → one-line stakes → CTA, 2–3 hook variants.
- **Newsletter blurb** — short PAS/BAB paragraph + CTA.
Each component: variants with rationale → assumptions → A/B suggestion → volces QC.
</recipe>

<step name="no_fabrication_pass">
Before writing any file, scan the draft for proof claims (quotes, awards, sales, "bestselling",
endorsements, credentials). Any claim not grounded in BRIEF.md / BOOK.md / PROMISE.md becomes
`[PLACEHOLDER: needs blurb from author or peer]`. Never invent. Persuasion must not bypass
informed choice.
</step>

<step name="volces_qc">
Append to EACH artifact a 4-step pass/fail check. The copy passes only if all four are YES:
1. **Grab** — does the opening grab attention?
2. **Desire** — does it create desire for this specific book?
3. **Objection** — does it remove the dominant objection (proof at the resistance point)?
4. **Next action** — does it prompt the next action (buy / request pages / subscribe)?
Fail any one → mark the artifact FAIL and revise before it leaves the workflow.
</step>

<step name="finish">
Confirm written files under `.book/distribution/`. Offer: refine a single artifact by
re-running its subcommand, or hand off to `/gbd:beta-readers` for ARC/launch use. No git
commit is forced here (distribution copy is author-facing, not manuscript prose); offer a
`chore(book): distribution copy` commit if the author wants it tracked.
</step>

</process>

<failure_modes>
- *Generates copy before locking the brief → off-target, wasted variants* → brief_lock_gate is
  a hard STOP that always runs first.
- *Invents an endorsement or "bestseller" to strengthen the pitch → ethics + legal failure* →
  no_fabrication_pass converts every ungrounded claim to a placeholder.
- *Fiction blurb resolves the plot → kills curiosity* → blurb-recipe ends on tension.
- *Single take, no variants → no A/B, no author choice* → every recipe ships 2–3 rationale'd
  variants.
- *Skips the QC because the copy "reads fine" → ships copy with no CTA or unanswered objection*
  → volces_qc runs on every artifact; FAIL blocks delivery.
</failure_modes>
