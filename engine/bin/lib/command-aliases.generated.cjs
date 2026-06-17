'use strict';

/**
 * command-aliases.generated.cjs — the verb manifest.
 *
 * `verbs` is the canonical list of dispatchable verbs (used for help/listing).
 * `aliases` maps alternate spellings to a canonical verb. The `query` subcommand
 * in the entry point routes `gbd-tools query <verb>` through this same table.
 */

const verbs = [
  // config family
  'config-get',
  'config-set',
  'config-validate',
  // book family
  'book.read',
  'book.sections',
  // outline family
  'outline.analyze',
  'outline.parse',
  'outline.next-decimal',
  // promise family
  'promise.parse',
  'promise.coverage',
  'promise.ids',
  // chapter family
  'chapter.state',
  'chapter.must-land',
  'chapter.list',
  // state family
  'state.read',
  'state.add-decision',
  'state.add-blocker',
  'state.record-metric',
  'state.set-position',
  // verify family
  'verify.plan-structure',
  'verify.promise-coverage',
  'verify.references',
  // intel family
  'intel.status',
  'intel.query',
  'intel.open-setups',
  // init family
  'init.progress',
  'init.plan-chapter',
  'init.draft-chapter',
  'init.read-through',
  'init.outline',
  'init.new-book',
  'init.complete-draft',
  // flat utilities
  'generate-slug',
  'current-timestamp',
  'commit',
  'stats.json',
  'progress.bar',
];

const aliases = {
  // convenient short / alternate spellings -> canonical
  'config.get': 'config-get',
  'config.set': 'config-set',
  'config.validate': 'config-validate',
  progress: 'init.progress',
  stats: 'stats.json',
  slug: 'generate-slug',
  timestamp: 'current-timestamp',
  'chapter.mustland': 'chapter.must-land',
  'outline.nextdecimal': 'outline.next-decimal',
};

module.exports = { verbs, aliases };
