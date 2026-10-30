# Process Blueprint — Blog Content Production

<!-- WORKED EXAMPLE. Illustrative content for a fictional mid-size B2B company, shipped to
     show the specificity bar a finished deep-mode Blueprint should hit. Not a real
     company's process. -->

| | |
|---|---|
| **Business objective** | Organic search traffic that produces qualified inbound leads — each published post targets a keyword tied to a product line |
| **Operator** | Content marketer (writes and publishes); marketing lead (reviews) |
| **Mode** | Deep |
| **Captured** | 2026-07-22 |
| **Status** | Draft — stakeholder validation not yet done |

## 1. Purpose and outcome

Publish two blog posts per week that rank for target keywords and move readers toward a
demo request. Success for a single run: a post live on the site, on brand voice, internally
linked, with tracking in place. Success for the process: posts that reach page one for
their keyword within 90 days and generate form fills.

## 2. Trigger and preconditions

**Trigger:** A keyword reaches the top of the priority list in the content calendar
(maintained monthly from keyword research).

**Preconditions:** Keyword has an assigned search intent and target persona; the content
calendar row has a working title; brand voice guide is current.

**Variants:** (1) Standard keyword post — this Blueprint. (2) Product-launch post — skips
keyword selection, adds product-team review; separate Blueprint. (3) Rush executive
request — skips calendar, same Steps 2-6 compressed; exception-managed, not a variant
worth its own Blueprint.

## 3. Inputs

| Input | Where it comes from | Format |
|---|---|---|
| Target keyword + intent | Content calendar (spreadsheet) | Row |
| Keyword research detail | SEO tool export | CSV |
| Brand voice guide | Shared drive | Markdown |
| Product facts for claims | Product marketing one-pagers | PDF |

## 4. Systems and tools

Content calendar (spreadsheet, edited directly); SEO tool (UI + CSV export); Claude
(drafting, with brand voice guide loaded); CMS (UI publishing); analytics (UI, read-only).

## 5. Step sequence

### Step 1 — Pull the next keyword and build the outline

- **Action:** Take the top calendar row; review the keyword's search results to see what
  currently ranks; outline the post (H2s, angle, target length)
- **Tool/system:** Content calendar, SEO tool, browser
- **Data in → out:** Keyword row → outline doc
- **Why this step exists:** The outline is where search intent gets matched; a wrong angle
  here wastes the whole run
- **Evidence of success:** Outline names the intent, the angle vs. current top results, and
  3-5 H2s
- **Missing-input path:** If the keyword has no intent assigned, send it back to the
  monthly research pass — don't guess
- **Autonomy:** Monitor — agent drafts the outline; operator reviews before drafting starts
  because the angle call is judgment

### Step 2 — Draft the post

- **Action:** Draft from the outline with the brand voice guide loaded as context
- **Tool/system:** Claude
- **Data in → out:** Outline + voice guide + product facts → draft (~1,200-1,800 words)
- **Why this step exists:** Produces the artifact
- **Evidence of success:** Draft covers every H2, cites only facts present in the product
  one-pagers, passes the voice guide's quality checklist
- **Missing-input path:** If a claim needs a fact not in the one-pagers, flag it in the
  draft as [NEEDS SOURCE] — never invent product claims
- **Autonomy:** Automate — reversible, cheap to regenerate, gated by Step 3 anyway

### Step 3 — Review the draft

- **Action:** Marketing lead reads for accuracy, voice, and positioning; edits or kicks back
- **Tool/system:** Shared doc
- **Data in → out:** Draft → approved draft
- **Why this step exists:** Public content carries brand and legal risk; claims must be true
- **Evidence of success:** Lead's approval recorded on the doc
- **Missing-input path:** n/a
- **Autonomy:** Human — external-facing brand judgment; a wrong claim shipped is expensive
  to walk back

### Step 4 — Produce images

- **Action:** Generate header + inline images per the brand image style, size and compress
- **Tool/system:** Image generation tool, then compression
- **Data in → out:** Approved draft → image files at target sizes
- **Why this step exists:** Posts without images underperform; images must be on brand
- **Evidence of success:** Files exist at correct dimensions, under the size cap, on style
- **Missing-input path:** If generation misses the style after two attempts, fall back to
  the approved stock library
