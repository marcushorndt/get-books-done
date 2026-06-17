---
name: gbd-distribute
description: "Use when the author wants sales/pitch copy for a finished or near-finished book — back-cover blurb, agent query letter, logline/elevator pitch, or platform/launch copy. Triggers: \"write the back-cover copy\", \"draft a query letter\", \"give me a logline\", \"Amazon description\", \"launch tweet/newsletter blurb\", \"pitch this book\"."
argument-hint: "[blurb | query | logline | platform | all]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
ONE orchestrator for book distribution copy. A subcommand routes to the right recipe —
**blurb** (back-cover / retailer description), **query** (agent/editor query letter),
**logline** (one-line pitch / elevator), **platform** (launch posts, newsletter, ad/subject
lines), or **all**.

Every run begins with the **mandatory brief-lock gate** (STOP for author confirmation),
then generates the requested artifact(s) with the correct framework per artifact, applies
no-fabrication discipline (placeholders for missing proof), produces 2–3 variants each with a
one-line rationale, and ends with the volces 4-step QC.

**Writes to:** `.book/distribution/` — `BLURB.md`, `QUERY.md`, `LOGLINE.md`, `PLATFORM.md`,
plus a shared `BRIEF.md` (the locked brief, reused across runs).

**After this command:** Hand copy to `/gbd:beta-readers` for ARC/launch use, or iterate a
single artifact by re-running with its subcommand.
</objective>

<routing>

| Subcommand | Artifact | Recipe (in workflow) | Reader & awareness stage |
|------------|----------|----------------------|--------------------------|
| `blurb`    | `.book/distribution/BLURB.md`    | blurb-recipe    | browsing reader, problem-aware → hook + stakes/curiosity |
| `query`    | `.book/distribution/QUERY.md`    | query-recipe    | agent/editor, low category-trust → comps + craft + proof |
| `logline`  | `.book/distribution/LOGLINE.md`  | logline-recipe  | anyone, unaware → 4 U's, ultra-specific |
| `platform` | `.book/distribution/PLATFORM.md` | platform-recipe | followers/list, mixed → identity/belonging + low-friction CTA |
| `all` (default) | all four | run each recipe in order | — |

</routing>

<execution_context>
@$HOME/.claude/get-books-done/workflows/distribute.md
@$HOME/.claude/get-books-done/references/craft-distribution.md
@$HOME/.claude/get-books-done/references/conventions.md
@$HOME/.claude/get-books-done/references/mode-fiction-vs-nonfiction.md
</execution_context>

<context>
Arguments: $ARGUMENTS

Parse the first token:
- `blurb` | `query` | `logline` | `platform` → run that one recipe
- `all` or empty → run all four recipes in order

**Source-of-truth files (read for the brief, never fabricate beyond them):**
- `.book/BOOK.md` — title, genre, audience, comps, POV/tense, themes, the transformation/promise
- `.book/PROMISE.md` — the checkable reader promises (the "what this delivers")
- `.book/config.json` — `book_type` (fiction/nonfiction/general) selects blurb framework
- `.book/distribution/BRIEF.md` — a previously locked brief, if one exists (reuse it)
</context>

<process>
1. Parse the subcommand from $ARGUMENTS (default `all`).
2. Load and execute @$HOME/.claude/get-books-done/workflows/distribute.md.
3. ALWAYS run the **brief-lock gate FIRST** and STOP for confirmation before generating
   any copy — even for a single subcommand, even if BRIEF.md exists (re-confirm it is current).
4. Route to the requested recipe(s); apply the framework the recipe specifies for this
   `book_type`; enforce no-fabrication (placeholders for missing proof).
5. End EVERY artifact with the volces 4-step QC.
</process>

<success_criteria>
- A locked `BRIEF.md` exists and was confirmed by the author this run.
- Each requested artifact file written to `.book/distribution/` with: chosen framework +
  rationale, 2–3 variants (each with a one-line rationale), structured body, documented
  assumptions, an A/B suggestion, and the volces 4-step QC verdict.
- Every factual proof claim is either sourced from BOOK.md/PROMISE.md or marked
  `[PLACEHOLDER: …]`. No invented quotes, awards, or sales figures.
- Copy matches the artifact's reader/awareness stage per the routing table.
</success_criteria>

<critical_rules>
- **Brief-lock is a hard gate.** Do NOT generate a single line of copy until the author
  confirms the brief. Summarize the brief in 4–6 bullets + list assumptions, then STOP.
- **No fabrication.** Never invent endorsements, blurb quotes, awards, bestseller status, or
  sales numbers. Missing proof → `[PLACEHOLDER: needs blurb from author or peer]`.
- **Right framework per artifact** (craft-distribution.md): fiction blurb = BAB / stakes-AIDA
  ending on tension; nonfiction blurb = PAS / FAB ending on outcome; query = fixed 3 beats;
  logline = 4 U's; titles/subjects = the 6 headline formulas.
- **One dominant mechanism per piece**; place proof at the resistance point, not just the end;
  close with a low-friction, autonomy-preserving CTA. No fake scarcity / invented urgency.
- **Variants with rationale**, always — 2–3 per headline/hook/CTA, never a single take.
- **Close with volces 4-step QC.** Fail any one of grab / desire / objection-removal /
  next-action → the copy fails and must be revised before delivery.
</critical_rules>
