# GBD commands — manifest + adapter model

GBD is **agent-agnostic at the source, packaged per-CLI at install time.** A skill is a
portable prose **body** plus CLI-specific **packaging** (frontmatter, tool names, how
subagents are spawned, how the user is asked questions). Agents are the same. This
directory holds the single source of truth that ties bodies to packaging.

## The model

```
skills/<name>/SKILL.md   ─┐  portable prose BODIES (canonical; reused verbatim)
agents/<name>.md          │
core/{references,           ├─►  commands/manifest.json  ─►  adapters/<cli>/build.cjs  ─►  native packaging
      templates,workflows} ┘        (agent-neutral metadata)        (per-CLI emitter)        for each CLI
```

- **Bodies** live in `skills/*/SKILL.md` and `agents/*.md`. They are the canonical prose
  and are reused unchanged. The top-level `skills/` and `agents/` dirs stay authoritative.
- **`manifest.json`** captures the **agent-neutral metadata** for every skill and agent:
  name, command (`/gbd-…`, hyphen form — the colon form does not work), summary, the
  Claude trigger `description`, argument hint, lifecycle group, abstract `capabilities`,
  which agents a skill `spawns`, the `body` path, and (for agents) the `completion_marker`.
- **Adapters** (`adapters/<cli>/build.cjs`) read the manifest + bodies + `core/` and emit
  native packaging for one CLI. Capabilities are abstract (`read|write|edit|shell|glob|
  grep|spawn-agent|ask-user|web|web-fetch|web-search|slash-command`); each adapter maps
  them to its CLI's tool names.

## Abstract capabilities → Claude Code tools

| capability | Claude tool(s) |
|---|---|
| `read` | Read |
| `write` | Write |
| `edit` | Edit |
| `shell` | Bash |
| `glob` | Glob |
| `grep` | Grep |
| `spawn-agent` | Agent |
| `ask-user` | AskUserQuestion |
| `web` | WebFetch, WebSearch |
| `web-fetch` | WebFetch |
| `web-search` | WebSearch |
| `slash-command` | SlashCommand |

Gemini CLI and Codex map the same abstract set; `spawn-agent` and `ask-user` have no
native equivalent there and are emulated in-prompt (see each adapter's README).

## Building

```sh
node adapters/claude-code/build.cjs --target ~/.claude     # Claude Code skills/agents/core
node adapters/gemini-cli/build.cjs                          # -> adapters/gemini-cli/dist/
node adapters/codex/build.cjs                               # -> adapters/codex/dist/
```

The top-level `./install.sh [claude-code|gemini-cli|codex]` dispatches to the right
adapter. The Claude Code adapter **round-trips**: regenerated `SKILL.md`/agent files are
equivalent to the canonical bodies (frontmatter is rebuilt from the same metadata).

## Adding or changing a command

1. Edit the prose **body** in `skills/<name>/SKILL.md` or `agents/<name>.md`.
2. Update its entry in `manifest.json` (metadata only — never duplicate the body here).
3. Rebuild with the relevant adapter(s).
