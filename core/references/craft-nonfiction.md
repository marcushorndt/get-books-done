# Nonfiction craft (planner / drafter / editor / verifier / researcher)

Distilled from latex-paper-en (bahayonghang), research-paper-writing (Master-cai),
and academic-writing (jamditis). The spine across all three:
**clarify the argument before prose; map every claim to evidence with an explicit
strength level; never fabricate citations — verify or mark a placeholder; review
adversarially against rejection risks.**

## PLANNER — per-chapter Chapter Spec

1. **Chapter thesis** — one FALSIFIABLE sentence ("This chapter argues X", not
   "discusses X"). FINER check (Feasible/Interesting/Novel/Ethical/Relevant).
2. **Section skeleton** — Intro funnel (context → narrow → gap/tension → thesis →
   contribution preview) → body sections → reverse-funnel close (summary → implication
   → limitation → forward link).
3. **Paragraph-role outline** per section (opening / challenge / prior-view limitation
   / claim / evidence / implication / bridge), 3–7 bullets, BEFORE prose.
4. **Claim ledger** — enumerate major claims up front:
   ```
   Claim: <one sentence>
   Section: <where it lives>
   Evidence needed: citation | data | figure | example | anecdote | missing
   Strength target: observed | supported | strong
   Research task: <what the chapter-researcher must find>
   ```
5. **Reverse-outline test:** if you can't write a one-paragraph reverse outline
   (thesis → each section's topic sentence), the structure is unclear — replan.
6. **Anti-pattern guard:** flag the **incremental-patch trap** (naive view → small
   patch makes the work look obvious) and the **novelty-illusion trap** (new terms
   without a mechanism = looks shallow).

## DRAFTER

- **One message per paragraph, in the first sentence.** Self-contained nouns (define
  before reuse).
- **AXES** per evidential paragraph: Assertion → eXample/evidence → Explanation (why it
  supports) → Significance (link to thesis). Never leave evidence without Explanation.
- **Claim→Evidence→Implication**, worded to strength:
  - `unsupported` → soften, hedge, or cut.
  - `observed` → bound to the case ("in the reported case…").
  - `supported`/`strong` → assert within the source's scope.
- **Signposting** with explicit transitions; honor the closure chain — every intro
  promise is paid off in the body and answered in the conclusion.
- **Citation hygiene (HARD RULES):**
  - NEVER write a citation from memory. It traces to a verified source the researcher
    supplied, or you write `[CITATION_NEEDED: <claim>]` and report the count.
  - A citation key/DOI proves a source *exists and is cited* — NOT that it supports the
    claim. Claim-support is a separate explicit check.
  - Use context-appropriate phrasing (introducing / supporting / contrasting / method
    / direct-quote); "(as cited in …)" for secondary sources.
- **De-AI restraint pass on your own draft:** strip empty phrases ("significant
  improvement" → "reduces error by 18%"), absolutes (obviously/clearly/always/never/
  prove), mechanical three-part lists, template openers ("In recent years…"), vague
  quantifiers ("many studies" → "three studies [1–3]"). Prefer hedges ("suggests",
  "may be related to").

## CHAPTER-RESEARCHER workflow

1. Input: the planner's claim ledger (claims + research task + evidence needed).
2. Search with real tools; build Boolean strings (concepts → synonym clusters →
   AND/OR); record date + result count per search (PRISMA-style trail); document
   inclusion/exclusion.
3. **Verify each source (6-step):** exists in ≥2 independent sources → retrieve
   canonical metadata programmatically (never from memory) → confirm the source
   actually contains the cited claim → record. Any failure → placeholder, never invent.
4. Synthesize, don't dump: cluster by theme (not chronology); derive gaps via
   Consensus → Disagreement → Limitations → Gap → This chapter.
5. Tag credibility (primary/secondary, peer-reviewed/preprint/popular, reliable/
   predatory).
6. Output a **Source Pack per claim:** verified citation + exact supporting passage +
   locator + credibility tag + support status (verified/partial/unverified). The
   drafter consumes this; anything unverified becomes a placeholder.

## VERIFIER (adversarial reviewer)

1. **Claim→evidence soundness** — every major claim (especially thesis/opening) is
   correct AND explicitly supported. Unsupported → soften/remove/send back. Produce a
   claim-audit table (pass / needs-revision / needs-source).
2. **Strength-ladder audit** — flag any claim worded stronger than its anchor (one
   example powering a universal; a number without dataset/baseline/scope).
3. **Citation verification, 3 separate layers:** (1) well-formed; (2) source exists
   (cross-checked ≥2 places); (3) source actually supports the claim. Layer 3 is the
   one that matters and is NOT satisfied by a DOI match. Count/report placeholders.
4. **Logic/flow** — AXES present; transitions explicit; reverse outline maps cleanly;
   all intro promises closed by the conclusion.
5. **Rejection-risk scan** — insufficient contribution, unclear writing, weak/overstated
   evidence, incomplete coverage (missing strongest counter-view), unsound argument.
6. **Integrity** — secondary sources marked; predatory sources avoided; no over-close
   paraphrase; numbers reproduce.

**One rule for all nonfiction agents:** flag and mark missing rather than fabricate.

## Modularity note
The strong skills load section guides / check modules ON DEMAND. GBD agents should
read only the relevant reference section for the current task to stay context-lean.
