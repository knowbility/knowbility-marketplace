---
name: standards
description: Technical standards and US federal rulemaking discovery via the Federal Register, eCFR, and W3C APIs
allowed-tools: [Bash, WebSearch]
channel-type: standards
---

# Standards Channel Playbook

## 1. Channel Overview

**Discovers:** The text of a technical standard and the text of the US federal rule that adopts it — W3C technical reports with their maturity and supersession status, the Code of Federal Regulations as currently in force, and Federal Register documents at every stage of rulemaking (advance notice, proposed rule, final rule).

**Best for:** Any question of the form "what does this actually require," "which version is operative," or "what is coming." Conformance requirements, standards-body status, incorporation by reference, agency rulemaking in progress, and the gap between a published standard and the version a regulation points at.

**Why this channel exists separately from `regulatory`:** the regulatory channel is corporate disclosure — SEC filings and nonprofit 990s. It cannot reach the text of a standard or a rule, and its own playbook lists international and non-SEC regulatory documents under "Cannot find." Requests for standards text routed there return nothing or return a company filing that happens to mention the word.

**Cannot find:** Non-US jurisdictions (EU/EN 301 549, UK, Canada, Australia — out of scope for this channel as configured), state-level law, standards behind a paywall (most ISO and IEEE documents are sold, not published; this channel finds the citation and the status, never the text), court decisions and case law, enforcement actions and settlement agreements, and anything about whether a particular product conforms.

---

## 2. Tool Configuration

**Primary tool:** Bash (curl to three HTTP APIs). None requires authentication or a key.

**API 1 — Federal Register:**
- Base URL: `https://www.federalregister.gov/api/v1`
- Response format: JSON
- Returns: rulemaking documents with stage, agency, CFR references, docket ids, and a stable `html_url`
- Covers both halves of the brief: documents in force (`RULE`) and documents in progress (`PRORULE`, `NOTICE`)

**API 2 — eCFR (the regulation as currently in force):**
- Base URL: `https://www.ecfr.gov/api/versioner/v1`
- Response format: JSON for structure endpoints, XML for full-text endpoints
- **Required:** full-text endpoints reject uncompressed requests with HTTP 406 and `supportCode 11` ("This endpoint requires response compression"). Always pass `--compressed` to curl. A request without it fails in a way that looks like an outage.

**API 3 — W3C:**
- Base URL: `https://api.w3.org`
- Response format: JSON
- Returns: specification records with maturity status, dated version URIs, and series membership
- This is the only API here that answers "is the document I am holding superseded"

**Access Board, agency guidance, and anything without an API:** `tvly search` scoped to the publishing domain. See Template F.

---

## 3. Query Templates

### Template A — Federal Register, rulemaking by agency and stage
The workhorse. Find what an agency has issued, filtered to one stage:

```bash
curl -s --compressed -H "User-Agent: ResearchAgent (contact@example.com)" \
  "https://www.federalregister.gov/api/v1/documents.json?per_page=8&order=newest&conditions%5Bagencies%5D%5B%5D={agency_slug}&conditions%5Btype%5D%5B%5D={doc_type}&fields%5B%5D=document_number&fields%5B%5D=title&fields%5B%5D=type&fields%5B%5D=action&fields%5B%5D=publication_date&fields%5B%5D=agencies&fields%5B%5D=cfr_references&fields%5B%5D=docket_ids&fields%5B%5D=html_url"
```

Substitute: `{agency_slug}` = agency slug (see below), `{doc_type}` = `RULE` for final rules, `PRORULE` for proposed, `NOTICE` for notices. Repeat the `conditions[type][]` parameter to combine stages.

**Agency slugs that matter here, and are not guessable:**

| Agency | Slug |
|---|---|
| US Access Board | `architectural-and-transportation-barriers-compliance-board` |
| Department of Justice | `justice-department` |

The Access Board's slug is its statutory name, not "access board." Read the slug from `https://www.federalregister.gov/api/v1/agencies` rather than constructing it — that endpoint returns every agency with `id`, `slug`, and `name`.

