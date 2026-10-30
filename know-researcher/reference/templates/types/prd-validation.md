# PRD Validation

**Finding Tags:**
- **VALIDATED** — External evidence supports the PRD's claim or assumption
- **CHALLENGED** — External evidence contradicts or complicates the PRD's position
- **UNVERIFIABLE** — Can't confirm or deny with available sources; flag for internal validation
- **MISSING** — The PRD doesn't address something it should
- **OUTDATED** — The PRD references something that has changed since it was written

**Staleness Threshold:** 2 years — technical architecture, APIs, and market assumptions evolve quickly

**What to Validate:**
- Technical architecture choices — are they current best practice or already outdated?
- Timeline estimates — are they realistic given comparable projects?
- Market assumptions — do the numbers hold up against external data?
- Competitive claims — has anyone already built what the PRD describes?
- Integration dependencies — are the assumed APIs, protocols, and platforms stable?
- Cost projections — are the unit economics realistic?
- User behavior assumptions — does external research support how users are expected to engage?

**Source Credibility Hierarchy:**
- Official documentation (AWS, API docs, protocol specs) → high credibility
- Industry reports, analyst research → high credibility
- Benchmark studies, performance comparisons → high if methodology is sound
- Developer community discussion (Stack Overflow, GitHub issues) → high for implementation reality
- News coverage → moderate, check for primary source
- Company websites and marketing → low credibility for claims, useful for feature comparison
- AI-generated summaries without sources → not a source, do not use

**Boundaries:**
- This project is research and validation, not implementation. Do not write product code, deploy anything, or modify systems outside `research/`.
- Do not fabricate sources or data. If information isn't findable, log it as a gap.
- Do not over-index on any single source. Triangulate.
- If a research question can't be answered with available tools and public sources, say so in `gaps.md` and flag it as needing internal validation.

**Typical shape (non-binding):** 8-10 phases from PRD assumption clusters + synthesis.

**Success Criteria:**
1. Every major PRD assumption has been tagged
2. All outputs have been audited for unsupported claims
3. The commissioned deliverable(s) give a clear go/no-go/modify verdict per PRD section
4. Technical risks are specific enough for engineering to plan around
5. Every factual claim traces to a processed source
