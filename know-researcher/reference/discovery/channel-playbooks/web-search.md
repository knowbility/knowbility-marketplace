---
name: web-search
description: General web discovery via Tavily search and Exa neural search
allowed-tools:
  - Bash
  - WebSearch
channel-type: web-search
---

# Web-Search Channel Playbook

## 1. Channel Overview

**What this channel discovers:** General web content — articles, blog posts, official pages, news, documentation, and public-facing organizational content via Tavily search and Exa neural search. The broadest discovery channel and the default fallback for other channels when their specialized tools are unavailable.

**When to use it:**
- General topic research without a specific domain constraint
- Entity lookup (company, person, product, concept) with no channel preference
- Recent news and developments on any topic
- Background context gathering before activating specialized channels

**What it cannot find:**
- Paywalled content (surfaces summaries or citations only)
- Private databases, intranets, or authenticated portals
- Real-time data (stock prices, live feeds) — use financial or domain-specific channels
- Deep academic literature — academic channel provides better coverage

---

## 2. Tool Configuration

**Primary tool:** `tvly search` (Tavily CLI via Bash)

**Core parameters:**

| CLI Flag | Value | Notes |
|----------|-------|-------|
| `--depth` | `advanced` | Use for all research queries; `basic` only for quick fact checks |
| `--max-results` | 5–8 | Higher for broad topic searches, lower for entity lookups |
| `--topic` | `general` or `news` | `news` activates recency ranking and `--time-range` flag |
| `--include-domains` | `"domain1,domain2"` | Leave omitted for general web; populate for domain-scoped searches |
| `--time-range` | `month` or `year` | Only valid when `--topic news`; adjust for recency requirements |
| `--json` | (flag) | Always include for structured output |

**Authentication:** Tavily CLI authenticates via `TAVILY_API_KEY` environment variable or `tvly login`.

**API 2 — Exa (Secondary, Neural Search):**

**Tool:** Exa Search API (via Bash curl)

**Base URL:** `https://api.exa.ai/search`

**Authentication:** `EXA_API_KEY` environment variable. Free tier: 1,000 searches/month.

**Core parameters:**

| Parameter | Value | Notes |
|-----------|-------|-------|
| `query` | (string) | Natural language query; Exa optimizes for semantic relevance |
| `numResults` | 8 | Per D-03: 8-result cap per tool within channel |
| `type` | `auto` | Per D-04: routes to neural or keyword via Exa's internal categorization |
| `contents.highlights.maxCharacters` | `4000` | Token-efficient excerpts per result |
| `startPublishedDate` | (ISO date, optional) | Filter to results published after this date |
| `category` | (optional) | One of: company, research paper, news, pdf, github, tweet, personal site |

**Response format:** JSON with `results[]` array. Each result has: `title`, `url`, `publishedDate`, `author`, `score`, `highlights` (array of excerpt strings when `contents.highlights` is requested).

**Deprecated parameters (do NOT use):**
- `useAutoprompt` — removed from API
- `livecrawl: "always"` — use `contents.maxAgeHours: 0` instead
- `numSentences`, `highlightsPerUrl` — use `maxCharacters` instead

---

## 3. Query Templates

### Template A — Topic Search

```bash
tvly search "{topic} {context_keywords}" --depth advanced --max-results 8 --topic general --json
```

**Placeholder substitution:**
- `{topic}` — the primary research subject (e.g., "renewable energy storage")
- `{context_keywords}` — 1–3 constraining terms from the research brief (e.g., "policy regulation 2024")

**Use when:** Broad topic coverage is needed; no specific entity or domain constraint.

---

### Template B — Entity Search

```bash
tvly search "{entity_name} {entity_type}" --depth advanced --max-results 5 --json
```

**Placeholder substitution:**
- `{entity_name}` — proper name of the entity (e.g., "OpenAI", "Jensen Huang")
- `{entity_type}` — category term that disambiguates (e.g., "company AI", "CEO NVIDIA", "nonprofit climate")

**Use when:** Researching a specific named entity (company, person, product, organization). No domain filtering applied — surface all relevant web presence.

---

### Template C — News/Recent Search

```bash
tvly search "{topic} recent developments" --depth advanced --max-results 5 --topic news --time-range month --json
```

**Placeholder substitution:**
- `{topic}` — subject of interest
- Adjust `--time-range` to match recency requirement (`week` = last week, `month` = last month, `year` = last year)

**Use when:** The research brief calls for recent developments, current events, or time-bounded discovery.

---

### Exa Query Templates

### Template D — Exa Topic Search (Neural)

```bash
curl -s -X POST "https://api.exa.ai/search" \
  -H "x-api-key: $EXA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{topic} {context_keywords}",
    "numResults": 8,
    "type": "auto",
    "contents": {
      "highlights": {"maxCharacters": 4000}
    }
  }'
```

**Placeholder substitution:**
- `{topic}` — the primary research subject
- `{context_keywords}` — 1-3 constraining terms from the research brief

