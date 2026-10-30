---
research-type: customer-safari
description: Phase-grouped channel routing for customer safari market intelligence research
active-channels:
  - web-search
  - social-signals
  - domain-specific
---

# Customer Safari Type-Channel Map

**How to use this map:** The discover skill reads this file to determine which channels to query for each phase of a customer safari project. Match the current phase name against the phase keywords listed in each discovery group. Execute all Primary channels; activate Secondary channels if Primary results fall below 5-8 sources. Synthesis and prioritization phases are omitted — no new discovery is needed for those phases.

**Channel scope note:** Academic, regulatory, and financial channels are excluded. Customer safaris are about observing authentic audience behavior in natural digital habitats — academic papers, regulatory filings, and financial databases are not where that signal lives. If market sizing is needed, it happens in the competitive intelligence phase via web-search.

---

## Discovery Group 1: Audience Definition and Watering Hole Mapping

**Phase keywords:** audience definition, watering holes, watering hole mapping, communities, where they gather, platforms, forums, subreddits, Discord, newsletters, community mapping, digital habitats, target audience

**Primary channels:**
- social-signals — Reddit subreddit search, Discord server directories, Slack community directories, Indie Hackers, Twitter/X hashtag communities, community census posts, sidebar descriptions
- web-search — "best communities for [audience]" articles, newsletter directories, conference listings, community roundup posts, platform guides for the niche

**Rationale:** Finding the watering holes is the foundation of the entire safari. Social-signals is primary because the communities are the target — you're searching for where they gather. Web-search supplements with curated lists and directories that aggregate community recommendations.

---

## Discovery Group 2: Multi-Source Observation and Labeling

**Phase keywords:** observation, labeling, community conversations, discussions, threads, posts, comments, authentic behavior, community reading, systematic observation, multi-source

**Primary channels:**
- social-signals — Reddit threads, forum discussions, Discord conversations, Twitter/X threads, Indie Hackers posts, LinkedIn group discussions. This is the core safari observation phase — reading authentic conversations.

**Secondary channels:**
- web-search — blog posts and articles written by community members (not vendors), newsletter archives, conference talk summaries

**Rationale:** This is the core observation phase. Social-signals is overwhelmingly primary because safaris are about reading what people say in their natural habitats. Web-search supplements with community insider content that extends the observation beyond real-time discussion.

---

## Discovery Group 3: Pain Analysis and Classification

**Phase keywords:** pain, complaints, frustrations, struggles, workarounds, painkiller, vitamin, pain analysis, classification, emotional intensity, solution-seeking

**Primary channels:**
- social-signals — complaint threads, frustration posts, "what's your biggest challenge" threads, workaround descriptions, tool-switching discussions, repeated questions about the same problem

**Secondary channels:**
- domain-specific — G2/Capterra negative reviews and feature request boards for tools this audience uses; Product Hunt comment threads with complaints

**Rationale:** Pain analysis requires authentic, unprompted complaints — the highest-credibility source in the safari hierarchy. Domain-specific adds structured negative feedback from review platforms, which surfaces pain points people express when formally evaluating tools.

---

## Discovery Group 4: Competitive Intelligence and Positioning

**Phase keywords:** competitors, competitive, positioning, alternatives, solutions, market, landscape, gaps, competitive intelligence, positioning gaps, what exists, who builds

**Primary channels:**
- web-search — competitor websites, product landing pages, feature comparison articles, pricing pages, "best tools for [audience]" roundups
- domain-specific — G2/Capterra category pages and comparison features, Product Hunt launch pages and reception, Crunchbase profiles for funded competitors

**Secondary channels:**
- social-signals — user discussions comparing alternatives, "why I switched" posts, "X vs Y" threads, complaints about specific competitors

**Rationale:** Competitive intelligence requires both vendor-side data (what they claim via web-search and domain-specific) and user-side reality (what users actually experience via social-signals). The combination reveals where competitors' positioning diverges from actual user experience — the gaps where opportunity lives.

---

## Discovery Group 5: Trend Evaluation and Pattern Scoring

**Phase keywords:** trends, velocity, volume, emerging, accelerating, growing, declining, shifting, trend evaluation, pattern scoring, signal, noise, momentum

**Primary channels:**
- social-signals — tracking conversation frequency, thread engagement levels, community growth signals, topic recurrence over time
- web-search — trend articles, "state of [industry/niche]" reports, newsletter content tracking emerging topics, Google Trends context

**Rationale:** Trend evaluation requires both community observation (social-signals for velocity and volume signals) and broader context (web-search for industry-level trend framing). Cross-referencing community buzz with industry reporting separates genuine trends from isolated community noise.

---

## Omitted Phases

Strategic prioritization, tier assignment, and synthesis phases have no discovery channel mapping — they work from sources gathered in previous phases. If the discover skill finds no group match for a phase name, it reports: "No discovery channels mapped for this phase — this phase uses existing sources."

---

## Domain-Specific Sources

Active type hooks from domain-specific channel playbook:

**Industry Databases hook** — applies to pain analysis, competitive intelligence, and trend evaluation phases:
- G2/Capterra: User reviews (especially negative), feature request boards, category comparison pages
- Product Hunt: Launch pages, community reception, comment threads revealing user sentiment
- Crunchbase: Funded competitors targeting this audience, investment signals validating market existence
