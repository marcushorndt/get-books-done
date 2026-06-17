'use strict';

/**
 * core.cjs — shared primitives for gbd-tools.
 *
 * Holds: planning-root resolution, path helpers, safe fs reads, the error
 * code registry, the config defaults, the JSON output formatter (with >50KB
 * spillover to a temp file) and the --pick dot/bracket path resolver.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const PLANNING_DIRNAME = '.book';
const MANUSCRIPT_DIRNAME = 'manuscript';
const CONFIG_FILENAME = 'config.json';
const SPILL_THRESHOLD = 50 * 1024; // 50KB

// ---------------------------------------------------------------------------
// Error registry
// ---------------------------------------------------------------------------

const ERROR = {
  NO_BOOK_ROOT: 'NO_BOOK_ROOT',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  PARSE_ERROR: 'PARSE_ERROR',
  UNKNOWN_VERB: 'UNKNOWN_VERB',
  BAD_ARGS: 'BAD_ARGS',
  INVALID_CONFIG: 'INVALID_CONFIG',
  PICK_FAILED: 'PICK_FAILED',
  GIT_ERROR: 'GIT_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  IO_ERROR: 'IO_ERROR',
};

class GbdError extends Error {
  constructor(code, message, detail) {
    super(message);
    this.name = 'GbdError';
    this.code = code || ERROR.IO_ERROR;
    if (detail !== undefined) this.detail = detail;
  }
}

// ---------------------------------------------------------------------------
// Config defaults — mirrors core/templates/config.json
// ---------------------------------------------------------------------------

const CONFIG_DEFAULTS = {
  version: 1,
  mode: 'interactive',
  book_type: 'fiction',
  granularity: 'standard',
  workflow: {
    research: true,
    plan_check: true,
    verifier: true,
    auto_advance: false,
    discuss_mode: true,
    editorial_review: true,
    continuity_check: true,
    sensitivity_review: false,
    intel_enabled: true,
  },
  prose: {
    pov: 'third-limited',
    tense: 'past',
    target_words: null,
    chapter_target_words: 2500,
    style_locale: 'en-US',
  },
  parallelization: {
    enabled: true,
    max_concurrent_agents: 4,
    min_units_for_parallel: 2,
  },
  gates: {
    confirm_book: true,
    confirm_outline: true,
    confirm_chapter_plan: true,
    confirm_draft: false,
  },
  planning: {
    commit_docs: true,
    manuscript_dir: MANUSCRIPT_DIRNAME,
    planning_dir: PLANNING_DIRNAME,
  },
};

// ---------------------------------------------------------------------------
// Root resolution — walk upward like git does, looking for .book/
// ---------------------------------------------------------------------------

/** Find nearest ancestor directory (inclusive of start) containing .book/. */
function bookRoot(startCwd) {
  let dir = path.resolve(startCwd || process.cwd());
  // Guard against infinite loop at filesystem root.
  for (;;) {
    const candidate = path.join(dir, PLANNING_DIRNAME);
    try {
      if (fs.statSync(candidate).isDirectory()) return dir;
    } catch (_) {
      /* not here, keep walking */
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new GbdError(
    ERROR.NO_BOOK_ROOT,
    `No ${PLANNING_DIRNAME}/ directory found in ${startCwd || process.cwd()} or any parent.`
  );
}

function planningDir(startCwd) {
  return path.join(bookRoot(startCwd), PLANNING_DIRNAME);
}

function manuscriptDir(startCwd) {
  const root = bookRoot(startCwd);
  // Honor a custom manuscript_dir from config if present, else default.
  let dirName = MANUSCRIPT_DIRNAME;
  try {
    const cfgPath = path.join(root, PLANNING_DIRNAME, CONFIG_FILENAME);
    const raw = fs.readFileSync(cfgPath, 'utf8');
    const cfg = JSON.parse(raw);
    if (cfg && cfg.planning && typeof cfg.planning.manuscript_dir === 'string') {
      dirName = cfg.planning.manuscript_dir;
    }
  } catch (_) {
    /* fall back to default */
  }
  return path.join(root, dirName);
}

// ---------------------------------------------------------------------------
// Safe filesystem helpers
// ---------------------------------------------------------------------------

function readFileSafe(filePath, fallback) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    if (fallback !== undefined) return fallback;
    throw new GbdError(ERROR.FILE_NOT_FOUND, `Cannot read file: ${filePath}`, err.message);
  }
}