**Use when:** Broad topic coverage is needed and Tavily has already returned its results. Exa's neural mode surfaces semantically relevant pages that SEO-optimized results may miss.

---

### Template E — Exa Entity Search

```bash
curl -s -X POST "https://api.exa.ai/search" \
  -H "x-api-key: $EXA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{entity_name} {entity_type}",
    "numResults": 8,
    "type": "auto",
    "category": "{category}",
    "contents": {
      "highlights": {"maxCharacters": 4000}
    }
  }'
```

**Placeholder substitution:**
- `{entity_name}` — proper name of the entity
- `{entity_type}` — category term that disambiguates
- `{category}` — (optional) one of: company, research paper, news, personal site. Omit the field entirely if no category applies.

**Use when:** Researching a specific named entity. Use `category` to bias results toward the entity type.

---

### Template F — Exa Recent Search

```bash
curl -s -X POST "https://api.exa.ai/search" \
  -H "x-api-key: $EXA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{topic} recent developments",
    "numResults": 8,
    "type": "auto",
    "startPublishedDate": "{iso_date}",
    "category": "news",
    "contents": {
      "highlights": {"maxCharacters": 4000}
    }
  }'
```

**Placeholder substitution:**
- `{topic}` — subject of interest
- `{iso_date}` — ISO 8601 date (e.g., "2024-01-01") for the start of the recency window

**Use when:** The research brief calls for recent developments. Use `startPublishedDate` to bound the time window.

---

## 4. Credibility Tiers

Channel-level source ranking for results returned via web-search. These tiers rank within this channel; cross-channel ranking is defined in type templates.

**Tier 1 — Highest Credibility:**
- Government databases and official agency pages (.gov, .gov.uk, .europa.eu)
- Peer-reviewed publication landing pages and publisher archives
- Official regulatory filings and public records
- Recognized academic and research institution sites (.edu domains with institutional content)

**Tier 2 — Reliable:**
- Established national and international news organizations (AP, Reuters, BBC, NYT, WSJ)
- Industry analyst reports from recognized firms (Gartner, IDC, Forrester)
- Professional associations and standards bodies
- Major reference databases (Wikipedia for factual claims only, with source verification)

**Tier 3 — Contextual:**
- Company websites and official product pages (treat as primary source for company facts, secondary for industry claims)
- Press releases (source is the organization, not an independent observer)
- Blog posts, op-eds, and personal sites (useful for perspectives, not facts)
- User-generated content and forums

**Red Flags — Treat with Skepticism:**
- SEO-optimized listicles with no byline, no date, no cited sources
- Content farms producing high-volume generic articles (Demand Media pattern)
- AI-generated aggregation sites that summarize without original sourcing
- Press releases published through wire services (PR Newswire, Business Wire) presented as journalism
- Sites with excessive advertising-to-content ratios
- Undated content on time-sensitive topics

---

## 5. Source Status Taxonomy

**Canonical definitions** — all other channel playbooks reference this section.

| Status | Meaning | Next Action |
|--------|---------|-------------|
| `DISCOVERED` | URL returned by search; content not yet verified accessible | Attempt extraction with `tvly extract` or direct fetch |
| `ACCESSIBLE` | Content confirmed reachable and extractable; key facts visible | Extract and process; move to research notes |
| `PROCESSED` | Content extracted and integrated into research notes; claim traced | No further action needed; cite in output |

**Recording format:** When logging candidates in `research/discovery/`, annotate each URL with its current status.

```
- [DISCOVERED] https://example.com/article — "title or description"
- [ACCESSIBLE] https://example.com/report — key claim confirmed: "direct quote or paraphrase"
- [PROCESSED] https://example.com/filing — integrated into §3 financials
```

**Status does not imply credibility.** A `PROCESSED` source can still be Tier 3. Always record both status and tier assessment.

---

## 6. Degradation Behavior

**Tier 1 (primary):** `tvly search` (Tavily CLI)

**Tier 2 [Firecrawl fallback]:** `npx firecrawl-cli search` (secondary)

**Tier 3 [WebSearch fallback]:** `WebSearch` (tertiary, built-in)

> The agent works out of the box with zero CLIs installed — WebSearch is always available.

**Unavailability criteria (trigger next tier):**
- Non-zero exit code from CLI command
- Request timeout > 30 seconds
- Rate limit response (429 or equivalent)
- Authentication failure (API key invalid or expired)

**Fallback protocol:**
1. Detect Tier 1 unavailability via one of the criteria above
2. Switch to Tier 2: `npx firecrawl-cli search "{query}" --limit 5 --format json`
3. Label results: `"via Firecrawl (tvly fallback)"`
4. If Tier 2 also fails, switch to Tier 3: `WebSearch` for the same query
5. Label results: `"via WebSearch (tvly+Firecrawl fallback)"`
6. Note in research log which tier succeeded and any limitations (no `--include-domains` scoping, no `--topic` parameter, etc.)

