---
name: academic
description: Academic paper and scholarly source discovery via OpenAlex, Crossref, and Unpaywall APIs
allowed-tools: [Bash, WebSearch]
channel-type: academic
---

# Academic Channel Playbook

## 1. Channel Overview

**Discovers:** Peer-reviewed journal articles, conference proceedings, preprints, books, systematic reviews, and meta-analyses.

**Best for:** Research types requiring empirical evidence, literature reviews, technical depth, or citation-backed claims. Ideal for validating scientific claims, identifying domain experts, and establishing research consensus.

**Cannot find:** Unpublished manuscripts, most dissertations and theses, non-English publications with poor OpenAlex indexing, proprietary research, classified reports, very recent preprints not yet indexed.

---

## 2. Tool Configuration

**Primary tool:** Bash (curl to three HTTP APIs)

**Authentication:** None required for any API.

**API 1 — OpenAlex:**
- Base URL: `https://api.openalex.org`
- Authentication: None required — OpenAlex is fully open access.
- Polite pool: Include `mailto` parameter with a contact email for priority rate limit tier (10 req/s vs 1 req/s without).
- Response format: JSON
- Returns: Paper metadata including title, DOI, authors, citation count, open-access status, and OA URL

**API 2 — Crossref:**
- Base URL: `https://api.crossref.org/works`
- Authentication: None required — polite pool via `mailto` query parameter (same as OpenAlex convention)
- Response format: JSON
- Returns: Paper metadata including DOI, title, authors, citation count (is-referenced-by-count), publication date, and primary URL

**API 3 — Unpaywall:**
- Base URL: `https://api.unpaywall.org/v2/{doi}`
- Authentication: None required — email parameter required for identification: `?email={email}`
- Response format: JSON
- Returns: Open access status, best OA location URL, license, and OA type (gold/green/hybrid/bronze/closed)

---

## 3. Query Templates

### Template A — Topic Search
Find papers on a subject, filtered by citation count for quality:

```bash
curl -s "https://api.openalex.org/works?search={topic}&filter=cited_by_count:>10&per_page=8&sort=relevance_score:desc&mailto={email}"
```

Substitute: `{topic}` = search phrase, `{email}` = contact email for polite pool.

**The citation floor is a per-run choice, not a fixed filter.** `cited_by_count:>10` is the default for established topics, where citations are a workable quality proxy. For **emerging topics** (a field or question younger than ~3 years, or fast-moving areas where the important work is recent), the floor systematically excludes exactly the papers that matter — drop the `cited_by_count` filter entirely and add `from_publication_date:{year_minus_2}`, sorting by `publication_date:desc`; judge quality by venue, author affiliation, and methodology instead (Tier 2 criteria apply — recent ≠ low quality). Decide per run from the phase's questions, state which floor was used ("citation floor: >10" or "citation floor: none — emerging topic"), and record the actual query in the retrieval log as always.

### Template B — Author Search
Find recent papers by a specific researcher:

```bash
curl -s "https://api.openalex.org/works?filter=authorships.author.display_name.search:{author_name}&per_page=8&sort=publication_date:desc&mailto={email}"
```

Substitute: `{author_name}` = full or partial name (URL-encode spaces as `+`), `{email}` = contact email.

### Template C — Filtered Search (Recent, Open Access, High-Impact)
Find recent open-access papers with meaningful citation counts:

```bash
curl -s "https://api.openalex.org/works?search={topic}&filter=from_publication_date:{year_minus_5},is_oa:true,cited_by_count:>5&per_page=8&sort=cited_by_count:desc&mailto={email}"
```

Substitute: `{topic}` = search phrase, `{year_minus_5}` = current year minus 5 (e.g., `2020` if current year is 2025), `{email}` = contact email.

The same per-run citation-floor choice as Template A applies: for emerging topics, drop `cited_by_count:>5` and sort by `publication_date:desc` instead of `cited_by_count:desc`.

### Crossref Query Templates

### Template D — Crossref Topic Search
Find papers on a subject via Crossref, sorted by relevance:

```bash
curl -s "https://api.crossref.org/works?query={topic}&rows=8&sort=relevance&order=desc&mailto={email}"
```

Substitute: `{topic}` = search phrase (URL-encode spaces as `+`), `{email}` = contact email for polite pool.

### Template E — Crossref Author Search
Find papers by a specific author:

```bash
curl -s "https://api.crossref.org/works?query.author={author_name}&rows=8&sort=published&order=desc&mailto={email}"
```

Substitute: `{author_name}` = author name (URL-encode spaces as `+`), `{email}` = contact email.

### Template F — Crossref DOI Lookup
Retrieve full metadata for a known DOI:

```bash
curl -s "https://api.crossref.org/works/{doi}?mailto={email}"
```

Substitute: `{doi}` = full DOI (e.g., `10.1038/s41586-020-2649-2`), `{email}` = contact email.

### Unpaywall Lookup

### Template G — Unpaywall OA Check
Check if a paywalled paper has a legal open-access copy:

```bash
curl -s "https://api.unpaywall.org/v2/{doi}?email={email}"
```