function fileExists(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch (_) {
    return false;
  }
}

function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch (_) {
    return false;
  }
}

function listDir(p) {
  try {
    return fs.readdirSync(p);
  } catch (_) {
    return [];
  }
}

// ---------------------------------------------------------------------------
// --pick path resolver (dot + [index] / [key])
// ---------------------------------------------------------------------------

/** Tokenize "a.b[0].c" into ['a','b','0','c']. */
function tokenizePath(expr) {
  const tokens = [];
  let buf = '';
  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i];
    if (ch === '.') {
      if (buf !== '') tokens.push(buf);
      buf = '';
    } else if (ch === '[') {
      if (buf !== '') tokens.push(buf);
      buf = '';
      let key = '';
      i++;
      while (i < expr.length && expr[i] !== ']') {
        key += expr[i];
        i++;
      }
      key = key.trim();
      if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
        key = key.slice(1, -1);
      }
      tokens.push(key);
    } else {
      buf += ch;
    }
  }
  if (buf !== '') tokens.push(buf);
  return tokens;
}

function pickPath(value, expr) {
  if (!expr) return value;
  const tokens = tokenizePath(expr);
  let cur = value;
  for (const tok of tokens) {
    if (cur == null) {
      throw new GbdError(ERROR.PICK_FAILED, `Cannot resolve "${expr}": null at "${tok}".`);
    }
    if (Array.isArray(cur) && /^\d+$/.test(tok)) {
      cur = cur[Number(tok)];
    } else if (typeof cur === 'object') {
      cur = cur[tok];
    } else {
      throw new GbdError(ERROR.PICK_FAILED, `Cannot index "${tok}" on a ${typeof cur}.`);
    }
  }
  return cur;
}

// ---------------------------------------------------------------------------
// Output formatter — JSON to stdout, spill big payloads to temp file
// ---------------------------------------------------------------------------

/**
 * Render a result to stdout.
 * @param {*} value         the payload
 * @param {object} opts     { raw, pick }
 *   raw  — print primitives bare (no JSON quoting) for shell consumption
 *   pick — dot/bracket path to extract before printing
 */
function output(value, opts) {
  opts = opts || {};
  let payload = value;
  if (opts.pick) payload = pickPath(payload, opts.pick);

  if (opts.raw && (typeof payload === 'string' || typeof payload === 'number' || typeof payload === 'boolean')) {
    process.stdout.write(String(payload) + '\n');
    return;
  }

  const json = JSON.stringify(payload, null, 2);
  if (Buffer.byteLength(json, 'utf8') > SPILL_THRESHOLD) {
    const tmp = path.join(os.tmpdir(), `gbd-tools-${process.pid}-${Date.now()}.json`);
    fs.writeFileSync(tmp, json, 'utf8');
    process.stdout.write(`@file:${tmp}\n`);
    return;
  }
  process.stdout.write(json + '\n');
}

function emitError(err, jsonErrors) {
  const code = err && err.code ? err.code : ERROR.IO_ERROR;
  const message = err && err.message ? err.message : String(err);
  if (jsonErrors) {
    const obj = { error: true, code, message };
    if (err && err.detail !== undefined) obj.detail = err.detail;
    process.stderr.write(JSON.stringify(obj, null, 2) + '\n');
  } else {
    process.stderr.write(`gbd-tools error [${code}]: ${message}\n`);
  }
}

module.exports = {
  PLANNING_DIRNAME,
  MANUSCRIPT_DIRNAME,
  CONFIG_FILENAME,
  SPILL_THRESHOLD,
  ERROR,
  GbdError,
  CONFIG_DEFAULTS,
  bookRoot,
  planningDir,
  manuscriptDir,
  readFileSafe,
  fileExists,
  isDir,
  listDir,
  pickPath,
  tokenizePath,
  output,
  emitError,
};
