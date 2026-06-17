'use strict';

/**
 * state.cjs — read/update .book/STATE.md.
 *
 * STATE.md is a markdown digest with `## ` sections (Position, Word count,
 * Velocity, Recent decisions, Open threads / blockers, Deferred ideas). We
 * parse it into a section map and provide structured mutators that append to
 * the right section.
 */

const fs = require('fs');
const path = require('path');
const core = require('./core.cjs');

function statePath(cwd) {
  return path.join(core.planningDir(cwd), 'STATE.md');
}

function parseSections(content) {
  const lines = content.split(/\r?\n/);
  let title = null;
  const sections = {};
  const order = [];
  let cur = null;
  const preamble = [];

  for (const line of lines) {
    const h1 = line.match(/^#\s+(.*)$/);
    const h2 = line.match(/^##\s+(.*)$/);
    if (h1 && title === null && cur === null) {
      title = h1[1].trim();
      continue;
    }
    if (h2) {
      cur = h2[1].trim();
      sections[cur] = [];
      order.push(cur);
      continue;
    }
    if (cur) sections[cur].push(line);
    else preamble.push(line);
  }
  return { title, sections, order, preamble };
}

/** Read STATE.md into a structured object. */
function read(cwd) {
  const p = statePath(cwd);
  if (!core.fileExists(p)) {
    return { exists: false, path: p, title: null, position: {}, sections: {} };
  }
  const content = core.readFileSafe(p);
  const parsed = parseSections(content);

  // Pull recognizable fields out of the Position section bullets.
  const position = {};
  const posLines = parsed.sections['Position'] || [];
  for (const l of posLines) {
    const m = l.match(/^\s*-\s*\*\*([^:*]+):\*\*\s*(.*)$/);
    if (m) position[m[1].trim().toLowerCase().replace(/\s+/g, '_')] = m[2].trim();
  }

  const sectionsText = {};
  for (const k of parsed.order) sectionsText[k] = parsed.sections[k].join('\n').trim();

  return {
    exists: true,
    path: p,
    title: parsed.title,
    position,
    sections: sectionsText,
    order: parsed.order,
  };
}

/** Rebuild the file from a parsed structure (used by mutators). */
function write(cwd, parsed) {
  const p = statePath(cwd);
  const out = [];
  if (parsed.title) out.push(`# ${parsed.title}`, '');
  if (parsed.preamble && parsed.preamble.length) {
    out.push(parsed.preamble.join('\n').replace(/\n+$/, ''), '');
  }
  for (const sec of parsed.order) {
    out.push(`## ${sec}`);
    const body = (parsed.sections[sec] || []).join('\n').replace(/^\n+|\n+$/g, '');
    if (body) out.push(body);
    out.push('');
  }
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, out.join('\n').replace(/\n{3,}/g, '\n\n').replace(/\n*$/, '\n'), 'utf8');
  return p;
}

function loadParsed(cwd) {
  const p = statePath(cwd);
  const content = core.fileExists(p) ? core.readFileSafe(p) : '# State\n';
  const parsed = parseSections(content);
  if (!parsed.title) parsed.title = 'State';
  return parsed;
}

function ensureSection(parsed, name) {
  if (!parsed.sections[name]) {
    parsed.sections[name] = [];
    parsed.order.push(name);
  }
}

function appendBullet(cwd, sectionName, text) {
  const parsed = loadParsed(cwd);
  ensureSection(parsed, sectionName);
  parsed.sections[sectionName].push(`- ${text}`);
  const written = write(cwd, parsed);
  return { section: sectionName, added: text, path: written };
}

/** add-decision <text> — append to "Recent decisions". */
function addDecision(cwd, text) {
  if (!text) throw new core.GbdError(core.ERROR.BAD_ARGS, 'add-decision requires text');
  return appendBullet(cwd, 'Recent decisions', text);
}

/** add-blocker <text> — append to "Open threads / blockers". */
function addBlocker(cwd, text) {
  if (!text) throw new core.GbdError(core.ERROR.BAD_ARGS, 'add-blocker requires text');
  return appendBullet(cwd, 'Open threads / blockers', text);
}

/** record-metric <name> <value> — append to "Velocity". */
function recordMetric(cwd, name, value) {
  if (!name) throw new core.GbdError(core.ERROR.BAD_ARGS, 'record-metric requires a name');
  const ts = new Date().toISOString().slice(0, 10);
  return appendBullet(cwd, 'Velocity', `${ts} · ${name}: ${value}`);
}

/** set-position <key> <value> — update a Position bullet (creates if absent). */
function setPosition(cwd, key, value) {
  if (!key) throw new core.GbdError(core.ERROR.BAD_ARGS, 'set-position requires a key');
  const parsed = loadParsed(cwd);
  ensureSection(parsed, 'Position');
  const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const bullets = parsed.sections['Position'];
  const re = new RegExp(`^\\s*-\\s*\\*\\*${label}:\\*\\*`, 'i');
  let found = false;
  for (let i = 0; i < bullets.length; i++) {
    if (re.test(bullets[i])) {
      bullets[i] = `- **${label}:** ${value}`;
      found = true;
      break;
    }
  }
  if (!found) bullets.push(`- **${label}:** ${value}`);
  const written = write(cwd, parsed);
  return { key, value, path: written };
}

module.exports = {
  read,
  statePath,
  addDecision,
  addBlocker,
  recordMetric,
  setPosition,
};