Substitute: `{doi}` = full DOI (e.g., `10.1038/s41586-020-2649-2`), `{email}` = contact email.

**Trigger condition:** Call only when a paper has `is_oa=false` (from OpenAlex) or no OA indicator (from Crossref). Do not call for papers already known to be open access. Bounded by the existing 8-result-per-channel cap — worst case 8 Unpaywall calls per query.

---

## 4. Credibility Tiers

**Tier 1 (Highest credibility):**
- Papers in peer-reviewed journals with high citation counts (>50)
- Systematic reviews and meta-analyses
- Papers from journals with established impact factors
- Works by authors at recognized research institutions

**Tier 2 (Reliable with context):**
- Recent peer-reviewed papers with <50 citations (may simply be new, not low quality)
- Conference proceedings from top-tier venues (NeurIPS, ICML, CVPR, ICLR, CHI, etc.)
- Preprints from established researchers with institutional affiliations
- Book chapters from academic presses

**Tier 3 (Contextual — use cautiously):**
- Preprints without peer review from unknown authors
- Very low-citation papers (<5 citations, >2 years old)
- Conference workshop papers
- Book chapters from non-academic or vanity publishers

**Red flags:**
- **Predatory journal indicators (predatory publishers):** Implausibly fast review times (<1 week), journals indexed only in DOAJ without SCOPUS/WoS, journals not matching declared scope, excessive article processing charges with no clear review process
- **Retraction notices:** OpenAlex `is_retracted: true` field — always check before citing
- **Self-citation inflation:** Author has high citation count but most citations are from co-authored papers with overlapping author lists
- **Paper mills:** Multiple papers with suspiciously similar structures, methodologies, or figure patterns — common in life sciences and materials science
- **Citation manipulation:** Sudden spike in citations after long dormancy, especially for commercial claims

---

## 5. Source Status Taxonomy

Reference `${CLAUDE_PLUGIN_ROOT}/reference/discovery/channel-playbooks/web-search.md` for canonical definitions of DISCOVERED / ACCESSIBLE / PROCESSED.

**Academic-channel notes:**
- OpenAlex `is_oa: true` indicates open access — the full text is likely ACCESSIBLE via `open_access.oa_url`
- Paywalled papers (is_oa: false) are DISCOVERED only unless the researcher has institutional access
- DOI links always resolve to a landing page (ACCESSIBLE for metadata), but full text may be paywalled
- arXiv preprints (`open_access.oa_url` contains "arxiv.org") are always ACCESSIBLE

---

## 6. Degradation Behavior

**Primary:** Bash curl to OpenAlex, Crossref, and Unpaywall APIs

**Tier 2 [Tavily fallback]:** `tvly search` with academic domain scoping:
```bash
tvly search "{topic} site:scholar.google.com OR site:arxiv.org OR site:pubmed.ncbi.nlm.nih.gov" --depth advanced --max-results 8 --json
```
Label results: "via tvly (OpenAlex fallback)"

**Tier 3 [Firecrawl fallback]:** `npx firecrawl-cli search` with academic keywords:
```bash
npx firecrawl-cli search "{topic} academic paper arxiv pubmed" --limit 8 --format json
```
Label results: "via Firecrawl (OpenAlex+tvly fallback)"

**Tier 4 [WebSearch fallback]:** WebSearch with academic domain keywords:
```
query: "{topic} academic paper OR research study OR systematic review"
```
Label results: "via WebSearch (OpenAlex+tvly+Firecrawl fallback)". Warn user that results will be less targeted — quality filtering not available.

> The agent works out of the box with zero CLIs installed — WebSearch is always available.

**Crossref degradation (if api.crossref.org unavailable):**

**Tier 2 [Tavily fallback] for Crossref:**
```bash
tvly search "{topic} site:doi.org OR site:crossref.org" --depth advanced --max-results 8 --json
```
Label results: "via tvly (Crossref fallback)"

**Tier 3 [WebSearch fallback] for Crossref:**
```
query: "{topic} DOI academic paper crossref"
```
Label results: "via WebSearch (Crossref fallback)". Warn user that citation metadata will be unavailable.

**Unpaywall degradation (if api.unpaywall.org unavailable):**

If Unpaywall is unavailable (timeout > 15 seconds, HTTP 5xx, HTTP 429), the paper remains DISCOVERED. Skip silently. Log a one-line channel status note: `Unpaywall: unavailable — N papers remain DISCOVERED`. Do not retry. Do not block. Do not fall back to another service — there is no equivalent free OA lookup service.

**Unavailable criteria:** Trigger next tier when:
- HTTP 5xx response from api.openalex.org or api.crossref.org (or non-zero exit from CLI)
- Request timeout > 15 seconds
- HTTP 429 rate limit (without mailto parameter — add mailto and retry once before falling back)

---

## 7. Rate Limits

**OpenAlex polite pool (with mailto parameter):** 10 requests/second

**Without mailto:** 1 request/second

**Daily cap:** None documented for reasonable usage (hundreds of requests per session is fine).

**Crossref polite pool (with mailto parameter):** 50 requests/second

