// Synthetic GAQL-shaped rows for the fictional brand "Brewly". Deterministic (seeded) so demos are reproducible.
// Each angle gets a hidden CTR/CVR multiplier so the tag report has a real pattern to find.
import { writeFileSync } from 'node:fs';

let seed = 42;
const rand = () => ((seed = (seed * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32);

const TEXTS = {
  time_saved: ['Fresh beans in 2 days', 'Roasted and shipped in 24 hours', 'Brew better coffee in 3 minutes', 'Same day roast, next day cup'],
  loss_aversion: ['Stop drinking stale coffee', 'Tired of bitter supermarket beans', 'Never run out of beans again', 'Stop wasting $5 a cup'],
  social_proof: ['Trusted by 40K home baristas', 'Rated 4.8 by 12K customers', 'Used by 300 indie cafes'],
  pricing: ['Save 20% on your first bag', 'Plans from $12 per month', 'Free trial, cancel anytime'],
  workflow: ['Pause or skip any delivery', 'Choose your roast in the app', 'Delivered to your doorstep weekly'],
  output: ['4 bags of single origin a month', '60 cups from every bag'],
  generic: ['Specialty coffee for home', 'Brewly coffee subscription', 'Light roast single origin beans', 'Cold brew ready beans'],
};
const LIFT = { time_saved: [1.3, 1.0], loss_aversion: [0.8, 1.2], social_proof: [1.6, 1.1], pricing: [1.1, 0.6], workflow: [0.9, 1.0], output: [0.7, 1.3], generic: [1.0, 0.9] };
const CAMPAIGNS = [['Search - Brand - US', 'SEARCH'], ['Demand Gen - Coffee Lovers', 'DEMAND_GEN'], ['Demand Gen - Home Baristas', 'DEMAND_GEN'], ['Search - Generic - Coffee Subscription', 'SEARCH']];
const LABELS = ['BEST', 'GOOD', 'LOW', 'LEARNING'];

const rows = [];
for (const [angle, texts] of Object.entries(TEXTS)) {
  for (const text of texts) {
    for (const [name, channel] of CAMPAIGNS) {
      if (rand() < 0.35) continue;
      const branded = /brand/i.test(name);
      const impressions = Math.round(800 + rand() * 9000);
      const ctr = (branded ? 0.08 : 0.012) * LIFT[angle][0] * (0.8 + rand() * 0.4);
      const clicks = Math.round(impressions * ctr);
      const conversions = +(clicks * 0.06 * LIFT[angle][1] * (0.7 + rand() * 0.6)).toFixed(2);
      rows.push({
        adGroupAdAssetView: { fieldType: text.length <= 30 ? 'HEADLINE' : 'DESCRIPTION', performanceLabel: LABELS[Math.floor(rand() * 4)] },
        asset: { textAsset: { text } },
        campaign: { name, advertisingChannelType: channel },
        metrics: { impressions: String(impressions), clicks: String(clicks), conversions, costMicros: String(Math.round(clicks * (0.6 + rand() * 0.8) * 1e6)) },
      });
    }
  }
}
writeFileSync(new URL('./rows.json', import.meta.url), JSON.stringify({ rows }, null, 1));
writeFileSync(new URL('./texts.json', import.meta.url), JSON.stringify(Object.values(TEXTS).flat(), null, 1));
console.log(`wrote ${rows.length} rows, ${Object.values(TEXTS).flat().length} texts (synthetic)`);
