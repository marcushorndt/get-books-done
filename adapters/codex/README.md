# GBD — Codex CLI adapter

> **Status: generated, not yet battle-tested.** Emitted from the agent-neutral manifest
> (`commands/manifest.json`) + the portable skill bodies, structurally validated, but not
> yet run end-to-end against a real manuscript on Codex.

## What it produces

`node adapters/codex/build.cjs [--target <dir>]` writes:

```
<target>/prompts/gbd-<name>.md   one Codex custom prompt per GBD skill  (invoke /gbd-<name>)
<target>/AGENTS.md               persistent GBD operating guide
<target>/core/                   the portable GBD core (workflows, references, templates)
```

Default `--target` is `adapters/codex/dist/`.

## Codex CLI conventions (as implemented here)

- **Custom prompts** are Markdown files in `~/.codex/prompts/<name>.md`, invoked as
  `/<name>`. Argument interpolation uses `$ARGUMENTS` (the full argument string) and
  `$1`…`$9` (positional). We emit `gbd-<name>.md`, keeping the hyphen invocation
  `/gbd-<name>` consistent with GBD across CLIs. The skill body's `$ARGUMENTS` token is
  preserved (it is Codex-native).
- **AGENTS.md** is Codex's project-level persistent guidance file. We emit one that
  states GBD's operating rules (single-agent emulation of subagents, hard-gate behavior,
  atomic commits) plus the command and agent tables. Place it at the **root of your book
  project**, not in `~/.codex`.

## Install

```sh
node adapters/codex/build.cjs                     # builds into dist/
cp adapters/codex/dist/prompts/*.md ~/.codex/prompts/
cp adapters/codex/dist/AGENTS.md   /path/to/your/book/AGENTS.md
cp -R adapters/codex/dist/core     ~/.gbd/core
```

Generated prompts reference the core at `~/.gbd/core/...`; install the `core/` tree there
(or change `CORE_ROOT` in `build.cjs` and rebuild).

## Capability mapping — faithful vs. degraded

| GBD capability | Claude Code | Codex CLI | Fidelity |
|---|---|---|---|
| `read` / `write` / `edit` | Read/Write/Edit | built-in file editing | faithful |
| `shell` | Bash | sandboxed shell | faithful |
| `glob` / `grep` | Glob/Grep | shell `find` / `grep` | faithful |
| `web` / `web-fetch` / `web-search` | WebFetch/WebSearch | web access (if enabled) | faithful when enabled |
| `slash-command` | SlashCommand | run target prompt manually | degraded |
| **`spawn-agent`** | Agent (parallel subagents) | none | **emulated** in-prompt |
| **`ask-user`** | AskUserQuestion (structured) | plain chat question | **emulated** |
| `@file` includes | auto-inlined | plain path references | rewritten |

### Subagents → sequential steps (emulated)

Codex is a single agent. Each generated prompt carries an adapter note listing the agents
the workflow spawns and instructing the model to perform their jobs itself, in spawn
order, honoring each agent's completion marker. AGENTS.md restates this globally. The
craft and gating survive; parallelism and context isolation do not.

### Structured questions → plain chat (emulated)

`AskUserQuestion` gates become plain-language questions; the note tells the model to wait
at hard gates.

## Known limitations

- No parallel waves — per-scene drafting is sequential.
- No deterministic engine call wired in for Codex; state/commit discipline relies on the
  model following the workflow prose and AGENTS.md.
- Web/shell availability depends on your Codex sandbox/approval settings.

## Assumptions

The `~/.codex/prompts/*.md` custom-prompt mechanism, `$ARGUMENTS`/`$1..$9` interpolation,
and the `AGENTS.md` project-guidance convention reflect documented Codex CLI behavior. If
your Codex version differs, adjust `build.cjs` and rebuild; the prose bodies are
version-independent.
