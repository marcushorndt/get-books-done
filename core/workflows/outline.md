<purpose>
CRUD for chapters in `.book/OUTLINE.md` — the book's phase structure. Add, insert (split), remove, edit, or view chapters. Chapters are the phase unit and are IMMUTABLE once scoped (a CONTEXT.md exists). To break a scoped chapter apart, SPLIT it via decimals (3 → 3.1, 3.2); never renumber or rewrite it.
</purpose>

<required_reading>
@$HOME/.claude/get-books-done/references/conventions.md
@$HOME/.claude/get-books-done/templates/outline.md
</required_reading>

<core_principle>
OUTLINE.md is the single source of truth for chapter structure (= GSD ROADMAP). The orchestrator edits it directly — no subagents. Every structural change keeps the Progress table in sync and is committed with `outline(...):`.
</core_principle>

<immutability_rule>
A chapter is **scoped** once its `.book/chapters/NN-slug/NN-CONTEXT.md` exists (it has been discussed). A scoped chapter's number, slug, and Goal are LOCKED:
- `--edit` on a scoped chapter may only touch un-locked fields (Promises advanced, Dependencies, Plans hint, Mode). It MUST refuse to change the number/slug/Goal.
- `--remove` MUST refuse to remove a scoped chapter (its work would be orphaned). Refuse and suggest `--insert` a correction chapter instead.
- To enlarge a scoped chapter's scope, use `--insert` to add `NN.1` after it — do not rewrite NN.

If the rule is about to be violated, STOP and explain why, then offer the split alternative.
</immutability_rule>

<process>

## 0. Load state

```bash
test -f .book/OUTLINE.md || { echo "No .book/OUTLINE.md — run /gbd:new-book first."; exit 1; }
```
Read `.book/OUTLINE.md`. List existing `.book/chapters/*/` dirs to know which chapters are scoped (have a CONTEXT.md). Determine `commit_docs` from `.book/config.json`.

Route on the leading flag passed by the skill: none → §A, `--insert` → §B, `--remove` → §C, `--edit` → §D, `--view` → §E.

---

## §A — add-chapter (default)

Add a new INTEGER chapter at the end of the last act (or a named act if the author specified one).

1. Determine the next integer chapter number (max existing integer + 1) and derive a slug from the description (`lowercase-hyphen`, ≤4 words).
2. Append a chapter block under the target act using the `templates/outline.md` chapter shape. Ask the author (AskUserQuestion, unless obvious from the description) for: Goal, Promises advanced (offer the open PROMISE.md ids), Dependencies, and Mode (only if `book_type == general`).
3. Add a row to the Progress table: `| NN | <title> | planned | 0 | <promises> |`.
4. Commit → §F.

---

## §B — insert-chapter (`--insert <after-N> <description>`)

Insert a DECIMAL chapter immediately after chapter `<after-N>`. This is the ONLY way to add scope around a scoped chapter (the split mechanism).

1. Compute the new id: the next free `<after-N>.<k>` (e.g. after `3`, first insert is `3.1`, then `3.2`). If `<after-N>` is itself a decimal, increment its last segment.
2. Place the new chapter block directly after `<after-N>`'s block, in the same act. Gather Goal / Promises advanced / Dependencies / Mode as in §A. Set `Dependencies:` to include `<after-N>` by default.
3. Insert the Progress row in order.
4. Do NOT renumber any other chapters — decimals preserve every existing number and every scoped chapter's identity.
5. Commit → §F.

---

## §C — remove-chapter (`--remove <N>`)

1. **Immutability gate:** if `<N>` is scoped (CONTEXT.md exists), REFUSE per `<immutability_rule>`. Explain and suggest inserting a correction chapter.
2. If unscoped: confirm with the author (AskUserQuestion — removal is destructive to structure). On confirm, delete the chapter block and its Progress row.
3. Renumber subsequent INTEGER chapters down by one (e.g. removing 4 makes old 5 → 4), but ONLY across unscoped chapters. If renumbering would cross a scoped chapter, STOP and refuse — offer to leave a gap instead (keep numbering, mark the removed slot `(cut)`).
4. Commit → §F.

---

## §D — edit-chapter (`--edit <N>`)

1. Read chapter `<N>`'s block. Determine if it is scoped.
2. Present its fields (AskUserQuestion: which to edit). 
   - **Unscoped:** any field is editable, including title/slug/Goal. If the slug changes and a chapter dir exists, rename the dir to match.
   - **Scoped:** only Promises advanced, Dependencies, Plans hint, Mode are editable. The number/slug/Goal are locked — gray them out and refuse edits to them per `<immutability_rule>`.
3. Apply edits in place; keep the Progress row's title/promises in sync.
4. Commit → §F.

---

## §E — view-outline (`--view`)

Print the full OUTLINE.md (acts → chapters) and the Progress table, annotating each chapter with its state: `scoped` (CONTEXT.md), `planned` (PLAN.md files), `drafted` (SUMMARY.md), `verified` (VERIFICATION.md `passed`), else `outlined`. Read-only — no commit. Stop.

---

## §F — commit

Keep the Progress table sorted (integers ascending, decimals after their parent). Then, respecting `commit_docs`:
```bash
git add .book/OUTLINE.md 2>/dev/null
git commit -q -m "outline: <verb> chapter <N> — <short title>" || true
```
Verbs: `add` / `split` / `remove` / `edit`. If `commit_docs` is false, skip the commit and report the change is written but uncommitted.

Report the change and, for add/insert, suggest `/gbd:discuss-chapter <new-N>`.

</process>

<success_criteria>
- The requested CRUD operation is applied and the Progress table stays consistent and sorted.
- The immutability rule is enforced: no scoped chapter is renumbered, removed, or has its Goal/slug rewritten — splits used instead.
- Decimal inserts never renumber existing chapters.
- Change committed with an `outline:` message (unless `commit_docs=false`).
</success_criteria>