**Crossref without mailto:** Rate limited to ~1 request/second with aggressive throttling.

**Unpaywall (with email parameter):** 100,000 requests/day (practically unlimited for research use). Required: `email` parameter in every request.

**Tavily (`tvly search`, fallback):** ~1,000 searches/month on free tier.

**Firecrawl (`npx firecrawl-cli search`, fallback):** Free tier: 500 credits/month; each search consumes credits based on result count.

**Best practice:** Always include `mailto={email}` parameter for OpenAlex and Crossref requests. For bulk retrieval, use cursor-based pagination with `cursor=*` parameter rather than high `per_page` values.

---

## 8. Deduplication and Priority Rules

**Query order:** OpenAlex first, Crossref second, Unpaywall third (inline during same pass).

**Deduplication by DOI:** If a paper appears in both OpenAlex and Crossref results (matched by DOI string equality after normalization to lowercase), the OpenAlex entry is kept. The Crossref entry is silently dropped. This mirrors the URL deduplication in the discover skill's Step 4.

**Data merge:** After deduplication, Crossref enriches missing fields on the surviving OpenAlex entries:
- If OpenAlex entry has no DOI but Crossref matched by title → add DOI from Crossref
- If OpenAlex entry has no citation count → use Crossref `is-referenced-by-count`
- If OpenAlex author list is incomplete → supplement from Crossref `author[]`
- OpenAlex data has priority in all cases — Crossref fills gaps only, never overwrites

**Unpaywall trigger:** Called only when a paper has `is_oa=false` (from OpenAlex) or has no OA indicator (from Crossref-only results). Result: if `best_oa_location.url` is present and non-null, upgrade source status from DISCOVERED to ACCESSIBLE. Capped by the existing 8-result-per-channel limit.

**Channel status line:** After all three APIs complete, report a single academic channel status line:
```
Academic: {N} results (OpenAlex: {n1}, Crossref-only: {n2}, Unpaywall upgrades: {n3}) [degraded: {list}]
```
Where `{list}` names any API that was unavailable during this run (empty if all succeeded).

---

## Example Response

Trimmed OpenAlex JSON response for a works query. The discover skill should extract these fields:

```json
{
  "results": [
    {
      "id": "https://openalex.org/W2741809807",
      "title": "Attention Is All You Need",
      "doi": "https://doi.org/10.48550/arXiv.1706.03762",
      "publication_date": "2017-06-12",
      "cited_by_count": 95000,
      "authorships": [
        {
          "author": {
            "display_name": "Ashish Vaswani"
          }
        }
      ],
      "open_access": {
        "is_oa": true,
        "oa_url": "https://arxiv.org/abs/1706.03762"
      },
      "primary_location": {
        "source": {
          "display_name": "arXiv"
        }
      },
      "is_retracted": false
    }
  ],
  "meta": {
    "count": 1,
    "per_page": 8,
    "page": 1
  }
}
```

**Fields to extract per result:**
- `title` — paper title
- `doi` — canonical identifier and link
- `publication_date` — for recency assessment
- `cited_by_count` — for credibility tier assignment
- `authorships[].author.display_name` — author names (may be multiple)
- `open_access.is_oa` — true = ACCESSIBLE, false = DISCOVERED
- `open_access.oa_url` — direct full-text URL if open access
- `primary_location.source.display_name` — journal or repository name
- `is_retracted` — if true, flag prominently before including in research

### Crossref Example Response

Trimmed Crossref JSON response for a works query. The discover skill should extract these fields:

```json
{
  "message": {
    "items": [
      {
        "DOI": "10.1038/s41586-020-2649-2",
        "title": ["Language models show human-like content effects on reasoning"],
        "author": [
          {"given": "Ishita", "family": "Dasgupta"}
        ],
        "is-referenced-by-count": 245,
        "published": {"date-parts": [[2023, 1, 15]]},
        "resource": {"primary": {"URL": "https://doi.org/10.1038/s41586-020-2649-2"}}
      }
    ]
  }
}
```

**Fields to extract per result:**
- `DOI` — canonical identifier (use for deduplication against OpenAlex)
- `title[0]` — paper title (Crossref wraps in array)
- `author[].given` + `author[].family` — author names
- `is-referenced-by-count` — citation count
- `published.date-parts[0]` — publication date as [year, month, day] array
- `resource.primary.URL` — landing page URL

### Unpaywall Example Response

Trimmed Unpaywall JSON response for a DOI lookup:

```json
{
  "doi": "10.1038/s41586-020-2649-2",
  "is_oa": true,
  "best_oa_location": {
    "url": "https://europepmc.org/articles/pmc7888567",
    "license": "cc-by",
    "version": "publishedVersion"
  },
  "oa_status": "green"
}
```

**Fields to extract:**
- `doi` — confirms lookup target
- `is_oa` — true means legal OA copy found; upgrade source status to ACCESSIBLE
- `best_oa_location.url` — direct OA URL (use as the accessible link in candidates)
- `best_oa_location.license` — license type (cc-by, cc-by-nc, etc.)
- `oa_status` — gold/green/hybrid/bronze/closed (informational for credibility notes)
