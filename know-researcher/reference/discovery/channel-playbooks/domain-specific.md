---
name: domain-specific
description: Research-type-specific niche sources and specialized databases
allowed-tools: [Bash, WebSearch]
channel-type: domain-specific
---

# Domain-Specific Channel Playbook

## 1. Channel Overview

**Discovers:** Sources that don't fit the other five channels — patent databases, specialized industry databases, niche registries, standards bodies, educational repositories, and professional credentialing databases.

**Best for:** Research types requiring specialized sources beyond general web, academic, regulatory, financial, or social channels. This channel is type-dependent — different research types route to entirely different specialized sources.

**How this channel works:** The type-channel maps (Phase 2) specify which domain-specific type hooks each research type uses. The discover skill reads the relevant type-channel map first, then selects the appropriate hooks from this playbook to execute. Do not run all hooks — only the hooks specified by the research type's channel map.

**Cannot find:** Sources adequately covered by the other five channels, proprietary industry databases requiring subscriptions (except via Tavily discovery), unpublished internal data.

---

## 2. Tool Configuration

**Primary tool:** Varies by type hook (see Query Templates section):
- **Patent search:** URL construction + `tvly extract` (Google Patents has no API — URLs are constructed and then extracted)
- **Industry databases:** `tvly search` with domain scoping
- **Standards bodies:** `tvly search` with domain scoping, or direct URL construction for known standards bodies
- **Educational repositories:** `tvly search` with domain scoping
- **Professional registries:** `tvly search` with domain scoping

**Authentication:** Tavily CLI authenticates via `TAVILY_API_KEY` environment variable or `tvly login`.

---

## 3. Query Templates

The following are type hooks — structured query blocks organized by research type. The discover skill selects hooks based on what the type-channel map specifies for the current research type. Each hook is a self-contained query block.

---

### Type Hook: Patent Search
**Applies to:** company, person, PRD validation research types

**Google Patents URL construction:**
```
URL: https://patents.google.com/?q={search_terms}&assignee={company_name}&after=priority:{year_minus_5}0101
```

Substitute: `{search_terms}` = technology keywords (URL-encoded), `{company_name}` = assignee company name (URL-encoded), `{year_minus_5}` = current year minus 5 as 4-digit year (e.g., `2020`).

Execution: Construct the URL above, then extract patent listings:
```bash
tvly extract "{constructed_url}" --json
```
**Extraction fallbacks (if `tvly extract` unavailable):**
1. `npx firecrawl-cli scrape "{constructed_url}" --format json`
2. `npx playwright pdf "{constructed_url}" patents.pdf` (for archival/manual review)
3. Present the constructed URL to the user for manual review

**Patent search by inventor (person research):**
```
URL: https://patents.google.com/?inventor={person_name}&after=priority:{year_minus_5}0101
```

---

### Type Hook: Industry Databases
**Applies to:** company, competitive analysis, market/industry research types

**Crunchbase company lookup:**
```bash
tvly search "{company_name} crunchbase funding employees" --depth advanced --max-results 3 --include-domains "crunchbase.com" --json
```

**Industry market reports:**
```bash
tvly search "{industry} market report {year} size share forecast" --depth advanced --max-results 5 --include-domains "statista.com,ibisworld.com,grandviewresearch.com,mordorintelligence.com" --json
```

Substitute: `{industry}` = industry or sector name, `{year}` = current year.

---

### Type Hook: Educational Resources
**Applies to:** curriculum research type

**Academic standards databases:**
```bash
tvly search "{subject} standards framework grade {grade_level}" --depth advanced --max-results 5 --include-domains "corestandards.org,nextgenscience.org,iste.org,ed.gov,achieve.org" --json
```

**Open Educational Resources (OER):**
```bash
tvly search "{topic} open educational resource curriculum" --depth advanced --max-results 5 --include-domains "oer.commons.org,merlot.org,openstax.org,opened.com,khanacademy.org" --json
```

Substitute: `{subject}` = academic subject, `{grade_level}` = grade or grade range (e.g., `6-8`), `{topic}` = curriculum topic.

---

### Type Hook: Specialized Registries
**Applies to:** person research type

**Academic and research professional profiles:**
```bash
tvly search "{person_name} {field} researcher profile publications" --depth advanced --max-results 3 --include-domains "orcid.org,researchgate.net,scholar.google.com,academia.edu" --json
```

**Professional licensing and credentialing:**
```bash
tvly search "{person_name} {credential_type} license certification verified" --depth advanced --max-results 3 --json
```

Substitute: `{person_name}` = full name, `{field}` = domain/discipline, `{credential_type}` = license type (e.g., "CPA", "MD", "PE engineer").

---

