'use strict';

/**
 * init.cjs — compound context objects. Each verb returns a SINGLE JSON blob
 * with everything a workflow needs in one call: resolved config flags, paths,
 * chapter state, promises, position, etc. Mirrors GSD's init.* family.
 */

const path = require('path');
const core = require('./core.cjs');
const config = require('./config.cjs');
const book = require('./book.cjs');
const outline = require('./outline.cjs');
const promise = require('./promise.cjs');
const chapter = require('./chapter.cjs');
const stateLib = require('./state.cjs');
const intel = require('./intel.cjs');
const commands = require('./commands.cjs');

function basePaths(cwd) {
  const root = core.bookRoot(cwd);
  const planning = core.planningDir(cwd);
  return {
    root,
    planning,
    manuscript: core.manuscriptDir(cwd),
    config: path.join(planning, core.CONFIG_FILENAME),
    book: path.join(planning, 'BOOK.md'),
    outline: path.join(planning, 'OUTLINE.md'),
    promise: path.join(planning, 'PROMISE.md'),
    state: path.join(planning, 'STATE.md'),
    bible: path.join(planning, 'bible'),
    research: path.join(planning, 'research'),
    reviews: path.join(planning, 'reviews'),
    graphs: path.join(planning, 'graphs'),
    chapters: path.join(planning, 'chapters'),
  };
}

function commonContext(cwd) {
  const cfg = config.load(cwd);
  return {
    config: cfg,
    paths: basePaths(cwd),
    position: stateLib.read(cwd).position,
  };
}

/** init.progress — where the book stands + what's next. */
function progress(cwd) {
  const ctx = commonContext(cwd);
  const o = outline.analyze(cwd);
  const cov = promise.coverage(cwd);
  const st = stateLib.read(cwd);

  const chapters = chapter.list(cwd).map((c) => {
    const cs = chapter.state(cwd, c.number);
    return { number: cs.number, slug: cs.slug, drafted: cs.drafted, verified: cs.verified, plan_count: cs.plan_count };
  });
  const drafted = chapters.filter((c) => c.drafted).length;
  const verified = chapters.filter((c) => c.verified).length;

  // Recommend the next action.
  let next = null;
  const firstUndrafted = chapters.find((c) => !c.drafted && c.plan_count > 0);
  const firstUnplanned = o.chapters.find((c) => !chapters.some((x) => x.number === chapter.normPrefix(c.number) && x.plan_count > 0));
  if (firstUndrafted) next = { command: `/gbd-draft-chapter ${Number(firstUndrafted.number)}`, why: 'chapter planned but not drafted' };
  else if (firstUnplanned) next = { command: `/gbd-plan-chapter ${Number(firstUnplanned.number)}`, why: 'chapter outlined but not planned' };
  else if (o.chapter_count === 0) next = { command: '/gbd-outline', why: 'no chapters outlined yet' };
  else next = { command: '/gbd-stats', why: 'all known chapters drafted' };

  return {
    verb: 'init.progress',
    config: ctx.config,
    paths: ctx.paths,
    position: st.position,
    outline: { chapter_count: o.chapter_count, status_counts: o.status_counts },
    chapters,
    counts: { outlined: o.chapter_count, with_dirs: chapters.length, drafted, verified },
    promises: { committed: cov.committed_count, covered: cov.covered_count, uncovered: cov.uncovered, delivered: cov.delivered },
    next,
  };
}

/** init.plan-chapter <N> — everything the planner workflow needs. */
function planChapter(cwd, num) {
  if (num == null) throw new core.GbdError(core.ERROR.BAD_ARGS, 'init.plan-chapter requires a chapter number');
  const ctx = commonContext(cwd);
  const o = outline.parse(cwd);
  const cs = chapter.state(cwd, num);
  const prefix = chapter.normPrefix(num);
  const outlineEntry = o.chapters.find((c) => chapter.normPrefix(c.number) === prefix) || null;
  const promiseIds = outlineEntry ? outlineEntry.promises : [];
  const pdata = promise.parse(cwd);
  const relevantPromises = pdata.committed.filter((p) => promiseIds.includes(p.id));

  return {
    verb: 'init.plan-chapter',
    chapter: cs.number,
    config: ctx.config,
    paths: ctx.paths,
    outline_entry: outlineEntry,
    chapter_state: cs,
    has_context: cs.artifacts.context,
    has_research: cs.artifacts.research,
    promises: relevantPromises,
    flags: {
      research: ctx.config.workflow.research,
      plan_check: ctx.config.workflow.plan_check,
      discuss_mode: ctx.config.workflow.discuss_mode,
    },
  };
}

