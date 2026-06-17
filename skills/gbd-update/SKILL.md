---
name: gbd-update
description: "Use when the author wants to update their installed GBD to the latest version, or acts on the 'update available' banner. Triggers: \"/gbd-update\", \"update gbd\", \"is there a new version of gbd\", \"upgrade get-books-done\"."
allowed-tools:
  - Read
  - Bash
---

<objective>
Update the user's installed GBD (skills, agents, core, engine, and hooks under
the Claude config dir) to the latest version published on the GBD git remote,
by pulling the source repo and re-running its installer. Report the version
delta and what changed.
</objective>

<process>
1. **Locate the install source.** Read `$HOME/.claude/get-books-done/install.json`
   (honor `$CLAUDE_CONFIG_DIR` if set instead of `~/.claude`). It records:
   - `source_repo` — the local path to the GBD repo the install came from
   - `update_remote` — the git URL releases are published to
   If the file is missing, tell the user GBD was installed without update metadata
   (an older install) and ask for the path to their get-books-done repo. Do not guess.

2. **Read the current state.**
   - Installed version: `$HOME/.claude/get-books-done/VERSION`
   - If present, the cached check: `$HOME/.cache/gbd/gbd-update-check.json`
     (`installed`, `latest`, `update_available`).

3. **Refresh the source repo.** In `source_repo`:
   - Confirm it is a clean git checkout (`git -C <repo> status --porcelain`). If it
     has uncommitted local changes, STOP and report them — do not pull over local
     work. Let the user decide.
   - `git -C <repo> fetch --tags` then `git -C <repo> pull --ff-only`. If the pull
     is not fast-forwardable, stop and report — the user's checkout has diverged.

4. **Re-install.** Run the repo's installer for Claude Code:
   `sh <repo>/install.sh claude-code`
   It backs up the prior install, regenerates skills/agents/core, copies the engine,
   re-installs the hooks, and re-registers the SessionStart check. This is idempotent.

5. **Report.** Show old version → new version (compare the VERSION file before and
   after), the installer's summary line (counts of skills/agents/core), and a short
   list of notable changes if the repo has a CHANGELOG or the git log between the
   two tags is informative. Remind the user that newly installed skills/hooks take
   effect in a **new session** (the current session has the old definitions loaded).

6. **Clear the stale banner.** After a successful update, remove
   `$HOME/.cache/gbd/gbd-update-check.json` so the "update available" notice does
   not show again until the next background check runs.
</process>

<constraints>
- Never force-push, hard-reset, or discard local changes in the source repo.
- If git or the installer fails, surface the exact error and stop — do not retry blindly.
- Do not modify the user's settings.json yourself; the installer's register step owns that.
</constraints>
