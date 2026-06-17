# GBD — Gemini CLI adapter

> **Status: generated, not yet battle-tested.** This adapter emits Gemini CLI custom
> commands from the agent-neutral manifest (`commands/manifest.json`) and the portable
> skill bodies. It has been generated and structurally validated, but not yet run
> end-to-end against a real manuscript on Gemini CLI.

## What it produces

`node adapters/gemini-cli/build.cjs [--target <dir>]` writes:

```
<target>/commands/gbd-<name>.toml   one Gemini custom command per GBD skill
<target>/core/                      the portable GBD core (workflows, references, templates)
```

Default `--target` is `adapters/gemini-cli/dist/`. To emit straight into your Gemini
config, pass `--target ~/.gemini` (user-level) or `--target ./.gemini` (project-level).

## Gemini CLI command format (as implemented here)

Gemini CLI discovers custom commands as **TOML files** under a `commands/` directory
(`~/.gemini/commands/` for user scope, `./.gemini/commands/` for project scope). Each
file defines:

- `description` — a one-line summary shown in the command list.
- `prompt` — the prompt text injected when the command runs. `{{args}}` is replaced
  with whatever the user typed after the command.

Subdirectories namespace commands using `:` (e.g. `gbd/help.toml` → `/gbd:help`). GBD
commands use the **hyphen** form, so we emit **flat** files named `gbd-<name>.toml`,
keeping the invocation `/gbd-<name>` — consistent with GBD conventions across CLIs.

## Install

```sh
node adapters/gemini-cli/build.cjs --target ~/.gemini   # or build into dist/ then copy
cp -R adapters/gemini-cli/dist/core ~/.gbd/core          # install the portable core
```

The generated prompts reference the core at `~/.gbd/core/...`. Put the `core/` tree there
(or edit the `CORE_ROOT` constant in `build.cjs` and rebuild).

## Capability mapping — what's faithful vs. degraded

The manifest declares each skill's **abstract capabilities**. Gemini CLI's single-agent
prompt model supports most of them, but two GBD mechanisms have no native equivalent and
are **emulated in-prompt** rather than executed by the harness:

| GBD capability | Claude Code | Gemini CLI | Fidelity |
|---|---|---|---|
| `read` / `write` / `edit` | Read/Write/Edit tools | built-in file tools | faithful |
| `shell` | Bash | built-in shell tool | faithful |
| `glob` / `grep` | Glob/Grep | built-in / shell `grep`,`find` | faithful |
| `web` / `web-fetch` / `web-search` | WebFetch/WebSearch | web fetch/search tools | faithful (if enabled) |
| `slash-command` | SlashCommand | run the target command manually | degraded |
| **`spawn-agent`** | Agent (parallel subagents) | none | **emulated** — see below |
| **`ask-user`** | AskUserQuestion (structured) | plain chat question | **emulated** |
| `@file` includes | auto-inlined | plain path references | rewritten |

### Subagents → sequential prompt steps (emulated)

GBD orchestrators spawn dedicated subagents (planner, drafter, verifier, …), each with
its own context and a completion marker. Gemini CLI has no subagent primitive. Every
generated command therefore carries an **adapter note** instructing the model to perform
each spawned agent's job itself, **as sequential steps in the same session**, in the
order the workflow spawns them, and to treat each agent's completion marker as a
checkpoint. The agents' own prompt bodies live in `core/` (and in the repo's `agents/`);
the note lists which agents a given workflow relies on. This loses parallelism and
context isolation — long workflows (e.g. `gbd-draft-chapter`) will be heavier on a single
context window.

### Structured questions → plain chat (emulated)

`AskUserQuestion` gates become plain-language questions. The adapter note tells the model
to ask and **wait** at hard gates rather than assume an answer. The discipline survives;
the structured multiple-choice UI does not.

### `@file` includes → path references (rewritten)

Claude Code auto-inlines `@$HOME/.claude/get-books-done/...` includes. Those are rewritten
to plain `~/.gbd/core/...` path references; the model is told to read them before acting.

## Known limitations

- No parallel waves; the drafter's per-scene parallelism collapses to sequential.
- Atomic-commit and state-file conventions depend on the model following the workflow
  prose — there is no deterministic engine call wired in for Gemini yet.
- Tool names/availability vary by Gemini CLI version and config; verify file, shell, and
  web tools are enabled in your environment.

## Assumptions

The TOML schema (`description` + `prompt`, `{{args}}` substitution, `commands/` discovery,
`:`-namespacing via subdirs) reflects the documented Gemini CLI custom-command format. If
your Gemini CLI version differs, adjust `build.cjs` (the `tomlString`/`tomlMultiline`
emitters and the `commands/` layout) and rebuild. The prose bodies are version-independent.
