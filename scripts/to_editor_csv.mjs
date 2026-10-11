// ponytail: MCP is read-only, so deploy = Google Ads Editor CSV import. Swap for API mutate if write access lands.
import { readFileSync } from 'node:fs';

const COLS = { headline: 'Headline', long_headline: 'Long headline', description: 'Description' };
// Prefix formula triggers so a cell can never execute in Excel/Sheets (CSV injection, OWASP A03).
const esc = (s) => `"${String(s).replace(/^[=+\-@\t\r]/, "'$&").replace(/"/g, '""')}"`;

export function toCsv({ campaign, ad_group, final_url, assets }) {
  const n = { headline: 0, long_headline: 0, description: 0 };
  const row = { Campaign: campaign, 'Ad group': ad_group, 'Final URL': final_url };
  for (const a of assets) row[`${COLS[a.type]} ${++n[a.type]}`] = a.text;
  return [Object.keys(row).map(esc).join(','), Object.values(row).map(esc).join(',')].join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) console.log(toCsv(JSON.parse(readFileSync(process.argv[2], 'utf8'))));
