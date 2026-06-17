'use strict';

/**
 * frontmatter.cjs — minimal, dependency-free YAML frontmatter parser and
 * serializer. Supports the subset GBD templates actually use:
 *   - scalars (quoted or bare), null, booleans, numbers
 *   - flow arrays:  promises: ["ARC-01", "HOOK-01"]
 *   - block arrays:
 *       beats:
 *         - "first"
 *         - "second"
 *   - one level of nesting (e.g. must_land.beats / must_land.turn)
 *
 * Not a general YAML engine — just enough for the frontmatter shapes in
 * beat-sheet.md and summary.md.
 */

const FM_DELIM = '---';

/** Split a document into { frontmatter: rawYaml|null, body: string }. */
function split(content) {
  const text = content.replace(/^﻿/, '');
  const lines = text.split(/\r?\n/);
  if (lines[0] !== FM_DELIM) {
    return { fmRaw: null, body: text };
  }
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === FM_DELIM) {
      end = i;
      break;
    }
  }
  if (end === -1) return { fmRaw: null, body: text };
  const fmRaw = lines.slice(1, end).join('\n');
  const body = lines.slice(end + 1).join('\n').replace(/^\n/, '');
  return { fmRaw, body };
}

function parseScalar(raw) {
  let v = raw.trim();
  if (v === '') return '';
  if (v === 'null' || v === '~') return null;
  if (v === 'true') return true;
  if (v === 'false') return false;
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }
  if (/^-?\d+$/.test(v)) return Number(v);
  if (/^-?\d*\.\d+$/.test(v)) return Number(v);
  return v;
}

/** Parse a flow array body like `"a", "b"` -> ['a','b']. */
function parseFlowArray(inner) {
  const items = [];
  let buf = '';
  let inStr = false;
  let strCh = '';
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (inStr) {
      if (ch === strCh) {
        inStr = false;
      } else {
        buf += ch;
      }
    } else if (ch === '"' || ch === "'") {
      inStr = true;
      strCh = ch;
    } else if (ch === ',') {
      const trimmed = buf.trim();
      if (trimmed !== '') items.push(parseScalar(trimmed));
      buf = '';
    } else {
      buf += ch;
    }
  }
  const last = buf.trim();
  if (last !== '') items.push(parseScalar(last));
  // For quoted-only items the scalar parse may keep quotes if buffer captured
  // them char by char; normalize by stripping again.
  return items.map((it) => (typeof it === 'string' ? it : it));
}

function indentOf(line) {
  const m = line.match(/^(\s*)/);
  return m ? m[1].length : 0;
}

/**
 * Parse frontmatter YAML into an object. Supports one level of nesting and
 * block/flow arrays as described in the module header.
 */
function parse(content) {
  const { fmRaw } = split(content);
  if (fmRaw == null) return {};
  const lines = fmRaw.split('\n');
  const result = {};
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '' || line.trim().startsWith('#')) {
      i++;
      continue;
    }
    const ind = indentOf(line);
    if (ind !== 0) {
      // stray indented line at top level — skip
      i++;
      continue;
    }
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*?)\s*(?:#.*)?$/);
    if (!m) {
      i++;
      continue;
    }
    const key = m[1];
    const rest = m[2];

    if (rest === '') {
      // Could be a block array or a nested map. Look ahead.
      let j = i + 1;
      // skip blank
      while (j < lines.length && lines[j].trim() === '') j++;
      if (j < lines.length && indentOf(lines[j]) > ind && lines[j].trim().startsWith('- ')) {
        // block array
        const arr = [];
        while (j < lines.length) {
          const l = lines[j];
          if (l.trim() === '') {
            j++;
            continue;
          }
          if (indentOf(l) <= ind) break;
          const itemMatch = l.trim().match(/^-\s*(.*)$/);
          if (!itemMatch) break;
          arr.push(parseScalar(itemMatch[1]));
          j++;
        }
        result[key] = arr;
        i = j;
        continue;
      } else if (j < lines.length && indentOf(lines[j]) > ind) {
        // nested map (one level)
        const childIndent = indentOf(lines[j]);
        const obj = {};
        while (j < lines.length) {
          const l = lines[j];
          if (l.trim() === '') {
            j++;
            continue;
          }
          if (indentOf(l) < childIndent) break;
          const cm = l.match(/^\s*([A-Za-z0-9_-]+):\s*(.*?)\s*(?:#.*)?$/);
          if (!cm) {
            j++;
            continue;
          }
          const ckey = cm[1];
          const crest = cm[2];
          if (crest === '') {
            // nested block array under child key
            let k = j + 1;
            while (k < lines.length && lines[k].trim() === '') k++;
            if (k < lines.length && indentOf(lines[k]) > childIndent && lines[k].trim().startsWith('- ')) {
              const arr = [];
              while (k < lines.length) {
                const ll = lines[k];
                if (ll.trim() === '') {
                  k++;
                  continue;
                }
                if (indentOf(ll) <= childIndent) break;
                const im = ll.trim().match(/^-\s*(.*)$/);
                if (!im) break;
                arr.push(parseScalar(im[1]));
                k++;
              }
              obj[ckey] = arr;
              j = k;
              continue;
            } else {
              obj[ckey] = null;
              j++;
              continue;
            }
          } else if (crest.startsWith('[') && crest.endsWith(']')) {
            obj[ckey] = parseFlowArray(crest.slice(1, -1));
            j++;
          } else {
            obj[ckey] = parseScalar(crest);
            j++;
          }
        }
        result[key] = obj;
        i = j;
        continue;
      } else {
        result[key] = null;
        i++;
        continue;
      }
    } else if (rest.startsWith('[') && rest.endsWith(']')) {
      result[key] = parseFlowArray(rest.slice(1, -1));
      i++;
    } else {
      result[key] = parseScalar(rest);
      i++;
    }
  }
  return result;
}

function serializeScalar(v) {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'boolean' || typeof v === 'number') return String(v);
  const s = String(v);
  if (s === '' || /[:#\[\]{}",]/.test(s) || /^\s|\s$/.test(s)) {
    return `"${s.replace(/"/g, '\\"')}"`;
  }
  return s;
}

/** Serialize an object back to a frontmatter YAML block (one nesting level). */
function serialize(obj) {
  const out = [];
  for (const key of Object.keys(obj)) {
    const v = obj[key];
    if (Array.isArray(v)) {
      const flow = '[' + v.map((x) => serializeScalar(x)).join(', ') + ']';
      out.push(`${key}: ${flow}`);
    } else if (v && typeof v === 'object') {
      out.push(`${key}:`);
      for (const ck of Object.keys(v)) {
        const cv = v[ck];
        if (Array.isArray(cv)) {
          out.push(`  ${ck}:`);
          for (const item of cv) out.push(`    - ${serializeScalar(item)}`);
        } else {
          out.push(`  ${ck}: ${serializeScalar(cv)}`);
        }
      }
    } else {
      out.push(`${key}: ${serializeScalar(v)}`);
    }
  }
  return out.join('\n');
}

/** Reconstruct a full document with a new frontmatter object + body. */
function reconstruct(obj, body) {
  return `${FM_DELIM}\n${serialize(obj)}\n${FM_DELIM}\n\n${body.replace(/^\n+/, '')}`;
}

module.exports = { split, parse, serialize, reconstruct, parseFlowArray, parseScalar };
