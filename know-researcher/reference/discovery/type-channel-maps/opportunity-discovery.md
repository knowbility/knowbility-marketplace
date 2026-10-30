---
research-type: opportunity-discovery
description: Phase-grouped channel routing for opportunity discovery research targeting a specific niche audience
active-channels:
  - web-search
  - social-signals
  - financial
  - domain-specific
---

# Opportunity Discovery Type-Channel Map

**How to use this map:** The discover skill reads this file to determine which channels to query for each phase of an opportunity discovery project. Match the current phase name against the phase keywords listed in each discovery group. Execute all Primary channels; activate Secondary channels if Primary results fall below 5-8 sources. Synthesis phases are omitted — no new discovery is needed for those phases.

**Channel scope note:** Academic and regulatory channels are excluded. Opportunity discovery is about finding what real people complain about and pay for — academic papers and regulatory filings are not where that signal lives.

---

## Discovery Group 1: Niche Definition and Audience Profiling

**Phase keywords:** niche definition, audience profiling, who are they, niche identity, demographics, niche boundaries, audience size, persona, target audience

**Primary channels:**
- web-search — industry reports on the broader market; blog posts profiling the niche; survey results on demographics and behaviors
- social-signals — community self-descriptions, "who here is a..." threads, subreddit sidebar descriptions, community census posts

**Secondary channels:**
- financial — funding databases for startups already targeting this niche (Crunchbase), which validates niche existence and rough sizing

**Rationale:** Niche definition requires both top-down framing (industry reports, blog profiles) and bottom-up identity signals from the communities themselves. Social-signals surfaces how people in the niche describe themselves, which is higher fidelity than how analysts describe them.

---

## Discovery Group 2: Watering Hole Mapping and Community Discovery

**Phase keywords:** watering holes, community discovery, where they talk, communities, forums, subreddits, Discord, Slack, newsletters, conferences, platforms, community mapping

**Primary channels:**
- social-signals — Reddit subreddit search, Indie Hackers community search, Discord server directories, Slack community directories, Twitter/X hashtag communities
- web-search — "best communities for [niche]" articles, newsletter directories, conference listings, community roundup posts

**Rationale:** This phase is about locating the watering holes themselves. Social-signals is primary because the communities are the target. Web-search supplements with curated lists and directories that aggregate community recommendations.

---

## Discovery Group 3: Pain Point Extraction and Complaint Analysis

**Phase keywords:** pain points, complaints, frustrations, problems, struggles, recurring issues, complaint analysis, pain point extraction, what frustrates, biggest challenges

**Primary channels:**
- social-signals — Reddit complaint threads, forum rants, "what's your biggest frustration" threads, product feedback posts, Twitter/X threads about workflow pain, Indie Hackers "what problems do you have" threads

**Secondary channels:**
- web-search — blog posts about common challenges in the niche, survey results on pain points, "state of [niche]" reports

**Rationale:** This is the core phase of opportunity discovery. Unprompted community complaints are the highest-credibility source in the credibility hierarchy. People describing their own problems in their own words is irreplaceable signal. Web-search supplements with aggregated pain point content.

---

## Discovery Group 4: Current Tool Stack and Spending Patterns

**Phase keywords:** tool stack, spending, current tools, what they pay for, subscriptions, workflow, software stack, budget, spending patterns, tools they use

**Primary channels:**
- social-signals — "what tools do you use" threads, tool recommendation posts, "my tech stack" posts, product comparison discussions
- web-search — "best tools for [niche]" articles, tool roundups, stack-sharing blog posts, pricing comparison articles

**Secondary channels:**
- domain-specific — G2 and Capterra category pages for tools serving this niche; Product Hunt collections targeting this audience

**Rationale:** Actual tool usage data lives in community discussions where people share their stacks honestly. Web-search provides curated roundups. Domain-specific adds structured review data for discovered tools.

---

## Discovery Group 5: Existing Solution Audit

**Phase keywords:** existing solutions, solution audit, competitors, who builds for this niche, alternatives, current products, solution landscape, product reviews, competitive landscape

**Primary channels:**
- web-search — competitor websites, product landing pages, feature pages, pricing pages for solutions targeting this niche
- social-signals — user reviews and complaints about existing solutions on Reddit, G2, Capterra, Product Hunt; "why I switched from X" posts
- domain-specific — G2/Capterra structured review data; Product Hunt launch pages and comment threads; Crunchbase profiles for funded solutions

**Secondary channels:**
- financial — Crunchbase/PitchBook for funding data on companies building for this niche (signals investor confidence and competitive density)

**Rationale:** Solution auditing requires both vendor-side data (what they claim via web-search) and user-side reality (what users actually experience via social-signals). Domain-specific provides structured comparison data. Financial data contextualizes competitive intensity.

---

## Discovery Group 6: Demand Validation and Willingness to Pay

**Phase keywords:** demand validation, willingness to pay, would they pay, pricing signals, market sizing, demand evidence, monetization potential, market size, pricing

**Primary channels:**
- social-signals — "I would pay for this" posts, feature request threads with upvotes, crowdfunding campaigns, bounty posts, pricing discussions, "shut up and take my money" signals
- financial — Crunchbase for startups already funded in this space (market validation by investors); market sizing reports

**Secondary channels:**
- web-search — market sizing articles, industry revenue data, pricing benchmarks for comparable products in adjacent niches

**Rationale:** Willingness to pay is best evidenced by actual user statements and financial commitments (crowdfunding, upvotes on paid features). Financial data from funded competitors provides indirect validation that investors see a market. Web-search adds sizing context.

---

## Omitted Phases

Synthesis and opportunity ranking phases have no discovery channel mapping — they work from sources gathered in previous phases. If the discover skill finds no group match for a phase name, it reports: "No discovery channels mapped for this phase — this phase uses existing sources."

---

## Domain-Specific Sources

Active type hooks from domain-specific channel playbook:

**Industry Databases hook** — applies to tool stack, existing solution audit, and demand validation phases:
- G2/Capterra: User reviews, ratings, category pages for tools serving the target niche
- Product Hunt: Launch pages and community reception for products targeting this niche
- Crunchbase/PitchBook: Funded startups building for this niche; market validation signals
