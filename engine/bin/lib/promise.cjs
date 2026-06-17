'use strict';

/**
 * promise.cjs — parse .book/PROMISE.md.
 *
 * Recovers committed/deferred promise ids (CATEGORY-NN), their text, and the
 * trailing `## Traceability` table that maps ids -> chapters + status.
 * promise.coverage cross-references the table to surface uncovered ids.
 */

const path = require('path');
const core = require('./core.cjs');

const ID_RE = /\b([A-Z]+)-(\d+)\b/;

function promisePath(cwd) {
  return path.join(core.planningDir(cwd), 'PROMISE.md');
}

function parse(cwd) {
  const p = promisePath(cwd);
  if (!core.fileExists(p)) {
    return { exists: false, path: p, committed: [], deferred: [], traceability: [] };
  }
  const content = core.readFileSafe(p);
  const lines = content.split(/\r?\n/);

  const committed = [];
  const deferred = [];
  const traceability = [];
  let section = null; // 'committed' | 'deferred' | 'traceability'

  for (const line of lines) {
    if (/^##\s+Committed\b/i.test(line)) {
      section = 'committed';
      continue;
    }
    if (/^##\s+Deferred\b/i.test(line)) {
      section = 'deferred';
      continue;
    }
    if (/^##\s+Traceability\b/i.test(line)) {
      section = 'traceability';
      continue;
    }
    if (/^##\s+/.test(line)) {
      section = null;
      continue;
    }

    if (section === 'committed' || section === 'deferred') {
      // "- **ARC-01** — text" or "- text"
      const bm = line.match(/^\s*-\s+\*\*([A-Z]+-\d+)\*\*\s*[—–-]?\s*(.*)$/);
      if (bm) {
        const [, id, text] = bm;
        const [, category] = id.match(ID_RE) || [];
        const entry = { id, category, text: text.trim() };
        if (section === 'committed') committed.push(entry);
        else deferred.push(entry);
      } else if (section === 'deferred') {
        const plain = line.match(/^\s*-\s+(.*)$/);
        if (plain && plain[1].trim()) deferred.push({ id: null, category: null, text: plain[1].trim() });
      }
    }

    if (section === 'traceability') {
      const row = line.match(/^\|(.+)\|\s*$/);
      if (row) {
        const cells = row[1].split('|').map((c) => c.trim());
        if (/^-+$/.test(cells[0]) || /^id$/i.test(cells[0])) continue;
        if (cells.length >= 4 && ID_RE.test(cells[0])) {
          traceability.push({
            id: cells[0],
            promise: cells[1],
            chapters: cells[2]
              .split(/[,;]/)
              .map((s) => s.trim())
              .filter((s) => s && !/^—|^-$|^none$/i.test(s)),
            status: cells[3],
          });
        }
      }
    }
  }

  return { exists: true, path: p, committed, deferred, traceability };
}

/**
 * promise.coverage — for each committed id, which chapters cover it (from the
 * traceability table) and whether it is uncovered.
 */
function coverage(cwd) {
  const data = parse(cwd);
  const traceById = {};
  for (const t of data.traceability) traceById[t.id] = t;

  const mapped = [];
  const uncovered = [];
  for (const c of data.committed) {
    const t = traceById[c.id];
    const chapters = t ? t.chapters : [];
    const status = t ? t.status : 'open';
    const entry = { id: c.id, category: c.category, chapters, status, covered: chapters.length > 0 };
    mapped.push(entry);
    if (!entry.covered) uncovered.push(c.id);
  }

  const delivered = mapped.filter((m) => /deliver/i.test(m.status)).map((m) => m.id);

  return {
    committed_count: data.committed.length,
    covered_count: mapped.filter((m) => m.covered).length,
    uncovered,
    delivered,
    mapping: mapped,
  };
}

/** All committed promise ids (helper). */
function ids(cwd) {
  return parse(cwd).committed.map((c) => c.id);
}

module.exports = { parse, coverage, ids, promisePath };
