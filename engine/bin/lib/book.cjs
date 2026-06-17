'use strict';

/**
 * book.cjs — read .book/BOOK.md (the vision doc).
 * Extracts the H1 title and the ## section map.
 */

const path = require('path');
const core = require('./core.cjs');

function bookPath(cwd) {
  return path.join(core.planningDir(cwd), 'BOOK.md');
}

/** Parse BOOK.md into { exists, path, title, sections: [{ heading, body }] }. */
function read(cwd) {
  const p = bookPath(cwd);
  if (!core.fileExists(p)) {
    return { exists: false, path: p, title: null, sections: [] };
  }
  const content = core.readFileSafe(p);
  const lines = content.split(/\r?\n/);
  let title = null;
  const sections = [];
  let current = null;

  for (const line of lines) {
    const h1 = line.match(/^#\s+(.*)$/);
    const h2 = line.match(/^##\s+(.*)$/);
    if (h1 && title === null) {
      title = h1[1].trim();
      continue;
    }
    if (h2) {
      if (current) sections.push(current);
      current = { heading: h2[1].trim(), body: '' };
      continue;
    }
    if (current) current.body += (current.body ? '\n' : '') + line;
  }
  if (current) sections.push(current);

  // Trim section bodies.
  for (const s of sections) s.body = s.body.trim();

  return { exists: true, path: p, title, sections };
}

/** Convenience: just the section headings. */
function sections(cwd) {
  return read(cwd).sections.map((s) => s.heading);
}

module.exports = { read, sections, bookPath };
