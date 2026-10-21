// Config-driven validator and tagger. Every brand rule lives in the brand config passed as the first argument (config/brand.json is the sample).
// Usage: node lab.mjs validate <config.json> <assets.json> | node lab.mjs tag <config.json> <texts.json>
import { readFileSync } from 'node:fs';

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const phraseRe = (p) => new RegExp('\\b' + escapeRegExp(p) + '\\b', 'i');

export function validate(input, cfg) {
  const issues = [];
  const counts = {};
  const assets = [];
  const seen = new Map();
  const prule = cfg.placement_rules?.[input.placement] || {};
  const placementRe = prule.forbid_pattern ? new RegExp(prule.forbid_pattern, 'i') : null;
  const filler = new Set((cfg.filler_words || []).map((w) => String(w).toLowerCase()));
  const tails = {}; // type -> last word -> asset indexes
  const lastWord = (t) => (t.toLowerCase().match(/[\p{L}\p{N}']+(?=[^\p{L}\p{N}']*$)/u) || [''])[0];

  (input.assets || []).forEach((asset, idx) => {
    const { type, text } = asset;
    const branded = asset.tags?.branded === true;
    counts[type] = (counts[type] || 0) + 1;
    const chars = [...text].length;
    let ok = true;
    const add = (rule, severity, detail) => {
      issues.push({ index: idx, type, text, rule, severity, detail });
      if (severity === 'error') ok = false;
    };

    const lim = prule.limits?.[type] || cfg.limits?.[type];
    if (lim && (chars < lim[0] || chars > lim[1])) add('length', 'error', `${chars} chars (need ${lim[0]}-${lim[1]})`);
    if (cfg.no_dashes && /[–—]/.test(text)) add('dash', 'error', 'em/en dash');
    if (cfg.no_emoji && /\p{Extended_Pictographic}/u.test(text)) add('emoji', 'error', 'emoji');
    for (const p of cfg.banned || []) if (p && phraseRe(p).test(text)) add('banned', 'error', `"${p}"`);
    for (const p of cfg.urgency || []) if (p && phraseRe(p).test(text)) add('urgency', 'error', `"${p}"`);
    // Google Ads editorial policy rejects punctuation repeated in a row, like "flowers!!".
    if (cfg.no_repeated_punctuation && /[!?]{2,}|([.,;:*])\1/.test(text)) add('punctuation', 'error', 'repeated punctuation');
    // Padding: a filler word tacked on the end to reach a length ("...in 2 days fast always.").
    const tail = lastWord(text);
    if (filler.has(tail)) add('filler', 'error', `"${tail}"`);
    if (tail) ((tails[type] ||= {})[tail] ||= []).push(idx);
    if (placementRe?.test(text)) add('placement', 'error', `not allowed in ${input.placement}`);
    if (cfg.require_number && !branded && !/\d/.test(text)) add('no_number', 'warn', 'no number');
    const key = type + '|' + text.trim().toLowerCase();
    if (seen.has(key)) add('duplicate', 'error', `duplicate of #${seen.get(key)}`);
    else seen.set(key, idx);
    assets.push({ index: idx, type, text, chars, ok });
  });

  // Same last word on many lines of one type reads as padding; a warning, since a product noun can repeat on purpose.
  const most = cfg.max_same_ending;
  if (Number.isInteger(most) && most > 0) {
    for (const [type, words] of Object.entries(tails)) {
      for (const [w, idxs] of Object.entries(words)) {
        if (idxs.length <= most || filler.has(w)) continue;
        for (const index of idxs) issues.push({ index, type, text: input.assets[index].text, rule: 'same_ending', severity: 'warn', detail: `"${w}" ends ${idxs.length} lines` });
      }
    }
  }

  const expected = cfg.expected_counts || {};
  for (const type of new Set([...Object.keys(counts), ...Object.keys(expected)])) {
    if ((counts[type] || 0) !== expected[type]) {
      issues.push({ index: -1, type, text: '', rule: 'count', severity: 'warn', detail: `expected ${expected[type]}, found ${counts[type] || 0}` });
    }
  }
  const errors = issues.filter((i) => i.severity === 'error').length;
  return { ok: errors === 0, counts, errors, warnings: issues.length - errors, issues, assets };
}

export function tag(text, cfg) {
  const t = cfg.tags || {};
  const hit = (t.angle || []).find(([, src]) => new RegExp(src, 'i').test(text));
  const out = { angle: hit ? hit[0] : t.default_angle || 'generic' };
  for (const [flag, src] of Object.entries(t.flags || {})) out[flag] = new RegExp(src, 'i').test(text) ? 'yes' : 'no';
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [cmd, cfgPath, dataPath] = process.argv.slice(2);
  const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'));
  const data = JSON.parse(readFileSync(dataPath, 'utf8'));
  if (cmd === 'validate') {
    const res = validate(data, cfg);
    console.log(JSON.stringify(res, null, 2));
    process.exit(res.ok ? 0 : 1);
  } else if (cmd === 'tag') {
    console.log(JSON.stringify(data.filter((s) => typeof s === 'string' && s).map((text) => ({ text, tags: tag(text, cfg) }))));
  } else {
    console.error('Usage: node lab.mjs validate|tag <config.json> <data.json>');
    process.exit(2);
  }
}
