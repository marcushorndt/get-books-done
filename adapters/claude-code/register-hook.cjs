#!/usr/bin/env node
'use strict';
// Idempotently register GBD's SessionStart update-check hook in settings.json.
// Preserves every other hook (including GSD's) and is safe to run repeatedly:
// it removes any prior gbd-check-update entry, then appends a fresh one.
//
// Usage: node register-hook.cjs <configDir> <hookCommand>
//   configDir   e.g. ~/.claude
//   hookCommand the full command string to run (node + absolute hook path)

const fs = require('fs');
const path = require('path');

const configDir = process.argv[2];
const hookCommand = process.argv[3];
if (!configDir || !hookCommand) {
  console.error('usage: register-hook.cjs <configDir> <hookCommand>');
  process.exit(1);
}

const settingsPath = path.join(configDir, 'settings.json');

let settings = {};
if (fs.existsSync(settingsPath)) {
  try {
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  } catch (e) {
    console.error(`  warning: ${settingsPath} is not valid JSON — leaving it untouched.`);
    console.error('  Add this SessionStart hook manually:');
    console.error('    ' + hookCommand);
    process.exit(0); // non-fatal: don't break the whole install over settings.
  }
  // Back up before we modify a file we didn't create.
  try {
    fs.copyFileSync(settingsPath, settingsPath + '.gbd-bak');
  } catch (e) {}
}

if (!settings.hooks || typeof settings.hooks !== 'object') settings.hooks = {};
if (!Array.isArray(settings.hooks.SessionStart)) settings.hooks.SessionStart = [];

const arr = settings.hooks.SessionStart;

// Does a command string belong to our hook? Match on the script filename so a
// changed node path or config dir still dedups correctly.
const isOurs = (cmd) => typeof cmd === 'string' && cmd.includes('gbd-check-update.js');

// Drop any prior GBD entries (whole groups and individual inner hooks).
for (let i = arr.length - 1; i >= 0; i--) {
  const group = arr[i];
  if (group && Array.isArray(group.hooks)) {
    group.hooks = group.hooks.filter((h) => !(h && isOurs(h.command)));
    if (group.hooks.length === 0) arr.splice(i, 1);
  }
}

// Append a fresh group of our own.
arr.push({
  hooks: [{ type: 'command', command: hookCommand }],
});

fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
console.log('  registered SessionStart update-check hook in ' + settingsPath);
