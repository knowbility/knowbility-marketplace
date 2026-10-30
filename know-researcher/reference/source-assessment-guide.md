# Source Assessment Guide

How to assess source credibility beyond the basic hierarchy in `source-standards.md`. Use this when processing sources to produce more nuanced credibility ratings.

## 1. Recency Assessment

**When recency matters:** Market data, technology adoption rates, competitive landscapes, pricing, regulatory status, company financials. These change fast — data older than 2 years may be misleading, and older than 5 years is likely obsolete.

**When recency does not matter:** Historical facts, foundational research, established theoretical frameworks, biographical facts, legal precedents. A 2015 source on a company's founding year is as valid as a 2024 one.

**How to flag:** Note the data year (not just publication year — a 2024 article may cite 2021 data). If the data year is more than 2 years old for a time-sensitive claim, flag it as "potentially stale" in the credibility assessment.

## 2. Methodology Quality

For sources that cite studies, surveys, or original research:

**Green flags:** Methodology section describes sample selection, sample size, data collection method, and limitations. Peer-reviewed or published by a recognized research institution. Sample size appropriate to the claims being made.

**Red flags:** "Proprietary data" or "proprietary methodology" with no further detail. Surveys with undisclosed sample size or selection criteria. Self-selected samples presented as representative. No methodology section at all.

**How to assess:** If a source claims "70% of companies are adopting X," look for: How many companies? How were they selected? When was the data collected? If none of these are answered, note "methodology not disclosed" in the credibility assessment.

## 3. Conflict of Interest Indicators

Not automatically disqualifying, but must be noted:

- **Vendor research about their own market:** A CRM company publishing a "State of CRM" report will likely overstate market size and urgency. Use for directional signal, not precise numbers.
- **Consultant reports that recommend consulting:** Strategy firms publishing research that concludes "companies need strategic guidance" have a structural incentive.
- **Industry association data that favors members:** Trade associations exist to promote their industry. Their data will skew positive.
- **Sponsored research:** Check for "sponsored by" or "in partnership with" disclosures. The sponsor's interests may shape the framing even if the data is legitimate.

**How to handle:** Note the conflict in the credibility assessment. Do not discard the source — use it for claims where the conflict does not apply (a vendor's technical documentation is high-credibility for product capabilities even if their market claims are suspect).

## 4. Sample Size and Representativeness

When a source cites percentages or rates:

- **Ask:** How many? "70% of companies" means something different when it is 70% of 12 surveyed enterprise clients vs. 70% of 2,000 randomly selected businesses.
- **Check representativeness:** Who was in the sample? A survey of Fortune 500 CIOs does not represent small businesses. A survey of conference attendees self-selects for engaged adopters.
- **Flag extrapolation:** When a source applies a finding from a specific sample to a broader population, note the leap. "70% of surveyed enterprises" becoming "70% of the market" is an extrapolation, not a fact.

## 5. Replication Status

**Has anyone independently verified the claim?**

- **Replicated findings:** Multiple independent studies reach the same conclusion. Strongest evidence level.
- **Single-study findings:** Only one study supports the claim. Common in market research and emerging fields. Note "single study" in the assessment.
- **Contradicted findings:** Other studies have found different results. Note the disagreement and flag for cross-referencing.

**Particularly important for:** Market size estimates (which notoriously vary between research firms), behavioral claims ("users prefer X"), and effectiveness claims ("approach Y improves outcomes by Z%").

## 6. Primary vs. Secondary Source

- **Primary:** The original source of the claim — the study, the financial filing, the interview transcript, the official announcement.
- **Secondary:** A source reporting on someone else's findings — a news article about a study, a blog post summarizing a report, an analyst citing another firm's data.

**Always prefer primary.** When using a secondary source, note the chain in the source note: "Reported by [secondary], originally from [primary]." If the primary source is accessible, process it directly rather than relying on the secondary.

**Why this matters:** Each link in the chain is an opportunity for qualifier stripping, range narrowing, and context loss. The further from the primary, the less reliable the claim.

## Per-Source Assessment Checklist

For each source processed, verify:

- [ ] Is this primary or secondary? If secondary, is the primary accessible?
- [ ] What is the data year (not just publication year)?
- [ ] Is the methodology described? Sample size? Selection criteria?
- [ ] Are there conflicts of interest? (vendor, sponsor, association)
- [ ] Are percentages backed by explicit denominators?
- [ ] Has the core claim been replicated by independent sources?
