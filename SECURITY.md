# Security

Reviewed against the OWASP Top 10 (2021) and OWASP Top 10 for LLM Applications before first release.

| Area | Finding | Status |
|---|---|---|
| A03 Injection: XSS | Report values were inserted into the dashboard with `innerHTML`, and report JSON could close the `<script>` tag | Fixed: values escaped, numbers coerced, `<` and line separators escaped on embed. Regression test in `scripts/test.mjs` |
| A03 Injection: CSV | Ad text starting with `=`, `+`, `-`, `@` would run as a formula when the Editor CSV opens in Excel or Sheets | Fixed: such cells get a leading `'`. Regression test |
| LLM01 Prompt injection | Ad texts and campaign names from Google Ads reach the agents | Agents treat them as data; the executor may only run `lab.mjs` |
| A02 / secrets | No keys, tokens, or credentials in the repo; `.env` is gitignored | OK |
| A06 Vulnerable components | Zero npm dependencies; Python uses stdlib only | OK |
| A10 SSRF / network | Scripts make no network calls. The dashboard loads Google Fonts only | OK |
| Data exposure | Sample data is synthetic. No real account IDs, campaign names, or spend | OK |
| ReDoS | Tag and placement regexes come from `config/brand.json`, which the brand owner controls. Do not load configs from untrusted sources | Documented |

Report a vulnerability by opening a private security advisory on this repo.
