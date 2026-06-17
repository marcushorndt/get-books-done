#!/usr/bin/env node
// gbd-hook-version: 0.1.0
// SessionStart hook. Two jobs, in this order:
//   1. Spawn a detached background worker that refreshes the update-check cache
//      (queries the GitHub remote for the latest tag). Never blocks startup.
//   2. Read the cache left by a PREVIOUS session and, if an update is available,
//      print a yellow banner. SessionStart stdout only reaches the model, so to
//      show the user visible text we write to stderr and exit 2 (Claude Code
//      surfaces stderr to the user on exit 2 for SessionStart, and continues).
//
// The notice is therefore eventually consistent: a release published now shows
// up at the start of the *next* session, after the background check has run.

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const homeDir = os.homedir();

// Resolve the config dir (honor CLAUDE_CONFIG_DIR; fall back to ~/.claude).
const configDir =
  process.env.CLAUDE_CONFIG_DIR &&
  fs.existsSync(path.join(process.env.CLAUDE_CONFIG_DIR, 'get-books-done', 'VERSION'))
    ? process.env.CLAUDE_CONFIG_DIR
    : path.join(homeDir, '.claude');

const coreDir = path.join(configDir, 'get-books-done');
const versionFile = path.join(coreDir, 'VERSION');

// Tool-agnostic cache location, mirroring the GSD convention.
const cacheDir = path.join(homeDir, '.cache', 'gbd');
const cacheFile = path.join(cacheDir, 'gbd-update-check.json');

// Discover the remote to query. Written at install time into install.json;
// fall back to the canonical GitHub repo if absent.
let updateRemote = 'https://github.com/marcushorndt/get-books-done.git';
try {
  const meta = JSON.parse(fs.readFileSync(path.join(coreDir, 'install.json'), 'utf8'));
  if (meta && meta.update_remote) updateRemote = meta.update_remote;
} catch (e) {}

// --- 1) Kick off the background refresh (detached, output discarded). ---
try {
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
  const worker = path.join(__dirname, 'gbd-check-update-worker.js');
  if (fs.existsSync(worker)) {
    const child = spawn(process.execPath, [worker], {
      stdio: 'ignore',
      windowsHide: true,
      detached: true,
      env: {
        ...process.env,
        GBD_CACHE_FILE: cacheFile,
        GBD_VERSION_FILE: versionFile,
        GBD_UPDATE_REMOTE: updateRemote,
      },
    });
    child.unref();
  }
} catch (e) {}

// --- 2) Show the banner from the previous session's cached result. ---
try {
  if (fs.existsSync(cacheFile)) {
    const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    if (cache && cache.update_available) {
      const Y = '\x1b[33m';
      const B = '\x1b[1m';
      const R = '\x1b[0m';
      process.stderr.write(
        `${Y}⬆ GBD ${cache.installed} → ${B}${cache.latest}${R}${Y} available — run ${B}/gbd-update${R}\n`
      );
      process.exit(2); // stderr is shown to the user; SessionStart continues.
    }
  }
} catch (e) {}

process.exit(0);
