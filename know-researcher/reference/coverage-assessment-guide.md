# Coverage Assessment Guide

How to distinguish real coverage from thin coverage when assessing research gaps.

## Evidence Depth vs. Breadth

- **Breadth:** How many of the phase's questions have at least one source?
- **Depth:** For each addressed question, how many independent sources provide substantive evidence?

A phase can have high breadth and low depth — every question touched but none answered well enough to write a defensible synthesis. Report both dimensions.

## What "Addressed" Actually Means

A question is **addressed** when:
- A source note contains a specific claim, data point, or argument that directly answers the question
- The evidence is substantive — enough to write about, not just a passing mention
- The source note is in `research/notes/`, not in conversation memory

A question is **NOT addressed** when:
- A source mentions the topic but provides no evidence (e.g., "market size is important" without a number)
- The answer exists only in conversation memory, not in a processed source note
- A source addresses a related but different question — classify as Adjacent, not Direct (see Match Classification)
- The only "evidence" is the source repeating a claim without its own data

## Match Classification

Every source note's relevance to a given question is classified into one of four tiers:

- **Direct:** Source contains a specific claim, data point, or argument that substantively answers the question. The source's evidence directly addresses the question's subject matter. Direct matches count toward coverage status.
- **Adjacent:** Source addresses a related topic but does not answer the specific question. Example: a source about "cloud infrastructure market size" is adjacent to a question about "AWS market share" — related but not the same question. Display with explanation: "Addresses [actual topic] rather than [phase question]". Adjacent matches do **not** count toward coverage status.
- **Contradicts:** Source actively opposes or contradicts the research question's hypothesis — same topic as the question but arguing the opposite conclusion. Distinguished from Adjacent (which is a different topic) and from Direct (which supports the question). Display with explanation: "Contradicts [phase question] by [brief description]". Contradicts matches do **not** count toward Direct coverage status, but do trigger "Evidence Against" status when no Direct sources exist.
- **None:** Source does not address the question or any related topic. Not listed in per-question detail.

**Critical rule:** Adjacent matches do not contribute to coverage status. A question with 3 Adjacent sources and 0 Direct sources is **Not Started**, not Partial or Complete.

**Critical rule:** Contradicts is not Adjacent. A source arguing against the hypothesis is Contradicts. A source about a related-but-different topic is Adjacent. Never use Adjacent as a catch-all for inconvenient sources — the distinction is load-bearing for Evidence Against detection.

## Source Diversity Requirements

Questions answered by only one source type carry coverage risk:

| Source Composition | Risk Level | Action |
|---|---|---|
| 3+ independent sources, mixed types | Low | Solid coverage |
| 2-3 sources, same type (e.g., all vendor blogs) | Moderate | Flag as "covered but source-type skewed" |
| 1 source only | High | Flag as "thin — single source" |
| Multiple sources, all citing the same original | High | Flag as "echo — one underlying data point" |

**Balance risk:** Questions answered by sources from only one perspective (e.g., all pro, all con, all from incumbents) have balance risk even if source count is adequate.

## Coverage Status Definitions

Use these labels consistently in `research/gaps.md`. All statuses are calculated using **independent Direct source count only** — Adjacent matches do not contribute.

- **Complete:** 3+ **independent** sources with **Direct** matches, no unresolved contradictions, source types are mixed
- **Partial:** 1-2 **independent** sources with Direct matches, or sources exist but coverage is thin, one-sided, or source-type skewed
- **Not started:** No source notes have a **Direct** match for this question (including questions with only Adjacent matches)
- **Evidence Against:** No source notes have a **Direct** match for this question, but at least one source note is classified **Contradicts** — meaning active counter-evidence exists. Distinguished from "Not started" (which means no sources at all, for or against). An Evidence Against question is a synthesis challenge: the user must address the contradiction, not find more sources. Discovery will not resolve it.
- **Addressed but unbalanced:** **Direct** sources exist but represent only one perspective or source type

**Note:** Adjacent matches do not contribute to coverage status. A question with 3 Adjacent sources and 0 Direct sources is Not Started.

## Source Independence

Independence determines how many distinct data points exist for a question — not how many source notes reference it.

- Independence is established by the **origin_chain field** in source notes only when it affirmatively identifies distinct origins
- **Independence defaults to unknown, never assumed.** A source whose origin chain reads "Origin unclear" has UNKNOWN independence: it counts toward Direct coverage existence but supplies no corroboration credit. A question whose 2+-source status rests on unclear-origin sources is "independence unverified" — treat as lopsided-risk, not confirmed convergence. Three differently-worded articles from one hidden press release are one data point, whether or not any of them says so.
- Sources sharing the same cited original (e.g., multiple articles all citing the same Gartner report) collapse to **one independent data point**
- **Shared-wording / shared-figure heuristics:** near-identical phrasing, the same uncommon figure with identical rounding, or the same unattributed quote across sources — especially unclear-origin ones — mark a *suspected* shared-origin cluster. Treat it as Echo level (one data point) until independence is established.
- Coverage status uses independent source count: 3 sources sharing one origin = 1 independent = Partial, not Complete
- Two sources with clear, distinct origins that independently reach the same conclusion are still two independent sources — collapse requires tracing to the same origin (confirmed or suspected), not mere agreement
- Cross-reference with `pattern-recognition-guide.md` Echo level for shared-origin clusters

## When to Accept Gaps

A gap is **acceptable** when:
- Sources for the question were **not found via the mapped discovery channels** after actual searching (not just assumption). Note the limit of the claim: purposive sampling through mapped channels can establish "not found where we looked," never "does not exist." Record the gap in those terms.
- The user has explicitly acknowledged the gap and decided to proceed
- The question is peripheral to the phase's core objective

**How the first condition gets reached in practice.** "Not found via the mapped channels
after actual searching" used to depend on the commissioner volunteering that judgment.
`/know-research:check-gaps` now computes the situation: when `/know-research:cross-ref`'s saturation
record says a question has stopped producing new information across independent origins, and
its independent Direct coverage is still below the bar, the gap check names the state and puts
three outcomes to the commissioner — accept the gap, re-scope the question, or open a channel
discovery never mapped. Acceptance is one of three answers, never the default and never the
agent's to choose.

Note what saturation licenses and what it does not. It supports "not found where we looked."
It never supports "does not exist" — which is why *change the channels* is always on the table
and why an accepted gap is recorded in found-where-we-looked terms.

A gap is **NOT acceptable** just because:
- It is documented in gaps.md (documenting a gap does not resolve it)
- The phase has "enough" sources overall (coverage is per-question, not per-phase)
- Finding sources would take too long (flag the time constraint to the user, let them decide)

## Coverage Assessment Workflow

For each phase question:
1. List source notes that address the question — classify each as Direct, Adjacent, Contradicts, or None
2. For Contradicts classifications: verify the source actively argues against the hypothesis (not merely presenting a different facet). If in doubt, use Adjacent — only use Contradicts when the source's conclusion directly opposes the research question.
3. For Direct sources, verify the evidence is substantive (not a passing mention)
4. Check source independence using origin_chain — collapse shared-origin sources to one independent data point
5. Check source type diversity
6. Check perspective balance
7. Assign a coverage status using the definitions above — based on independent Direct source count only
