'use strict';

/**
 * commands.cjs — flat utility verbs.
 *   generate-slug, current-timestamp, commit, progress.bar, stats.json
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const core = require('./core.cjs');
const outline = require('./outline.cjs');
const promise = require('./promise.cjs');
const chapter = require('./chapter.cjs');

// ---------------------------------------------------------------------------
// generate-slug
// ---------------------------------------------------------------------------

function generateSlug(text) {
  if (!text) throw new core.GbdError(core.ERROR.BAD_ARGS, 'generate-slug requires text');
  const slug = String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics
    .replace(/['’"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
  return { input: text, slug };
}

// ---------------------------------------------------------------------------
// current-timestamp
// ---------------------------------------------------------------------------

function currentTimestamp(format) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  switch (format) {
    case 'date':
      return date;
    case 'filename':
      return `${date}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    case 'iso':
      return now.toISOString();
    case 'full':
    default:
      return `${date} ${time}`;
  }
}

// ---------------------------------------------------------------------------
// commit (git add + commit)
// ---------------------------------------------------------------------------

function git(cwd, args) {
  const root = core.bookRoot(cwd);
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
  } catch (err) {
    throw new core.GbdError(core.ERROR.GIT_ERROR, `git ${args.join(' ')} failed`, (err.stderr || err.message || '').toString().trim());
  }
}

function commit(cwd, message, paths) {
  if (!message) throw new core.GbdError(core.ERROR.BAD_ARGS, 'commit requires a message');
  const addTargets = paths && paths.length ? paths : ['-A'];
  git(cwd, ['add'].concat(addTargets));
  // Detect whether there's anything staged.
  let staged;
  try {
    staged = git(cwd, ['diff', '--cached', '--name-only']);
  } catch (_) {
    staged = '';
  }
  if (!staged) {
    return { committed: false, reason: 'nothing staged', message };
  }
  git(cwd, ['commit', '-m', message]);
  const hash = git(cwd, ['rev-parse', '--short', 'HEAD']);
  return { committed: true, hash, message, files: staged.split('\n').filter(Boolean) };
}

// ---------------------------------------------------------------------------
// progress.bar
// ---------------------------------------------------------------------------

function progressBar(done, total, width) {
  done = Number(done) || 0;
  total = Number(total) || 0;
  width = Number(width) || 20;
  const ratio = total > 0 ? Math.max(0, Math.min(1, done / total)) : 0;
  const filled = Math.round(ratio * width);
  const bar = '█'.repeat(filled) + '░'.repeat(width - filled);
  const pct = Math.round(ratio * 100);
  return { done, total, percent: pct, bar: `[${bar}] ${pct}%` };
}

// ---------------------------------------------------------------------------
// stats.json — word counts, chapters drafted/verified, promises delivered
// ---------------------------------------------------------------------------

function countWords(text) {
  const m = text.trim().match(/\S+/g);
  return m ? m.length : 0;
}

function manuscriptWordCount(cwd) {
  const dir = core.manuscriptDir(cwd);
  const files = {};
  let total = 0;
  if (core.isDir(dir)) {
    const walk = (d) => {
      for (const name of core.listDir(d)) {
        const full = path.join(d, name);
        if (core.isDir(full)) {
          walk(full);
        } else if (/\.(md|markdown|txt)$/i.test(name)) {
          const words = countWords(core.readFileSafe(full, ''));
          files[path.relative(dir, full)] = words;
          total += words;
        }
      }
    };
    walk(dir);
  }
  return { total, files, dir };
}

function stats(cwd) {
  const words = manuscriptWordCount(cwd);
  const o = outline.analyze(cwd);
  const coverage = promise.coverage(cwd);

  // Chapter draft/verify tallies from chapter dirs.
  const chapters = chapter.list(cwd).map((c) => {
    const st = chapter.state(cwd, c.number);
    return {
      number: st.number,
      slug: st.slug,
      drafted: st.drafted,
      verified: st.verified,
      plan_count: st.plan_count,
    };
  });

  const drafted = chapters.filter((c) => c.drafted).length;
  const verified = chapters.filter((c) => c.verified).length;

  return {
    words: { total: words.total, by_file: words.files },
    chapters: {
      total_outlined: o.chapter_count,
      total_with_dirs: chapters.length,
      drafted,
      verified,
      detail: chapters,
    },
    promises: {
      committed: coverage.committed_count,
      covered: coverage.covered_count,
      delivered: coverage.delivered.length,
      uncovered: coverage.uncovered,
    },
  };
}

module.exports = {
  generateSlug,
  currentTimestamp,
  commit,
  progressBar,
  stats,
  manuscriptWordCount,
  countWords,
};