**Do not use `conditions[term]` alone.** It is full-text across the entire Federal Register and the result count saturates at 10,000; a term search for "web accessibility" returns Medicare payment rules that mention the phrase in passing. Scope by agency, by `conditions[cfr][title]`, or by docket before adding a term.

### Template B — Federal Register, by CFR citation
When you know the part a rule amends:

```bash
curl -s --compressed -H "User-Agent: ResearchAgent (contact@example.com)" \
  "https://www.federalregister.gov/api/v1/documents.json?per_page=8&order=newest&conditions%5Bcfr%5D%5Btitle%5D={cfr_title}&conditions%5Bcfr%5D%5Bpart%5D={cfr_part}&fields%5B%5D=title&fields%5B%5D=type&fields%5B%5D=action&fields%5B%5D=publication_date&fields%5B%5D=html_url"
```

Substitute: `{cfr_title}` = CFR title number (e.g. `36`), `{cfr_part}` = part number (e.g. `1194`).

### Template C — eCFR, the text of a part as currently in force
```bash
curl -s --compressed -H "User-Agent: ResearchAgent (contact@example.com)" \
  "https://www.ecfr.gov/api/versioner/v1/full/{date}/title-{cfr_title}.xml?part={cfr_part}" -o part.xml
```

Substitute: `{date}` = the date the text should reflect, `YYYY-MM-DD` (use today's date for current text; an earlier date returns the text as it stood then), `{cfr_title}` and `{cfr_part}` as above.

Returns XML. Record the part label and the retrieval date with the source — eCFR is a point-in-time snapshot and the date is part of the citation, not metadata.

**Parts worth knowing for accessibility requirements:**

| Citation | What it is |
|---|---|
| 36 CFR 1194 | Information and Communication Technology Standards and Guidelines (the Section 508 standards) |
| 28 CFR 35 | ADA Title II, including subpart H on web and mobile accessibility at 35.200 |
| 28 CFR 36 | ADA Title III |

### Template D — W3C, a specification's current status
```bash
curl -s --compressed "https://api.w3.org/specifications/{shortname}"
```

Substitute: `{shortname}` = W3C shortname, uppercase and without punctuation (`WCAG22`, `WCAG21`, `WCAG20`, `ATAG20`, `WAI-ARIA-1.2`).

Extract `title`, `series-version`, `shortlink`, and `_links.latest-version` (whose `title` is the maturity status and whose `href` ends in the publication date).

### Template E — W3C, the supersession check
**Run this every time you cite a W3C document.** It is the only query here that answers whether the document is current:

```bash
curl -s --compressed "https://api.w3.org/specification-series/{series_shortname}"
```

Substitute: `{series_shortname}` = lowercase series name (`wcag`, `atag`, `wai-aria`).

Read `_links.current-specification.href`. If it does not point at the specification you are citing, the one you are citing is **superseded**, whatever its own status field says.

**This matters because per-specification status does not distinguish.** WCAG 2.0, WCAG 2.1 and WCAG 2.2 all report `status: "Recommendation"` on their own records. A version check that reads only the specification record concludes that WCAG 2.0 is current, because it is a Recommendation and always will be. Only the series endpoint knows which one is the current Recommendation. To list the whole family, including drafts in progress:

```bash
curl -s --compressed "https://api.w3.org/specification-series/{series_shortname}/specifications"
```

### Template F — publisher-scoped search, for bodies with no API
```bash
tvly search "{query}" --depth advanced --max-results 5 --include-domains "access-board.gov,section508.gov,ada.gov,w3.org,nist.gov" --json
```

Use for agency guidance documents, FAQ pages, technical assistance material, and Access Board publications that are not Federal Register documents. Prefer Templates A to E whenever the question can be answered from an API — a guidance page summarizing a rule is Tier 2, and the rule itself is Tier 1.

---

## 4. Credibility Tiers

**Tier 1 (Highest credibility):**
- The CFR text itself via eCFR, retrieved for a stated date — the requirement as in force
- Federal Register final rules (`type: Rule`), including the preamble, which is where an agency states what the rule means and why
- W3C Recommendations confirmed current by the series endpoint
- Statutes as codified

**Tier 2 (Reliable with context):**
- Federal Register proposed rules and advance notices — authoritative as to what is *proposed*, and no evidence at all of what is required
- W3C Candidate Recommendations and Proposed Recommendations: stable enough to cite as direction, never as requirement
- Agency guidance, technical assistance documents, and FAQs — the agency's reading of its own rule, which carries weight but is not the rule
- W3C Working Group Notes and supporting material (Understanding documents, Techniques) — informative by the W3C's own designation, never normative

**Tier 3 (Contextual — use with caution):**
- W3C Working Drafts and Editor's Drafts, which change without notice
- Comment letters in a docket, including those from authoritative organizations — a party's position, not an outcome
- Secondary summaries of a standard: vendor "WCAG compliance" pages, consultancy explainers, conformance checklists of unstated provenance

**Red flags:**
- **The version a regulation points at is not the current version, and that is normal.** Three WCAG versions are operative in US federal law at once: 36 CFR 1194 incorporates **WCAG 2.0 Level A and AA** by reference, 28 CFR 35.200 adopts **WCAG 2.1 Level AA**, and the current W3C Recommendation is **WCAG 2.2**. All three statements are true simultaneously. A claim that "the standard is WCAG 2.2" is wrong as a statement about Section 508 and right as a statement about the W3C. Never collapse them.
- **Incorporation by reference freezes a version.** When a regulation incorporates a dated edition, a later edition of that standard does not become the requirement when it publishes. The regulation has to be amended. Record which edition the regulation names.
- **A proposed rule cited as a requirement.** `type: Proposed Rule` with `action: "Notice of proposed rulemaking."` is a request for comment. An `action` of "Advance notice of proposed rulemaking" is a stage earlier still — the agency has not yet proposed text. Both are routinely written up as though they were in force.
- **A withdrawn or never-finalized proposal.** A docket can sit for years and die. Presence of an NPRM is not evidence that a final rule followed; check for a later `RULE` in the same docket.
- **Compliance dates that have not arrived.** A rule can be final, in force, and not yet required of anyone. 28 CFR 35.200 carries staged compliance dates by entity size. "Final rule" does not answer "required of this entity today."
- **A standard cited without a level.** WCAG conformance is meaningless without the level, and the levels are not cumulative across versions in the way people assume. "Conforms to WCAG" is not a claim.
- **Safe-harbor and legacy provisions.** 36 CFR 1194 still contains WCAG 1.0 text, because the 2017 refresh preserved existing conforming content. Finding WCAG 1.0 in the current CFR text is not an error in the retrieval.

---

## 5. Source Status Taxonomy

Reference `${CLAUDE_PLUGIN_ROOT}/reference/discovery/channel-playbooks/web-search.md` for canonical definitions of DISCOVERED / ACCESSIBLE / PROCESSED.

**Standards-channel notes:**
- Federal Register documents are always ACCESSIBLE — published by law, free, and stably addressed by `html_url`
- eCFR full-text responses are ACCESSIBLE on retrieval; record the snapshot date, because the same URL returns different text tomorrow
- W3C technical reports are ACCESSIBLE — the W3C publishes every maturity level openly
- ISO and IEEE documents are **DISCOVERED, not ACCESSIBLE**, even when the citation is confirmed. The text is sold. Record the citation, the edition, and the price barrier; never imply the text was read

**A second axis this channel adds, which the three-state taxonomy does not carry.** Access status says whether you could read it. It says nothing about whether the document states a requirement. Every source from this channel also carries:

| Field | Values | Where it comes from |
|---|---|---|
| `authority` | `in-force` · `proposed` · `draft` · `informative` · `superseded` | Federal Register `type` and `action`; W3C `status` plus the series check |
| `edition` | the version or publication date the document is | W3C version URI date; CFR snapshot date; the edition a regulation names |
| `adopted-by` | the citation that makes it binding, or `none` | the CFR section that incorporates it |

A W3C Recommendation with `adopted-by: none` is a standard, not a requirement. A superseded Recommendation that a regulation still incorporates is a requirement and not current practice. Both cases are common and neither survives a single "is this source good" question.

---

## 6. Degradation Behavior

**Primary:** Bash curl to the Federal Register, eCFR, and W3C APIs.

**Tier 2 [Tavily fallback] (if an API is unavailable):**
```bash
tvly search "{query}" --depth advanced --max-results 5 --include-domains "federalregister.gov,ecfr.gov,govinfo.gov,w3.org,access-board.gov" --json
```
Label results: "via tvly (Federal Register fallback)", "via tvly (eCFR fallback)", or "via tvly (W3C fallback)" — name which API was unreachable.

**Tier 3 [Firecrawl fallback]:**
```bash
npx firecrawl-cli search "{query} site:federalregister.gov OR site:w3.org" --limit 5 --format json
```
Label results: "via Firecrawl (API+tvly fallback)"

**Tier 4 [WebSearch fallback]:** WebSearch with site-scoped queries:
- Rulemaking: `{topic} site:federalregister.gov`
- Regulation text: `{citation} site:ecfr.gov`
- Standards: `{spec} site:w3.org/TR`

Label results: "via WebSearch (API+tvly+Firecrawl fallback)".

> The agent works out of the box with zero CLIs installed — WebSearch is always available.

**What degradation costs here, and it is not nothing.** Every fallback tier returns a page rather than a record, which means the `authority` and `edition` fields in section 5 stop being read from a field and start being read off prose. A search result for `/TR/WCAG21/` does not say whether WCAG 2.1 is the current Recommendation; the series endpoint does. When running below Tier 1, mark `authority` as `unconfirmed` rather than inferring it, and say so in the candidate entry. An inferred authority is the failure this channel was added to prevent.

**Unavailable criteria:** Trigger the next tier when:
- HTTP 5xx from the API (or non-zero exit from the CLI)
- Request timeout > 20 seconds (eCFR full-text responses are large; do not set this lower)
- HTTP 429 (back off, retry once after 5 seconds, then fall back)
- **Not on HTTP 406 from eCFR.** That is the missing `--compressed` flag, not an outage. Add the flag and retry the same tier.

---

## 7. Rate Limits

**Federal Register:** no documented hard limit; the API is open and unauthenticated. Pace at 2 req/s and keep `per_page` at 8 or less to stay within the channel's result cap anyway.

**eCFR:** no documented limit. Full-text responses are large (a single CFR part runs from tens of kilobytes to several hundred), so request a part at a time and never a whole title's text. Use the structure endpoint first to confirm a part exists before pulling its text.

**W3C:** no documented limit, no key. These are small JSON records; the supersession check in Template E is cheap enough to run on every citation and should be.

**Tavily (`tvly search`, fallback):** ~1,000 searches/month on free tier, shared across all channels.

**Firecrawl (fallback):** free tier 500 credits/month.

**Best practice:** send a descriptive `User-Agent` with a contact address on every government API request. The Federal Register and eCFR do not currently reject anonymous requests the way SEC EDGAR does, but identifying the caller is the condition on which open government APIs stay open.

---

## Example Responses

### Federal Register documents.json

Trimmed response from an agency-scoped, stage-filtered query. Extract these fields:

```json
{
  "count": 145,
  "total_pages": 49,
  "results": [
    {
      "document_number": "2024-18820",
      "title": "Americans With Disabilities Act and Architectural Barriers Act Accessibility Guidelines; EV Charging Stations",
      "type": "Proposed Rule",
      "action": "Notice of proposed rulemaking.",
      "publication_date": "2024-09-03",
      "agencies": [
        {
          "raw_name": "ARCHITECTURAL AND TRANSPORTATION BARRIERS COMPLIANCE BOARD",
          "name": "Architectural and Transportation Barriers Compliance Board",
          "id": 28,
          "slug": "architectural-and-transportation-barriers-compliance-board"
        }
      ],
      "cfr_references": [{ "title": 36, "part": "1191", "chapter": null }],
      "docket_ids": ["ATBCB-2024-0001"],
      "html_url": "https://www.federalregister.gov/documents/2024/09/03/2024-18820/americans-with-disabilities-act-and-architectural-barriers-act-accessibility-guidelines-ev-charging"
    }
  ]
}
```

**Fields to extract per document:**
- `type` — the stage: `Rule`, `Proposed Rule`, `Notice`. This sets `authority` from section 5
- `action` — the finer stage. "Notice of proposed rulemaking" and "Advance notice of proposed rulemaking" are different things and only this field tells them apart
- `publication_date`, `document_number` — the citation
- `cfr_references` — which part is affected; feeds Template C to read the text as in force
- `docket_ids` — the thread. Use it to check whether a proposal was ever finalized
- `html_url` — the stable source URL to record
- `count` — if this is 10,000, the query saturated and is too broad to be a result set; narrow it

### eCFR full-text response

XML, not JSON. The part label and the structural identifiers are what to record:

```xml
<DIV5 N="1194" TYPE="PART">
  <HEAD>Part 1194—Information and Communication Technology Standards and Guidelines</HEAD>
  ...
</DIV5>
```

**What to extract:**
- The `HEAD` text — the official part label, which is the citable name of the requirement
- The retrieval date you passed as `{date}` — record it with the source; this is a snapshot
- Any incorporation-by-reference language, with the **edition named**. In 36 CFR 1194 this reads "WCAG 2.0 (incorporated by reference, see 702.10.1)" and the operative phrase is "Level A and Level AA Success Criteria and Conformance Requirements in WCAG 2.0"

Confirm the structure before pulling text, which is cheaper and tells you the part exists:
```bash
curl -s --compressed "https://www.ecfr.gov/api/versioner/v1/structure/{date}/title-{cfr_title}.json"
```

### W3C specification record

```json
{
  "shortlink": "https://www.w3.org/TR/WCAG22/",
  "title": "Web Content Accessibility Guidelines (WCAG) 2.2",
  "shortname": "WCAG22",
  "series-version": "2.2",
  "_links": {
    "version-history": { "href": "https://api.w3.org/specifications/WCAG22/versions" },
    "latest-version": {
      "href": "https://api.w3.org/specifications/WCAG22/versions/20241212",
      "title": "Recommendation"
    },
    "series": { "href": "https://api.w3.org/specification-series/wcag" }
  }
}
```

**Fields to extract:**
- `title` and `series-version` — the document and its version
- `_links.latest-version.title` — maturity status (`Recommendation`, `Candidate Recommendation`, `Working Draft`, …)
- `_links.latest-version.href` — the trailing 8 digits are the publication date of that version, `YYYYMMDD`. Fetch it for `status`, `date`, `rec-track`, `informative`, and the dated `uri`
- `shortlink` — the version-independent URL. Cite the **dated** `uri` instead when the claim depends on a specific edition; the shortlink moves when a new version publishes

A dated version record looks like this, and `informative: false` plus `rec-track: true` is what makes a document normative:

```json
{
  "status": "Recommendation",
  "date": "2024-12-12",
  "rec-track": true,
  "informative": false,
  "uri": "https://www.w3.org/TR/2024/REC-WCAG22-20241212/"
}
```

### W3C series record — the supersession answer

```json
{
  "shortname": "wcag",
  "name": "Web Content Accessibility Guidelines (WCAG)",
  "_links": {
    "current-specification": { "href": "https://api.w3.org/specifications/WCAG22" }
  }
}
```

**The one field that matters:** `_links.current-specification.href`. Compare it against the specification you are about to cite. The series listing endpoint returns the whole family — for WCAG that is 1.0, 2.0, 2.1, 2.2 and WCAG 3.0 in progress — and every one of 2.0, 2.1 and 2.2 reports its own status as "Recommendation." Supersession is a property of the series, not of the document.