**Degradation impact by tier:**
- **Tier 2 (Firecrawl):** Full-text search with content extraction; lacks `--topic` and `--time-range` flags; results are broader
- **Tier 3 (WebSearch):** No `include_domains` scoping, no topic parameter, no time-range scoping; result quality may be lower for specialized queries

**Recovery:** On subsequent research sessions, verify Tier 1 availability and re-run degraded queries if result quality was insufficient.

**Exa degradation (if api.exa.ai unavailable):**

If Exa is unavailable (API key absent, timeout > 15 seconds, HTTP 5xx, HTTP 429, or non-zero exit from curl), skip silently. Log a one-line channel status note: `Exa: unavailable — web search results from Tavily only`. Do not retry. Do not block. Do not trigger Tavily fallbacks — Exa and Tavily are independent parallel tools within the same channel (per D-13). Discovery continues with Tavily results only.

**Unavailability criteria for Exa:**
- `EXA_API_KEY` environment variable not set
- HTTP 5xx response from api.exa.ai
- Request timeout > 15 seconds
- HTTP 429 (rate limit exceeded)
- Non-zero exit code from curl command

---

## 7. Rate Limits

**Tavily (`tvly search`):**
- Free tier: ~1,000 searches/month (shared across all channels)
- No per-second throttle required for typical research sessions (1–20 searches per session)
- If approaching monthly limit: prioritize searches, batch related queries, use `--max-results` conservatively
- Rate limit detection: 429 response or non-zero exit → trigger degradation behavior (Section 6)

**Firecrawl (`npx firecrawl-cli search`, fallback):**
- Free tier: 500 credits/month; each search consumes credits based on result count
- Credit-conscious: use `--limit` conservatively

**WebSearch (tertiary fallback):**
- No documented hard limit; use conservatively
- Avoid repeated identical queries — cache results within a session

**Exa (API 2, parallel neural search):**
- Free tier: 1,000 searches/month
- No per-second throttle required for typical research sessions (1-20 searches per session)
- Monthly cap is shared with all Exa usage — budget searches conservatively if approaching limit
- Rate limit detection: 429 response or non-zero exit from curl → trigger Exa degradation (Section 6)

---

## 8. Deduplication and Priority Rules

**Query order:** Tavily first, Exa second (per D-02). Tavily executes and returns up to 8 results. Exa then executes and returns up to 8 results. Dedup collapses overlaps before presenting combined candidates.

**Deduplication by URL:** If a URL appears in both Tavily and Exa results (matched by exact URL string equality — no normalization, no trailing-slash stripping, no protocol comparison), the Tavily entry is kept as the primary candidate. The Exa entry is silently dropped. The surviving candidate receives the `[Tavily+Exa]` attribution tag to indicate both engines found it.

**No data merge:** Unlike academic.md's Crossref gap-filling, web-search dedup is pure collapse. Tavily metadata (title, snippet) is kept; Exa metadata for the duplicate is discarded. This keeps the contract simple — URL string equality is the only dedup key.

**Source attribution tags:** Every candidate in the web-search channel carries an engine attribution tag after its status tag:

| Tag | Meaning |
|-----|---------|
| `[Tavily]` | Found by Tavily only |
| `[Exa]` | Found by Exa only (not in Tavily results) |
| `[Tavily+Exa]` | Found by both; Tavily entry kept, Exa match collapsed |

**Candidate format with attribution:**
```
- [ACCESSIBLE] [Tavily] Title — URL
- [DISCOVERED] [Exa] Title — URL
- [ACCESSIBLE] [Tavily+Exa] Title — URL
```

The engine tag appears immediately after the status tag (`[ACCESSIBLE]`, `[DISCOVERED]`, `[PROCESSED]`) and before the title. This extends the existing tag idiom used by `[Firecrawl fallback]` and `[WebSearch fallback]`.

**Channel status line:** After both APIs complete (or Exa degrades), report a single web-search channel status line:

```
Web Search: {N} results (Tavily: {n1}, Exa-only: {n2}, deduped: {n3}) [degraded: {list}]
```

Where:
- `{N}` = total unique candidates presented (n1 + n2, after dedup)
- `{n1}` = results from Tavily (including those that were also in Exa, tagged [Tavily+Exa])
- `{n2}` = results from Exa that were NOT in Tavily results
- `{n3}` = number of Exa results dropped due to URL match with Tavily
- `{list}` = names any tool that was unavailable during this run (e.g., "Exa"); empty if both succeeded

**Exa-only mode:** If Tavily degrades but Exa succeeds, all Exa results are tagged `[Exa]` and reported normally. The status line shows `Tavily: 0` and notes `[degraded: Tavily]`.

**Tavily-only mode:** If Exa degrades, all Tavily results are tagged `[Tavily]`. Status line shows `Exa-only: 0, deduped: 0` and notes `[degraded: Exa]`.
