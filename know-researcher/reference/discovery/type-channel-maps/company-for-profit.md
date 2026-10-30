---
research-type: company-for-profit
description: Phase-grouped channel routing for for-profit company research
active-channels:
  - web-search
  - regulatory
  - financial
  - social-signals
  - domain-specific
---

# Type-Channel Map: Company (For-Profit)

Maps each discovery phase to prioritized channels derived from the company-for-profit credibility hierarchy. Synthesis and risks phases are omitted — those phases use existing sources, not new discovery.

If the discover skill finds no group match for a phase, it reports: "No discovery channels mapped for this phase — this phase uses existing sources."

---

## Discovery Group: Company Identity and Overview

**Phases:** overview, company identity, what they do, history

**Primary channels:**
- web-search
- regulatory

**Secondary channels (if primaries return fewer than 5-8 sources):**
- domain-specific

**Rationale:** Company overview relies on public filings (regulatory) and general web coverage (web-search) as the most authoritative starting points; funding databases add founding and ownership context.

---

## Discovery Group: Leadership and Governance

**Phases:** leadership, team, executives, board, governance, hiring

**Primary channels:**
- social-signals
- web-search

**Secondary channels (if primaries return fewer than 5-8 sources):**
- regulatory

**Rationale:** LinkedIn (social-signals) is the highest-credibility source for team composition and hiring patterns; regulatory filings (proxy statements) corroborate executive roles and compensation when needed.

---

## Discovery Group: Products, Technology, and IP

**Phases:** products, services, technology, tech, IP, intellectual property, patents, architecture

**Primary channels:**
- domain-specific
- web-search

**Secondary channels (if primaries return fewer than 5-8 sources):**
- social-signals
- academic

**Rationale:** Patent filings (domain-specific patent search hook) are the highest-credibility source for IP and technical approach; user reviews (social-signals) surface implementation reality beyond marketing claims.

---

## Discovery Group: Financial Health and Funding

**Phases:** financials, funding, revenue, burn rate, profitability, financial health, investors, rounds

**Primary channels:**
- regulatory
- domain-specific

**Secondary channels (if primaries return fewer than 5-8 sources):**
- financial
- web-search

**Rationale:** SEC filings (regulatory) are the highest-credibility source for public company financials; Crunchbase/PitchBook (domain-specific industry databases hook) are the highest-credibility source for private funding rounds and investor data.

---

## Discovery Group: Market Position and Competitive Landscape

**Phases:** market position, competitive landscape, market share, industry, market context, positioning

**Primary channels:**
- web-search
- financial

**Secondary channels (if primaries return fewer than 5-8 sources):**
- domain-specific

**Rationale:** Industry analyst reports (web-search) are the highest-credibility source for market structure and competitive positioning; financial and market intelligence databases (domain-specific) add structured market sizing data.

---

## Discovery Group: Customers and Traction

**Phases:** customers, traction, user base, growth, retention, case studies, testimonials

**Primary channels:**
- social-signals
- web-search

**Secondary channels (if primaries return fewer than 5-8 sources):**
- regulatory

**Rationale:** User reviews (G2, Capterra — social-signals) are the highest-credibility source for product quality reality and customer sentiment; regulatory filings may include customer concentration disclosures for public companies.

---

## Discovery Group: Partnerships and Ecosystem

**Phases:** partnerships, integrations, ecosystem, alliances, channels, distribution

**Primary channels:**
- web-search
- regulatory

**Secondary channels (if primaries return fewer than 5-8 sources):**
- social-signals

**Rationale:** Partnership announcements and press releases (web-search) are primary; SEC filings (regulatory) disclose material agreements and dependencies for public companies.

---

## Discovery Group: Culture and Talent

**Phases:** culture, talent, employees, retention, satisfaction, workplace, values

**Primary channels:**
- social-signals
- web-search

**Secondary channels (if primaries return fewer than 5-8 sources):**
- domain-specific

**Rationale:** Glassdoor and Blind (social-signals) are the highest-credibility sources for culture patterns despite known negative skew; LinkedIn (domain-specific industry databases hook) shows hiring velocity and talent composition.

---

## Domain-Specific Sources

The following type hooks from the domain-specific channel playbook apply to company-for-profit research:

**Patent Search hook** — applies to: products, technology, IP, patents phases
- Source: Google Patents (USPTO/EPO filings)
- Use: Verify technology claims, identify IP portfolio, assess technical moat
- Query strategy: Assignee search by company name, filtered to last 5 years

**Industry Databases hook** — applies to: financials, funding, market position, leadership phases
- Crunchbase: Funding rounds, investors, founding data, employee estimates
- PitchBook: Venture funding history and investor relationships
- G2: User reviews and product ratings (product quality reality check)
- Capterra: User reviews for software products (SMB/mid-market perspective)
- LinkedIn: Team composition, hiring patterns, headcount trends (accessed via social-signals channel; listed here for cross-reference)
