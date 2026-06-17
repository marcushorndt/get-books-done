'use strict';

/**
 * outline.cjs — parse .book/OUTLINE.md.
 *
 * Recovers the act/chapter tree (from `## Act` and `### Chapter NN — title`
 * headings + bullet metadata) and the trailing `## Progress` table. Read-only
 * analysis is the primary surface; add/insert just compute the resulting
 * numbering without mutating the file.
 */

const path = require('path');
const core = require('./core.cjs');

function outlinePath(cwd) {
  return path.join(core.planningDir(cwd), 'OUTLINE.md');
}

function parseBullet(line) {
  // "- **Goal:** something" -> { key:'goal', value:'something' }
  const m = line.match(/^\s*-\s*\*\*([^:*]+):\*\*\s*(.*)$/);
  if (!m) return null;
  return { key: m[1].trim().toLowerCase().replace(/\s+/g, '_'), value: m[2].trim() };
}

function splitIds(value) {
  if (!value) return [];
  return value
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter((s) => s && !/^none$/i.test(s));
}

/** Parse the OUTLINE.md document into structured form. */
function parse(cwd) {
  const p = outlinePath(cwd);
  if (!core.fileExists(p)) {
    return { exists: false, path: p, acts: [], chapters: [], progress: [] };
  }
  const content = core.readFileSafe(p);
  const lines = content.split(/\r?\n/);

  const acts = [];
  const chapters = [];
  let curAct = null;
  let curChapter = null;
  let inProgress = false;
  let draft = null;
  const progressRows = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (draft === null) {
      const dm = line.match(/\*\*Draft:\*\*\s*([^·|]+)/i);
      if (dm) {
        const v = dm[1].trim();
        // ignore unfilled template placeholders like {{zero | first | ...}}
        if (v && !v.startsWith('{{')) draft = v;
      }
    }

    if (/^##\s+Progress\s*$/i.test(line)) {
      inProgress = true;
      curChapter = null;
      continue;
    }

    if (inProgress) {
      const row = line.match(/^\|(.+)\|\s*$/);
      if (row) {
        const cells = row[1].split('|').map((c) => c.trim());
        // skip header & separator rows
        if (/^-+$/.test(cells[0]) || /^ch$/i.test(cells[0])) continue;
        if (cells.length >= 5) {
          progressRows.push({
            chapter: cells[0],
            title: cells[1],
            status: cells[2],
            words: /^\d+$/.test(cells[3]) ? Number(cells[3]) : cells[3],
            promises: splitIds(cells[4]),
          });
        }
      }
      continue;
    }

    const actM = line.match(/^##\s+(Act|Part)\b\s*(.*)$/i);
    if (actM) {
      curAct = { name: (actM[1] + ' ' + actM[2]).trim(), chapters: [] };
      acts.push(curAct);
      curChapter = null;
      continue;
    }

    const chM = line.match(/^###\s+Chapter\s+(\d+(?:\.\d+)?)\s*[—–-]?\s*(.*)$/i);
    if (chM) {
      curChapter = {
        number: chM[1],
        title: chM[2].trim(),
        act: curAct ? curAct.name : null,
        goal: null,
        promises: [],
        dependencies: [],
        mode: null,
        plans: [],
      };
      chapters.push(curChapter);
      if (curAct) curAct.chapters.push(curChapter.number);
      continue;
    }

    if (curChapter) {
      const b = parseBullet(line);
      if (b) {
        if (b.key === 'goal') curChapter.goal = b.value;
        else if (b.key === 'promises_advanced' || b.key === 'promises') curChapter.promises = splitIds(b.value);
        else if (b.key === 'dependencies') curChapter.dependencies = splitIds(b.value);
        else if (b.key === 'mode') curChapter.mode = b.value;
        else if (b.key === 'plans') curChapter.plans = splitIds(b.value);
      }
    }
  }

  return { exists: true, path: p, draft, acts, chapters, progress: progressRows };
}

/** outline.analyze — summary suited for workflows. */
function analyze(cwd) {
  const o = parse(cwd);
  const byStatus = {};
  for (const r of o.progress) {
    byStatus[r.status] = (byStatus[r.status] || 0) + 1;
  }
  return {
    exists: o.exists,
    path: o.path,
    draft: o.draft,
    chapter_count: o.chapters.length,
    act_count: o.acts.length,
    chapters: o.chapters,
    progress: o.progress,
    status_counts: byStatus,
  };
}

/** Compute the next integer chapter number (string, zero-padded). */
function nextDecimal(cwd, after) {
  const o = parse(cwd);
  if (after != null) {
    // sub-chapter split: 3 -> 3.1, 3.1 -> 3.2
    const base = String(after);
    const subs = o.chapters
      .map((c) => c.number)
      .filter((n) => n === base || n.startsWith(base + '.'))
      .map((n) => (n.includes('.') ? Number(n.split('.')[1]) : 0));
    const maxSub = subs.length ? Math.max(...subs) : 0;
    return `${base}.${maxSub + 1}`;
  }
  const ints = o.chapters
    .map((c) => Number(String(c.number).split('.')[0]))
    .filter((n) => Number.isFinite(n));
  const max = ints.length ? Math.max(...ints) : 0;
  return String(max + 1).padStart(2, '0');
}

module.exports = { parse, analyze, nextDecimal, outlinePath };
