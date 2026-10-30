---
name: research-graph-analysis
description: This skill should be used when the user asks how much to trust the research, which claims are load-bearing, or where the evidence is weakest (e.g. "what's the research resting on", "where is my evidence fragile", "cheapest way to raise confidence"). Analyzes the claim graph for load-bearing claims, fragile foundations, and the cheapest evidence upgrades — decision support, not output.
allowed-tools: Read, Grep, Glob
---

# /know-research:graph-analysis

Analyze the claim graph as a decision-support tool. This is not research output — it tells you how much to trust what the research found, where the evidence is fragile, and where targeted follow-up would have the biggest impact.

## Process

1. **Read `research/reference/claim-graph.json`.** If the file does not exist, is empty, or contains `{"claims": []}`, report: "No claims in graph yet — run `/know-research:audit-claims` on at least one phase first." and stop.

2. **Read `CLAUDE.md`** to get the `research-type` field (for type-specific framing in step 6).

3. **Read `research/research-plan.md`** to get the phase names (for phase attribution in the output).

4. **Compute per-node metrics** across all claim nodes in the `claims` array:

   - **Shared-source degree**: For each claim, count how many *other* claims share at least one entry in `source_files`. Higher degree = more of the research depends on the same source material as this claim.
   - **Figure exposure**: For each claim with non-empty `figure_ids`, count how many *other* claims reference any of the same figure IDs. If this figure changes (drift), that many claims are affected.
   - **Combined degree**: shared-source degree + figure exposure. Used for ranking within buckets.

5. **Produce 4 analysis buckets.** For each bucket, select the top 5-7 claims by combined degree. Show: claim ID, short description (first ~10 words of `text`), phase, confidence tier, source count, and combined degree.

### Bucket 1: Load-Bearing Claims

**Filter:** `confidence_tier` is High or Moderate AND combined degree >= 2

These claims anchor the argument. They're well-supported, but if any turn out to be wrong, the most output breaks.

| Claim | Phase | Confidence | Sources | Degree | Why it matters |
|-------|-------|------------|---------|--------|----------------|
| `{id}` — {short text} | {phase} | {tier} | {source_count} | {degree} | {one-line: what depends on it} |

If no claims qualify, report: "No high-degree load-bearing claims detected — evidence base is distributed rather than concentrated."

### Bucket 2: Fragile Foundations

**Filter:** `confidence_tier` is Low or Insufficient AND combined degree >= 1

These claims are thinly supported but other parts of the research depend on them. Biggest risk areas.

| Claim | Phase | Confidence | Sources | Degree | Risk |
|-------|-------|------------|---------|--------|------|
| `{id}` — {short text} | {phase} | {tier} | {source_count} | {degree} | {one-line: what breaks if wrong} |

If no claims qualify, report: "No fragile foundations detected — all connected claims have Moderate or better confidence."

### Bucket 3: Cheapest Confidence Upgrades

**Filter:** `confidence_tier` is Low AND `source_count` == 1

Each of these is one independent source away from a confidence upgrade. Highest-ROI research tasks.

| Claim | Phase | Current Tier | What to look for |
|-------|-------|-------------|------------------|
| `{id}` — {short text} | {phase} | Low (1 source) | {one-line: what kind of source would independently confirm this} |

If no claims qualify, report: "No single-source Low claims — all Low-confidence claims already have multiple sources (upgrade requires stronger sources, not more)."

### Bucket 4: Convergence Clusters

**Filter:** `confidence_tier` is High AND `source_count` >= 3

Multiple independent sources converge on these claims. Strongest ground.

| Claim | Phase | Sources | Convergence |
|-------|-------|---------|-------------|
| `{id}` — {short text} | {phase} | {source_count} | {one-line: which source types agree} |

If no claims qualify, report: "No strong convergence clusters yet — no claim has 3+ independent sources at High confidence."

6. **Type-specific framing.** After the 4 buckets, add a section:

### What This Means For Your {Research Type}

Write 2-3 sentences tailored to the research type. Use this mapping:

| Research Type | Framing Focus |
|---|---|
| competitive-analysis | Which competitive claims are triangulated vs single-sourced. Positioning decisions to trust vs verify. |
| prd-validation | Which product assumptions have converging evidence vs which rest on one data point. Build confidence in the thesis or identify where it's thin. |
| company-for-profit / company-non-profit | Which financial or operational claims are load-bearing for the assessment. Where one source changing would shift the conclusion. |
| market-industry | Which market sizing claims are well-sourced vs which are one analyst's estimate. Where the numbers could move. |
| person-research | Which biographical or credential claims are independently verified vs single-source. What you can state with confidence vs what needs verification. |
| exploratory-thesis | Which thesis-supporting claims have counter-evidence and which are unchallenged. Where the thesis is tested vs where it's assumed. |
| curriculum-research | Which pedagogical claims are established vs emerging with thin evidence. What to teach with confidence vs what to present as developing. |
| customer-safari | Which user behavior patterns are observed across multiple sources vs anecdotal. Patterns to design around vs hypotheses to test further. |
| presentation-research | Which claims the audience could challenge and how well each is defended. Where to lead with confidence vs where to hedge. |
| opportunity-discovery | Which opportunity signals are triangulated vs speculative single-source. Where to invest investigation vs where to stay exploratory. |

If the research type is not recognized, skip this section.

## Transition Prompt

End with a `▶ NEXT:` block (format defined in `${CLAUDE_PLUGIN_ROOT}/reference/prompt-templates-runtime.md`). Context-sensitive:

- **If Fragile Foundations is non-empty:** recommend `/know-research:discover` — targeted discovery to close the fragile claims
- **If all buckets look healthy:** recommend `/know-research:progress` — full project dashboard
- **If graph is sparse (< 10 claims):** note that more phases need to complete before the analysis is meaningful, recommend `/know-research:audit-claims` on the next draft

## Guardrails

1. This skill is **read-only** — it does NOT write any files.
2. Do not editorialize on whether the research is "good enough." Present the structure and let the user decide.
3. Do not repeat full claim text — use claim IDs and the first ~10 words as short descriptions.
4. Cap each bucket at 5-7 claims max (top N by combined degree). The full graph is in the JSON for anyone who wants it.
5. Do not confuse this with audit-claims. Audit-claims evaluates individual claim accuracy. This skill evaluates the *structural health* of the evidence base as a whole.
6. If the graph has claims but all buckets are empty (everything is Moderate with degree 1, no convergence), say so plainly: "The evidence base is uniformly moderate with no concentration points. No claims stand out as load-bearing, fragile, or strongly converged."
