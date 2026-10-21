# Ogilvy copy rules for Google Ads text assets

Source: David Ogilvy, *Ogilvy on Advertising* (1983). This file is plugin-provided and brand-neutral; brand facts and house rules live in `.ads-copy-lab/references/`. When this file and a brand reference disagree, the brand reference and `decisions.md` win. The Validator (`lab.mjs validate`) always wins on form.

Evidence tags:
- **[B]** original book text (Ch.1 and part of Ch.2 only)
- **[S]** chapter summary (Ch.1-20; some sections cut short)
- **[K]** in the full book but not checked against it here. Verify against the full text before you cite it externally.

Evidence age: most of the readership data is US print from the 1930s-1970s (Gallup, Starch). Treat it as a starting hypothesis, then confirm it with your own split tests and the Weekly refine loop. Readership and recall are attention metrics, not sales. Ogilvy himself rates brand-preference shift above recall as a predictor of purchase [S, Ch.8].

## 1. Operating principle
- The job is sales, not praise. "If it doesn't sell, it isn't creative" (Benton & Bowles, quoted) [B].
- Appeal choice drives the outcome: same space, same publication, one ad sold **19.5x** another. The only difference was the appeal (Caples) [B].
- Wrong advertising can reduce sales [B]. Every variant has to prove itself against a control.

## 2. Before writing
1. **Product homework.** Pull one specific, verifiable fact from the brief or `brand-rules.md` that can carry a headline [B]. Never invent one.
2. **Competitor claims.** If the brief lists them, do not repeat them [B].
3. **Customer language.** Use the words customers use about the category, from the brief or the grounding pack [B].
4. **Positioning = what the product does + who it is for.** One sentence, written before the first asset [B].
5. **One benefit per asset.** Two benefits mean two assets, not one blended line [S, Ch.14].
6. **Heavy users first.** Write for the motivations of the people who buy most [S, Ch.16].

## 3. Headline rules (headline 30, Demand Gen headline 40, long headline 70-80)
| Rule | How it applies to ad text | Evidence |
|---|---|---|
| Headline carries the ad | In RSA and Demand Gen the headline is often the whole ad. Make each one sell alone | [S, Ch.7] |
| Promise a benefit | Lead with what the buyer gets | [S, Ch.15] |
| Include news when the brief has it | New product, feature, or offer goes in the headline | [S, Ch.7] |
| Brand name in some headlines | Where the limit allows; most long headlines have room | [S, Ch.7] |
| Be specific | Exact figures from the brief beat vague claims | [S, Ch.7, Ch.11] |
| Name the audience or category | Who it is for, or what kind of product it is | [S, Ch.7 Q&A] |
| No puns, no wordplay, no blind headlines | A headline must make sense with no other line beside it | [S, Ch.7] |
| Avoid negative constructions | Readers can take away the opposite meaning. Say what it does, not what it doesn't | [K] |

## 4. Description rules (description 85-90)
- Facts sell [S, Ch.7]. Spend the characters on facts from the brief, not adjectives.
- Write to one person, conversationally, in short sentences with no jargon [S, Ch.7 Q&A].
- Make the product the hero. No attention bait unrelated to the product [S, Ch.11].
- In parity categories, do not claim superiority. Say what is **positively good**, clearly and honestly (Raphaelson) [B].
- Show the money or time saved when the brief gives the numbers [S, Ch.11].
- Candor builds credibility; a stated limitation can help [S, Ch.9].
- End with one clear action [S, Ch.11].

## 5. Proof
- Use only proof the brief gives: verified numbers, ratings, real-user or expert testimonials, demonstrations [S, Ch.7, Ch.11].
- A credible peer outweighs a celebrity [B; S, Ch.8].

## 6. Direct-response and testing
- Price and payment terms are strong variables; test them where the placement allows [S, Ch.12].
- Test one variable at a time against a profitable **control** [S, Ch.12 Q&A]. Log the variable in the asset's `angle` tag.
- A smaller entry offer can sell more of the full product [S, Ch.12]. Suggest it as a test, never as a fact.
- Judge promos by retained customers, not first response [S, Ch.12 Q&A].
- Repeat winners until they stop selling [B]. Retire an asset on a CTR or CPA decline against baseline, not on age.
- Keep a consistent brand image; every ad adds to it [B].
- Localize headlines in the market's language [S, Ch.15], and expect local edits [S, Ch.17].

## 7. Banned patterns
- Originality for its own sake [B]
- Puns, clever-but-vague headlines, blind headlines
- Superiority claims on parity products
- Interchangeable corporate language [S, Ch.9]
- Several benefits stacked in one asset

## 8. Conflicts with ad formats
Ogilvy's strongest finding is that long, fact-dense copy outsells short copy for considered purchases [S, Ch.7, Ch.11, Ch.12]. A 30-character headline cannot hold it. Put long copy on the landing page, video scripts, and social primary text. In ad text, keep one fact per line and spread facts across the set. His print-layout rules (editorial format, reverse type) and video rules do not apply to text assets.

## 9. Self-check (after the Validator passes)
The Validator runs first and its errors are fixed first. This check is judgment, not a gate the script enforces.

Score each asset 1 (pass), 0 (fail), or n/a:
1. One benefit stated
2. Benefit is specific: a number or verifiable fact from the brief
3. Audience or category named
4. Brand name present. n/a when it does not fit the limit or the line is a non-brand variant by design
5. News included. n/a when the brief has no news
6. No pun, no blind headline, no negative construction
7. No superiority claim on a parity product
8. Proof element (verified number, testimonial, demonstration). n/a when the brief has no proof
9. One clear action. n/a for headlines and long headlines
10. Notes the single variable it tests. n/a unless the brief is an A/B test against a control

Asset score = passes / applicable items. Ship threshold: at least 80% of applicable items (8 of 10 when all apply, 6 of 7 when three are n/a). Items 1, 6, and 7 must pass on every asset.

Set score: report the share of assets at or above threshold and the mean asset score, plus the items that fail most often. Set-level targets: brand name in some headlines and most long headlines; at least a third of headlines carry a number from the brief when it has numbers.
