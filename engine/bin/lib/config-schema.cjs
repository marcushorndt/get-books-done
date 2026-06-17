'use strict';

/**
 * config-schema.cjs — the validation schema for .book/config.json.
 *
 * Mirrors the exact key set of core/templates/config.json plus a small set of
 * dynamic regex patterns for the value-constrained fields. Validation rejects
 * unknown keys (typo protection) and bad values.
 */

// Exact set of valid dotted keys (leaf paths) the config may carry.
const VALID_KEYS = new Set([
  'version',
  'mode',
  'book_type',
  'granularity',
  'workflow.research',
  'workflow.plan_check',
  'workflow.verifier',
  'workflow.auto_advance',
  'workflow.discuss_mode',
  'workflow.editorial_review',
  'workflow.continuity_check',
  'workflow.sensitivity_review',
  'workflow.intel_enabled',
  'prose.pov',
  'prose.tense',
  'prose.target_words',
  'prose.chapter_target_words',
  'prose.style_locale',
  'parallelization.enabled',
  'parallelization.max_concurrent_agents',
  'parallelization.min_units_for_parallel',
  'gates.confirm_book',
  'gates.confirm_outline',
  'gates.confirm_chapter_plan',
  'gates.confirm_draft',
  'planning.commit_docs',
  'planning.manuscript_dir',
  'planning.planning_dir',
]);

// Dynamic value constraints. type is one of: bool, int, string, enum,
// int_or_null. enum carries `values`. string carries optional `pattern`.
const KEY_RULES = {
  version: { type: 'int' },
  mode: { type: 'enum', values: ['interactive', 'autonomous', 'yolo'] },
  book_type: { type: 'enum', values: ['fiction', 'nonfiction', 'general'] },
  granularity: { type: 'enum', values: ['fine', 'standard', 'coarse'] },

  'workflow.research': { type: 'bool' },
  'workflow.plan_check': { type: 'bool' },
  'workflow.verifier': { type: 'bool' },
  'workflow.auto_advance': { type: 'bool' },
  'workflow.discuss_mode': { type: 'bool' },
  'workflow.editorial_review': { type: 'bool' },
  'workflow.continuity_check': { type: 'bool' },
  'workflow.sensitivity_review': { type: 'bool' },
  'workflow.intel_enabled': { type: 'bool' },

  'prose.pov': { type: 'string' },
  'prose.tense': { type: 'enum', values: ['past', 'present', 'future', 'mixed'] },
  'prose.target_words': { type: 'int_or_null' },
  'prose.chapter_target_words': { type: 'int_or_null' },
  'prose.style_locale': { type: 'string', pattern: /^[a-z]{2}(-[A-Z]{2})?$/ },

  'parallelization.enabled': { type: 'bool' },
  'parallelization.max_concurrent_agents': { type: 'int' },
  'parallelization.min_units_for_parallel': { type: 'int' },

  'gates.confirm_book': { type: 'bool' },
  'gates.confirm_outline': { type: 'bool' },
  'gates.confirm_chapter_plan': { type: 'bool' },
  'gates.confirm_draft': { type: 'bool' },

  'planning.commit_docs': { type: 'bool' },
  'planning.manuscript_dir': { type: 'string', pattern: /^[A-Za-z0-9_./-]+$/ },
  'planning.planning_dir': { type: 'string', pattern: /^[A-Za-z0-9_./-]+$/ },
};

/** Flatten a config object into dotted leaf paths. */
function flatten(obj, prefix, acc) {
  acc = acc || {};
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      flatten(v, key, acc);
    } else {
      acc[key] = v;
    }
  }
  return acc;
}

function validateValue(key, value) {
  const rule = KEY_RULES[key];
  if (!rule) return null; // no value rule -> accept
  switch (rule.type) {
    case 'bool':
      if (typeof value !== 'boolean') return `${key} must be a boolean`;
      return null;
    case 'int':
      if (!Number.isInteger(value)) return `${key} must be an integer`;
      return null;
    case 'int_or_null':
      if (value !== null && !Number.isInteger(value)) return `${key} must be an integer or null`;
      return null;
    case 'string':
      if (typeof value !== 'string') return `${key} must be a string`;
      if (rule.pattern && !rule.pattern.test(value)) return `${key} does not match ${rule.pattern}`;
      return null;
    case 'enum':
      if (!rule.values.includes(value)) return `${key} must be one of ${rule.values.join(', ')}`;
      return null;
    default:
      return null;
  }
}

/** Validate a merged config object. Returns { valid, errors: [] }. */
function validate(config) {
  const errors = [];
  const flat = flatten(config);
  for (const key of Object.keys(flat)) {
    if (!VALID_KEYS.has(key)) {
      errors.push(`Unknown config key: ${key}`);
      continue;
    }
    const err = validateValue(key, flat[key]);
    if (err) errors.push(err);
  }
  return { valid: errors.length === 0, errors };
}

module.exports = { VALID_KEYS, KEY_RULES, flatten, validate, validateValue };
