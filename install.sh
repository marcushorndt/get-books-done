#!/usr/bin/env bash
# Get Books Done (GBD) installer — deploys into ~/.claude
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_DIR="${CLAUDE_HOME:-$HOME/.claude}"
CORE_DEST="$CLAUDE_DIR/get-books-done"
SKILLS_DEST="$CLAUDE_DIR/skills"
AGENTS_DEST="$CLAUDE_DIR/agents"

echo "GBD installer"
echo "  repo:   $REPO_DIR"
echo "  target: $CLAUDE_DIR"

if [ ! -d "$CLAUDE_DIR" ]; then
  echo "error: $CLAUDE_DIR does not exist (is Claude Code installed?)" >&2
  exit 1
fi

# Back up any existing GBD install
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP="$CLAUDE_DIR/backups/gbd-$STAMP"
if [ -d "$CORE_DEST" ] || ls "$SKILLS_DEST"/gbd-* >/dev/null 2>&1 || ls "$AGENTS_DEST"/gbd-*.md >/dev/null 2>&1; then
  echo "  backing up existing GBD -> $BACKUP"
  mkdir -p "$BACKUP/skills" "$BACKUP/agents"
  [ -d "$CORE_DEST" ] && cp -R "$CORE_DEST" "$BACKUP/get-books-done" || true
  for d in "$SKILLS_DEST"/gbd-*/; do [ -d "$d" ] && cp -R "$d" "$BACKUP/skills/" || true; done
  for f in "$AGENTS_DEST"/gbd-*.md; do [ -f "$f" ] && cp "$f" "$BACKUP/agents/" || true; done
fi

# Deploy
mkdir -p "$CORE_DEST" "$SKILLS_DEST" "$AGENTS_DEST"
cp -R "$REPO_DIR/core/." "$CORE_DEST/"
for d in "$REPO_DIR"/skills/gbd-*/; do
  name="$(basename "$d")"
  mkdir -p "$SKILLS_DEST/$name"
  cp "$d/SKILL.md" "$SKILLS_DEST/$name/SKILL.md"
done
cp "$REPO_DIR"/agents/gbd-*.md "$AGENTS_DEST/"

echo "Installed:"
echo "  core:   $(find "$CORE_DEST" -type f | wc -l | tr -d ' ') files"
echo "  skills: $(ls -d "$SKILLS_DEST"/gbd-*/ | wc -l | tr -d ' ')"
echo "  agents: $(ls "$AGENTS_DEST"/gbd-*.md | wc -l | tr -d ' ')"
echo "Done. Try /gbd:help in a book folder."