- **Autonomy:** Monitor — agent generates and self-checks; operator spot-checks per batch

### Step 5 — Publish to CMS

- **Action:** Create the post, paste content, set slug/meta/tags, attach images, internal-link
  to two related posts, attach the tracked CTA
- **Tool/system:** CMS
- **Data in → out:** Approved draft + images → scheduled post
- **Why this step exists:** Mechanical assembly of the live artifact
- **Evidence of success:** Preview renders correctly; meta fields populated; CTA fires on
  the staging check
- **Missing-input path:** If no related posts exist for internal links, link the product
  page instead and note the gap in the calendar
- **Autonomy:** Automate — fully rules-based; staging preview is the validation

### Step 6 — Confirm live and log

- **Action:** After the scheduled publish, verify the live URL, check tracking fires, update
  the calendar row to Published with the URL
- **Tool/system:** Browser, analytics, content calendar
- **Data in → out:** Scheduled post → verified live post + updated calendar
- **Why this step exists:** Done-state and the record other reporting runs on
- **Evidence of success:** Live URL returns 200, pageview event received, calendar row shows
  Published + URL + date
- **Missing-input path:** If tracking doesn't fire, roll the post to draft and escalate to
  whoever owns analytics
- **Autonomy:** Automate — observable checks, reversible fix

## 6. Decision points

| Where | What's evaluated | Criteria / threshold | Who decides |
|---|---|---|---|
| Step 1 | Angle vs. current top results | Post must add something the top 3 results don't | Operator |
| Step 3 | Claims accuracy + voice | Every claim traceable to a one-pager; voice checklist passes | Marketing lead |
| Step 4 | Image on-style | Matches brand image style guide | Operator (sampled) |

## 7. Exception paths

| Exception | How often | What happens | Escalates to |
|---|---|---|---|
| [NEEDS SOURCE] flags in draft | ~1 in 3 posts | Operator asks product marketing; publish waits | Product marketing |
| Rush executive request | ~1/month | Jumps queue; same Steps 2-6 compressed to 48h | Marketing lead |
| Keyword landscape shifted since research | occasional | Kick back to monthly research pass | — |

## 8. Approval and accountability

Marketing lead holds real approval at Step 3 — can edit, approve, or kick back, and the
approval is recorded on the doc. Nobody else can approve external content. Overrides of a
kick-back require the lead's explicit sign-off, logged in the calendar row.

## 9. Outputs and done state

**Artifacts produced:** Live post (CMS), image files (CMS media library), updated calendar
row (URL, date, status).

**Done means:** Live URL verified, tracking firing, calendar updated.

**Audit trail:** Calendar row history + approval on the draft doc.

## 10. Timing

One post ≈ 4-6 working hours spread over 2-4 days (review latency dominates). Cadence: two
posts per week.

## 11. Risks and failure impact

A false product claim published: legal/brand exposure, expensive retraction — this is why
Step 3 is Human. Off-voice content: gradual brand erosion, cheap to fix per-instance —
Monitor is enough. A broken publish: visible but reversible in minutes — Automate is safe.

## 12. Improvement loop

Kick-backs at Step 3 get a one-line reason in the calendar row; monthly, recurring reasons
become edits to the voice guide or this Blueprint. 90-day ranking results feed the monthly
keyword research pass.

## 13. Open questions

- [ ] Should the rush-request variant get its own Blueprint? (Owner: marketing lead)
- [ ] Is the two-internal-links rule still right as the post library grows? (Owner: SEO)

## 14. Automation notes

**First candidates:** Step 5 (CMS assembly) and Step 6 (verify + log) — fully rules-based,
observable success. Step 2 (drafting) next.

**Connections needed:** CMS API or application password; analytics read access; calendar
spreadsheet access.

**Checkpoints that stay human:** Step 3 review — external-facing claims and brand judgment.
The angle call in Step 1 stays operator-reviewed until kick-back rates fall.
