---
research-type: competitive-analysis
description: Phase-grouped channel routing for competitive analysis research
active-channels:
  - web-search
  - financial
  - social-signals
  - domain-specific
  - academic
---

# Type-Channel Map: Competitive Analysis

Maps each discovery phase to prioritized channels derived from the competitive-analysis credibility hierarchy. Competitive analysis has high channel variation across phases — more granular discovery groups are used to reflect this. Synthesis and white-space phases are omitted — those phases use existing sources, not new discovery.

If the discover skill finds no group match for a phase, it reports: "No discovery channels mapped for this phase — this phase uses existing sources."

---

## Discovery Group: Market Definition and Boundaries

**Phases:** market definition, market boundaries, market scope, adjacent markets, market size, what's in scope

**Primary channels:**
- web-search
- financial
- domain-specific

**Secondary channels (if primaries return fewer than 5-8 sources):**
- academic

**Rationale:** Industry analyst reports (web-search via Gartner, Forrester, CB Insights) are the highest-credibility source for market structure definitions; financial databases and domain-specific market reports add quantitative sizing data.

---

## Discovery Group: Competitor Identification

**Phases:** competitors, player identification, who competes, direct competitors, indirect competitors, adjacent players

**Primary channels:**
- web-search
- domain-specific
- financial

**Secondary channels (if primaries return fewer than 5-8 sources):**
- social-signals

**Rationale:** Analyst reports and industry coverage (web-search) identify market participants; Crunchbase/PitchBook (domain-specific) fill in funded competitors not yet widely covered; user review platforms (social-signals) surface active alternatives users actually compare.

---

## Discovery Group: Features and Capabilities

**Phases:** features, capabilities, feature comparison, what each player does, product capabilities, functionality

**Primary channels:**
- web-search
- social-signals

**Secondary channels (if primaries return fewer than 5-8 sources):**
- domain-specific

**Rationale:** Product documentation and feature pages (web-search) are the primary source for claimed capabilities; user reviews on G2 and Capterra (social-signals) surface implementation reality versus marketing claims — the highest-credibility source for actual feature behavior.

---

## Discovery Group: Positioning and Messaging

**Phases:** positioning, messaging, brand, how they describe themselves, go-to-market, marketing strategy, narrative

**Primary channels:**
- web-search

**Secondary channels (if primaries return fewer than 5-8 sources):**
- social-signals

**Rationale:** Positioning lives on company websites, blogs, ad copy, and press coverage (web-search); community discussion (social-signals via Reddit, HN) reveals how positioning is actually received by the market.

---

## Discovery Group: Pricing and Business Models

**Phases:** pricing, business model, monetization, revenue model, cost structure, pricing strategy

**Primary channels:**
- web-search
- social-signals

**Secondary channels (if primaries return fewer than 5-8 sources):**
- financial

**Rationale:** Pricing pages and pricing documentation (web-search) are primary; user discussion and review data (social-signals via G2, Reddit) surfaces real-world pricing and negotiation patterns not on official pages; financial filings (financial channel) add revenue model context for public companies.

---

## Discovery Group: Technology and Architecture

**Phases:** technology, architecture, tech stack, technical approach, infrastructure, tech differentiation, IP

**Primary channels:**
- domain-specific
- web-search

**Secondary channels (if primaries return fewer than 5-8 sources):**
- academic

**Rationale:** Patent filings (domain-specific patent search hook) are the highest-credibility source for IP and technical differentiation; technical blog posts and documentation (web-search) reveal architectural decisions; academic publications provide technical depth for research-backed products.

---

## Discovery Group: Traction, Scale, and Funding

**Phases:** traction, scale, user counts, funding, growth signals, ARR, revenue, customers, market share

**Primary channels:**
- financial
- domain-specific

**Secondary channels (if primaries return fewer than 5-8 sources):**
- web-search

**Rationale:** SEC filings and earnings calls (financial channel) are the highest-credibility source for public company financials; Crunchbase/PitchBook (domain-specific) are highest-credibility for private funding and growth signals; analyst coverage adds market share estimates.

---

## Discovery Group: Market Trends

**Phases:** trends, market trends, emerging trends, where the market is heading, technology trends, buyer behavior

**Primary channels:**
- web-search
- financial
- domain-specific

**Secondary channels (if primaries return fewer than 5-8 sources):**
- academic

**Rationale:** Industry analyst reports and trade press (web-search) are primary for trend identification; financial channel adds investor theses and capital flow signals; academic research provides rigor for technology and behavioral trends.

---

## Domain-Specific Sources

The following type hooks from the domain-specific channel playbook apply to competitive-analysis research:

**Patent Search hook** — applies to: technology, architecture, IP phases
- Source: Google Patents (USPTO/EPO filings)
- Use: Compare IP portfolios across competitors, identify technical differentiation and potential freedom-to-operate issues
- Query strategy: Assignee search by competitor name, filtered to last 5 years; keyword search for core technical terms

**Industry Databases hook** — applies to: market definition, competitor identification, traction/funding, trends phases
- Crunchbase: Funding rounds, investors, employee count, founding data for private competitors
- PitchBook: Venture funding history and investor relationships (more complete for funded startups)
- G2: User reviews, ratings, category positioning, and head-to-head comparisons
- Capterra: User reviews for software products (SMB/mid-market perspective, distinct audience from G2)
- Statista / IBISWorld / Grand View Research / Mordor Intelligence: Market size, share, and forecast reports (industry market report query)
