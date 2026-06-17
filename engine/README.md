# gbd-tools — the GBD engine

A small, dependency-free Node.js engine that gives GBD workflows **deterministic**
state — config, outline/promise/chapter parsing, progress, verification — without
spending model tokens or trusting the model to parse files by hand. It's a focused
mirror of GSD's `gsd-tools`, retargeted to the `.book/` manuscript model.

Node built-ins only (`fs`, `path`, `os`, `child_process`). No npm install.

## Invocation

```sh
node "$HOME/.claude/get-books-done/engine/bin/gbd-tools.cjs" <verb> [args] [flags]
# or, with the shim on PATH:
gbd-tools <verb> [args] [flags]
# `query` is accepted as a no-op alias: gbd-tools query <verb> ...
```

Output is JSON on stdout. Payloads over ~50 KB spill to a temp file and print
`@file:<path>` (callers read the file). Errors print a typed JSON object and exit
non-zero (use `--json-errors` for structured errors).

### Global flags
- `--cwd <path>` — resolve the book root from here (walks up to the nearest `.book/`).
- `--pick <path>` — extract one field via dot/bracket path, e.g. `--pick chapters[0].title`.
- `--raw` — print a scalar result without JSON quoting.
- `--json-errors` — emit structured error objects.

## Verb surface

| Verb | Returns |
|---|---|
| `config-get <key>` / `config-set <key> <val>` / `config-validate` | config read/write/validate over `.book/config.json` merged with defaults |
| `book.read` / `book.sections` | BOOK.md title + sections |
| `outline.analyze` / `outline.parse` / `outline.next-decimal <N>` | chapters, acts, progress table; decimal split numbering |
| `promise.parse` / `promise.ids` / `promise.coverage` | reader promises + traceability; which IDs are covered / delivered / uncovered |
| `chapter.state <N>` / `chapter.must-land <N>` / `chapter.list` | chapter dir, artifacts present, plan index with `wave`, `must_land` |
| `state.read` / `state.add-decision` / `state.add-blocker` / `state.record-metric` / `state.set-position` | STATE.md read + mutations |
| `verify.plan-structure <N>` / `verify.promise-coverage` / `verify.references <file>` | structural checks for the verifier/plan-checker |
| `intel.status` / `intel.query <entity>` / `intel.open-setups` | continuity-graph queries (`.book/graphs/continuity-graph.json`) |
| `init.progress` / `init.plan-chapter <N>` / `init.draft-chapter <N>` / `init.read-through <N>` / `init.outline` / `init.new-book` / `init.complete-draft` | one-call compound context bundles for the workflows |
| `generate-slug <text>` / `current-timestamp [full\|date\|filename]` / `commit <msg> [files…]` | utilities |
| `stats.json` / `progress.bar <done> <total> [width]` | metrics + rendering |

### Examples

```sh
$ gbd-tools config-get book_type --raw
fiction

$ gbd-tools outline.analyze --pick chapter_count
2

$ gbd-tools promise.coverage
{ "committed_count": 3, "covered_count": 2, "uncovered": ["MYSTERY-01"],
  "delivered": ["HOOK-01"], "mapping": [ … ] }
```

## How workflows use it

Mirror GSD's pattern — one compound call, then read fields:

```sh
INIT=$(node "$HOME/.claude/get-books-done/engine/bin/gbd-tools.cjs" init.plan-chapter 3)
[ "${INIT#@file:}" != "$INIT" ] && INIT=$(cat "${INIT#@file:}")
# parse fields from $INIT (jq or node)
```

## Test

```sh
node engine/test/smoke.cjs   # builds a temp .book/, asserts the core verbs; exits non-zero on failure
```
