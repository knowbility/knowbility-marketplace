---
research-type: market-industry
description: Phase-grouped channel routing for market and industry landscape research
active-channels:
  - web-search
  - academic
  - regulatory
  - financial
  - social-signals
  - domain-specific
---

# Market/Industry Type-Channel Map

**How to use this map:** The discover skill reads this file to determine which channels to query for each phase of a market/industry research project. Match the current phase name against the phase keywords listed in each discovery group. Execute all Primary channels; activate Secondary channels if Primary results fall below 5-8 sources. Synthesis and risk phases are omitted — no new discovery is needed for those phases.

---

## Discovery Group 1: Market Definition and Scope

**Phase keywords:** definition, scope, boundaries, maturity, current state, landscape overview, market overview

**Primary channels:**
- web-search — broad landscape framing; market definition articles, analyst overviews, industry primers
- regulatory — government statistical databases (BLS, Census, OECD, Eurostat) for macro scope data
- financial — SEC filings and earnings calls for how public companies define their addressable market

**Secondary channels:**
- academic — peer-reviewed research for methodology-backed definitions of market boundaries

**Rationale:** Market definition requires authoritative framing from official stats and analyst overviews; regulatory and financial primary sources rank highest in the type's credibility hierarchy for macro data.

---

## Discovery Group 2: Market Size, Growth, and Adoption

**Phase keywords:** size, growth, adoption, market sizing, growth rate, adoption patterns, segments

**Primary channels:**
- financial — VC/funding databases (Crunchbase, PitchBook) for investment signals; SEC filings and earnings calls for company-level market data
- regulatory — government statistics and official data releases (BLS, Census, OECD) for macro sizing
- web-search — analyst firm reports (Gartner, Forrester, IDC, McKinsey) for market sizing estimates; developer survey results (Stack Overflow, JetBrains) for tech adoption signals

**Secondary channels:**
- academic — peer-reviewed studies with disclosed sample size and methodology for adoption research
- domain-specific — industry market report databases (Statista, IBISWorld, Grand View Research) for sector-specific sizing

**Rationale:** Market size and adoption data must be traceable to government statistics, analyst methodology, or financial filings — the top tiers of this type's credibility hierarchy. Multiple source types are needed to surface the range of estimates rather than a single figure.

---

## Discovery Group 3: Key Players and Ecosystem Mapping

**Phase keywords:** key players, ecosystem, vendors, platforms, competitors, participants, landscape map, players

**Primary channels:**
- financial — Crunchbase/PitchBook for company profiles, funding rounds, and M&A activity; SEC filings for public company market position statements
- web-search — analyst ecosystem maps, trade press coverage, company official pages for positioning

**Secondary channels:**
- domain-specific — industry databases (Crunchbase, PitchBook, IBISWorld) for structured company data and market share estimates
- regulatory — industry association reports and trade group filings for ecosystem participant registries

**Rationale:** Key player mapping depends on verified funding/financial data and analyst ecosystem maps — financial and web-search primary sources provide the cross-validated picture needed before adding niche databases.

---

## Discovery Group 4: Technology and Capability Landscape

**Phase keywords:** technology, capability, technical, innovation, state of the art, technical constraints, capabilities, maturity curve, technical landscape

**Primary channels:**
- academic — peer-reviewed benchmarks, technical evaluations, and capability assessments rank highest for technology claims
- domain-specific — patent search (Google Patents) for IP landscape and innovation direction; industry databases for standards body publications

**Secondary channels:**
- web-search — technical documentation, benchmark publications, developer surveys (Stack Overflow, JetBrains) for adoption signals within tech
- regulatory — NIST, ISO, and standards body documentation for technical standards and specifications

**Rationale:** Technology assessment demands peer-reviewed research and patent evidence over commercial claims — academic and domain-specific (patents) align with the credibility hierarchy's preference for methodology-backed and legally-filed sources.

---

## Discovery Group 5: Investment and Funding Patterns

**Phase keywords:** investment, funding, VC, venture capital, M&A, acquisition, spending, money flow, capital

