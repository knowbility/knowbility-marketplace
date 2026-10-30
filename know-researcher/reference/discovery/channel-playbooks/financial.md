---
name: financial
description: Financial filings, market data, and investment research discovery
allowed-tools:
  - Bash
  - WebSearch
channel-type: financial
---

# Financial Channel Playbook

## 1. Channel Overview

**What this channel discovers:** SEC filings, earnings data, revenue figures, analyst coverage, investment research, and financial news. Scoped to Tavily-based discovery of publicly indexed financial content.

**When to use it:**
- Finding SEC filings (10-K, 10-Q, 8-K, proxy statements) for public companies
- Discovering revenue, earnings, and financial performance data
- Locating analyst reports, valuations, and investment commentary
- Researching financial news and market developments for a company or sector

**What it cannot find:**
- Private company financials not voluntarily disclosed
- Real-time market data (stock prices, live quotes) — Tavily returns cached/indexed content
- Full text of paywalled Bloomberg/WSJ/FT articles (surfaces citations and summaries only)
- Deep EDGAR filing retrieval — for direct EDGAR API access and full filing text extraction, use the regulatory channel (Plan 02), which covers direct HTTP API access to EDGAR, ProPublica, and other regulatory databases

**Scope boundary:** This playbook covers Tavily-scoped financial discovery. The regulatory channel (Plan 02) covers direct EDGAR/ProPublica HTTP API access for deeper filing retrieval.

---

## 2. Tool Configuration

**Primary tool:** `tvly search` (Tavily CLI via Bash)

**Core parameters:**

| CLI Flag | Value | Notes |
|----------|-------|-------|
| `--depth` | `advanced` | Standard for all financial queries |
| `--max-results` | 5 | Financial queries benefit from precision over volume |
| `--topic` | `general` | Default topic for financial queries |
| `--include-domains` | See templates | Domain lists defined per query variant |
| `--json` | (flag) | Always include for structured output |

**Authentication:** Tavily CLI authenticates via `TAVILY_API_KEY` environment variable or `tvly login`.

---

## 3. Query Templates

### Template A — SEC Filings Search

```bash
tvly search "{company_name} SEC filing 10-K OR 10-Q OR 8-K" --depth advanced --max-results 5 --include-domains "sec.gov" --json
```

**Placeholder substitution:**
- `{company_name}` — legal company name or common name (e.g., "Alphabet Inc", "Apple")
- Adjust filing type (`10-K OR 10-Q OR 8-K`) to match the specific filing sought

**Use when:** Looking for official SEC submissions. `sec.gov` is the authoritative source. Supplement with direct EDGAR access via the regulatory channel for deeper filing retrieval.

---

### Template B — Market and Financial Data

```bash
tvly search "{company_name} revenue earnings financial results" --depth advanced --max-results 5 --include-domains "finance.yahoo.com,bloomberg.com,reuters.com,wsj.com,ft.com,seekingalpha.com" --json
```

**Placeholder substitution:**
- `{company_name}` — company name as commonly used in financial press (e.g., "Meta Platforms", "Tesla")
- Add year or quarter for time-bounded searches (e.g., "Tesla revenue Q3 2024 financial results")

**Use when:** Seeking reported financial figures, earnings summaries, or financial news from established financial publications.

---

### Template C — Investment Analysis

```bash
tvly search "{company_name} analysis valuation" --depth advanced --max-results 5 --topic general --include-domains "morningstar.com,fool.com,seekingalpha.com" --json
```

**Placeholder substitution:**
- `{company_name}` — company name
- Optionally add `buy OR sell OR hold` to surface analyst recommendations

**Use when:** Seeking analyst valuations, investment thesis, or buy/sell/hold analysis. Note that Seeking Alpha content includes both professional and contributor-level analysis — assess author credentials per credibility tiers.

---

## 4. Credibility Tiers

Channel-level source ranking for financial content. Financial misinformation has direct monetary consequences — apply higher skepticism than general web channels.

