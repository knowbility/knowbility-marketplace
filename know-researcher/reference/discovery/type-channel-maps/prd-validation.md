---
research-type: prd-validation
description: Phase-grouped channel routing for PRD assumption validation research
active-channels:
  - web-search
  - academic
  - financial
  - social-signals
  - domain-specific
---

# PRD Validation Type-Channel Map

**How to use this map:** The discover skill reads this file to determine which channels to query for each phase of a PRD validation research project. Match the current phase name against the phase keywords listed in each discovery group. Execute all Primary channels; activate Secondary channels if Primary results fall below 5-8 sources. Synthesis phases are omitted — no new discovery is needed for those phases.

**Note:** PRD validation phases are generated from PRD assumption clusters, so exact phase names vary by project. Match on the assumption category (technical, market, user behavior, competitive) rather than a fixed phase number.

---

## Discovery Group 1: Market and Business Assumptions

**Phase keywords:** market assumptions, market validation, market size, business model, unit economics, TAM, cost projections, revenue model, go-to-market

**Primary channels:**
- financial — VC/funding databases (Crunchbase, PitchBook) for market sizing signals; SEC filings and earnings calls for comparable company financials and market definitions
- web-search — analyst firm reports (Gartner, Forrester, IDC) for market sizing; industry reports for comparable business model validation

**Secondary channels:**
- academic — peer-reviewed economics or business research for market structure analysis and unit economics benchmarks
- domain-specific — industry databases (Crunchbase, PitchBook, IBISWorld) for structured market data and funding comparables

**Rationale:** Market assumption validation depends on industry reports and analyst research (top of this type's credibility hierarchy) cross-referenced against financial data from comparable companies.

---

## Discovery Group 2: Technical Architecture and Feasibility

**Phase keywords:** technical, architecture, feasibility, technical choices, tech stack, infrastructure, API, protocol, integration, implementation, performance, benchmarks, technical debt, scalability

**Primary channels:**
- academic — peer-reviewed benchmark studies and performance comparisons; technical evaluations with disclosed methodology rank highest for feasibility claims
- domain-specific — patent search (Google Patents) for prior art and IP landscape; official API/protocol documentation for integration feasibility

**Secondary channels:**
- web-search — official documentation (AWS, GCP, API docs, protocol specs); developer community discussion (Stack Overflow, GitHub issues) for implementation reality checks; benchmark publications

**Rationale:** Technical feasibility requires methodology-backed benchmarks and official documentation over commercial claims — academic and official sources rank highest in the credibility hierarchy for architecture decisions.

---

## Discovery Group 3: User Behavior and Pain Points

**Phase keywords:** user behavior, user needs, pain points, user assumptions, how users engage, customer behavior, adoption, user research, customer validation

**Primary channels:**
- social-signals — user reviews (G2, Capterra, Reddit, product forums), developer and practitioner communities, discussion threads on comparable products for ground-truth user behavior signals
- web-search — published user research reports, survey data with disclosed methodology, UX research publications

**Secondary channels:**
- academic — peer-reviewed user behavior research and human-computer interaction studies for behavioral assumption backing

**Rationale:** User behavior assumptions are best validated by actual user discourse (social-signals) and published survey research — practitioner community discussion provides the highest-fidelity signal for how users actually behave vs. how PRDs assume they will.

---

## Discovery Group 4: Competitive Alternatives and Landscape

**Phase keywords:** competitive, alternatives, competitors, comparable products, existing solutions, competitive landscape, market alternatives, substitutes

**Primary channels:**
- web-search — competitor websites, product comparison articles, analyst competitive landscape reports; official product documentation for feature-level comparison
- financial — Crunchbase/PitchBook for competitor funding and scale; SEC filings for public competitor market position statements

**Secondary channels:**
- social-signals — user reviews (G2, Capterra) for comparative user sentiment; community discussions on why users choose or switch between alternatives
- domain-specific — G2 and Capterra structured review databases for comparative feature and user satisfaction data

**Rationale:** Competitive validation requires both analyst-level positioning (web-search/financial) and user-level comparative data (social-signals) — the credibility hierarchy places news and company websites as moderate, so triangulation across multiple source types is essential.

---

## Discovery Group 5: Integration Dependencies and External Stability

**Phase keywords:** integration, dependencies, APIs, protocols, third-party, platforms, external services, SDK, compatibility, versioning, deprecation

**Primary channels:**
- web-search — official API documentation, platform status pages, changelog and deprecation notices; GitHub repositories for SDK stability signals
- social-signals — developer community discussions (Stack Overflow, GitHub Issues, HN) on integration pain points and breakage history

**Secondary channels:**
- academic — technical papers on protocol stability and interoperability standards where relevant to the integration

**Rationale:** Integration dependency validation requires official documentation (highest credibility) supplemented by developer community reality checks — social-signals is secondary because developer forums surface real-world integration failures that official docs don't disclose.

---

## Discovery Group 6: Timeline and Comparable Project Estimates

**Phase keywords:** timeline, estimates, schedule, realistic, comparable projects, delivery, milestones, time to build, effort

**Primary channels:**
- web-search — post-mortems, case studies, and engineering blog posts from comparable projects; developer surveys (Stack Overflow) for technology-specific build time benchmarks
- social-signals — practitioner community discussions on real-world build timelines and complexity surprises

**Secondary channels:**
- academic — software engineering research on project estimation accuracy and comparable project benchmarks

**Rationale:** Timeline validation is primarily empirical — case studies, practitioner experience, and community reports provide higher-fidelity evidence than analyst projections for project-level estimates.

---

## Domain-Specific Sources

**Active type hooks from domain-specific channel playbook:**

### Patent Search
**Use for:** Technical architecture phases; prior art and IP landscape validation

```
Type hook: Patent Search
Sources: Google Patents (USPTO, EPO, WIPO filings)
Apply to groups: 2 (Technical Architecture)
```

Query guidance:
- Search by technology keywords for prior art — determines if proposed architecture is novel or established
- Search by potential competitor names to map IP holdings that could affect technical choices
- Use `tvly extract` on constructed Google Patents URLs

### Industry Databases (Competitive and Market Validation)
**Use for:** Market assumption and competitive alternative phases

```
Type hook: Industry Databases
Sources: G2, Capterra (for product comparison and user reviews), Crunchbase/PitchBook (for funding and competitive scale)
Apply to groups: 1 (Market), 4 (Competitive)
```

Query guidance:
- G2/Capterra: Structured product comparison data and aggregated user reviews — use for Group 4
- Crunchbase/PitchBook: Competitor funding rounds and growth signals — use for Groups 1 and 4
- IBISWorld/Statista: Market sizing validation for business model assumptions — use for Group 1
- Limit to 5-10 domain-specific queries per session

---

## Omitted Phases

The following phase types have no discovery channel mapping — they work from sources gathered in previous phases:

- **Synthesis / executive summary** — final output phase; no new discovery
- **Gap analysis** — identifies what couldn't be found; uses existing discovery results

If the discover skill finds no group match for a phase name, it should report: "No discovery channels mapped for this phase — this phase uses existing sources."
