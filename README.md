# Ads Copy Lab

A Claude Code plugin that writes Google Ads text assets, checks them against your brand rules, tags every line by attribute, and learns from your own ad data which attributes lower CPA.

Built by [Laila Karomah](https://evilgenius.id) for MBCL Cohort 3 (Claude for Non-Tech Professional), then generalized so any brand can use it.

## What it does

| Step | Who does it | Tool |
|---|---|---|
| Ground the prompt in your best and worst ads | script | GAQL pull + tag report |
| Write 15 headlines, 15 long headlines, 10 descriptions | executor agent (Sonnet) | `ads-copywriter` skill (RTCF prompt) |
| Explore unusual angles | LLM | Verbalized sampling, 3–5 headlines per ad group |
| Check length, banned words, placement rules | script | `lab.mjs validate` |
| Pick and upload | human | Google Ads Editor CSV |
| Tag every live text and measure CTR/CPA per tag | script | `lab.mjs tag`, `tag_report.mjs`, dashboard |

The rule that runs through it: **the model writes, scripts check hard rules, a human decides.**

### Model delegation
The strongest model manages; cheaper models execute.

| Role | Model | Job |
|---|---|---|
| PM | your Claude Code session (e.g. Opus) | brief, grounding, review, final pick |
| `ad-copy-executor` | Sonnet | write copy, run validator, fix |
| `ad-tagger` | Haiku | backfill tags on old texts |
| scripts | none | validation, reports, dashboard |

Change a model by editing the `model:` line in `agents/*.md`.

## Try it in 1 minute (no Google Ads account needed)

```bash
node sample/make_sample.mjs
node scripts/lab.mjs tag config/brand.json sample/texts.json > sample/tags.json
node scripts/tag_report.mjs sample/rows.json sample/tags.json config/brand.json > sample/report.json
node scripts/build_dashboard.mjs dashboard.template.html sample/report.json sample/dashboard.html
open sample/dashboard.html
```

The sample brand ("Brewly", a coffee subscription) and its numbers are synthetic.

## Use it for your brand

Full steps: [INSTALL.md](INSTALL.md).

1. Install the plugin in Claude Code.
2. Edit `config/brand.json`: character limits, banned and urgency phrases, placement rules, tag regexes.
3. Fill the four templates in `skills/ads-copywriter/references/`.
4. Give Claude a brief: `Demand Gen, spring sale, returning customers, EN`.

## What we measured (original deployment)

- **Validator vs an independently written checker:** 104 assets, precision 1.00, recall 1.00. The model's own first-pass compliance was 74%, which is why the validator exists.
- **Regex tagger vs blind labels (60 texts):** binary tags 0.91–1.00 precision. Angle accuracy 72%, so angle-level findings carry a caution flag.
- **Plain prompt vs verbalized sampling (same model, same brief):** plain passed 25/32, VS 18/32 but was ~15% more diverse. Plain writes the main set; VS only explores.

## Honest limits

- Google Ads asset metrics are correlation, not causation. Confirm winners with an A/B test.
- The tagger is regex. Replace it with an LLM tagger only if it beats the regex on a blind gold set.
- The Google Ads connector used here is read-only, so a human uploads the copy.

## Tests

```bash
node scripts/test.mjs
```

MIT license.
