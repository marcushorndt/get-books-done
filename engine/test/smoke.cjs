#!/usr/bin/env node
'use strict';

/**
 * smoke.cjs — end-to-end check of the gbd-tools engine.
 * Builds a throwaway .book/ in a temp dir and asserts key verbs return correct JSON.
 * Exits non-zero on any failure. No external deps.
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ENTRY = path.join(__dirname, '..', 'bin', 'gbd-tools.cjs');
let pass = 0;
let fail = 0;

function run(args) {
  const out = execFileSync('node', [ENTRY, ...args], { encoding: 'utf8' });
  return out.trim();
}
function runJSON(args) {
  let s = run(args);
  if (s.startsWith('@file:')) s = fs.readFileSync(s.slice('@file:'.length), 'utf8');
  return JSON.parse(s);
}
function check(name, cond, got) {
  if (cond) {
    pass++;
    console.log(`PASS  ${name}`);
  } else {
    fail++;
    console.log(`FAIL  ${name}` + (got !== undefined ? `  (got: ${JSON.stringify(got)})` : ''));
  }
}

// --- build sample .book/ -------------------------------------------------
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gbd-smoke-'));
const book = path.join(root, '.book');
const chap = path.join(book, 'chapters', '01-opening');
fs.mkdirSync(chap, { recursive: true });
fs.mkdirSync(path.join(root, 'manuscript'), { recursive: true });

fs.writeFileSync(path.join(book, 'config.json'), JSON.stringify({
  version: 1, mode: 'interactive', book_type: 'fiction',
  prose: { pov: 'third-limited', tense: 'past', chapter_target_words: 2500 },
}));
fs.writeFileSync(path.join(book, 'BOOK.md'), '# The Salt Road\n## What This Is\nA smuggler’s daughter inherits a debt.\n');
fs.writeFileSync(path.join(book, 'OUTLINE.md'), [
  '# Outline — The Salt Road', '## Act I',
  '### Chapter 01 — opening', '- Goal: hook',
  '### Chapter 02 — the letter', '- Goal: turn',
  '## Progress',
  '| Ch | Title | Status | Words | Promises |',
  '|----|-------|--------|-------|----------|',
  '| 01 | opening | drafted | 2400 | ARC-01 |',
  '| 02 | the letter | planned | 0 | ARC-01 |', '',
].join('\n'));
fs.writeFileSync(path.join(book, 'PROMISE.md'), [
  '# Reader Promises', '', '## Committed (this draft)', '',
  '- **ARC-01** — Mara’s arc', '- **HOOK-01** — the hook', '- **MYSTERY-01** — the letter’s sender',
  '', '## Traceability',
  '| ID | Promise | Chapter(s) | Status |',
  '|----|---------|-----------|--------|',
  '| ARC-01 | arc | 01, 02 | advancing |',
  '| HOOK-01 | hook | 01 | delivered |',
  '| MYSTERY-01 | mystery | — | open |', '',
].join('\n'));
fs.writeFileSync(path.join(book, 'STATE.md'), '---\ndraft: first\nchapter: "01"\n---\n# State\n');
fs.writeFileSync(path.join(chap, '01-01-PLAN.md'), [
  '---', 'chapter: "01"', 'plan: "01"', 'wave: 1',
  'must_land:', '  beats: ["Mara hides the letter"]', '  turn: "trust to fear"',
  '  promises: ["ARC-01","HOOK-01"]', '---', '# Beat Sheet', '### Scene 01 — the dock', '',
].join('\n'));
fs.writeFileSync(path.join(chap, '01-01-SUMMARY.md'), '# Summary\n');
fs.writeFileSync(path.join(root, 'manuscript', 'ch01.md'),
  'The dock smelled of brine. ' + Array.from({ length: 60 }, (_, i) => 'word' + i).join(' ') + '\n');

const C = ['--cwd', root];

// --- assertions ----------------------------------------------------------
try {
  check('config-get book_type', run([...C, 'config-get', 'book_type', '--raw']) === 'fiction');

  const outline = runJSON([...C, 'outline.analyze']);
  check('outline chapter_count == 2', outline.chapter_count === 2, outline.chapter_count);
  check('outline progress rows == 2', Array.isArray(outline.progress) && outline.progress.length === 2);

  const cov = runJSON([...C, 'promise.coverage']);
  check('promise committed == 3', cov.committed_count === 3, cov.committed_count);
  check('promise MYSTERY-01 uncovered', cov.uncovered.includes('MYSTERY-01'), cov.uncovered);
  check('promise HOOK-01 delivered', cov.delivered.includes('HOOK-01'), cov.delivered);

  const ch = runJSON([...C, 'chapter.state', '1']);
  check('chapter.state exists', ch.exists === true);
  check('chapter.state plan count == 1', ch.plans.length === 1, ch.plans.length);
  check('chapter.state must_land.turn', ch.plans[0].must_land && ch.plans[0].must_land.turn === 'trust to fear');

  const prog = runJSON([...C, 'init.progress']);
  check('init.progress has config', prog.config && prog.config.book_type === 'fiction');

  const stats = runJSON([...C, 'stats.json']);
  check('stats word total > 50', stats.words.total > 50, stats.words.total);
  check('stats drafted == 1', stats.chapters.drafted === 1, stats.chapters.drafted);

  check('generate-slug', runJSON([...C, 'generate-slug', 'The Betrayal']).slug === 'the-betrayal');
  check('--pick chapter_count', run([...C, 'outline.analyze', '--pick', 'chapter_count']) === '2');

  // unknown verb: engine emits a typed JSON error AND exits non-zero (so execFile throws)
  let err = null;
  let exitedNonZero = false;
  try {
    runJSON([...C, 'no.such.verb', '--json-errors']);
  } catch (e) {
    exitedNonZero = true;
    const raw = ((e.stdout || '') + (e.stderr || '')).trim();
    const j = raw.indexOf('{');
    try { err = JSON.parse(j >= 0 ? raw.slice(j) : raw); } catch (_) { /* leave err null */ }
  }
  check('unknown verb -> non-zero exit', exitedNonZero);
  check('unknown verb -> typed error', !!err && err.error === true && err.code === 'UNKNOWN_VERB', err && err.code);
} catch (e) {
  fail++;
  console.log('FAIL  threw: ' + e.message);
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