**Note:** These are starter hooks in a template pattern. Phase 2 type-channel maps determine which hooks each research type actually uses, and may add research-type-specific sources beyond these defaults. If a type-channel map specifies a domain-specific source not listed here, follow the map's instructions directly.

---

## 4. Credibility Tiers

**Tier 1 (Highest credibility):**
- Patent office filings from USPTO, EPO, WIPO (legally filed, publicly recorded)
- Official standards documents from ANSI, ISO, NIST, IEEE, W3C
- Government educational databases (.gov, .edu institutional repositories)
- ORCID-verified researcher profiles (researcher-controlled, linked to publications)

**Tier 2 (Reliable with context):**
- Established industry databases with verified data (Crunchbase company profiles with funding rounds confirmed by press releases, Statista data with cited primary sources)
- Professional registries with identity verification (LinkedIn with employment history corroborated by other sources)
- Major OER platforms with editorial review (OpenStax, Khan Academy)

**Tier 3 (Contextual — use cautiously):**
- User-submitted profiles without verification (ResearchGate self-reported data)
- Unverified database entries (Crunchbase company descriptions, estimated employee counts)
- Industry reports without disclosed methodology or sample size
- Educational materials without peer review or institutional backing

**Red flags:**
- **Pay-to-play directories:** Databases that sell "verified" listings (common in professional directories) — check if listing requires payment for inclusion
- **Vanity registries:** "Who's Who" style directories that charge subjects for inclusion — high name recognition but low credibility
- **Industry reports as vendor marketing:** Reports from companies about markets they participate in — check if report author has commercial interest in the findings
- **Patent trolls:** Companies or individuals with high patent volume but no products — patents exist but may not reflect meaningful innovation; note when assignee is a holding entity with no operating business
- **Outdated standards:** Standards bodies update regularly — confirm you have the current version (check publication date and whether a newer version supersedes it)

---

## 5. Source Status Taxonomy

Reference `${CLAUDE_PLUGIN_ROOT}/reference/discovery/channel-playbooks/web-search.md` for canonical definitions of DISCOVERED / ACCESSIBLE / PROCESSED.

**Domain-specific channel notes:**
- Patent filings at USPTO and EPO are always ACCESSIBLE (public by law after publication)
- Google Patents URL results via `tvly extract` are ACCESSIBLE
- Industry database records may be partially paywalled — mark as DISCOVERED until full content access is confirmed
- OER resources are typically ACCESSIBLE by definition (open access)
- Professional registry profiles are ACCESSIBLE (public profiles); full contact information may be restricted

---

## 6. Degradation Behavior

This channel uses the Tavily CLI for most type hooks, so degradation follows a 3-tier chain.

**If `tvly search` unavailable:**

Tier 2 [Firecrawl fallback]: Use `npx firecrawl-cli search` with equivalent domain-scoped queries:
```bash
npx firecrawl-cli search "{company_name} site:crunchbase.com OR site:statista.com" --limit 5 --format json
```
Label results: "via Firecrawl (tvly fallback)"

Tier 3 [WebSearch fallback]: Use WebSearch with site-scoped queries:
```
WebSearch: "{company_name} site:crunchbase.com OR site:statista.com"
```
Label results: "via WebSearch (tvly+Firecrawl fallback)"

> The agent works out of the box with zero CLIs installed — WebSearch is always available.

**If `tvly extract` unavailable (for patent URL hooks):**
1. `npx firecrawl-cli scrape "{url}" --format json` [Firecrawl fallback]
2. `npx playwright pdf "{url}" patents.pdf` [Playwright fallback — archival/manual review]
3. Present the constructed Google Patents URL to the user for manual review. Log as: "Patent URL constructed but extraction unavailable — manual review required: {url}"

**Without any tools:**
Document which type hooks could not execute. List constructed URLs (patents) as DISCOVERED with note that content extraction was not possible. Inform user that domain-specific channel results are incomplete.

**Label all fallback results** with the actual source method used.

---

## 7. Rate Limits

**Tavily (`tvly search` / `tvly extract`):** Standard Tavily rate limits apply (~1,000 searches/month on free tier, shared across all channels).

**Firecrawl (`npx firecrawl-cli search` / `npx firecrawl-cli scrape`, fallback):** Free tier: 500 credits/month; each search or scrape consumes credits. Use `--limit` conservatively.

**Google Patents (URL construction + extract):** No API rate limit — URL construction is local computation. `tvly extract` rate limits apply to the extraction step.

**Industry databases (accessed via Tavily CLI):** Standard web rate limits apply to the underlying sites. The CLI handles this; no additional throttling needed.

**Best practice:** Limit total domain-specific queries per session to 10-15 to avoid over-saturating any single database and to stay within Tavily monthly budgets.
