'use strict';

/**
 * chapter.cjs — discover and scan a chapter directory.
 *
 * A chapter lives at .book/chapters/NN-slug/. Within it:
 *   NN-CONTEXT.md, NN-RESEARCH.md, NN-VERIFICATION.md, NN-READTHROUGH.md
 *   NN-NN-PLAN.md (beat sheets), NN-NN-SUMMARY.md (post-draft)
 *
 * chapter.state returns the full picture: which artifacts exist, the plan
 * index (with `wave`), and must_land extracted from each PLAN frontmatter.
 */

const fs = require('fs');
const path = require('path');
const core = require('./core.cjs');
const fm = require('./frontmatter.cjs');

function chaptersDir(cwd) {
  return path.join(core.planningDir(cwd), 'chapters');
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

/** Normalize a chapter argument ("3", "03", "3.1") to its dir prefix "03". */
function normPrefix(num) {
  const intPart = String(num).split('.')[0];
  return pad2(intPart);
}

/** Find the chapter dir whose name starts with NN-. */
function findDir(cwd, num) {
  const base = chaptersDir(cwd);
  if (!core.isDir(base)) return null;
  const prefix = normPrefix(num);
  const match = core
    .listDir(base)
    .filter((name) => core.isDir(path.join(base, name)))
    .find((name) => name === prefix || name.startsWith(prefix + '-'));
  return match ? path.join(base, match) : null;
}

/** Scan a single chapter; returns full state object. */
function state(cwd, num) {
  const dir = findDir(cwd, num);
  const prefix = normPrefix(num);
  if (!dir) {
    return {
      number: prefix,
      exists: false,
      dir: null,
      slug: null,
      artifacts: {},
      plans: [],
      drafted: false,
      verified: false,
    };
  }

  const dirName = path.basename(dir);
  const slug = dirName.slice(prefix.length).replace(/^-/, '') || null;
  const files = core.listDir(dir);

  const has = (suffix) => files.some((f) => f === `${prefix}-${suffix}`);
  const artifacts = {
    context: has('CONTEXT.md'),
    research: has('RESEARCH.md'),
    verification: has('VERIFICATION.md'),
    readthrough: has('READTHROUGH.md'),
  };

  // Plans + summaries: NN-MM-PLAN.md / NN-MM-SUMMARY.md
  const planFiles = files
    .filter((f) => new RegExp(`^${prefix}-(\\d+)-PLAN\\.md$`).test(f))
    .sort();

  const plans = planFiles.map((file) => {
    const m = file.match(new RegExp(`^${prefix}-(\\d+)-PLAN\\.md$`));
    const planNum = m[1];
    const planPath = path.join(dir, file);
    const front = fm.parse(core.readFileSafe(planPath, ''));
    const summaryFile = `${prefix}-${planNum}-SUMMARY.md`;
    const summaryPath = path.join(dir, summaryFile);
    const hasSummary = files.includes(summaryFile);

    let summary = null;
    if (hasSummary) {
      summary = fm.parse(core.readFileSafe(summaryPath, ''));
    }

    return {
      plan: planNum,
      id: `${prefix}-${planNum}`,
      path: planPath,
      wave: front.wave != null ? front.wave : null,
      type: front.type || null,
      mode: front.mode || null,
      pov: front.pov || null,
      target_words: front.target_words != null ? front.target_words : null,
      depends_on: Array.isArray(front.depends_on) ? front.depends_on : [],
      promises: Array.isArray(front.promises) ? front.promises : [],
      must_land: front.must_land || null,
      summary: summary
        ? {
            path: summaryPath,
            words: summary.words != null ? summary.words : null,
            scenes: summary.scenes != null ? summary.scenes : null,
            pov: summary.pov || null,
          }
        : null,
      drafted: hasSummary,
    };
  });

  const drafted = plans.length > 0 && plans.every((p) => p.drafted);
  const verified = artifacts.verification;

  return {
    number: prefix,
    exists: true,
    dir,
    slug,
    artifacts,
    plans,
    plan_count: plans.length,
    drafted,
    verified,
  };
}

/** must_land across all plans of a chapter. */
function mustLand(cwd, num) {
  const st = state(cwd, num);
  return st.plans.map((p) => ({ plan: p.id, must_land: p.must_land, promises: p.promises }));
}

/** List all chapter dirs that exist. */
function list(cwd) {
  const base = chaptersDir(cwd);
  if (!core.isDir(base)) return [];
  return core
    .listDir(base)
    .filter((name) => /^\d+/.test(name) && core.isDir(path.join(base, name)))
    .sort()
    .map((name) => {
      const m = name.match(/^(\d+)-?(.*)$/);
      return { number: m[1], slug: m[2] || null, dir: path.join(base, name) };
    });
}

module.exports = { state, mustLand, findDir, list, chaptersDir, normPrefix };