**Tier 1 — Highest Credibility:**
- SEC filings (10-K annual reports, 10-Q quarterly reports, 8-K material event disclosures, DEF 14A proxy statements) — filed under penalty of law
- Official earnings call transcripts and investor day presentations from company IR pages
- Audited financial statements from Big 4 or recognized audit firms
- Federal Reserve, Treasury, and regulatory agency data (for macroeconomic context)

**Tier 2 — Reliable:**
- Bloomberg and Reuters financial reporting (institutional-grade editorial standards)
- Wall Street Journal and Financial Times financial coverage
- Morningstar quantitative analysis and fund data
- Recognized equity research from named analysts at established firms (Goldman Sachs, Morgan Stanley) — note: subject to commercial bias, check for disclosure

**Tier 3 — Contextual:**
- Seeking Alpha contributor posts (quality varies widely; check author credentials and disclosure)
- Financial blogs and independent newsletters (useful for perspectives, not primary data)
- Company press releases about earnings or guidance — these are the company's own narrative, not independent reporting
- Summary sites (Macrotrends, Wisesheets) — useful for quick figures but verify against primary source

**Red Flags — Treat with Skepticism:**
- Penny stock promotion sites and "hot stock picks" content
- Any content using "guaranteed returns", "can't miss", or urgency language
- Undisclosed paid promotions — check for "sponsored content" disclosures, especially on Seeking Alpha and financial blogs
- Outdated financial data presented as current without a clear date — financial figures expire quickly
- Sites aggregating SEC data without citing the specific filing (cannot verify accuracy of transcription)

---

## 5. Source Status Taxonomy

See `web-search.md` Section 5 for canonical definitions of `DISCOVERED`, `ACCESSIBLE`, and `PROCESSED`.

**Financial note:** Financial data has a recency dimension that other channels do not. When logging status, also record the data date:

```
- [ACCESSIBLE] https://sec.gov/Archives/edgar/.../aapl-20240928.htm — 10-K FY2024, filed 2024-11-01
- [PROCESSED] https://finance.yahoo.com/news/apple-q4-results — Q4 earnings summary; revenue figure integrated into §2
```

---

## 6. Degradation Behavior

**Tier 1 (primary):** `tvly search` (Tavily CLI)

**Tier 2 [Firecrawl fallback]:** `npx firecrawl-cli search` (secondary)

**Tier 3 [WebSearch fallback]:** `WebSearch` (tertiary, built-in)

> The agent works out of the box with zero CLIs installed — WebSearch is always available.

**Unavailability criteria (trigger next tier):**
- Non-zero exit code from CLI command
- Request timeout > 30 seconds
- Rate limit response (429)
- Authentication failure

**Fallback protocol:**
1. Detect Tier 1 unavailability via criteria above
2. Switch to Tier 2: `npx firecrawl-cli search "{company_name} SEC filing 10-K" --limit 5 --format json`
3. Label results: `"via Firecrawl (tvly fallback)"`
4. If Tier 2 also fails, switch to Tier 3: `WebSearch` with site-scoped queries:
   - `site:sec.gov {company_name} 10-K`
   - `site:finance.yahoo.com {company_name} earnings`
   - `site:reuters.com {company_name} financial results`
5. Label results: `"via WebSearch (tvly+Firecrawl fallback)"`
6. Note in research log which tier succeeded and any limitations

**Degradation impact:** Financial data discovery is heavily web-based, so fallback tiers have lower impact than API-based channels. SEC filings and major financial news are well-indexed by general search engines. Direct EDGAR access via the regulatory channel (Plan 02) provides a complementary path that is not affected by Tavily availability.

---

## 7. Rate Limits

**Tavily (`tvly search`):** Same limits as web-search channel (~1,000 searches/month on free tier). Financial queries tend to be more targeted and fewer in number — typical financial research uses 5–10 queries per company.

**Firecrawl (`npx firecrawl-cli search`, fallback):** Free tier: 500 credits/month; each search consumes credits based on result count. Use `--limit` conservatively.

**WebSearch (tertiary fallback):** No documented hard limit; use conservatively.

**EDGAR direct access (regulatory channel):** SEC imposes rate limits on EDGAR full-text search API — see regulatory channel playbook (Plan 02) for specific limits.
