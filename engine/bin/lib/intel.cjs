'use strict';

/**
 * intel.cjs — read .book/graphs/continuity-graph.json (the story bible's
 * machine-readable index). Read-only; the gbd-intel-updater agent writes it.
 *
 * Expected shape (flexible — we degrade gracefully):
 * {
 *   "entities": [ { "id", "name", "type", "appearances": ["ch01", ...], ... } ],
 *   "setups":   [ { "id", "description", "opened_in", "paid_in"|null } ],
 *   "relations": [ ... ]
 * }
 */

const path = require('path');
const core = require('./core.cjs');

function graphPath(cwd) {
  return path.join(core.planningDir(cwd), 'graphs', 'continuity-graph.json');
}

function load(cwd) {
  const p = graphPath(cwd);
  if (!core.fileExists(p)) {
    return { exists: false, path: p, entities: [], setups: [], relations: [] };
  }
  let data;
  try {
    data = JSON.parse(core.readFileSafe(p));
  } catch (err) {
    throw new core.GbdError(core.ERROR.PARSE_ERROR, `Invalid JSON in ${p}`, err.message);
  }
  return {
    exists: true,
    path: p,
    entities: Array.isArray(data.entities) ? data.entities : [],
    setups: Array.isArray(data.setups) ? data.setups : [],
    relations: Array.isArray(data.relations) ? data.relations : [],
    meta: data.meta || null,
  };
}

/** intel.status — graph presence + headline counts. */
function status(cwd) {
  const g = load(cwd);
  const openSetups = g.setups.filter((s) => !s.paid_in).length;
  return {
    exists: g.exists,
    path: g.path,
    entity_count: g.entities.length,
    setup_count: g.setups.length,
    open_setups: openSetups,
    relation_count: g.relations.length,
    meta: g.meta || null,
  };
}

/** intel.query <entity> — find an entity by id or name (case-insensitive). */
function query(cwd, term) {
  if (!term) throw new core.GbdError(core.ERROR.BAD_ARGS, 'intel.query requires an entity');
  const g = load(cwd);
  const t = String(term).toLowerCase();
  const matches = g.entities.filter(
    (e) =>
      (e.id && String(e.id).toLowerCase() === t) ||
      (e.name && String(e.name).toLowerCase().includes(t))
  );
  // Setups mentioning the entity.
  const relatedSetups = g.setups.filter(
    (s) => JSON.stringify(s).toLowerCase().includes(t)
  );
  return { query: term, found: matches.length, entities: matches, related_setups: relatedSetups };
}

/** intel.open-setups — setups opened but not yet paid off. */
function openSetups(cwd) {
  const g = load(cwd);
  const open = g.setups.filter((s) => !s.paid_in);
  return { count: open.length, setups: open };
}

module.exports = { load, status, query, openSetups, graphPath };
