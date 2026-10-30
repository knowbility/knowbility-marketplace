---
research-type: person-research
description: Phase-grouped channel routing for person research — maps career arc, expertise validation, track record, public positions, reputation, network, and financial/legal footprint phases to prioritized discovery channels
active-channels:
  - web-search
  - academic
  - social-signals
  - regulatory
  - financial
  - domain-specific
---

# Type-Channel Map: Person Research

This map tells the discover skill which channels to query for each phase of person research. Priorities are derived from the person-research credibility hierarchy: SEC filings, court records, patent filings, and corporate registrations are highest credibility for verifiable facts; published work and third-party profiles are high for career data; social media and personal sites are low for factual claims.

Synthesis and red flags assessment phases are omitted — those phases synthesize existing findings rather than requiring new discovery. If the discover skill finds no group match for a phase, report: "No discovery channels mapped for this phase — this phase uses existing sources."

---

## Discovery Group: Career Arc and Professional Background

**Covers phases with keywords:** career arc, career timeline, identity, professional background, roles, companies, transitions, work history, career trajectory, who are they

**Rationale:** Web-search surfaces career history across news coverage, company pages, and third-party profiles. Third-party profiles (Crunchbase, Bloomberg) carry high credibility for career data. Social-signals (LinkedIn) provides career timeline structure but is low-credibility for impact claims — treat as structural reference only.

**Primary channels:**
- web-search — news coverage of career moves, company press releases naming the person, conference bios, published interviews, third-party profile aggregators (Crunchbase, Bloomberg, Pitchbook); high credibility for verifiable career data
- social-signals — LinkedIn profile for career timeline structure (treat as self-reported until independently verified); Twitter/X and professional social profiles for current role and public identity signals

**Secondary channels (if primary returns fewer than 5 sources):**
- regulatory — corporate filings listing officers and directors (SEC, state corporate registrations); highest credibility for executive role verification
- domain-specific — specialized registries for professional background in credentialed fields (see Domain-Specific Sources section)

---

## Discovery Group: Expertise Validation and Publications

**Covers phases with keywords:** expertise, publications, published work, papers, patents, books, talks, speaking, peer recognition, demonstrated outcomes, credentials, IP

**Rationale:** Published academic and professional work provides the highest-credibility evidence for expertise claims. Patents are legally filed public records — highest credibility for IP and technical expertise. The domain-specific channel handles patent search by inventor.

**Primary channels:**
- academic — published papers, books, peer-reviewed conference proceedings (OpenAlex, Semantic Scholar, Google Scholar); highest credibility for academic and research expertise validation
- domain-specific — patent search by inventor (Google Patents URL construction); highest credibility for IP and technical innovation claims

**Secondary channels (if primary returns fewer than 5 sources):**
- web-search — named conference talks with recordings, published interviews, featured commentary in credible publications; high for expertise signals when academic record is thin
- social-signals — ORCID profiles, ResearchGate academic profiles; moderate-to-high for research community presence signals

---

## Discovery Group: Public Positions and Thought Leadership

**Covers phases with keywords:** public positions, thought leadership, statements, talks, articles, interviews, social media, what they've said, opinions, writing, podcast

**Rationale:** Web-search surfaces the full range of public statements across news, interviews, and published writing. Social-signals captures real-time positions and social media presence where the person has a direct public voice.

**Primary channels:**
- web-search — published articles, op-eds, news interviews, podcast episode pages, conference talk recordings, curated press coverage; high for documented public record of stated positions
- social-signals — Twitter/X and active social media profiles for real-time positions and stated views; useful for positions but low credibility for factual claims — treat as self-reported

**Secondary channels (if primary returns fewer than 5 sources):**
- academic — published books, academic papers, peer-reviewed commentary attributed to the person

---

## Discovery Group: Reputation and Peer Perception

**Covers phases with keywords:** reputation, peer perception, what others say, awards, endorsements, criticism, conflict, reviews, recognition, pattern of behavior

**Rationale:** Social-signals is the primary channel for peer perception — practitioner communities, Glassdoor/Blind (for employment reputation), and professional network discussions reveal reputation signals. Web-search surfaces formal recognition, awards, and journalism about the person's standing.

