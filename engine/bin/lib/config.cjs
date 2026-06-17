'use strict';

/**
 * config.cjs — load/merge/get/set .book/config.json.
 *
 * Project config is loaded and deep-merged OVER CONFIG_DEFAULTS so a partial
 * project config still produces a complete, valid config object.
 */

const fs = require('fs');
const path = require('path');
const core = require('./core.cjs');
const schema = require('./config-schema.cjs');

function deepMerge(base, over) {
  const out = Array.isArray(base) ? base.slice() : Object.assign({}, base);
  if (!over || typeof over !== 'object') return out;
  for (const k of Object.keys(over)) {
    const bv = out[k];
    const ov = over[k];
    if (bv && typeof bv === 'object' && !Array.isArray(bv) && ov && typeof ov === 'object' && !Array.isArray(ov)) {
      out[k] = deepMerge(bv, ov);
    } else {
      out[k] = ov;
    }
  }
  return out;
}

function configPath(cwd) {
  return path.join(core.planningDir(cwd), core.CONFIG_FILENAME);
}

/** Load the project config merged over defaults. */
function load(cwd) {
  const cfgPath = configPath(cwd);
  let project = {};
  if (core.fileExists(cfgPath)) {
    const raw = core.readFileSafe(cfgPath);
    try {
      project = JSON.parse(raw);
    } catch (err) {
      throw new core.GbdError(core.ERROR.PARSE_ERROR, `Invalid JSON in ${cfgPath}`, err.message);
    }
  }
  return deepMerge(core.CONFIG_DEFAULTS, project);
}

/** config-get [key] — return full config, or a dotted leaf/section. */
function get(cwd, key) {
  const cfg = load(cwd);
  if (!key) return cfg;
  return core.pickPath(cfg, key);
}

function coerce(raw) {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (raw === 'null') return null;
  if (/^-?\d+$/.test(raw)) return Number(raw);
  if (/^-?\d*\.\d+$/.test(raw)) return Number(raw);
  return raw;
}

/** config-set <key> <value> — write to the project config (creating it). */
function set(cwd, key, rawValue) {
  if (!key) throw new core.GbdError(core.ERROR.BAD_ARGS, 'config-set requires a key');
  const value = coerce(rawValue);

  const cfgPath = configPath(cwd);
  let project = {};
  if (core.fileExists(cfgPath)) {
    try {
      project = JSON.parse(core.readFileSafe(cfgPath));
    } catch (err) {
      throw new core.GbdError(core.ERROR.PARSE_ERROR, `Invalid JSON in ${cfgPath}`, err.message);
    }
  }

  // Set the dotted path on the project object.
  const parts = key.split('.');
  let cur = project;
  for (let i = 0; i < parts.length - 1; i++) {
    if (typeof cur[parts[i]] !== 'object' || cur[parts[i]] === null) cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;

  // Validate the resulting merged config before persisting.
  const merged = deepMerge(core.CONFIG_DEFAULTS, project);
  const res = schema.validate(merged);
  if (!res.valid) {
    throw new core.GbdError(core.ERROR.INVALID_CONFIG, `Invalid config after set`, res.errors);
  }

  fs.mkdirSync(path.dirname(cfgPath), { recursive: true });
  fs.writeFileSync(cfgPath, JSON.stringify(project, null, 2) + '\n', 'utf8');
  return { key, value, written: cfgPath };
}

function validateProject(cwd) {
  const cfg = load(cwd);
  return schema.validate(cfg);
}

module.exports = { load, get, set, validateProject, deepMerge, configPath };
