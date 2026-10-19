// Converts a Google Ads UI asset report export (CSV or UTF-16 "Excel CSV") into the rows.json shape tag_report.mjs reads.
// Zero npm deps. Exports parseCsv/detectDelimiter/toNumber/importRows; CLI: node scripts/import_ads_csv.mjs <export.csv> <outdir>

import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export function parseCsv(text, delimiter) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows = [];
  let row = [], field = '', inQuotes = false, started = false;
  const pushField = () => { row.push(field); field = ''; started = false; };
  const pushRow = () => { pushField(); if (!(row.length === 1 && row[0] === '')) rows.push(row); row = []; };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else field += ch;
    } else if (ch === '"' && !started) { inQuotes = true; started = true; }
    else if (ch === delimiter) pushField();
    else if (ch === '\r') { if (text[i + 1] === '\n') i++; pushRow(); }
    else if (ch === '\n') pushRow();
    else { field += ch; started = true; }
  }
  if (field !== '' || row.length) pushRow();
  return rows;
}

export function detectDelimiter(text) {
  const line = text.replace(/^﻿/, '').split(/\r\n|\n|\r/).find((l) => l.trim()) ?? '';
  const count = (c) => line.split(c).length - 1;
  return count('\t') > count(',') ? '\t' : ',';
}

export function toNumber(s) {
  let str = String(s ?? '').trim();
  if (str === '' || str === '--' || str === '-') return 0;
  str = str.replace(/[^\d.,-]/g, '');
  const neg = str.startsWith('-');
  str = str.replace(/-/g, '');
  const lc = str.lastIndexOf(','), ld = str.lastIndexOf('.');
  if (lc !== -1 && ld !== -1) str = lc > ld ? str.replace(/\./g, '').replace(',', '.') : str.replace(/,/g, '');
  else if (lc !== -1) str = /^\d{3}$/.test(str.slice(lc + 1)) ? str.replace(/,/g, '') : str.replace(',', '.');
  const n = Number(str);
  return Number.isFinite(n) ? (neg ? -n : n) : 0;
}

// ponytail: header aliases follow Google Ads UI column names; extend the table when a real export uses a different label.
const ALIASES = {
  text: ['asset', 'asset text', 'text', 'ad asset'],
  type: ['asset type', 'field type', 'type'],
  campaign: ['campaign', 'campaign name'],
  impressions: ['impr.', 'impr', 'impressions'],
  clicks: ['clicks'],
  conversions: ['conversions', 'conv.', 'conv'],
  label: ['performance', 'performance label', 'asset performance'],
};
const TYPES = { headline: 'HEADLINE', 'long headline': 'LONG_HEADLINE', description: 'DESCRIPTION' };

export function importRows(text) {
  const all = parseCsv(text, detectDelimiter(text));
  const norm = (h) => String(h ?? '').trim().toLowerCase();
  const find = (header, aliases) => header.findIndex((h) => aliases.includes(norm(h)));
  const hi = all.findIndex((r) => find(r, ALIASES.text) !== -1 && find(r, ALIASES.impressions) !== -1);
  if (hi === -1) throw new Error('header not found: need an asset text column and an impressions column');
  const h = all[hi];
  const col = Object.fromEntries(Object.entries(ALIASES).map(([k, a]) => [k, find(h, a)]));
  col.cost = h.findIndex((x) => norm(x) === 'cost' || norm(x).startsWith('cost ('));
  const get = (r, i) => (i === -1 ? '' : String(r[i] ?? '').trim());

  const rows = [], texts = [], assets = [], seenT = new Set(), seenA = new Set();
  let skipped = 0;
  for (const r of all.slice(hi + 1)) {
    const text = get(r, col.text);
    if (!text || norm(r[0]).startsWith('total')) { skipped++; continue; }
    const rawType = get(r, col.type).toLowerCase();
    const label = get(r, col.label).toUpperCase();
    rows.push({
      adGroupAdAssetView: {
        fieldType: col.type === -1 ? 'UNKNOWN' : TYPES[rawType] ?? rawType.toUpperCase().replace(/\s+/g, '_'),
        performanceLabel: !label || label === '--' ? 'PENDING' : label,
      },
      asset: { textAsset: { text } },
      campaign: { name: get(r, col.campaign) },
      metrics: {
        impressions: String(Math.round(toNumber(get(r, col.impressions)))),
        clicks: String(Math.round(toNumber(get(r, col.clicks)))),
        conversions: Math.round(toNumber(get(r, col.conversions)) * 100) / 100,
        costMicros: String(Math.round(toNumber(get(r, col.cost)) * 1e6)),
      },
    });
    if (!seenT.has(text)) { seenT.add(text); texts.push(text); }
    if (TYPES[rawType] && !seenA.has(rawType + '\0' + text)) {
      seenA.add(rawType + '\0' + text);
      assets.push({ type: rawType.replace(' ', '_'), text });
    }
  }
  return { rows, texts, assets: { placement: 'unknown', assets }, skipped };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [file, out] = process.argv.slice(2);
  if (!file || !out) { console.error('usage: node scripts/import_ads_csv.mjs <export.csv> <outdir>'); process.exit(1); }
  const buf = readFileSync(file);
  const r = importRows(buf[0] === 0xff && buf[1] === 0xfe ? buf.toString('utf16le') : buf.toString('utf8'));
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'rows.json'), JSON.stringify({ rows: r.rows }, null, 1));
  writeFileSync(join(out, 'texts.json'), JSON.stringify(r.texts, null, 1));
  writeFileSync(join(out, 'existing_assets.json'), JSON.stringify(r.assets, null, 1));
  console.log(`imported ${r.rows.length} rows, ${r.texts.length} unique texts, ${r.assets.assets.length} assets (${r.skipped} skipped) -> ${out}`);
}