**Primary channels:**
- social-signals — Glassdoor and Blind reviews (multiple similar reports carry weight for pattern detection), professional community discussions, Twitter/X mentions and quote-tweets, forum discussions; moderate for individual claims but high for patterns across multiple independent sources
- web-search — award announcements, formal recognition coverage, investigative journalism about the person, news pieces covering criticism or disputes; high for documented public record of recognition or controversy

**Secondary channels (if primary returns fewer than 5 sources):**
- academic — citation counts and academic community standing signals if the person is in a research field

---

## Discovery Group: Network and Affiliations

**Covers phases with keywords:** network, affiliations, board seats, advisory roles, investments, institutional connections, professional associations, who they associate with, investors

**Rationale:** Web-search captures board and advisory role announcements, investment disclosures, and institutional affiliations. Regulatory and financial channels surface legally required disclosures of board membership and investment stakes.

**Primary channels:**
- web-search — company board pages, advisory committee listings, press releases announcing board appointments, LinkedIn board and advisory listings (cross-check against formal sources), investor portfolio pages
- regulatory — SEC proxy statements and Form 4 filings listing board memberships and significant ownership; highest credibility for disclosed affiliations of public company officers

**Secondary channels (if primary returns fewer than 5 sources):**
- financial — Crunchbase and PitchBook for investor roles and portfolio company affiliations; high for startup/venture ecosystem connections
- social-signals — LinkedIn professional connections and stated affiliations (treat as self-reported until corroborated)

---

## Discovery Group: Financial and Legal Footprint

**Covers phases with keywords:** financial footprint, legal, SEC filings, litigation, corporate registrations, lawsuits, court records, disclosed investments, regulatory filings

**Rationale:** SEC filings, court records, patent filings, and corporate registrations are the highest-credibility sources for verifiable facts — these are legally recorded public documents. This group applies only to individuals with public filings (executives, directors, public company officers). Skip this group if the person has no known public filings.

**Primary channels:**
- regulatory — SEC EDGAR (proxy statements, Form 4 ownership disclosures, 10-K officer listings), state corporate registrations, federal court PACER records (if available), litigation coverage; highest credibility for legally verified facts
- financial — disclosed investment activity, Crunchbase and PitchBook for investment rounds where person is listed as investor or officer; high for financial involvement signals

**Secondary channels (if primary returns fewer than 5 sources):**
- web-search — news coverage of litigation, disclosed financial moves, corporate registration announcements, journalist investigations citing court records
- domain-specific — patent filings under the person's name as inventor (Google Patents by inventor); highest credibility for IP ownership record

---

## Domain-Specific Sources

Person research uses two type hooks from the domain-specific playbook. Execute these hooks as indicated by the current phase.

**Patent search by inventor (expertise validation, financial/legal footprint phases):**
```
URL construction: https://patents.google.com/?inventor={person_name}&after=priority:{year_minus_5}0101
```
Substitute `{person_name}` = URL-encoded full name, `{year_minus_5}` = current year minus 5.

Execution: Construct URL, then use `tvly extract` to retrieve patent listings, OR present constructed URL to user if `tvly extract` is unavailable.

**Specialized registries — academic and research professionals (expertise validation phase):**
```
tvly search:
  query: "{person_name} {field} researcher profile publications"
  include_domains: ["orcid.org", "researchgate.net", "scholar.google.com", "academia.edu"]
  search_depth: "advanced"
  max_results: 3
```

**Specialized registries — licensed professionals (career arc, expertise validation phases):**
```
tvly search:
  query: "{person_name} {credential_type} license certification verified"
  search_depth: "advanced"
  max_results: 3
```
Substitute `{credential_type}` = license type relevant to the person's claimed credentials (e.g., "CPA", "MD", "PE engineer", "licensed attorney").

**Note:** Domain-specific hooks apply selectively based on the person's profile. Do not execute the patent hook if the person has no technical or IP background. Do not execute the professional registry hook if the person operates in a non-credentialed field.
