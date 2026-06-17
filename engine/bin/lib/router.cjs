'use strict';

/**
 * router.cjs — dispatch table mapping verbs to handlers.
 *
 * Each handler is (cwd, args) => result. The generic adapter resolves aliases
 * via the manifest, then calls the matching handler. Family verbs (book.*,
 * outline.*, …) are flat entries in one table — no separate sub-routers needed,
 * which keeps dispatch a single lookup.
 */

const core = require('./core.cjs');
const manifest = require('./command-aliases.generated.cjs');

const config = require('./config.cjs');
const book = require('./book.cjs');
const outline = require('./outline.cjs');
const promise = require('./promise.cjs');
const chapter = require('./chapter.cjs');
const stateLib = require('./state.cjs');
const verify = require('./verify.cjs');
const intel = require('./intel.cjs');
const init = require('./init.cjs');
const commands = require('./commands.cjs');

const HANDLERS = {
  // config
  'config-get': (cwd, a) => config.get(cwd, a[0]),
  'config-set': (cwd, a) => config.set(cwd, a[0], a[1]),
  'config-validate': (cwd) => config.validateProject(cwd),

  // book
  'book.read': (cwd) => book.read(cwd),
  'book.sections': (cwd) => book.sections(cwd),

  // outline
  'outline.analyze': (cwd) => outline.analyze(cwd),
  'outline.parse': (cwd) => outline.parse(cwd),
  'outline.next-decimal': (cwd, a) => ({ next: outline.nextDecimal(cwd, a[0]) }),

  // promise
  'promise.parse': (cwd) => promise.parse(cwd),
  'promise.coverage': (cwd) => promise.coverage(cwd),
  'promise.ids': (cwd) => promise.ids(cwd),

  // chapter
  'chapter.state': (cwd, a) => chapter.state(cwd, requireArg(a[0], 'chapter number')),
  'chapter.must-land': (cwd, a) => chapter.mustLand(cwd, requireArg(a[0], 'chapter number')),
  'chapter.list': (cwd) => chapter.list(cwd),

  // state
  'state.read': (cwd) => stateLib.read(cwd),
  'state.add-decision': (cwd, a) => stateLib.addDecision(cwd, a.join(' ')),
  'state.add-blocker': (cwd, a) => stateLib.addBlocker(cwd, a.join(' ')),
  'state.record-metric': (cwd, a) => stateLib.recordMetric(cwd, a[0], a.slice(1).join(' ')),
  'state.set-position': (cwd, a) => stateLib.setPosition(cwd, a[0], a.slice(1).join(' ')),

  // verify
  'verify.plan-structure': (cwd, a) => verify.planStructure(cwd, a[0]),
  'verify.promise-coverage': (cwd) => verify.promiseCoverage(cwd),
  'verify.references': (cwd) => verify.references(cwd),

  // intel
  'intel.status': (cwd) => intel.status(cwd),
  'intel.query': (cwd, a) => intel.query(cwd, a[0]),
  'intel.open-setups': (cwd) => intel.openSetups(cwd),

  // init
  'init.progress': (cwd) => init.progress(cwd),
  'init.plan-chapter': (cwd, a) => init.planChapter(cwd, requireArg(a[0], 'chapter number')),
  'init.draft-chapter': (cwd, a) => init.draftChapter(cwd, requireArg(a[0], 'chapter number')),
  'init.read-through': (cwd, a) => init.readThrough(cwd, requireArg(a[0], 'chapter number')),
  'init.outline': (cwd) => init.outline(cwd),
  'init.new-book': (cwd) => init.newBook(cwd),
  'init.complete-draft': (cwd) => init.completeDraft(cwd),

  // flat utilities
  'generate-slug': (cwd, a) => commands.generateSlug(a.join(' ')),
  'current-timestamp': (cwd, a) => ({ timestamp: commands.currentTimestamp(a[0]) }),
  commit: (cwd, a) => commands.commit(cwd, a[0], a.slice(1)),
  'stats.json': (cwd) => commands.stats(cwd),
  'progress.bar': (cwd, a) => commands.progressBar(a[0], a[1], a[2]),
};

function requireArg(v, name) {
  if (v == null || v === '') throw new core.GbdError(core.ERROR.BAD_ARGS, `Missing argument: ${name}`);
  return v;
}

function resolveVerb(verb) {
  if (HANDLERS[verb]) return verb;
  if (manifest.aliases[verb]) return manifest.aliases[verb];
  return null;
}

function dispatch(verb, cwd, args) {
  const canonical = resolveVerb(verb);
  if (!canonical) {
    throw new core.GbdError(core.ERROR.UNKNOWN_VERB, `Unknown verb: ${verb}`, { known: manifest.verbs });
  }
  return HANDLERS[canonical](cwd, args || []);
}

module.exports = { dispatch, resolveVerb, HANDLERS, verbs: manifest.verbs, aliases: manifest.aliases };
