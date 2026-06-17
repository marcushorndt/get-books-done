#!/usr/bin/env node
'use strict';

/**
 * gbd-tools — engine entry point for the GBD (Get Books Done) framework.
 *
 * Grammar:
 *   gbd-tools <verb> [args...] [--raw] [--pick <path>] [--cwd <dir>] [--json-errors]
 *   gbd-tools query <verb> [args...]      (alias form)
 *   gbd-tools help                        (list verbs)
 *
 * Output: JSON to stdout. Payloads >50KB spill to a temp file and print
 * `@file:<path>`. --pick extracts a dot/bracket field. Errors go to stderr;
 * with --json-errors they are emitted as a typed JSON object.
 */

const core = require('./lib/core.cjs');
const router = require('./lib/router.cjs');

function parseArgv(argv) {
  const positional = [];
  const flags = { raw: false, pick: null, cwd: process.cwd(), jsonErrors: false };
  for (let i = 0; i < argv.length; i++) {
    const tok = argv[i];
    switch (tok) {
      case '--raw':
        flags.raw = true;
        break;
      case '--pick':
        flags.pick = argv[++i];
        break;
      case '--cwd':
        flags.cwd = argv[++i];
        break;
      case '--json-errors':
        flags.jsonErrors = true;
        break;
      default:
        if (tok.startsWith('--pick=')) flags.pick = tok.slice(7);
        else if (tok.startsWith('--cwd=')) flags.cwd = tok.slice(6);
        else positional.push(tok);
    }
  }
  return { positional, flags };
}

function printHelp() {
  const lines = ['gbd-tools — verbs:', ''];
  for (const v of router.verbs) lines.push(`  ${v}`);
  lines.push('', 'Aliases:');
  for (const [a, c] of Object.entries(router.aliases)) lines.push(`  ${a} -> ${c}`);
  lines.push('', 'Flags: --raw  --pick <path>  --cwd <dir>  --json-errors');
  lines.push('Forms: gbd-tools <verb> [args]   |   gbd-tools query <verb> [args]');
  process.stdout.write(lines.join('\n') + '\n');
}

function main() {
  const rawArgv = process.argv.slice(2);
  const { positional, flags } = parseArgv(rawArgv);

  if (positional.length === 0 || positional[0] === 'help' || positional[0] === '--help' || positional[0] === '-h') {
    printHelp();
    return 0;
  }

  // `query` alias: shift it off and treat next token as the verb.
  let verb = positional[0];
  let args = positional.slice(1);
  if (verb === 'query') {
    verb = args[0];
    args = args.slice(1);
    if (!verb) {
      core.emitError(new core.GbdError(core.ERROR.BAD_ARGS, 'query requires a verb'), flags.jsonErrors);
      return 2;
    }
  }

  try {
    const result = router.dispatch(verb, flags.cwd, args);
    core.output(result, { raw: flags.raw, pick: flags.pick });
    return 0;
  } catch (err) {
    core.emitError(err, flags.jsonErrors);
    if (err && err.code === core.ERROR.UNKNOWN_VERB) return 2;
    return 1;
  }
}

process.exit(main());
