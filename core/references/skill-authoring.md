# How to author GBD skills & agents (meta-craft)

Distilled from obra/superpowers writing-skills and trailofbits harness-writing.
Apply when writing or editing any `gbd-*` SKILL.md or agent file.

## One skill = one job
Narrow targets. No mega-skills. Split by artifact; compose via chaining. (A "marketing"
mega-skill is wrong; blurb / query-letter / platform as separate skills is right.)

## Match the form to the failure
| Failure type | Right form | Wrong form |
|---|---|---|
| Skips a rule under pressure | Prohibition + rationalization table + red-flags | soft "prefer…" |
| Wrong output *shape* | Recipe/contract stating what the output IS | prohibition list |
| Omits a required element | Structural template with REQUIRED fields | prose reminder |
| Conditional behavior | Observable predicate (if X exists, do Y) | unconditional rule + exemptions |
Prohibitions backfire on shaping problems. For GBD: the PLANNER and VERIFIER have
output-shape needs → use **recipes/templates with REQUIRED fields** (the four-field
scene record, the claim ledger). The DRAFTER has pressure-driven habits (resolving
tension, stock-tells, em-dashes) → use **prohibitions + a rationalization table**.

## Description field rule
Start with "Use when…", list only TRIGGERING CONDITIONS, never summarize the workflow.
(When a description summarizes workflow, agents follow the description instead of
reading the skill.)

## SKILL.md document spine (from harness-writing)
Overview → Key Concepts → **When to Apply / When to Skip** → Quick Reference →
Step-by-Step → Patterns → **Anti-Patterns table** → Troubleshooting → Related Skills.
Always include negative scope (When to Skip) — most authors omit it.

## Hard gates
Encode confirmation gates as explicit STOP instructions ("Do NOT proceed until the
author confirms"). Pair with hard-stop completion criteria ("complete ONLY when…").

## Name failure modes inline
Format: *what the agent typically does wrong → why it fails → do this instead.* Far
more effective than abstract dos/don'ts.

## Chaining contract
List upstream prerequisites and downstream consumers in each skill so a router can
sequence them. Build routing matrices ("If X → do Y") for conditional logic.

## Self-containment & lean context
Each skill/agent runs from declared inputs, not hidden conversational state; restate
context at entry. Keep prompts lean (token discipline). Dry-run on a known book before
shipping. Load reference sub-files on demand rather than inlining everything.

## End with a self-QC checklist
Every skill closes with an output-quality check (e.g. "matched the reader's awareness
stage? every claim non-fabricated? variants with rationale provided?").