**Primary channels:**
- financial — VC and funding databases (Crunchbase, PitchBook, CB Insights) for deal data; SEC filings for public company capex and M&A disclosures
- web-search — trade journalism and news for announced funding rounds and M&A activity

**Secondary channels:**
- domain-specific — Crunchbase and PitchBook via domain-scoped search for structured deal-level data

**Rationale:** Investment patterns require financial database coverage and official disclosure data — the financial channel is primary because VC databases and SEC filings are highest credibility for deal-level information.

---

## Discovery Group 6: Regulatory Environment

**Phase keywords:** regulatory, regulation, compliance, policy, government, legislation, legal, standards, regulatory environment

**Primary channels:**
- regulatory — SEC filings (industry-specific disclosures), government agency publications, official regulation text, industry association reports
- web-search — trade press and news for regulatory developments; official government agency pages

**Secondary channels:**
- academic — peer-reviewed research on regulatory impacts and policy analysis

**Rationale:** Regulatory discovery must go to primary government and official sources first — web-search supplements with recent developments and news that may precede official publication.

---

## Discovery Group 7: Barriers, Accelerators, and Segment Variations

**Phase keywords:** barriers, accelerators, challenges, drivers, segments, regional, geography, verticals, SMB, enterprise, adoption barriers

**Primary channels:**
- web-search — analyst reports on barriers/drivers; survey data on adoption challenges; regional market coverage
- social-signals — developer and practitioner community discussions on real-world friction points; user forums for bottom-up adoption signals

**Secondary channels:**
- academic — peer-reviewed research on diffusion of innovation and adoption factor analysis
- regulatory — regulatory filings that surface compliance barriers specific to regulated industries

**Rationale:** Barriers and accelerators require both analyst synthesis and ground-level practitioner signals — social-signals supplements analyst reports with current, unfiltered adoption friction evidence.

---

## Discovery Group 8: Emerging Trends and Inflection Points

**Phase keywords:** emerging, trends, inflection, next 1-3 years, future, shifts, disruption, inflection points, what is changing

**Primary channels:**
- web-search — analyst trend reports (Gartner Hype Cycle, Forrester wave reports); trade press on emerging developments
- academic — recent peer-reviewed research on nascent capabilities and early-stage technologies
- financial — VC funding patterns as a leading indicator of emerging bets

**Secondary channels:**
- social-signals — early developer and innovator community discussions as leading indicators ahead of mainstream coverage
- domain-specific — patent search for technology directions that have not yet reached mainstream coverage

**Rationale:** Emerging trend detection requires triangulation across analyst synthesis, academic research, and financial signal (VC bets) — no single channel is sufficient for uncertain, forward-looking assessment.

---

## Domain-Specific Sources

**Active type hooks from domain-specific channel playbook:**

### Industry Databases
**Use for:** Market sizing, key players, investment patterns, segment data

```
Type hook: Industry Databases
Sources: Crunchbase, PitchBook, IBISWorld, Statista, Grand View Research, Mordor Intelligence
Apply to groups: 2 (Market Size), 3 (Key Players), 5 (Investment)
```

Query guidance:
- Crunchbase/PitchBook: Company profiles, funding rounds, M&A — use for Groups 3 and 5
- IBISWorld/Statista/Grand View Research: Market sizing and sector reports — use for Group 2
- Limit to 5-10 domain-specific queries per session to avoid Tavily budget overrun

### Patent Search
**Use for:** Technology and capability phases; innovation landscape mapping

```
Type hook: Patent Search
Sources: Google Patents (USPTO, EPO filings)
Apply to groups: 4 (Technology), 8 (Emerging Trends)
```

Query guidance:
- Search by technology keyword and date range for innovation tracking
- Use for Groups 4 and 8 when the research question involves IP landscape or innovation direction
- Construct Google Patents URL, then extract via tvly extract

---

## Omitted Phases

The following phase types have no discovery channel mapping — they work from sources gathered in previous phases:

- **Risks and uncertainties** — synthesizes from prior discovery; no new channel queries needed
- **Synthesis / landscape report** — final output phase; no new discovery

If the discover skill finds no group match for a phase name, it should report: "No discovery channels mapped for this phase — this phase uses existing sources."
