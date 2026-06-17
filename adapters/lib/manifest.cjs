'use strict';
// Shared helpers for GBD CLI adapters. Node built-ins only.
const fs = require('fs');
const path = require('path');

// Repo root = three levels up from adapters/lib/manifest.cjs
const REPO_ROOT = path.resolve(__dirname, '..', '..');

function loadManifest() {
  const p = path.join(REPO_ROOT, 'commands', 'manifest.json');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

// Split a Markdown file with YAML frontmatter into { frontmatter (raw string), body }.
// If no frontmatter is present, frontmatter is '' and body is the whole file.
function splitFrontmatter(text) {
  if (text.startsWith('---\n') || text.startsWith('---\r\n')) {
    const rest = text.slice(text.indexOf('\n') + 1);
    const endIdx = rest.indexOf('\n---');
    if (endIdx !== -1) {
      const fm = rest.slice(0, endIdx);
      // Body begins after the closing '---' line.
      let after = rest.slice(endIdx + 1); // starts at '---...'
      const nl = after.indexOf('\n');
      const body = nl === -1 ? '' : after.slice(nl + 1);
      return { frontmatter: fm.replace(/\s+$/, ''), body: body.replace(/^\s+/, '') };
    }
  }
  return { frontmatter: '', body: text };
}

function readBody(relPath) {
  const abs = path.join(REPO_ROOT, relPath);
  const raw = fs.readFileSync(abs, 'utf8');
  return splitFrontmatter(raw);
}

// Map abstract capabilities -> Claude Code tool names.
const CLAUDE_TOOL_MAP = {
  read: ['Read'],
  write: ['Write'],
  edit: ['Edit'],
  shell: ['Bash'],
  glob: ['Glob'],
  grep: ['Grep'],
  'spawn-agent': ['Agent'],
  'ask-user': ['AskUserQuestion'],
  web: ['WebFetch', 'WebSearch'],
  'web-fetch': ['WebFetch'],
  'web-search': ['WebSearch'],
  'slash-command': ['SlashCommand'],
};

function capsToClaudeTools(caps) {
  const out = [];
  for (const c of caps) {
    const tools = CLAUDE_TOOL_MAP[c] || [];
    for (const t of tools) if (!out.includes(t)) out.push(t);
  }
  return out;
}

// Human-readable capability descriptions (for honest adapter READMEs / degraded CLIs).
const CAP_DESC = {
  read: 'read files',
  write: 'create files',
  edit: 'edit files in place',
  shell: 'run shell commands',
  glob: 'find files by glob',
  grep: 'search file contents',
  'spawn-agent': 'spawn subagents',
  'ask-user': 'ask the user structured questions',
  web: 'fetch and search the web',
  'web-fetch': 'fetch web pages',
  'web-search': 'search the web',
  'slash-command': 'invoke another command/skill',
};

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

// Recursively copy a directory tree (Node built-ins only).
function copyDir(src, dest) {
  ensureDir(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else if (entry.isFile()) fs.copyFileSync(s, d);
  }
}

// Parse simple "key: a, b, c" or block-list YAML for the limited fields we need.
// We do NOT need a full YAML parser; bodies are reused verbatim, the manifest is the
// source of truth for metadata.

// Rewrite a portable skill body for a non-Claude CLI.
//   - Claude `@$HOME/.claude/get-books-done/<rel>` includes become plain path references
//     under the install root the adapter documents (default ~/.gbd/core).
//   - `$ARGUMENTS` is replaced with the supplied token (e.g. Gemini `{{args}}`).
// The substance of the prose is preserved; only Claude-specific wiring is neutralized.
function rewriteBody(body, opts) {
  const o = opts || {};
  const coreRoot = o.coreRoot || '~/.gbd/core';
  const argsToken = o.argsToken; // if undefined, $ARGUMENTS is left as-is

  let out = body;

  // @$HOME/.claude/get-books-done/foo  OR  @~/.claude/get-books-done/foo  (with optional leading whitespace)
  out = out.replace(
    /@(?:\$HOME|~)\/\.claude\/get-books-done\/([^\s)]+)/g,
    (_m, rel) => `${coreRoot}/${rel}`
  );
  // Bare ~/.claude/get-books-done references in prose -> core root.
  out = out.replace(/(?:\$HOME|~)\/\.claude\/get-books-done\//g, `${coreRoot}/`);

  if (argsToken != null) {
    out = out.replace(/\$ARGUMENTS/g, argsToken);
  }
  return out;
}

// Extract the inner text of an XML-ish block like <execution_context>...</execution_context>.
function extractBlock(body, tag) {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`);
  const m = body.match(re);
  return m ? m[1].trim() : null;
}

module.exports = {
  REPO_ROOT,
  loadManifest,
  splitFrontmatter,
  readBody,
  capsToClaudeTools,
  CLAUDE_TOOL_MAP,
  CAP_DESC,
  ensureDir,
  copyDir,
  rewriteBody,
  extractBlock,
};
