#!/usr/bin/env node
// gbd-hook-version: 0.1.0
// Background worker spawned by gbd-check-update.js (SessionStart hook).
// Queries the GBD GitHub remote for the latest release tag, compares it against
// the installed get-books-done/VERSION, and writes the result to a cache file.
// The SessionStart hook reads that cache on the NEXT session to decide whether
// to show the "update available" banner — so the notice is eventually consistent
// and never blocks startup on the network.
//
// Receives paths via environment variables set by the parent hook:
//   GBD_CACHE_FILE        where to write the JSON result
//   GBD_VERSION_FILE      installed get-books-done/VERSION
//   GBD_UPDATE_REMOTE     git URL to query for tags (e.g. the GitHub repo)

'use strict';

const fs = require('fs');
const { execFileSync } = require('child_process');

const cacheFile = process.env.GBD_CACHE_FILE;
const versionFile = process.env.GBD_VERSION_FILE;
const updateRemote = process.env.GBD_UPDATE_REMOTE;

// Parse a semver-ish string into [major, minor, patch], stripping a leading 'v'
// and any pre-release/build suffix so Number() never yields NaN.
function parseV(s) {
  return String(s || '')
    .replace(/^v/, '')
    .split('.')
    .map((p) => Number(String(p).replace(/[-+].*/, '')) || 0);
}

// true if a is strictly newer than b
function isNewer(a, b) {
  const pa = parseV(a);
  const pb = parseV(b);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return true;
    if ((pa[i] || 0) < (pb[i] || 0)) return false;
  }
  return false;
}

let installed = '0.0.0';
try {
  if (versionFile && fs.existsSync(versionFile)) {
    installed = fs.readFileSync(versionFile, 'utf8').trim();
  }
} catch (e) {}

// Ask the remote for its tags without cloning. Dereferenced (--refs) so we skip
// the peeled '^{}' entries; we pick the highest semver tag of the form vX.Y.Z.
let latest = null;
try {
  const out = execFileSync('git', ['ls-remote', '--tags', '--refs', updateRemote], {
    encoding: 'utf8',
    timeout: 10000,
    windowsHide: true,
  });
  for (const line of out.split('\n')) {
    const m = line.match(/refs\/tags\/(v?\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?)\s*$/);
    if (!m) continue;
    const tag = m[1];
    if (!latest || isNewer(tag, latest)) latest = tag;
  }
} catch (e) {}

const result = {
  update_available: !!(latest && isNewer(latest, installed)),
  installed,
  latest: latest ? latest.replace(/^v/, '') : 'unknown',
  remote: updateRemote || 'unknown',
  // Seconds since epoch. Date.now() is fine here — this worker is a one-shot
  // process, not part of any resumable workflow.
  checked: Math.floor(Date.now() / 1000),
};

if (cacheFile) {
  try {
    fs.writeFileSync(cacheFile, JSON.stringify(result));
  } catch (e) {}
}