/** init.draft-chapter <N> — drafter workflow context (plans + waves). */
function draftChapter(cwd, num) {
  if (num == null) throw new core.GbdError(core.ERROR.BAD_ARGS, 'init.draft-chapter requires a chapter number');
  const ctx = commonContext(cwd);
  const cs = chapter.state(cwd, num);

  // Group plans into waves for parallel drafting.
  const waves = {};
  for (const plan of cs.plans) {
    const w = plan.wave != null ? plan.wave : 1;
    (waves[w] = waves[w] || []).push(plan.id);
  }

  return {
    verb: 'init.draft-chapter',
    chapter: cs.number,
    config: ctx.config,
    paths: ctx.paths,
    chapter_state: cs,
    plans: cs.plans,
    waves,
    flags: {
      verifier: ctx.config.workflow.verifier,
      parallelization: ctx.config.parallelization.enabled,
      max_concurrent: ctx.config.parallelization.max_concurrent_agents,
    },
  };
}

/** init.read-through <N> — verification workflow context. */
function readThrough(cwd, num) {
  if (num == null) throw new core.GbdError(core.ERROR.BAD_ARGS, 'init.read-through requires a chapter number');
  const ctx = commonContext(cwd);
  const cs = chapter.state(cwd, num);
  const mustLand = cs.plans.map((p) => ({ plan: p.id, must_land: p.must_land, promises: p.promises }));

  return {
    verb: 'init.read-through',
    chapter: cs.number,
    config: ctx.config,
    paths: ctx.paths,
    chapter_state: cs,
    drafted: cs.drafted,
    has_verification: cs.artifacts.verification,
    must_land: mustLand,
  };
}

/** init.outline — outline workflow context. */
function outlineCtx(cwd) {
  const ctx = commonContext(cwd);
  const o = outline.analyze(cwd);
  const cov = promise.coverage(cwd);
  const b = book.read(cwd);
  return {
    verb: 'init.outline',
    config: ctx.config,
    paths: ctx.paths,
    book: { exists: b.exists, title: b.title, sections: b.sections.map((s) => s.heading) },
    outline: o,
    promise_coverage: cov,
  };
}

/** init.new-book — onboarding context (what exists, what's missing). */
function newBook(cwd) {
  // bookRoot may not exist yet — resolve from raw cwd, fall back to cwd.
  let paths;
  let hasBook = false;
  try {
    paths = basePaths(cwd);
    hasBook = core.fileExists(paths.book);
  } catch (_) {
    const root = path.resolve(cwd || process.cwd());
    paths = {
      root,
      planning: path.join(root, core.PLANNING_DIRNAME),
      manuscript: path.join(root, core.MANUSCRIPT_DIRNAME),
    };
  }
  const exists = {};
  for (const k of Object.keys(paths)) exists[k] = core.fileExists(paths[k]);
  return {
    verb: 'init.new-book',
    paths,
    exists,
    has_book: hasBook,
    config_defaults: core.CONFIG_DEFAULTS,
  };
}

/** init.complete-draft — draft-completion gate context. */
function completeDraft(cwd) {
  const ctx = commonContext(cwd);
  const o = outline.analyze(cwd);
  const cov = promise.coverage(cwd);
  const stats = commands.stats(cwd);
  const st = stateLib.read(cwd);

  const draftLabel = st.position.draft || (o.chapters.length ? 'unknown' : 'zero');
  const undrafted = stats.chapters.detail.filter((c) => !c.drafted).map((c) => c.number);
  const unverified = stats.chapters.detail.filter((c) => c.drafted && !c.verified).map((c) => c.number);

  return {
    verb: 'init.complete-draft',
    config: ctx.config,
    paths: ctx.paths,
    current_draft: draftLabel,
    stats,
    promises: { uncovered: cov.uncovered, delivered: cov.delivered },
    gaps: { undrafted, unverified },
    ready: undrafted.length === 0 && cov.uncovered.length === 0,
    next_draft: nextDraftStage(draftLabel),
  };
}

function nextDraftStage(current) {
  const order = ['zero', 'first', 'revision', 'polish'];
  const idx = order.indexOf(String(current).toLowerCase());
  if (idx === -1 || idx === order.length - 1) return null;
  return order[idx + 1];
}

module.exports = {
  progress,
  planChapter,
  draftChapter,
  readThrough,
  outline: outlineCtx,
  newBook,
  completeDraft,
};
