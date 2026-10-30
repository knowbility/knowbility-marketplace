---
name: regulatory
description: Government filings and regulatory document discovery via EDGAR and ProPublica APIs
allowed-tools: [Bash, WebSearch]
channel-type: regulatory
---

# Regulatory Channel Playbook

## 1. Channel Overview

**Discovers:** SEC filings (10-K annual reports, 10-Q quarterly reports, 8-K event disclosures, S-1 IPO registrations, DEF 14A proxy statements), nonprofit 990 tax filings, and regulatory documents.

**Best for:** Company research (both for-profit and non-profit), financial analysis, executive compensation research, compliance research, corporate governance analysis, and verifying company self-reported claims against legally mandated disclosures.

**Cannot find:** Private company filings (not SEC-registered), international regulatory documents (non-US jurisdictions), state-level regulatory filings, pre-EDGAR historical filings (generally pre-1993), small nonprofits below 990 filing threshold.

---

## 2. Tool Configuration

**Primary tool:** Bash (curl to two HTTP APIs)

**Authentication:** None required for either API.

**API 1 — SEC EDGAR Full-Text Search (EFTS):**
- Base URL: `https://efts.sec.gov/LATEST/search-index`
- Required header: `User-Agent: ResearchAgent (contact@example.com)` — SEC policy requires identification
- Response format: JSON
- Returns: Filing metadata including filing date, form type, and links to full filing documents

**API 2 — ProPublica Nonprofit Explorer:**
- Base URL: `https://projects.propublica.org/nonprofits/api/v2`
- No authentication required
- Response format: JSON
- Returns: Organization metadata and links to 990 PDF filings

---

## 3. Query Templates

### Template A — EDGAR Company Filing Search
Find recent filings of any type for a named company:

```bash
curl -s -H "User-Agent: ResearchAgent (contact@example.com)" \
  "https://efts.sec.gov/LATEST/search-index?q=%22{company_name}%22&forms=10-K,10-Q,8-K&dateRange=custom&startdt={year_minus_2}-01-01&enddt={today}"
```

Substitute: `{company_name}` = company name (URL-encode spaces as `%20`, wrap in `%22...%22` for exact match), `{year_minus_2}` = current year minus 2, `{today}` = current date in YYYY-MM-DD format.

### Template B — EDGAR Specific Filing Type
Find a specific form type for a company:

```bash
curl -s -H "User-Agent: ResearchAgent (contact@example.com)" \
  "https://efts.sec.gov/LATEST/search-index?q=%22{company_name}%22&forms={form_type}"
```

Substitute: `{company_name}` = company name (URL-encoded and quoted), `{form_type}` = comma-separated form types such as `10-K`, `S-1`, `DEF+14A`, or `8-K`.

### Template C — ProPublica Nonprofit Lookup
Search for a nonprofit organization and retrieve 990 filing information:

```bash
curl -s "https://projects.propublica.org/nonprofits/api/v2/search.json?q={org_name}"
```

Substitute: `{org_name}` = organization name (URL-encode spaces as `+`).

**Note on EDGAR results:** EFTS returns filing metadata including the filing URL. Record the SEC filing URL as the source with status DISCOVERED. Full content extraction from the filing documents happens in the process-source step, not during discovery.

---

## 4. Credibility Tiers

**Tier 1 (Highest credibility):**
- Audited financial statements within 10-K filings (signed by external auditors)
- 990 tax returns (legally mandated disclosures with penalties for material misstatements)
- Proxy statements (DEF 14A) for executive compensation data
- S-1 registration statements (reviewed by SEC before effectiveness)

**Tier 2 (Reliable with context):**
- Non-audited SEC filings: 8-K event reports, 10-Q quarterly reports (reviewed but not audited)
- 990 schedules (supplemental information, less scrutinized than core return)
- SEC staff comment letters and company responses (shows areas of regulatory scrutiny)

**Tier 3 (Contextual — use with caution):**
- SEC no-action letters (guidance only, not binding)
- Regulatory guidance documents and interpretive releases
- EDGAR exhibits that are not financial statements (e.g., material contracts, press releases)

**Red flags:**
- **Amended filings (10-K/A, 10-Q/A):** Always check both the original and the amendment; an amendment may indicate material errors in prior reporting — note discrepancies
- **Late filings:** NT 10-K or NT 10-Q (notification of late filing) may indicate financial distress, accounting issues, or auditor disagreements
- **Large "other expenses" in 990s:** Nonprofits with significant unitemized "other expenses" may obscure compensation or questionable expenditures — request Schedule O if needed
- **Going concern opinions:** Auditor notes about going concern in 10-K filings indicate material uncertainty about the company's ability to continue operations
- **Frequent auditor changes:** Auditor hops (switching auditors repeatedly) may indicate disagreements about accounting treatment

---

## 5. Source Status Taxonomy

Reference `${CLAUDE_PLUGIN_ROOT}/reference/discovery/channel-playbooks/web-search.md` for canonical definitions of DISCOVERED / ACCESSIBLE / PROCESSED.

