#!/usr/bin/env node
'use strict';
// GBD Claude Code adapter — regenerates native Claude Code packaging from
// commands/manifest.json + the portable bodies under skills/ and agents/.
//
// Output (into <target>, default ~/.claude):
//   <target>/skills/gbd-*/SKILL.md      skill frontmatter + portable body
//   <target>/agents/gbd-*.md            agent frontmatter + portable body
//   <target>/get-books-done/            the portable core (templates/refs/workflows/VERSION)
//
// Round-trips: because the bodies are reused verbatim and the frontmatter is rebuilt
// from the same metadata, generated files are equivalent to the canonical skills/ & agents/.
//
// Node built-ins only.

const fs = require('fs');
const path = require('path');
const {
  REPO_ROOT, loadManifest, readBody, capsToClaudeTools, ensureDir, copyDir,
} = require('../lib/manifest.cjs');

function parseArgs(argv) {
  const args = { target: path.join(process.env.HOME || '', '.claude') };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--target') args.target = argv[++i];
    else if (argv[i].startsWith('--target=')) args.target = argv[i].slice('--target='.length);
  }
  return args;
}

// YAML double-quoted scalar (escape backslash and quote).
function yamlQuote(s) {
  return '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}

function skillFrontmatter(skill) {
  const tools = capsToClaudeTools(skill.capabilities);
  const lines = ['---'];
  lines.push(`name: ${skill.name}`);
  lines.push(`description: ${yamlQuote(skill.description)}`);
  if (skill.argument_hint && skill.argument_hint.length) {
    lines.push(`argument-hint: ${yamlQuote(skill.argument_hint)}`);
  }
  lines.push('allowed-tools:');
  for (const t of tools) lines.push(`  - ${t}`);
  lines.push('---');
  return lines.join('\n');
}

function agentFrontmatter(agent) {
  const tools = capsToClaudeTools(agent.capabilities);
  const lines = ['---'];
  lines.push(`name: ${agent.name}`);
  // Canonical agent descriptions are plain (unquoted) YAML scalars; emit verbatim.
  lines.push(`description: ${agent.description}`);
  lines.push(`tools: ${tools.join(', ')}`);
  if (agent.color != null && agent.color !== '') {
    // Hex colors carry their own quotes in the manifest; named colors are bare.
    const c = /^#/.test(agent.color) ? `"${agent.color}"` : agent.color;
    lines.push(`color: ${c}`);
  }
  lines.push('---');
  return lines.join('\n');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const manifest = loadManifest();
  const target = path.resolve(args.target);

  const skillsDir = path.join(target, 'skills');
  const agentsDir = path.join(target, 'agents');
  const coreDest = path.join(target, 'get-books-done');

  ensureDir(skillsDir);
  ensureDir(agentsDir);

  // Skills
  let skillCount = 0;
  for (const skill of manifest.skills) {
    const { body } = readBody(skill.body);
    const out = skillFrontmatter(skill) + '\n\n' + body.replace(/\s*$/, '') + '\n';
    const dir = path.join(skillsDir, skill.name);
    ensureDir(dir);
    fs.writeFileSync(path.join(dir, 'SKILL.md'), out);
    skillCount++;
  }

  // Agents
  let agentCount = 0;
  for (const agent of manifest.agents) {
    const { body } = readBody(agent.body);
    const out = agentFrontmatter(agent) + '\n\n' + body.replace(/\s*$/, '') + '\n';
    fs.writeFileSync(path.join(agentsDir, agent.name + '.md'), out);
    agentCount++;
  }

  // Core (portable; copied verbatim). The engine/ tree is installed separately by install.sh.
  const coreSrc = path.join(REPO_ROOT, 'core');
  copyDir(coreSrc, coreDest);

  const coreFiles = countFiles(coreDest);
  console.log('[claude-code] target: ' + target);
  console.log('[claude-code] skills: ' + skillCount + ' -> ' + skillsDir + '/gbd-*/SKILL.md');
  console.log('[claude-code] agents: ' + agentCount + ' -> ' + agentsDir + '/gbd-*.md');
  console.log('[claude-code] core:   ' + coreFiles + ' files -> ' + coreDest);
}

function countFiles(dir) {
  let n = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) n += countFiles(path.join(dir, e.name));
    else n++;
  }
  return n;
}

main();
