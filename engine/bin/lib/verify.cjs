'use strict';

/**
 * verify.cjs — structural verification verbs (mechanical checks the engine can
 * make without reading prose for meaning; the gbd-verifier agent does the
 * meaning-level read).
 *
 *   verify.plan-structure   — every PLAN.md has must_land + at least one scene
 *   verify.promise-coverage — every committed PROMISE id is advanced by a chapter
 *   verify.references       — @-paths in .book/ docs resolve to real files
 */

const fs = require('fs');
const path = require('path');
const core = require('./core.cjs');
const chapter = require('./chapter.cjs');
const outline = require('./outline.cjs');
const promise = require('./promise.cjs');

/** Each PLAN has must_land (with beats) and at least one "### Scene" block. */
function planStructure(cwd, num) {
  const targets = num != null ? [{ number: chapter.normPrefix(num) }] : chapter.list(cwd);
  const results = [];
  for (const t of targets) {
    const st = chapter.state(cwd, t.number);
    if (!st.exists) {
      results.push({ chapter: st.number, exists: false, issues: ['chapter dir not found'] });
      continue;
    }
    for (const plan of st.plans) {
      const issues = [];
      const ml = plan.must_land;
      if (!ml) issues.push('missing must_land frontmatter');
      else {
        if (!Array.isArray(ml.beats) || ml.beats.length === 0) issues.push('must_land.beats empty');
        if (!ml.turn) issues.push('must_land.turn missing');
      }
      const body = core.readFileSafe(plan.path, '');
      const sceneCount = (body.match(/^###\s+Scene\b/gim) || []).length;
      if (sceneCount === 0) issues.push('no "### Scene" blocks found');
      results.push({
        plan: plan.id,
        path: plan.path,
        scenes: sceneCount,
        has_must_land: !!ml,
        passed: issues.length === 0,
        issues,
      });
    }
  }
  const passed = results.every((r) => r.passed !== false && (!r.issues || r.issues.length === 0));
  return { check: 'plan-structure', passed, results };
}

/**
 * Every committed PROMISE id must be advanced by some chapter — either listed
 * in an OUTLINE chapter's "Promises advanced" or in a PLAN's promises array,
 * or marked covered in the traceability table.
 */
function promiseCoverage(cwd) {
  const cov = promise.coverage(cwd);
  const o = outline.parse(cwd);

  // Build the set of promise ids referenced by any chapter (outline + plans).
  const referenced = new Set();
  for (const ch of o.chapters) for (const id of ch.promises) referenced.add(id);
  for (const c of chapter.list(cwd)) {
    const st = chapter.state(cwd, c.number);
    for (const plan of st.plans) for (const id of plan.promises) referenced.add(id);
  }
  // Traceability-covered ids count too.
  for (const m of cov.mapping) if (m.covered) referenced.add(m.id);

  const uncovered = cov.mapping.filter((m) => !referenced.has(m.id)).map((m) => m.id);

  return {
    check: 'promise-coverage',
    passed: uncovered.length === 0,
    committed: cov.committed_count,
    covered: cov.committed_count - uncovered.length,
    uncovered,
  };
}

/** Collect @-style references (@.book/..., @manuscript/...) and resolve them. */
function references(cwd) {
  const root = core.bookRoot(cwd);
  const planning = core.planningDir(cwd);
  const refRe = /@([A-Za-z0-9_./-]+\.[A-Za-z0-9]+)/g;
  const results = [];

  const scan = (file) => {
    const content = core.readFileSafe(file, '');
    let m;
    while ((m = refRe.exec(content)) !== null) {
      const rel = m[1];
      const resolved = path.resolve(root, rel);
      results.push({ source: file, ref: rel, exists: core.fileExists(resolved) });
    }
  };

  const walk = (d) => {
    for (const name of core.listDir(d)) {
      const full = path.join(d, name);
      if (core.isDir(full)) {
        if (name === 'graphs') continue; // skip JSON graphs
        walk(full);
      } else if (/\.md$/i.test(name)) {
        scan(full);
      }
    }
  };
  if (core.isDir(planning)) walk(planning);

  const broken = results.filter((r) => !r.exists);
  return {
    check: 'references',
    passed: broken.length === 0,
    total: results.length,
    broken: broken.map((b) => ({ source: b.source, ref: b.ref })),
  };
}

module.exports = { planStructure, promiseCoverage, references };
