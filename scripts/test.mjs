// One runnable check for the whole kit: node scripts/test.mjs
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { validate, tag } from './lab.mjs';
import { buildReport } from './tag_report.mjs';
import { stats } from './compare_arms.mjs';
import { toCsv } from './to_editor_csv.mjs';

const cfg = JSON.parse(readFileSync(new URL('../config/brand.json', import.meta.url)));

const r = validate({ placement: 'demand_gen', assets: [
  { type: 'headline', text: 'Fresh beans in 2 days' },
  { type: 'headline', text: 'The best brew — $5 off' },
  { type: 'headline', text: 'fresh beans in 2 days' },
  { type: 'description', text: 'Limited time offer for Brewly fans', tags: { branded: true } },
] }, cfg);
const got = r.issues.map((i) => `${i.index}:${i.rule}`);
for (const s of ['1:banned', '1:dash', '1:placement', '2:duplicate', '3:urgency', '3:length']) assert(got.includes(s), s);
assert(!r.issues.some((i) => i.index === 0 && i.severity === 'error'));
assert.equal(r.ok, false);

assert.equal(tag('Trusted by 40K home baristas', cfg).angle, 'social_proof');
assert.equal(tag('Specialty coffee for home', cfg).angle, 'generic');
assert.equal(tag('Brewly cold brew', cfg).brand_mention, 'yes');

const rows = JSON.parse(readFileSync(new URL('../sample/rows.json', import.meta.url)));
const tags = JSON.parse(readFileSync(new URL('../sample/texts.json', import.meta.url))).map((text) => ({ text, tags: tag(text, cfg) }));
const rep = buildReport(rows, tags, cfg.branded_campaign_pattern);
assert(rep.segments.branded.angle && rep.segments.non_branded.angle, 'both segments');
assert.equal(rep.unmatched.rows, 0);

const s = stats({ placement: 'search', assets: [{ type: 'headline', text: 'Fresh beans in 2 days' }] }, cfg);
assert.equal(s.pass, 1);
assert.match(toCsv({ campaign: 'C', ad_group: 'A', final_url: 'u', assets: [{ type: 'headline', text: 'x' }] }), /Headline 1/);
console.log('all checks pass');

// Security regressions (see SECURITY.md)
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const dir = mkdtempSync(join(tmpdir(), 'acl-'));
const evil = structuredClone(rep);
evil.segments.non_branded.angle[0].value = '</script><script>alert(1)</script>';
writeFileSync(join(dir, 'r.json'), JSON.stringify(evil));
const root = new URL('..', import.meta.url).pathname;
execFileSync('node', [join(root, 'scripts/build_dashboard.mjs'), join(root, 'dashboard.template.html'), join(dir, 'r.json'), join(dir, 'd.html')]);
assert(!readFileSync(join(dir, 'd.html'), 'utf8').includes('</script><script>alert(1)'), 'script breakout');
assert.match(toCsv({ campaign: 'C', ad_group: 'A', final_url: 'u', assets: [{ type: 'headline', text: '=1+1' }] }), /"'=1\+1"/, 'csv formula guard');
console.log('security checks pass');
