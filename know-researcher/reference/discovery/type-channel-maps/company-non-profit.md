---
research-type: company-non-profit
description: Phase-grouped channel routing for non-profit company research
active-channels:
  - web-search
  - regulatory
  - academic
  - social-signals
  - domain-specific
---

# Type-Channel Map: Company (Non-Profit)

Maps each discovery phase to prioritized channels derived from the company-non-profit credibility hierarchy. Synthesis and risks phases are omitted — those phases use existing sources, not new discovery.

If the discover skill finds no group match for a phase, it reports: "No discovery channels mapped for this phase — this phase uses existing sources."

---

## Discovery Group: Mission and Organizational Identity

**Phases:** mission, theory of change, overview, history, identity, what they do

**Primary channels:**
- web-search
- regulatory

**Secondary channels (if primaries return fewer than 5-8 sources):**
- domain-specific

**Rationale:** IRS determination letters and state charity registrations (regulatory) verify nonprofit status and declared mission; web-search captures public-facing identity and news coverage.

---

## Discovery Group: Leadership and Governance

**Phases:** leadership, governance, board, executives, team, staff

**Primary channels:**
- regulatory
- social-signals

**Secondary channels (if primaries return fewer than 5-8 sources):**
- web-search

**Rationale:** Form 990 filings (regulatory via ProPublica) disclose officer compensation and board composition with legal authority; LinkedIn (social-signals) fills in organizational structure and scale not captured in filings.

---

## Discovery Group: Programs and Services

**Phases:** programs, services, activities, interventions, delivery, beneficiaries

**Primary channels:**
- web-search
- domain-specific

**Secondary channels (if primaries return fewer than 5-8 sources):**
- academic

**Rationale:** Program documentation lives primarily on the organization's own web presence and third-party evaluations (web-search); charity evaluators (domain-specific) provide independent program summaries and ratings.

---

## Discovery Group: Impact and Effectiveness

**Phases:** impact, outcomes, effectiveness, measurement, evidence, evaluation, results

**Primary channels:**
- academic
- web-search

**Secondary channels (if primaries return fewer than 5-8 sources):**
- regulatory

**Rationale:** Academic program evaluations and impact studies are the highest-credibility source for outcome evidence; annual reports and independent evaluations (web-search) provide organizational self-reporting to compare against.

---

## Discovery Group: Financial Health (990 Filings)

**Phases:** financials, financial health, budget, expenses, revenue, overhead, reserves, financial data

**Primary channels:**
- regulatory
- domain-specific

**Secondary channels (if primaries return fewer than 5-8 sources):**
- web-search

**Rationale:** IRS Form 990 filings via ProPublica Nonprofit Explorer (regulatory) are the highest-credibility source for nonprofit financials; GuideStar/Candid and Charity Navigator (domain-specific) aggregate 990 data with additional context and ratings.

---

## Discovery Group: Funding Landscape

**Phases:** funding, donors, grants, public funding, revenue sources, fundraising, diversification

**Primary channels:**
- regulatory
- domain-specific

**Secondary channels (if primaries return fewer than 5-8 sources):**
- web-search

**Rationale:** Government grant records via USASpending.gov (regulatory) and 990 Schedule B disclosures (regulatory) establish public funding flows; domain-specific charity evaluators and Foundation Directory Online add private funder data.

---

## Discovery Group: Partnerships and Ecosystem

**Phases:** partnerships, collaborations, ecosystem, alliances, coalitions, networks

**Primary channels:**
- web-search
- regulatory

**Secondary channels (if primaries return fewer than 5-8 sources):**
- social-signals

**Rationale:** Partnership announcements and collaborative programs are documented via general web coverage (web-search); 990 filings may disclose related organizations and joint ventures (regulatory).

---

## Discovery Group: Reputation and Capacity

**Phases:** reputation, perception, stakeholders, capacity, staffing, scale, organizational capacity

**Primary channels:**
- domain-specific
- social-signals
- web-search

**Secondary channels (if primaries return fewer than 5-8 sources):**
- academic

**Rationale:** Charity evaluators (domain-specific) provide independent ratings; Glassdoor/Indeed (social-signals) surface employee perspectives on organizational culture; investigative journalism (web-search) flags controversies; academic sector analyses add structural context.

---

## Domain-Specific Sources

The following type hooks from the domain-specific channel playbook apply to company-non-profit research:

**Industry Databases hook** — applies to: financials, funding, programs, reputation phases
- ProPublica Nonprofit Explorer: 990 filings with financial summaries and trend data (primary financial source)
- GuideStar / Candid: 990 aggregation, organizational profiles, program descriptions
- Charity Navigator: Ratings based on financial health, accountability, and results
- GiveWell: In-depth effectiveness evaluations (primarily applicable to global health and poverty nonprofits)
- Foundation Directory Online: Grant-making and foundation giving data (best for understanding donor landscape)

**Regulatory sources used via regulatory channel (not domain-specific):**
- IRS Form 990 via ProPublica (accessed through regulatory channel)
- USASpending.gov for federal grant records (accessed through regulatory channel)
- State charity registration databases (accessed through regulatory channel)
