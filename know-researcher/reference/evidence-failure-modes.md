# Evidence Failure Modes

Catalog of how evidence degrades during AI-assisted research. Use this as a checklist when auditing claims or writing synthesis. Each pattern includes what it looks like, why it happens, and how to detect it.

## 1. Source Skimming

**What it is:** Engaging with a user-provided document at the surface level — filename, first paragraph, or a one-line summary from the verbal description — instead of reading the full content. The most common trigger is the user dropping a document into `source-material/` before running `/know-research:init`, where the init skill saves the file but never reads it, so the research plan is written from a partial mental model of the source.

**Why it happens:** The verbal description the user gives at the start of a project feels like "the topic," and the file feels like "supporting material." In practice, the file usually contains the specific facts (named entities, dates, credentials, stated assumptions) that determine whether the plan's framing is right. When a plan-generation subagent is handed a verbal description and an unread file path, it will write phases that match the description and never touch the file.

**How to detect:** For every file in `source-material/`, verify its facts appear in either (a) the research plan's Research Subject, Assumptions section, or phase questions, or (b) an explicit Out of Scope list with a reason. If a named entity, date, credential, or stated assumption exists in the file but nowhere in the plan, the file was skimmed. This check is automated in the research-integrity agent's "Source Material Coverage" check — run it after plan generation and after any new source-material drop.

**Structural prevention:** `/know-research:init` Step 2 reads every source-material file in full and produces `research/source-material-digest.md`. The plan generator receives both the digest and the raw file paths and is required to re-read each file. After plan generation, research-integrity cross-checks the plan against the digest. `/know-research:start-phase` reconciles `source-material/` against the digest before every phase transition. `/know-research:process-source` updates the digest when processing a file from `source-material/`.

## 2. Qualifier Stripping

**What it is:** Removing hedging, conditions, or scope limitations from a claim during compression. The source says "primarily in North American enterprise deployments" and the draft says "broadly adopted."

**Why it happens:** Summarization naturally compresses, and qualifiers are the first words to go. The claim reads cleaner without them.

**How to detect:** Compare the draft's language word-by-word against the source note. Look for missing geographic limits, time bounds, population restrictions, confidence language ("suggests," "indicates," "in some cases"), and conditional statements.

## 3. Range Narrowing

**What it is:** Compressing a range to its midpoint or favorable end. The source says "$2M-$8M" and the draft says "$4M-$8M" or "approximately $5M."

**Why it happens:** Point estimates feel more authoritative than ranges. The model gravitates toward precision even when the source was deliberately imprecise.

**How to detect:** Check every number in the draft against its source note. If the source gave a range, the draft must give the same range. Check both endpoints — the lower bound is usually the one that gets dropped.

## 4. Citation Laundering

**What it is:** Citing a secondary source as if it were the primary. A blog post summarizes a McKinsey report; the draft cites the blog post's numbers as if they came from the blog's own research. The original methodology, caveats, and context are lost.

**Why it happens:** The secondary source is what was processed. The primary source may not have been directly accessible.

**How to detect:** When a source note attributes a claim to another source ("according to a study by..."), the draft must cite the original, not the intermediary. If the original was not processed, note the chain: "[claim], as reported by [secondary source], originally from [primary source]."

## 5. Survivorship Bias

**What it is:** Drawing conclusions from visible successes while ignoring failures that are not represented in the sources. "Companies using this approach grew 30%" — but only surviving companies are in the dataset.

**Why it happens:** Failed companies, abandoned projects, and quiet exits rarely produce public sources. The available evidence skews toward success stories.

**How to detect:** Ask: "Would failures show up in these sources?" If the answer is no, flag the finding as potentially survivorship-biased. Look for claims about success rates, adoption rates, or effectiveness where the denominator is unclear.

## 6. Denominator Drift

**What it is:** Carrying a percentage forward while the base it applies to shifts. "30% of surveyed enterprise companies" becomes "30% of companies."

**Why it happens:** The denominator is context that gets stripped during compression, especially when a finding moves across phases.

**How to detect:** For every percentage in the draft, verify the denominator matches the source. Check: surveyed vs. all, a specific segment vs. the whole market, respondents vs. population. Register the denominator in the canonical figures registry alongside the percentage.

## 7. False Precision

**What it is:** Adding specificity the source did not provide. Converting "$3-6B" to "$4.7B" or "several hundred" to "approximately 350."

**Why it happens:** Precise numbers feel more credible in synthesis. The model may interpolate or pick a specific value that "sounds right."

**How to detect:** Check every number against its source. If the source gave a range, approximation, or order of magnitude, the draft must preserve that level of precision. No decimal places that were not in the original.

## 8. Temporal Conflation

**What it is:** Mixing data from different time periods as if they were contemporaneous. Using 2019 market size and 2024 growth rate in the same calculation.

**Why it happens:** Different sources report data from different years. When synthesizing, the dates get stripped and the numbers appear compatible.

**How to detect:** Check the data year for every quantitative claim. If two numbers are combined (e.g., market size x growth rate), verify they come from the same or compatible time periods. Flag any calculation that mixes time periods.

## 9. Authority Transfer

**What it is:** Citing an expert's credibility in one domain as evidence for a claim in a different domain. A respected technologist's opinion about market dynamics, or an economist's prediction about technical feasibility.

**Why it happens:** Credible sources are trusted across topics. If a highly-rated source makes a claim outside their expertise, it inherits the credibility rating of the source rather than the claim.

**How to detect:** For each expert-attributed claim, check: is this within their demonstrated domain? A CTO's view on architecture is high-credibility; their market size estimate is an opinion. Rate the claim separately from the source.

## Quick Check

For each factual claim in the draft, verify:

- [ ] Every user-provided document in `source-material/` has been fully read and reflected in the research plan, or explicitly marked out of scope
- [ ] Qualifiers match the source exactly
- [ ] Ranges preserve both endpoints
- [ ] The primary source is cited (not a secondary summary)
- [ ] The denominator is explicit and matches the source
- [ ] The precision level matches the source (no added decimal places)
- [ ] The time period of the data is noted
- [ ] Expert claims are within their demonstrated domain