**Regulatory-channel notes:**
- SEC filings are always ACCESSIBLE — they are public by law and available at sec.gov
- The EDGAR EFTS response provides the filing index URL; individual filing documents within that index are also ACCESSIBLE
- ProPublica 990 data: the organization record is ACCESSIBLE (JSON); linked 990 PDFs require separate extraction and are ACCESSIBLE for most filings but may have older years unavailable
- Filing metadata (date, form type, company name) can be noted as PROCESSED upon extraction from the API response; full document analysis requires a separate process-source step

---

## 6. Degradation Behavior

**Primary:** Bash curl to EDGAR EFTS and ProPublica APIs

**Tier 2 [Tavily fallback] for EDGAR (if unavailable):**
```bash
tvly search "{company_name} SEC filing {form_type}" --depth advanced --max-results 5 --include-domains "sec.gov" --json
```
Label results: "via tvly (EDGAR fallback)"

**Tier 2 [Tavily fallback] for nonprofits (if ProPublica unavailable):**
```bash
tvly search "{org_name} 990 filing nonprofit annual report" --depth advanced --max-results 5 --include-domains "propublica.org,guidestar.org,candid.org" --json
```
Label results: "via tvly (ProPublica fallback)"

**Tier 3 [Firecrawl fallback]:**
```bash
npx firecrawl-cli search "{company_name} SEC filing {form_type} site:sec.gov" --limit 5 --format json
```
Label results: "via Firecrawl (EDGAR+tvly fallback)" or "via Firecrawl (ProPublica+tvly fallback)"

**Tier 4 [WebSearch fallback]:** WebSearch with site-scoped queries:
- For-profit: `{company_name} 10-K site:sec.gov`
- Nonprofit: `{org_name} 990 site:propublica.org`
Label results: "via WebSearch (EDGAR+tvly+Firecrawl fallback)" or "via WebSearch (ProPublica+tvly+Firecrawl fallback)". Results will be less structured — filing index pages rather than API JSON.

> The agent works out of the box with zero CLIs installed — WebSearch is always available.

**Unavailable criteria:** Trigger next tier when:
- HTTP 5xx response from API (or non-zero exit from CLI)
- Request timeout > 15 seconds
- HTTP 429 rate limit (back off and retry once after 5 seconds before falling back)

---

## 7. Rate Limits

**EDGAR (SEC policy):** Maximum 10 requests per second. Exceeding this may result in IP blocks from the SEC. For bulk queries, pace at 5 req/s to stay safely within limits.

**ProPublica Nonprofit Explorer:** No documented rate limit. Use 2 requests per second as a safe default to avoid triggering undocumented throttling.

**Tavily (`tvly search`, fallback):** ~1,000 searches/month on free tier.

**Firecrawl (`npx firecrawl-cli search`, fallback):** Free tier: 500 credits/month; each search consumes credits based on result count.

**Best practice:** Always include the required `User-Agent` header for EDGAR requests. The SEC actively blocks requests without proper User-Agent identification.

---

## Example Responses

### EDGAR EFTS Response

Trimmed example response from EDGAR full-text search. Extract these fields:

```json
{
  "hits": {
    "hits": [
      {
        "_source": {
          "file_date": "2024-02-15",
          "form_type": "10-K",
          "display_names": ["Acme Corp (CIK 0001234567)"],
          "file_num": "001-12345",
          "film_num": "24123456",
          "period_of_report": "2023-12-31",
          "entity_name": "Acme Corp"
        },
        "_id": "0001234567-24-000001"
      }
    ],
    "total": {
      "value": 42
    }
  }
}
```

**Fields to extract per filing:**
- `_source.file_date` — filing date
- `_source.form_type` — filing type (10-K, 10-Q, 8-K, etc.)
- `_source.entity_name` — company name as filed
- `_source.period_of_report` — reporting period end date
- `_id` — accession number; construct filing URL as: `https://www.sec.gov/Archives/edgar/data/{CIK}/{accession_no_dashes}/{accession_no}-index.htm`
- CIK extraction: parse from `display_names` value (format: "Name (CIK XXXXXXXXXX)")

### ProPublica Nonprofit Explorer Response

Trimmed example response from organization search. Extract these fields:

```json
{
  "total_results": 3,
  "organizations": [
    {
      "ein": "13-1837418",
      "name": "EXAMPLE FOUNDATION INC",
      "city": "New York",
      "state": "NY",
      "ntee_code": "A20",
      "subsection_code": "03",
      "revenue_amount": 5200000,
      "income_amount": 5000000,
      "asset_amount": 12000000
    }
  ]
}
```

**Fields to extract per organization:**
- `ein` — Employer Identification Number (canonical nonprofit identifier)
- `name` — organization name as filed
- `city`, `state` — location
- `ntee_code` — National Taxonomy of Exempt Entities code (identifies organization type/sector)
- `revenue_amount`, `income_amount`, `asset_amount` — high-level financial scale indicators
- **990 profile URL construction:** `https://projects.propublica.org/nonprofits/organizations/{ein_no_dashes}` — replace dashes in EIN with nothing (e.g., `13-1837418` → `131837418`)
