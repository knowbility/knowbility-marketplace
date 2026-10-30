---
research-type: exploratory-thesis
description: Phase-grouped channel routing for exploratory thesis research — maps theoretical, evidence, landscape, and practical phases to prioritized discovery channels
active-channels:
  - academic
  - web-search
  - regulatory
  - social-signals
  - financial
---

# Type-Channel Map: Exploratory Thesis

This map tells the discover skill which channels to query for each phase of exploratory thesis research. Priorities are derived from the exploratory-thesis credibility hierarchy: academic research is highest credibility for theoretical and evidence phases; government data (BLS, Census, Pew, Gallup) is high credibility and accessed via the regulatory channel; community and practitioner knowledge is moderate credibility via social-signals.

Synthesis and gaps phases are omitted — no new discovery needed for those phases. If the discover skill finds no group match for a phase, report: "No discovery channels mapped for this phase — this phase uses existing sources."

---

## Discovery Group: Theoretical Foundations

**Covers phases with keywords:** theoretical, foundations, theory, intellectual base, core claims, conceptual, framework, academic basis

**Rationale:** Peer-reviewed research is the highest-credibility source for theoretical claims and intellectual foundations. Web-search supplements with commentary, critiques, and context.

**Primary channels:**
- academic — peer-reviewed papers, books, and cited research (OpenAlex, Semantic Scholar, PubMed where domain-relevant); use for theoretical claims, foundational frameworks, and intellectual genealogy
- web-search — authoritative commentary, book excerpts, intellectual reviews, university course pages

**Secondary channels (if primary returns fewer than 5 sources):**
- social-signals — academic community discussion, conference talk summaries, practitioner framing of theoretical ideas

---

## Discovery Group: Evidence and Data

**Covers phases with keywords:** evidence, data, empirical, research support, validation, statistics, survey data, longitudinal

**Rationale:** Government surveys and research data (BLS, Census, Pew, Gallup) carry high credibility for empirical claims alongside peer-reviewed research. Regulatory channel surfaces government datasets and official survey publications.

**Primary channels:**
- academic — peer-reviewed empirical studies, meta-analyses, systematic reviews; highest credibility for evidence claims
- regulatory — government datasets, official survey publications (BLS labor data, Census demographic data, Pew Research reports, Gallup polling); high credibility for empirical grounding

**Secondary channels (if primary returns fewer than 5 sources):**
- web-search — industry reports, journalism citing primary sources, trend analysis with disclosed methodology

---

## Discovery Group: Landscape and White Space

**Covers phases with keywords:** landscape, who's working, competitive, existing work, field map, white space, comparable, adjacent, players, organizations

**Rationale:** Web-search is best for mapping who is active in a space — organizations, initiatives, publications, projects. Social-signals surfaces community discussion that reveals practitioner awareness of landscape players.

**Primary channels:**
- web-search — organization websites, project pages, initiative coverage, journalism about field participants
- social-signals — practitioner communities, forums, conference discussions, newsletter conversations about field players

**Secondary channels (if primary returns fewer than 5 sources):**
- academic — published landscape reviews, bibliometric studies, state-of-field papers

---

## Discovery Group: Audience, Market, and Feasibility

**Covers phases with keywords:** audience, market, feasibility, viability, demand, who cares, potential readers, users, buyers, reach, constraints, practical

**Rationale:** Web-search provides market context, audience signals, and published feasibility analysis. Social-signals reveals actual audience behavior and stated needs. Financial data adds market sizing and investment signals where a commercial angle exists.

**Primary channels:**
- web-search — market context, audience research, feasibility analysis, industry reports on target audience
- social-signals — community discussions about audience needs, forums where target audience is active, practitioner conversation about demand

**Secondary channels (if primary returns fewer than 5 sources):**
- financial — market size estimates, investment activity signals indicating market interest
- regulatory — government labor statistics or demographic data relevant to audience sizing

---

## Discovery Group: Cultural and Behavioral Dynamics

**Covers phases with keywords:** cultural, behavioral, social dynamics, psychology, patterns, attitudes, beliefs, adoption, behavior, norms

**Rationale:** Academic research in sociology, psychology, and behavioral economics is the highest-credibility source for cultural and behavioral claims. Social-signals provides real-world behavioral evidence from practitioners and communities.

**Primary channels:**
- academic — peer-reviewed sociology, psychology, behavioral economics, anthropology research; highest credibility for behavioral and cultural claims
- social-signals — community behavior patterns, forum discussions revealing real attitudes and norms, practitioner testimony about observed behavior

**Secondary channels (if primary returns fewer than 5 sources):**
- web-search — journalism and reporting on cultural trends, long-form pieces with primary source citations
- regulatory — government survey data (Pew, Gallup via regulatory channel) on attitudes and cultural patterns

---

## Domain-Specific Sources

Exploratory thesis research is primarily academic and web-search driven. Domain-specific hooks are applied selectively based on the thesis topic domain.

**Applicable type hooks from domain-specific playbook:**
- None required by default — thesis research does not typically need patent search, industry databases, or professional registries

**Conditionally applicable (at discover skill discretion):**
- Standards bodies — if the thesis engages a domain with relevant standards (technology, engineering, healthcare), the domain-specific channel can surface ISO, NIST, IEEE, or W3C documents. Execute via `tvly search` scoped to known standards body domains.
- Specialized academic databases — if the thesis domain has a major niche database not covered by OpenAlex or Semantic Scholar (e.g., PsycINFO for psychology, ERIC for education), note this as a domain-specific extension of the academic channel.

**Note:** Do not force domain-specific hooks that don't apply to the thesis domain. Consult the type-channel map for the thesis's subject domain (if one exists) for domain-specific source guidance.
