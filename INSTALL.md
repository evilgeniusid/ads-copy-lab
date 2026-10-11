# Install and use

## Requirements
- [Claude Code](https://claude.com/claude-code) (terminal, desktop app, or IDE extension)
- Node.js 20+ (the scripts have no npm dependencies)
- Python 3 (only for `eval_tagger.py`)
- Optional: a Google Ads MCP connector or API access to pull your own asset metrics

## Install

### Option A: from GitHub (recommended)
Inside Claude Code:
```
/plugin marketplace add evilgeniusid/ads-copy-lab
/plugin install ads-copy-lab@ads-copy-lab
```
Restart Claude Code if the skill does not appear.

### Option B: local folder, one session
```bash
git clone https://github.com/evilgeniusid/ads-copy-lab.git
claude --plugin-dir ./ads-copy-lab
```

Check it loaded: ask Claude "which skills and agents do you have?" and look for the `ads-copywriter` skill and the `ad-copy-executor` and `ad-tagger` agents.

Run your session on your strongest model (it acts as PM). The agents pick their own models (`model:` in `agents/*.md`); change them there.

## Try the demo (2 minutes, no Google Ads account)
From the plugin folder:
```bash
node sample/make_sample.mjs
node scripts/lab.mjs tag config/brand.json sample/texts.json > sample/tags.json
node scripts/tag_report.mjs sample/rows.json sample/tags.json config/brand.json > sample/report.json
node scripts/build_dashboard.mjs dashboard.template.html sample/report.json sample/dashboard.html
open sample/dashboard.html        # macOS; use xdg-open on Linux
node scripts/test.mjs             # should print: all checks pass
```

## Set it up for your brand

### 1. Config: `config/brand.json`
| Field | What to put |
|---|---|
| `brand`, `brand_pattern` | Brand name and a regex that matches it in copy |
| `branded_campaign_pattern` | Regex matching your branded campaign names (their CTR is inflated, so they are reported separately) |
| `limits` | Character range per asset type |
| `expected_counts` | How many of each asset type a brief should produce |
| `banned`, `urgency` | Phrases that must never appear |
| `require_number` | `true` if every non-branded asset must contain a number |
| `placement_rules` | Per placement, a regex of forbidden content (e.g. prices in Demand Gen) |
| `tags.angle` | Ordered `[name, regex]` pairs; the first match wins |
| `tags.flags` | Yes/no tags, e.g. product vocabulary, brand mention |

### 2. References: `skills/ads-copywriter/references/`
Copy each `*.template.md` to the same name without `.template` and fill it in:
- `brand-rules.md`: role, audience, product facts, output shape
- `brand-voice.md`: voice pillars, say/not-say list, core messages
- `learnings.md`: rules earned from data (start empty)
- `decisions.md`: which rule wins when two docs disagree

### 3. Validate one asset file before trusting it
```bash
node scripts/lab.mjs validate config/brand.json my-assets.json
```
`my-assets.json` shape:
```json
{ "placement": "search", "assets": [ { "type": "headline", "text": "Fresh beans in 2 days" } ] }
```

## Daily use

Give Claude a short brief. Examples:
- `Search, spring sale, returning customers, EN`
- `Demand Gen, new cold brew line, 15/15/10`
- `Which copy angles lowered CPA last month?`

Claude grounds the prompt in your data, writes the set, runs the validator until it passes, and hands you tables plus a Google Ads Editor CSV. You review and upload.

## Weekly refine loop
1. Export asset metrics from Google Ads (GAQL on `ad_group_ad_asset_view`) to `rows.json`. The query is in `skills/ads-copywriter/SKILL.md`.
2. Extract the unique texts into `texts.json` (a JSON array of strings).
3. Run tag, report, and dashboard (same commands as the demo, with your files).
4. Change a standing rule only when a tag has ≥1,000 impressions and a ≥20% CPA or CTR difference that holds 2 weeks, or wins an A/B test. Write it in `learnings.md`.

## Measure the tools (optional, recommended)
- **Tagger accuracy:** hand-label ~60 texts (`[{id, angle, <flag>: "yes"|"no"}]`), then
  `python3 scripts/eval_tagger.py predictions.json gold.json`
- **Plain prompt vs verbalized sampling:**
  `node scripts/compare_arms.mjs config/brand.json plain.json vs.json`

## Troubleshooting
| Problem | Fix |
|---|---|
| Skill not listed | Restart Claude Code; with Option B, check the `--plugin-dir` path |
| Validator fails on length every round | Normal for models; let Claude fix and rerun, or shorten by hand |
| Every text tagged `generic` | Your `tags.angle` regexes do not match your copy; add your own vocabulary |
| `unmatched` rows in the report | Texts in `rows.json` with no entry in `tags.json`; re-run the tag step on the same texts |
