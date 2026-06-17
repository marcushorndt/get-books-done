#!/bin/sh
# Get Books Done (GBD) installer — dispatcher.
#
# Usage: ./install.sh [claude-code|gemini-cli|codex]   (default: claude-code)
#
# claude-code : installs the engine and generates skills/agents/core into ~/.claude
#               (set CLAUDE_HOME to override). Runs adapters/claude-code/install.sh.
# gemini-cli  : generates Gemini CLI commands. Emits into ~/.gemini if present, else into
#               adapters/gemini-cli/dist/. Prints next steps.
# codex       : generates Codex prompts + AGENTS.md. Emits into ~/.codex if present, else
#               into adapters/codex/dist/. Prints next steps.
#
# POSIX sh, no dependencies (Node is required for the build/engine steps).
set -eu

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
CLI="${1:-claude-code}"

case "$CLI" in
  claude-code)
    exec sh "$REPO_DIR/adapters/claude-code/install.sh"
    ;;

  gemini-cli)
    if ! command -v node >/dev/null 2>&1; then
      echo "error: node is required to build the Gemini CLI commands." >&2
      exit 1
    fi
    if [ -d "$HOME/.gemini" ]; then
      TARGET="$HOME/.gemini"
    else
      TARGET="$REPO_DIR/adapters/gemini-cli/dist"
    fi
    node "$REPO_DIR/adapters/gemini-cli/build.cjs" --target "$TARGET"
    echo ""
    echo "Next steps (gemini-cli):"
    if [ "$TARGET" = "$HOME/.gemini" ]; then
      echo "  - Commands installed to $TARGET/commands/ (invoke /gbd-<name>)."
    else
      echo "  - No ~/.gemini found; generated into $TARGET."
      echo "  - Copy commands:  cp $TARGET/commands/*.toml ~/.gemini/commands/"
    fi
    echo "  - Install the core: cp -R $TARGET/core ~/.gbd/core"
    echo "  - See adapters/gemini-cli/README.md (generated, not yet battle-tested)."
    ;;

  codex)
    if ! command -v node >/dev/null 2>&1; then
      echo "error: node is required to build the Codex prompts." >&2
      exit 1
    fi
    if [ -d "$HOME/.codex" ]; then
      TARGET="$REPO_DIR/adapters/codex/dist"
      node "$REPO_DIR/adapters/codex/build.cjs" --target "$TARGET"
      echo ""
      echo "Next steps (codex):"
      echo "  - Prompts:   cp $TARGET/prompts/*.md ~/.codex/prompts/   (invoke /gbd-<name>)"
      echo "  - AGENTS.md: cp $TARGET/AGENTS.md /path/to/your/book/AGENTS.md"
      echo "  - Core:      cp -R $TARGET/core ~/.gbd/core"
    else
      TARGET="$REPO_DIR/adapters/codex/dist"
      node "$REPO_DIR/adapters/codex/build.cjs" --target "$TARGET"
      echo ""
      echo "Next steps (codex):"
      echo "  - No ~/.codex found; generated into $TARGET."
      echo "  - Prompts:   cp $TARGET/prompts/*.md ~/.codex/prompts/"
      echo "  - AGENTS.md: cp $TARGET/AGENTS.md /path/to/your/book/AGENTS.md"
      echo "  - Core:      cp -R $TARGET/core ~/.gbd/core"
    fi
    echo "  - See adapters/codex/README.md (generated, not yet battle-tested)."
    ;;

  -h|--help|help)
    echo "Usage: ./install.sh [claude-code|gemini-cli|codex]   (default: claude-code)"
    ;;

  *)
    echo "error: unknown adapter '$CLI'. Use claude-code | gemini-cli | codex." >&2
    exit 1
    ;;
esac
