# Ads Copy Lab

A Claude Code plugin that writes Google Ads text assets, checks them against your brand rules, tags every line by attribute, and learns from your own ad data which attributes lower CPA.

Built by [Laila Karomah](https://evilgenius.id) for MBCL Cohort 3 (Claude for Non-Tech Professional), then generalized so any brand can use it.

## Who this is for

- Google Ads specialists who want on-brand copy drafts without learning to code.
- Claude Code users who want a full loop for ad copy: write, check, tag, measure.

## Pick your path

### Path A: I run Google Ads, new to Claude Code

Claude Code is an app that runs in a terminal window; you type plain English and it reads files, runs commands, and writes for you.

1. Install Claude Code from https://claude.com/claude-code
2. Open a terminal. macOS: press Cmd+Space, type Terminal, press Enter. Windows: press the Windows key, type PowerShell, press Enter.
3. Type `claude` and press Enter.
4. Install the plugin (Claude Code 2.1.275 or later):

   ```
   /plugin install ads-copy-lab --marketplace evilgeniusid/ads-copy-lab
   ```

   On older versions:

   ```
   /plugin marketplace add evilgeniusid/ads-copy-lab
   /plugin install ads-copy-lab@ads-copy-lab
   ```

5. Ask Claude "which skills and agents do you have?" and look for the `ads-copywriter` skill and the `ad-copy-executor` and `ad-tagger` agents. Restart Claude Code if they do not appear.
6. Type your first brief:

   ```
   Demand Gen, spring sale, returning customers, EN
   ```

   Out of the box, `config/brand.json` holds the sample brand Brewly. Set up your own brand first: [INSTALL.md](INSTALL.md).

### Path B: I code with Claude, new to Google Ads

| Term | Plain meaning |
|---|---|
| Asset | One piece of ad text, like a headline or a description. |
| CTR | Click-through rate, the share of people who saw the ad and clicked. |
| CPA | Cost per acquisition, what you pay on average for one conversion. |
| Demand Gen | A Google Ads campaign type for visual ads in Google feeds such as YouTube and Gmail. |
| GAQL | Google Ads Query Language, a SQL-like way to pull ad data. |
| Google Ads Editor | Google's free desktop app for uploading ads in bulk from a CSV. |

Try it in 1 minute (no Google Ads account needed). You need Node.js 20+.

```bash
git clone https://github.com/evilgeniusid/ads-copy-lab.git
cd ads-copy-lab
node sample/make_sample.mjs
node scripts/lab.mjs tag config/brand.json sample/texts.json > sample/tags.json
node scripts/tag_report.mjs sample/rows.json sample/tags.json config/brand.json > sample/report.json
node scripts/build_dashboard.mjs dashboard.template.html sample/report.json sample/dashboard.html
open sample/dashboard.html
```

`open` is macOS; use `xdg-open` on Linux or `start` on Windows. The sample brand ("Brewly", a coffee subscription) and its numbers are synthetic. To load the plugin from your clone: `claude --plugin-dir ./ads-copy-lab`.

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

## Your first real brief

- `Search, spring sale, returning customers, EN`
- `Demand Gen, new cold brew line, 15/15/10`
- `Which copy angles lowered CPA last month?`

Claude grounds the prompt in your data, writes the set, runs the validator until it passes, and hands you tables plus a Google Ads Editor CSV. You review and upload.

To set it up for your brand, edit `config/brand.json` (character limits, banned and urgency phrases, placement rules, tag regexes) and fill the four templates in `skills/ads-copywriter/references/`. Full steps: [INSTALL.md](INSTALL.md).

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

It prints `all checks pass`.

## License

MIT
