import fs from 'node:fs';

const norm = (t) => String(t).trim().toLowerCase().replace(/\s+/g, ' ');
const num = (v) => (Number.isNaN(Number(v ?? 0)) ? 0 : Number(v ?? 0));
const round = (v, d) => (v == null || Number.isNaN(v) ? null : parseFloat(v.toFixed(d)));
const div = (a, b) => (b > 0 ? a / b : null);

export function buildReport(rows, tags, brandedPattern = 'brand') {
  const brandedRe = new RegExp(brandedPattern, 'i');
  const data = Array.isArray(rows) ? rows : rows?.rows ?? [];
  const tagMap = new Map(tags.map((t) => [norm(t.text), t.tags]));
  const segments = { branded: {}, non_branded: {} };
  const unmatched = { rows: 0, impressions: 0 };

  for (const row of data) {
    const text = row.asset?.textAsset?.text;
    const attrs = typeof text === 'string' && text.trim() ? tagMap.get(norm(text)) : null;
    if (!attrs) {
      unmatched.rows += 1;
      unmatched.impressions += num(row.metrics?.impressions);
      continue;
    }
    const seg = segments[brandedRe.test(row.campaign?.name ?? '') ? 'branded' : 'non_branded'];
    const label = row.adGroupAdAssetView?.performanceLabel;
    for (const [dim, value] of Object.entries(attrs)) {
      const m = (seg[dim] ??= new Map());
      const key = String(value);
      if (!m.has(key)) m.set(key, { value: key, texts: new Set(), impressions: 0, clicks: 0, conversions: 0, costMicros: 0, labels: {} });
      const a = m.get(key);
      a.texts.add(norm(text));
      a.impressions += num(row.metrics?.impressions);
      a.clicks += num(row.metrics?.clicks);
      a.conversions += num(row.metrics?.conversions);
      a.costMicros += num(row.metrics?.costMicros);
      if (label) a.labels[label] = (a.labels[label] || 0) + 1;
    }
  }

  const out = { branded: {}, non_branded: {} };
  for (const [segName, seg] of Object.entries(segments)) {
    for (const [dim, m] of Object.entries(seg)) {
      const entries = [...m.values()];
      const totI = entries.reduce((s, e) => s + e.impressions, 0);
      const totC = entries.reduce((s, e) => s + e.clicks, 0);
      out[segName][dim] = entries
        .map((e) => {
          const ctr = div(e.clicks, e.impressions);
          const cost = e.costMicros / 1e6;
          const otherCtr = div(totC - e.clicks, totI - e.impressions);
          return {
            value: e.value,
            assets: e.texts.size,
            impressions: e.impressions,
            clicks: e.clicks,
            conversions: e.conversions,
            cost: round(cost, 2),
            ctr: round(ctr, 4),
            cvr: round(div(e.conversions, e.clicks), 4),
            cpa: round(div(cost, e.conversions), 2),
            lift_ctr: round(ctr != null && otherCtr ? ctr / otherCtr : null, 2),
            low_sample: e.impressions < 1000,
            labels: e.labels,
          };
        })
        .sort((a, b) => b.impressions - a.impressions);
    }
  }
  return { segments: out, unmatched };
}

export function toMarkdown(report) {
  const pct = (v) => (v == null ? '-' : `${(v * 100).toFixed(2)}%`);
  const lines = ['# Tag report', ''];
  for (const [segName, seg] of Object.entries(report.segments)) {
    for (const [dim, rows] of Object.entries(seg)) {
      if (!rows.length) continue;
      lines.push(`## ${segName} / ${dim}`, '', '| value | assets | impr | CTR % | CVR % | CPA $ | CTR lift | label mix |', '|---|---|---|---|---|---|---|---|');
      for (const r of rows) {
        const mix = Object.entries(r.labels).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}: ${v}`).join(', ') || '-';
        lines.push(`| ${r.value}${r.low_sample ? ' *' : ''} | ${r.assets} | ${r.impressions} | ${pct(r.ctr)} | ${pct(r.cvr)} | ${r.cpa == null ? '-' : '$' + r.cpa.toFixed(2)} | ${r.lift_ctr ?? '-'} | ${mix} |`);
      }
      lines.push('', '* <1000 impressions, directional only', '');
    }
  }
  lines.push(`Unmatched rows: ${report.unmatched.rows} (${report.unmatched.impressions} impr)`);
  return lines.join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const [rowsFile, tagsFile, cfgFile] = args.filter((a) => a !== '--md');
  if (!rowsFile || !tagsFile) {
    console.error('Usage: node tag_report.mjs <gaql_rows.json> <tags.json> [config.json] [--md]');
    process.exit(1);
  }
  const pattern = cfgFile ? JSON.parse(fs.readFileSync(cfgFile, 'utf8')).branded_campaign_pattern ?? 'brand' : 'brand';
  const report = buildReport(JSON.parse(fs.readFileSync(rowsFile, 'utf8')), JSON.parse(fs.readFileSync(tagsFile, 'utf8')), pattern);
  console.log(args.includes('--md') ? toMarkdown(report) : JSON.stringify(report, null, 2));
}
