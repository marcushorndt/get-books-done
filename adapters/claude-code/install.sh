#!/usr/bin/env bash
# GBD Claude Code adapter installer.
# Installs the deterministic engine, then regenerates skills/agents/core into ~/.claude
# from commands/manifest.json + the portable bodies. Backs up any prior GBD install.
set -euo pipefail

ADAPTER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$ADAPTER_DIR/../.." && pwd)"
CLAUDE_DIR="${CLAUDE_HOME:-$HOME/.claude}"
CORE_DEST="$CLAUDE_DIR/get-books-done"
ENGINE_DEST="$CORE_DEST/engine"
SKILLS_DEST="$CLAUDE_DIR/skills"
AGENTS_DEST="$CLAUDE_DIR/agents"

echo "GBD installer (claude-code)"
echo "  repo:   $REPO_DIR"
echo "  target: $CLAUDE_DIR"

if [ ! -d "$CLAUDE_DIR" ]; then
  echo "error: $CLAUDE_DIR does not exist (is Claude Code installed?)" >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "error: node is required (the build step and engine run on Node)." >&2
  exit 1
fi

# Back up any existing GBD install.
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP="$CLAUDE_DIR/backups/gbd-$STAMP"
if [ -d "$CORE_DEST" ] || ls "$SKILLS_DEST"/gbd-* >/dev/null 2>&1 || ls "$AGENTS_DEST"/gbd-*.md >/dev/null 2>&1; then
  echo "  backing up existing GBD -> $BACKUP"
  mkdir -p "$BACKUP/skills" "$BACKUP/agents"
  [ -d "$CORE_DEST" ] && cp -R "$CORE_DEST" "$BACKUP/get-books-done" || true
  for d in "$SKILLS_DEST"/gbd-*/; do [ -d "$d" ] && cp -R "$d" "$BACKUP/skills/" || true; done
  for f in "$AGENTS_DEST"/gbd-*.md; do [ -f "$f" ] && cp "$f" "$BACKUP/agents/" || true; done
fi

# 1) Generate skills/agents/core from the manifest + bodies.
echo "  building skills/agents/core ..."
node "$ADAPTER_DIR/build.cjs" --target "$CLAUDE_DIR"

# 2) Install the deterministic engine (owned by a parallel task; copied verbatim).
if [ -d "$REPO_DIR/engine" ]; then
  echo "  installing engine -> $ENGINE_DEST"
  rm -rf "$ENGINE_DEST"
  mkdir -p "$ENGINE_DEST"
  cp -R "$REPO_DIR/engine/." "$ENGINE_DEST/"
  # chmod +x the tool shim if present.
  for shim in "$ENGINE_DEST"/bin/gbd-tools.cjs "$ENGINE_DEST"/bin/*.cjs "$ENGINE_DEST"/bin/*.sh; do
    [ -f "$shim" ] && chmod +x "$shim" || true
  done
else
  echo "  note: engine/ not present in repo yet — skipping engine install."
fi

echo "Installed:"
echo "  core:   $(find "$CORE_DEST" -type f | wc -l | tr -d ' ') files"
echo "  skills: $(ls -d "$SKILLS_DEST"/gbd-*/ | wc -l | tr -d ' ')"
echo "  agents: $(ls "$AGENTS_DEST"/gbd-*.md | wc -l | tr -d ' ')"
echo "Done. Try /gbd-help in a book folder."
