// Compare two generated asset sets: validator pass rate, near-miss share, and lexical diversity.
import { readFileSync } from 'node:fs';
import { validate } from './lab.mjs';

const words = (t) => t.toLowerCase().match(/[a-z0-9']+/g) ?? [];
const jaccard = (a, b) => { const A = new Set(a), B = new Set(b); let i = 0; for (const x of A) if (B.has(x)) i++; return i / (A.size + B.size - i); };

export function stats(set, cfg) {
  const r = validate(set, cfg);
  const err = new Map();
  for (const i of r.issues) if (i.severity === 'error') (err.get(i.index) ?? err.set(i.index, []).get(i.index)).push(i);
  const nearMiss = [...err.values()].filter((l) => l.every((i) => i.rule === 'length') && Math.abs(r.assets[l[0].index].chars - (cfg.limits[l[0].type][1])) <= 5).length;
  const ws = set.assets.map((a) => words(a.text));
  let sim = 0, n = 0;
  for (let i = 0; i < ws.length; i++) for (let j = i + 1; j < ws.length; j++) { sim += jaccard(ws[i], ws[j]); n++; }
  const bigrams = new Set(), all = [];
  for (const w of ws) for (let k = 0; k < w.length - 1; k++) { const b = w[k] + ' ' + w[k + 1]; all.push(b); bigrams.add(b); }
  return { assets: set.assets.length, pass: set.assets.length - err.size, fail: err.size, near_miss: nearMiss, mean_pair_jaccard: +(sim / n).toFixed(3), distinct_bigram_ratio: +(bigrams.size / all.length).toFixed(3) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [cfgFile, ...files] = process.argv.slice(2);
  const cfg = JSON.parse(readFileSync(cfgFile, 'utf8'));
  for (const f of files) console.log(f, stats(JSON.parse(readFileSync(f, 'utf8')), cfg));
}
