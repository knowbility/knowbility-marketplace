---
research-type: presentation-research
description: Phase-grouped channel routing for presentation evidence and narrative research
active-channels:
  - web-search
  - academic
  - regulatory
  - social-signals
---

# Presentation Research Type-Channel Map

**How to use this map:** The discover skill reads this file to determine which channels to query for each phase of a presentation research project. Match the current phase name against the phase keywords listed in each discovery group. Execute all Primary channels; activate Secondary channels if Primary results fall below 5-8 sources. Synthesis phases are omitted — no new discovery is needed for those phases.

**Channel scope note:** Presentation research uses fewer specialized channels than market or company types. Web-search and academic cover the majority of phases; social-signals adds audience and counterpoint intelligence. Domain-specific and financial channels are not active for this type — presentation evidence does not typically require patent search, funding databases, or SEC filings.

---

## Discovery Group 1: Claim and Point Inventory

**Phase keywords:** nugget inventory, claims, points, existing points, catalog, inventory, what needs evidence, claim audit

**Primary channels:**
- web-search — quick validity check on existing claims; find primary sources behind assertions the presenter already has; identify whether claims are well-established or contested
- academic — peer-reviewed research to assess whether claims have strong evidence backing or are based on weaker secondary sources

**Rationale:** The claim inventory phase determines which points are defensible before investing in deep evidence gathering — web-search and academic provide the fastest credibility signal for each point.

---

## Discovery Group 2: Audience and Context Research

**Phase keywords:** audience, context, who is in the room, event, format, what they know, what they resist, audience research, conference, venue

**Primary channels:**
- web-search — event and conference information, speaker/organizer pages, past talk recordings from the same event, audience industry background
- social-signals — LinkedIn discussions and community conversations from the target audience segment; event hashtags and conference community discussions for current audience sentiment

**Secondary channels:**
- academic — if the audience is a technical or academic community, peer-reviewed work from that community signals what they consider established vs. contested

**Rationale:** Audience research is primarily about social and contextual signals — web-search finds the event context, social-signals surfaces what the audience is currently thinking and discussing.

---

## Discovery Group 3: Evidence Gathering for Claims

**Phase keywords:** evidence, data, statistics, supporting data, research findings, validate, proof, numbers, percentages, survey data

**Primary channels:**
- academic — peer-reviewed research and government data (highest credibility for on-stage claims); named methodology studies rank highest in this type's credibility hierarchy
- regulatory — government statistics (BLS, Census, OECD, Eurostat) for quotable macro data; official agency reports for policy or industry data points
- web-search — analyst firm reports (Gartner, McKinsey, Forrester) for named-source statistics; named case studies with verifiable outcomes

**Secondary channels:**
- social-signals — recent survey data or community-sourced data when recency (last 12 months) is more important than methodological rigor

**Rationale:** On-stage claims must withstand skeptical audiences — peer-reviewed research and government data rank highest because audiences cannot challenge their methodology in the moment. Analyst firm data (Gartner, McKinsey) is acceptable because audiences recognize the names.

---

## Discovery Group 4: Counterpoints and Objections

**Phase keywords:** counterpoints, objections, pushback, skeptic, arguments against, challenges, counterargument, what will they resist, strongest objection

**Primary channels:**
- web-search — published critiques, contrarian perspectives, industry debate coverage; academic or analyst takes that challenge the presenter's thesis
- social-signals — community discussions and social media threads where the presenter's thesis is contested; expert pushback in forums and professional communities

**Secondary channels:**
- academic — peer-reviewed work that contradicts or complicates the presenter's key claims

**Rationale:** Counterpoint research needs to surface what a smart skeptical audience will say — social-signals captures live debate and current pushback, while web-search finds structured critiques and published counterarguments.

---

## Discovery Group 5: Stories, Examples, and Case Studies

**Phase keywords:** stories, examples, case studies, concrete cases, companies, people, illustrate, specific, narrative, anecdotes

**Primary channels:**
- web-search — named case studies with verifiable outcomes; company success/failure stories; news coverage of specific events that illustrate the presenter's points
- social-signals — first-person accounts, practitioner experiences, specific examples shared in community discussions (LinkedIn, Twitter, Reddit, HN)

**Rationale:** Story and example research prioritizes specificity and verifiability — web-search finds published case studies, social-signals surfaces practitioner experiences that are more current and relatable than formal case studies.

---

## Discovery Group 6: Through Line and Narrative Gaps

**Phase keywords:** through line, narrative, gaps, story structure, how points connect, narrative arc, bridging evidence, what connects, opening, closing, hook, takeaway

**Primary channels:**
- web-search — related presentations, narrative frameworks, prior work on the same topic to identify how others have structured the argument
- academic — research on narrative persuasion and evidence-based argumentation structures if the presenter wants a principled narrative approach

**Secondary channels:**
- social-signals — community reception of similar arguments; how audiences have responded to comparable narrative structures in the same domain

**Rationale:** Narrative structure research is inherently interpretive — web-search surfaces what has worked in similar presentations, academic research provides evidence-based persuasion frameworks, and social-signals shows how audiences respond to comparable arguments.

---

## Domain-Specific Sources

Presentation research does not use domain-specific type hooks. The active channels (web-search, academic, regulatory, social-signals) are sufficient for the evidence and narrative structure needs of this research type. No patent search, industry database lookup, or professional registry queries are appropriate.

If a specific presentation covers a highly technical or specialized domain (e.g., a keynote on pharmaceutical policy), the discover skill may supplement with regulatory sources — those are already listed as Primary in Group 3 (Evidence Gathering) for data-heavy phases.

---

## Omitted Phases

The following phase types have no discovery channel mapping — they work from sources gathered in previous phases:

- **Synthesis / presentation brief** — final output phase producing narrative arc and evidence map; no new discovery
- **Kill list compilation** — identifies unsupportable points from prior discovery results; no new discovery needed

If the discover skill finds no group match for a phase name, it should report: "No discovery channels mapped for this phase — this phase uses existing sources."
