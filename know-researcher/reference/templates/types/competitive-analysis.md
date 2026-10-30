# Competitive Analysis

**Finding Tags:**
- **CONFIRMED** — Multiple sources confirm this competitive claim or market position
- **DISPUTED** — Sources disagree or the claim doesn't hold up under scrutiny
- **UNVERIFIABLE** — Can't confirm with public sources; may require direct testing or insider knowledge
- **EMERGING** — New player, feature, or trend with limited data but worth tracking
- **GAP** — Market gap or unserved need identified through competitive analysis

**Staleness Threshold:** 1 year — competitive positioning, features, and pricing shift frequently

**What to Analyze:**
- Market boundaries — what's in scope and what's adjacent?
- Player identification — who competes directly, indirectly, and who's adjacent?
- Feature and capability comparison — what does each player actually do vs. claim to do?
- Positioning and messaging — how does each player describe themselves and to whom?
- Pricing and business models — how do they make money, and what does it cost users?
- Technology and architecture — what's their technical approach? (when relevant)
- Traction and scale — user counts, revenue, funding, growth signals
- Strengths and weaknesses — what does each player do well and poorly?
- Trends — where is the market heading?
- White space — what's not being served?

**Source Credibility Hierarchy:**
- Product documentation, feature pages, and pricing pages → high for feature data, low for claims
- User reviews and community discussion (G2, Capterra, Reddit, HN) → high for implementation reality
- Industry analyst reports (Gartner, Forrester, CB Insights) → high for market structure
- SEC filings, investor decks, earnings calls → high for financials and strategy
- Crunchbase, PitchBook, LinkedIn → high for funding, team, and company data
- Company blogs and marketing → low credibility for claims, useful for positioning and messaging
- News coverage → moderate, check for primary source and recency
- AI-generated summaries without sources → not a source, do not use

**Boundaries:**
- This project is research and analysis, not implementation. Do not write product code or modify systems outside `research/`.
- Do not fabricate competitive data. If a competitor's metrics aren't public, log it as unverifiable.
- Do not over-index on marketing claims. Verify features through documentation, reviews, or direct testing when possible.
- If competitive intelligence requires product access or insider knowledge, flag it in `gaps.md`.

**Typical shape (non-binding):** 6-8 phases (market definition → competitors → features → positioning → pricing → trends → white space → synthesis).

**Success Criteria:**
1. Every identified competitor has been profiled with verified data
2. Feature comparison matrix covers all meaningful dimensions
3. Market gaps are specific enough to inform product decisions
4. All outputs have been audited for unsupported claims
5. The synthesis produces actionable positioning recommendations
6. Every factual claim traces to a processed source
