---
name: research-discover
description: This skill should be used when the user asks to find or discover sources for the current research phase (e.g. "find sources", "discover sources for this phase", "go find material on this"). Runs the phase's type-aware discovery channels through the 3-tier stack (Tavily, Firecrawl, built-in web), records the tier reached, and writes a reviewable candidate list — never auto-feeding process-source. Accepts an optional --channel filter.
allowed-tools: [Bash, WebSearch, Read, Grep, Glob, Write, Edit]
---

# /know-research:discover

Execute source discovery for the current research phase using all channels configured for the project's research type. Produces a reviewable candidate list — never auto-feeds into process-source.

Supports optional `--channel {name}` argument for targeted re-runs against a single channel (e.g., `--channel academic`).

## Pre-check (mandatory before execution)

1. **Read `research/STATE.md`** — extract the current active phase name.
   - If `research/STATE.md` does not exist at all: error: "No STATE.md found — this project hasn't been initialized. Run `/know-research:init` first." Do not proceed. (Note: `/know-research:start-phase` won't help here either — it also requires STATE.md.)
   - If `research/STATE.md` exists but the "Active phase" field is missing or empty: error: "STATE.md exists but has no active phase set. Check STATE.md — the active phase may need to be set manually." Do not proceed.
   - If `Active phase` is set to a completion sentinel like `— all phases complete` (or any value indicating no active phase remains): error: "All phases are complete per STATE.md. There is nothing to discover. Run `/know-research:progress` to review the project or `/know-research:check-gaps` for a final coverage pass." Do not proceed.

1a. **Stale-active-phase check (self-healing for missed closeouts).** Read the `Current Phase Cycle` block in STATE.md for the active phase. Count checked vs. unchecked steps:
   - If the active phase has **Verify checked `[x]`** (or all five steps checked), STATE.md is inconsistent: the phase has been completed but Active phase was never advanced. `/know-research:audit-claims` owns the closeout; this is its job, not discover's. Stop with an error: `"STATE.md inconsistency: Phase {N} ({name}) shows Verify checked in Current Phase Cycle, but Active phase still points at Phase {N}. This means the previous /know-research:audit-claims run promoted the draft but did not advance STATE.md. Do NOT run discovery against a completed phase. Options: (a) run /know-research:progress to see the full state, (b) manually advance STATE.md to the next phase using the format from /know-research:init (advance Active phase, replace Current Phase Cycle with a fresh next-phase checklist, mark Phase {N} complete in Completed Phases, reset Next Action), or (c) if you intended to re-run discovery for Phase {N}, first revert the completed marker in Completed Phases and uncheck Verify. Refuse to guess the right branch — the user must confirm which one applies."` Do not proceed until the user resolves the inconsistency. **Final-phase carve-out:** if Phase {N} is the plan's final phase, option (b) is not offered — manual completion of the final phase is the validator's job, never a STATE edit. Offer only (c) and "(b-final) re-run `/know-research:audit-claims` on the final deliverable so the validated corpus-review closeout completes the project properly."
   - If Verify is unchecked but earlier cycle steps (Collect/Connect/Assess/Synthesize) are mid-progress, this is a normal mid-phase discover re-run (e.g., gap-driven top-up) — proceed. Discovery in the middle of a phase is legitimate.

2. **Read `research/research-plan.md`** — extract the research questions and research subject (the entity, topic, or organization being researched) for the active phase. These become the primary inputs for query construction.

3. **Determine the research type** — read the project's CLAUDE.md. Find the `research-type` field. This value (e.g., `company-for-profit`, `non-profit`, `market-industry`) selects the type-channel map.

4a. **Check for discovery strategy** — read `research/discovery/strategy.md` if it exists. If found, look up the current active phase name in the strategy file. The strategy contains pre-matched phase-to-channel mappings (primary and secondary channels per phase). If the current phase is found in the strategy:
- Use the pre-matched channels directly — no keyword guessing needed
- Print: "Using project discovery strategy (pre-matched channels)"
- Skip to step 5 check (if channels list is empty or marked "no discovery", report "No discovery channels mapped for this phase — this phase uses existing sources." and stop)

4b. **Fall back to type-channel map** (only if `research/discovery/strategy.md` does not exist OR the current phase was not found in strategy.md):
- Print: "Using type-channel map (keyword matching)"
- Read the type-channel map at `${CLAUDE_PLUGIN_ROOT}/reference/discovery/type-channel-maps/{research-type}.md`. Parse `active-channels` from the frontmatter. Find the Discovery Group whose Phases list matches (or partially matches, via keyword) the current active phase name. The matched Discovery Group determines which channels to query and their priority order (Primary, Secondary).

5. **If no Discovery Group matches the current phase**, this is a synthesis phase — no new source collection is needed. Report: "No discovery channels mapped for Phase [N] — this is a synthesis phase that produces outputs from existing findings." Then render a synthesis-phase transition prompt and stop:

   ───────────────────────────────────────────────────────────

   **▶ NEXT:** `/know-research:summarize-section` — Draft outputs from existing findings.

   **Also available:**
   - `/know-research:check-gaps` — Verify coverage is adequate before drafting.
   - `/know-research:cross-ref` — Refresh cross-reference patterns before synthesis.

   **Cycle guidance:** Collect, Connect, and Assess are no-ops for synthesis phases — mark them complete when ready. The core work is Synthesize and Verify.

   ───────────────────────────────────────────────────────────

   Do not proceed to channel resolution or query execution.

6. **If `--channel {name}` was provided**, filter the channel list to only that channel. Confirm it exists in the matched Discovery Group's channel list. If not found, error: "Channel '{name}' is not mapped for this phase. Available channels: {list}."

7. **Check for existing candidates file** at `research/discovery/{phase}-candidates.md`. **Mid-phase re-run contract:** the existing file is never overwritten. New results are appended below a `## Re-discovery: <ISO timestamp>` separator (format defined in Step 6). Duplicates are dropped by exact URL match against all prior entries in the file. Before proceeding, print to the user: "Existing candidates file found. This run will append as a re-discovery block. N existing URLs will be deduped against." Do not ask the user whether to append or overwrite — the append-with-dedup behavior is the contract, not a choice.

## Process

### Step 1: Resolve channels

From the matched Discovery Group, collect Primary channels and Secondary channels. Primary channels execute first. If `--channel` filter was applied, use only that channel.

Print the following orientation block before executing any queries:

```
Running discovery for phase: {phase name}
Research type: {type}
Channels: {list}

What we're looking for:
  {Briefly restate the 2-3 core research questions for this phase from research-plan.md}

I'll search across {N} channels and present what I find. You'll get to review
candidates and decide which ones to process — nothing gets processed automatically.
```

### Step 1b: Tool availability pre-flight

Before executing any queries, check which tool tiers are available. Run this single Bash command — it completes in milliseconds:

```bash
which tvly 2>/dev/null && echo "TIER1_OK" || echo "TIER1_MISSING" && which npx 2>/dev/null && echo "TIER2_OK" || echo "TIER2_MISSING"
```

CLI invocations use bare names — `tvly search "..."`, `npx firecrawl-cli ...`. The plugin's `SessionStart` hook (`hooks/setup-paths.sh`) puts the necessary bin directories on PATH for every Bash call in the session. The pattern for every CLI invocation is:

```bash
tvly search "query" --depth advanced --max-results 8 --json
```

Do not prepend an inline `export PATH=...` — bare names match the project `settings.json` pre-allow patterns (`Bash(tvly:*)`, `Bash(npx:*)`) and suppress per-call permission prompts in Claude Code; a compound `export ... && tvly ...` does not match and prompts every time. If `which tvly` returns nothing despite the hook, treat the tier as unavailable and fall through.

Based on pre-flight results, set the tool availability for this run:

- **Both found:** All tiers available. Print: "Tool check: tvly ✓, npx ✓ — using Tier 1 (Tavily) as primary."
- **tvly missing, npx found:** Print: "Tool check: tvly ✗, npx ✓ — Tier 1 unavailable, using Tier 2 (Firecrawl) as primary." Then run a diagnostic:
  ```bash
  ls "$HOME/.local/bin/tvly" 2>/dev/null && echo "EXISTS_ON_DISK" || echo "NOT_INSTALLED"
  ```
  - If EXISTS_ON_DISK: "NOTE: tvly exists at ~/.local/bin/tvly but was not found even with PATH augmentation. Check that the binary is executable (`chmod +x`)."
  - If NOT_INSTALLED: "NOTE: tvly is not installed. Install with: curl -sSL https://tavily.com/install | sh (or see tools-guide.md)."
- **Both missing:** Print: "Tool check: tvly ✗, npx ✗ — CLI tools unavailable, using Tier 3 (WebSearch/WebFetch) for all channels." Then diagnose:
  ```bash
  ls "$HOME/.local/bin/tvly" 2>/dev/null && echo "TVLY_ON_DISK" || echo "TVLY_NOT_INSTALLED"
  ls "$HOME/.volta/bin/npx" 2>/dev/null || ls /usr/local/bin/npx 2>/dev/null || ls /opt/homebrew/bin/npx 2>/dev/null && echo "NPX_ON_DISK" || echo "NPX_NOT_INSTALLED"
  ```
  - Report which binaries exist on disk vs. genuinely not installed.

This pre-flight runs once per discovery invocation. The results determine the starting tier for Step 2 — if Tier 1 is confirmed missing (not installed), skip it on every channel instead of failing and retrying per-channel.

### Step 2: Execute each channel in priority order

For each channel:

**a.** Print status line: "{Channel Name}: querying..."

**b.** Read the channel playbook at `${CLAUDE_PLUGIN_ROOT}/reference/discovery/channel-playbooks/{channel-name}.md`

**c.** Select the appropriate query template from the playbook:
- Broad/background phases: use Template A (topic/overview search)
- Company/entity-specific phases: use Template B (entity-targeted search)
- Recent developments or time-sensitive phases: use Template C (recent news, add `days=90`)
- When in doubt, use Template A for general coverage

**d.** Substitute template placeholders:
- `{topic}` or `{research_subject}` → research subject name from research-plan.md
- `{company_name}` or `{entity_name}` → research subject name
- `{year_minus_2}` → current year minus 2 (e.g., 2024 for 2026)
- `{year_minus_5}` → current year minus 5 (e.g., 2021 for 2026)
- `{email}` → `research-agent@example.com` (OpenAlex polite pool parameter)
- `{current_year}` → current year

**e.** Execute the query using the primary tool specified in the playbook (`tvly search` via Bash, `Bash curl`, etc.). Tools are tried in tier order — if the primary tool fails (command not found, timeout, API error), try the next tier per the playbook's degradation chain.

**f.** Cap results at **8 sources maximum** per channel per query. If an API returns more, take the top 8 by relevance score or citation count. Never include more than 8.

**g.** Print result status: "{Channel Name}: found {N}" or "{Channel Name}: error — {reason}" or "{Channel Name}: degraded — using {fallback tool} fallback, found {N}" or "{Channel Name}: skipped (not mapped for this phase)"

**h.** If a channel fails (timeout, rate limit, API error, tool unavailable), log the specific failure reason, continue to the next channel. Never abort discovery because one channel failed.

**i.** Accumulate a retrieval log entry for this channel-tool execution. Do not write to disk yet — collect entries in memory for batch write to `research/reference/retrieval-log.json` after Step 6. Each entry is a JSON object with these fields:

| Field | Type | Value |
|-------|------|-------|
| `timestamp` | string (ISO 8601) | Current timestamp at the moment of this channel execution |
| `phase` | string | Active phase name from STATE.md (Step 1 pre-check) |
| `channel` | string | Channel name from the Discovery Group (e.g., "web-search", "academic", "financial") |
| `tool` | string | Specific tool that executed (e.g., "tavily", "exa", "openalex", "crossref", "firecrawl", "websearch") |
| `tier` | integer | Which tier actually ran (not the configured primary): 1 for `tvly`/`tvly extract`, 2 for `npx firecrawl-cli`, 3 for built-in `WebSearch`/`WebFetch`. HTTP-API channels (OpenAlex, EDGAR, ProPublica) record `tier: 1` when the primary API was reached; on fallback per the playbook degradation chain, record the tier of the tool that actually returned results. Per-tool entry — set at the moment of execution. |
| `query` | string | Exact query string or URL submitted to the tool (from Step 2d substitution) |
| `template` | string | Template letter used (A, B, or C from Step 2c selection) |
| `results_count` | integer | Count of URLs returned before dedup (from Step 2f) |
| `urls` | array of strings | All returned URLs from this call (pre-dedup) |
| `status` | string | One of: "found", "error", "degraded", "skipped" — mapped from Step 2g output |
| `degraded_to` | string or null | Fallback tool name if status is "degraded"; null otherwise |
| `deduped_count` | integer | Set to 0 here; updated after Step 4 dedup for multi-tool channels |

The `tier` field and the `degraded_to` field are complementary. `tier` records what ran; `degraded_to` records the chain. An entry with `tier: 2` and `degraded_to: "firecrawl"` means Tier 1 was attempted and failed, and Tier 2 (Firecrawl) returned results. `tier: 3` always indicates built-in fallback — either both CLI tiers were missing in pre-flight, or both failed at runtime.

**Multi-tool channels:** When a channel runs multiple tools (e.g., web-search runs Tavily then Exa), accumulate one entry per tool execution. A web-search channel with both tools succeeding produces two entries: one with `tool: "tavily"`, one with `tool: "exa"`. The Exa entry's `deduped_count` is updated after Step 4 to reflect URL matches collapsed against Tavily results.

**Failed channels:** Accumulate an entry even when status is "error" or "skipped". Set `results_count: 0`, `urls: []`, and populate `status` accordingly. This provides a full audit trail of what was attempted, not just what succeeded.

### Step 3: Degradation handling

Tools are organized in tiers. On failure, try the next tier automatically:
- **Tier 1** (`tvly search`/`tvly extract`) — richest params, primary tool
- **Tier 2** (`npx firecrawl-cli search`/`npx firecrawl-cli scrape`) — secondary, broader results
- **Tier 3** (`WebSearch`/`WebFetch`) — built-in, always available, no CLI needed

**CRITICAL: WebSearch/WebFetch are ONLY fallbacks.** Do not use WebSearch as a parallel tool, a convenience tool for site-scoped queries, or a "specialty" tool for any purpose. Every query runs through Tier 1 first. Tavily's `--include-domains` flag handles domain scoping (e.g., `--include-domains "github.com"` replaces `site:github.com`). WebSearch is the tool of last resort when Tier 1 AND Tier 2 both fail — not an alternative you choose because a query "feels" like a WebSearch query.

- **Tier 1 unavailable:** Try Tier 2 automatically. Print warning: "WARNING: `tvly` returned 'command not found'. The binary may be installed but not on the harness shell PATH (see tools-guide.md § PATH and Tool Visibility). Falling back to Firecrawl." Label results: `[Firecrawl fallback]`.
- **Tier 2 also unavailable:** Try Tier 3 (WebSearch). Print warning: "WARNING: `tvly` and `npx firecrawl-cli` both returned 'command not found'. Both may be installed but not on the harness shell PATH — run `ls ~/.local/bin/tvly` and `ls ~/.volta/bin/npx` to check. Falling back to WebSearch (less targeted)." Label results: `[WebSearch fallback]`.
- **Pre-flight sets the floor, runtime handles the rest.** Step 1b determines which tiers are genuinely available. If a tier was confirmed available in pre-flight but fails at runtime (API error, timeout, rate limit), that's a per-query degradation — fall back to the next tier for that query only. If a tier was confirmed missing in pre-flight, skip it entirely — don't waste time retrying a binary that doesn't exist.
- **HTTP API failure (OpenAlex, EDGAR, ProPublica):** Log as channel error, attempt `tvly search` fallback → `npx firecrawl-cli search` → `WebSearch` per the playbook's degradation chain.
- **Absolute floor:** If all tiers fail for all channels, produce the candidates file with empty channel sections and an all-channels-failed status report. Never leave the user without a file.

### Step 4: Deduplicate

Before writing, check if `research/discovery/{phase}-candidates.md` already exists. If it does:
- Parse all existing URLs from the file
- Remove any new results whose URL already appears in the existing file
- Track count of skipped duplicates
- Print: "Deduplication: {N} duplicates skipped (already in candidates file)"

After deduplication, update the `deduped_count` field on the relevant log entry objects. For cross-tool dedup within a channel (e.g., Exa URLs that matched Tavily URLs), set `deduped_count` on the later tool's entry to the number of URLs removed. For dedup against an existing candidates file (re-run), set `deduped_count` on each affected entry to the number of that entry's URLs that were already present.

### Step 5: Determine source status for each candidate

Apply the canonical status taxonomy (DISCOVERED / ACCESSIBLE / PROCESSED) to each result:

- **ACCESSIBLE**: Search tool returned full content snippets, OR source is known open-access (e.g., OpenAlex `is_oa=true`, Unpaywall `best_oa_location.url` present and non-null, Wikipedia, government data portals, arxiv.org, SEC EDGAR filings)
- **DISCOVERED**: URL returned but content not verified — applies to URL-only results, paywalled domains (wsj.com, ft.com, bloomberg.com, economist.com, hbr.org), Google Patents constructed URLs, and any result where only a title/snippet was returned without confirmed content extraction. Academic papers with `is_oa=false` from OpenAlex or Crossref begin as DISCOVERED; Unpaywall lookup (per academic.md Section 8) may upgrade them to ACCESSIBLE inline during the same discovery pass if a legal OA copy is found.
- **PROCESSED**: Reserved — do not assign PROCESSED status during discovery. This status is set by process-source when the source is fully extracted and integrated into research notes.

When uncertain, default to DISCOVERED. Better to underestimate than to claim accessibility incorrectly.

### Step 6: Write candidates file

Write to `research/discovery/{phase}-candidates.md`. Create the `research/discovery/` directory if it does not exist.

**Tier-3 banner.** Before writing the new file (or appending a re-run block), check the in-memory retrieval log entries for this run. If **every** entry has `tier: 3` (i.e., the entire run fell back to built-in WebSearch/WebFetch because both CLI tiers were unavailable), prepend a banner immediately above the Summary table:

```
> ⚠️ **Tier 3 (built-in WebSearch) only** — `tvly` and `npx firecrawl-cli` were unavailable for this run. Results are less targeted than Tier 1 (Tavily) or Tier 2 (Firecrawl). See `research/STATE.md` for the per-phase tier record. To restore Tier 1, install Tavily CLI (`curl -sSL https://tavily.com/install | sh`).
```

If any entry in the run has `tier: 1` or `tier: 2`, omit the banner — partial degradation already shows up in per-channel status lines and per-entry `degraded_to` markers, and a banner over a mixed run would over-state the problem. For appended re-runs (Step 6 re-discovery block), the banner is scoped to that re-run's entries only — write it above the re-discovery's own summary section, not at the top of the file.

**New file format:**

```
# Discovery Candidates: {Phase Name}

**Research type:** {type}
**Phase:** {phase name}
**Discovered:** {ISO timestamp}
**Channels run:** {comma-separated list}

[Tier-3 banner here if applicable — see above]

## Summary

| Channel | Status | Sources |
|---------|--------|---------|
| Web Search | found 6 | 6 |
| Financial | found 3 | 3 |
| Social Signals | skipped (not mapped for this phase) | 0 |
| Academic | found 5 | 5 |
| Regulatory | error (timeout) | 0 |
| Domain-Specific | found 2 | 2 |

**Total candidates:** {N}
**Duplicates skipped:** {N}

---

## Web Search

- [ACCESSIBLE] Title of source — https://example.com/article
  Brief 1-2 sentence snippet describing what this source contains and why it is relevant.

- [DISCOVERED] Title of paywalled source — https://wsj.com/article
  Brief snippet. Note: paywalled — content not verified accessible.

## Financial

...

## Academic

...

## Regulatory

...

## Social Signals

...

## Domain-Specific

...
```

**Appending to existing file format (re-run):**

```
---
## Re-discovery: {ISO timestamp}

**New candidates added:** {N}
**Duplicates skipped:** {N}
**Channels run:** {list}

## Web Search (re-run)

...
```

### Step 6a: Append retrieval log entries

After the candidates file write and verification succeed, write the accumulated log entries to `research/reference/retrieval-log.json`.

**Read-modify-write pattern** (mirrors claim-graph.json write in audit-claims step 8b):

1. **Read** `research/reference/retrieval-log.json`.
   - If the file does not exist: initialize with `{"entries": []}` and proceed.
   - If it exists but fails to parse as JSON: log a warning and skip the log write without failing the discovery run. Print: "WARNING: retrieval-log.json could not be parsed — log entries not written. Discovery output is unaffected." Do not block the user from proceeding.
   - If it parses correctly: load the existing `entries` array.
2. **Append** all retrieval log entry objects accumulated during Step 2 to the `entries` array.
   - Write the entire updated JSON back to `research/reference/retrieval-log.json`.
   - One entry per channel-tool execution. Entry order within this batch: channel priority order (Primary channels before Secondary channels), matching the execution order from Step 2.
3. **Verify** the write succeeded: re-read the file and confirm it parses as valid JSON and the entry count has increased by the expected number. If verification fails: print "WARNING: retrieval-log.json write failed — log entries not persisted. Discovery output is unaffected." Do not fail or retry discovery.

**Failure contract:** If the discover run crashes before Step 6 (the candidates file write), no log entries are written. If Step 6 fails (candidates file not written), do not attempt Step 6a. The candidates file and retrieval log are peers — both exist or neither exists for a given run.

### Step 7: Print completion summary and offer to process

**Before printing the summary, verify the write succeeded.** Re-read `research/discovery/{phase}-candidates.md` and confirm it exists and contains the Summary table plus at least one channel section. If the read fails or the file is empty or missing the Summary table, do not print "Discovery complete" or "Results saved" — surface the write failure to the user with the target path, preserve the in-memory candidate list so the user can direct a retry, and stop. A silent write failure here would let the user move on to processing sources that were never actually recorded.

```
Discovery complete.
  {N} candidates found across {M} channels.
  {P} duplicates skipped.
  Results saved to: research/discovery/{phase}-candidates.md

Channel results:
  Web Search    found {N}
  Academic      found {N}
  Regulatory    skipped (not mapped for this phase)
  ...
```

After printing the summary, present the top candidates in priority order and offer to begin processing.

**Priority order is defined as:** (1) ACCESSIBLE status beats DISCOVERED status (ACCESSIBLE means we verified we can fetch the content; DISCOVERED means we found it but haven't verified access); (2) within each status, higher source credibility tier first (per `research/reference/source-standards.md`); (3) within each credibility tier, the candidate most directly relevant to the phase's central research questions first; (4) break remaining ties by source recency (newer first). Print the priority rank number alongside each candidate so the user can reference candidates by rank when responding.

```
Top candidates for this phase (in priority order):

1. {Title} — {source} — {credibility tier} — {why it's high priority for this phase}
2. {Title} — {source} — {credibility tier} — {why it's high priority for this phase}
3. {Title} — {source} — {credibility tier} — {why it's high priority for this phase}
...

Want me to start processing these? I'll cross-reference automatically after
5 sources and keep going — you'll only hear from me if something needs your call.

Valid responses:
  - `yes` or `all`           — process every candidate in priority order
  - `top N` (e.g., `top 5`)  — process the first N candidates only
  - `1, 3, 7`                — process these specific candidates by rank
  - `skip 2, 5`              — process everything except those ranks
  - `no` or `review first`   — stop and let me read the candidates file before deciding
```

Parse the user's response against that list. If the response is ambiguous (mixed signals, unclear rank references, or something outside the list — e.g., "yeah but only the good ones"), re-ask with the same valid-response list and wait for an unambiguous choice. Do not guess.

**Record exclusions before processing.** For every candidate the user explicitly declined — a `skip N` list, a named rejection ("not the vendor whitepaper"), or a mid-batch "skip this one" — append a row to `research/discovery/exclusions.md`. Create the file with this header if it does not exist:

```markdown
# Source Exclusion Ledger

Candidates the user explicitly declined during discovery or processing, with reasons. Read by /know-research:check-gaps and /know-research:cross-ref — an excluded source is never processed, but the exclusion stays visible to gap analysis and pattern assessment. Record, never restrict.

| Date | Phase | Candidate | URL | Disposition | Reason (verbatim) |
|---|---|---|---|---|---|
```

Ask once, briefly: "Quick reason for the skips? One line is fine — it goes in the exclusion ledger so gap analysis can see what was left out and why." Accept one reason covering all skips or per-candidate reasons; if the user declines to give one, record `no reason given`. Never argue with an exclusion and never require a "good" reason — the user's sovereignty over source selection is absolute; the ledger records it, nothing restricts it. Two boundaries on scope: candidates merely not yet selected (`top 5` leaves the rest unprocessed) are NOT exclusions — they remain in the candidates file as unprocessed; and a `no`/`review first` response is a deferral, not an exclusion.

Once the user gives an unambiguous choice, begin processing sources sequentially using `/know-research:process-source` for each URL — **in the main conversation, as the main agent**. Track the count — the checkpoint triggers at 5 sources (the counter in `research/STATE.md`, enforced by `/know-research:process-source`'s pre-check and `research/bin/where-am-i.py`); pause there and present the cross-reference checkpoint:

**Do not delegate source processing to a subagent.** Do not spawn the Agent tool to "run the batch in parallel," "work through the queue," or "process sources while I handle something else." Each `process-source` call reads, extracts, writes a note, updates `research/sources/registry.md`, increments the cross-reference counter in `research/STATE.md`, and may surface a contradiction or access failure the user needs to see. All of that has to land in the main agent's context — not a subagent's window that returns a summary 15 minutes later — so that:

- the cross-reference checkpoint actually interrupts the work visibly at source 5 instead of sitting as a silent task-list item a subagent walks past;
- the user can react to contradictions, access failures, and surprises as they happen instead of reviewing them as a batch report;
- STATE.md, registry.md, and the cross-ref counter update in real time (a subagent either can't see STATE.md updates made between sources or races with the main agent over the same file);
- the commonplace book, assumptions, and prior source notes inform each processing call with fresh main-agent context, not a cold subagent context;
- a `/clear` recovery can read STATE.md and know exactly where processing stopped, to the source, not to the last batch report.

**Do not build a TodoWrite/TaskCreate task list of "Process Source 39, Process Source 40, Process Source 41, run cross-ref, Process Source 42…" to drive the batch.** The candidates file at `research/discovery/{phase}-candidates.md` IS the work queue. `research/STATE.md`'s "Sources since last cross-reference" counter IS the checkpoint trigger. The sources registry at `research/sources/registry.md` IS the completion ledger. A parallel task list duplicates that state in a place that disappears on `/clear` and drifts from the authoritative files. Read the candidates file top-to-bottom, process each source in-line in the main conversation, print one status line per source, stop at the cross-ref checkpoint, and resume — no task list, no subagent, no background queue.

A one-line status per completed source is the right cadence (`✓ Source 39: AccessU 2022 Sponsors page — ACCESSIBLE, 6 findings, 0 contradictions`). The user does not want a progress bar; they want to see the work happening and to be able to interrupt at any point.

```
That's {N} sources — cross-referencing before I go on.

What we've processed so far:
  {1-line summary per processed source — title and what it contributed}
```

Then run `/know-research:cross-ref` and continue the batch — do not ask permission. Cross-ref at the checkpoint is analysis whose answer is always yes; running it is not a decision the user makes (see the stop list in `${CLAUDE_PLUGIN_ROOT}/reference/workflow-ownership.md`). What cross-ref *finds* may be a stop — a material contradiction hands control back — but the run itself proceeds. After it completes, resume processing the remaining candidates.

If the user wants to skip a source during processing, skip it and move to the next — and append it to `research/discovery/exclusions.md` with a one-line reason (ask; record `no reason given` if declined). The skip is always honored; the record is never optional.

If the user wants to review the full candidates file first or pick specific sources, respect that — show them the file path and let them direct which sources to process.

### Decision points: proceed on the predictable, confirm only the genuine forks

Not every choice is a stop. Split them (full stop list: `${CLAUDE_PLUGIN_ROOT}/reference/workflow-ownership.md`):

**Predictable step — recommend in one line and proceed.** Running cross-ref at the checkpoint, moving to the gap check at end of batch, continuing to the next approved source. The answer is always yes and you can know the next step from the files, so acting is not skipping a decision — it's driving. Say what you're doing, do it. Do not end on "Sound good?"

**Genuine fork — recommend with reasoning, then let the user decide.** A choice where the user's answer changes what happens and you could not have known it from the files: whether to chase a weak last candidate versus stop, whether a surfaced gap warrants different sources, whether a material contradiction resolves one way or the other. Here you state your recommendation and reasoning first — you have the context, use it — then hand it over.

Good (a genuine fork — the recommendation carries, the decision is the user's):
```
I'd skip the last candidate (topstartups.io broader data) — we already have strong
startup-specific salary data from the earlier topstartups.io source, and the 7 processed
give solid coverage across all three questions. Moving to the gap check unless you want it.
```

The test is the same one everywhere: **would the user's answer change what happens, and could you not have known it from the files?** If no, proceed. If yes, that's a fork — recommend and hand it over.

---

## Channel Execution: Search-Based Channels

All search-based channels use the tiered tool chain: `tvly search` (Tier 1) → `npx firecrawl-cli search` (Tier 2) → `WebSearch` (Tier 3). Each channel's playbook defines the specific parameters. The summaries below show the key params for Tier 1; fallback tiers use equivalent query text with fewer filtering options.

### Web Search (channel-type: web-search)

Primary tool: `tvly search` (via Bash)
Secondary tool: Exa Search API (via Bash curl to `https://api.exa.ai/search`)

**Execution order:** Tavily first (up to 8 results), then Exa second (up to 8 results). Dedup collapses URL matches before presenting combined candidates. Maximum pre-dedup output: 16 candidates from web search.

**Tavily execution parameters** (from web-search.md playbook):
- `--topic general` for background/overview phases
- `--topic news --time-range month` for recent-developments phases
- `--include-domains`: leave empty for general web search (returns broadest results)
- `--exclude-domains`: exclude low-credibility aggregators if specified in playbook

**Exa execution parameters** (from web-search.md playbook):
- Authentication: `EXA_API_KEY` environment variable (free tier: 1,000 searches/month)
- Search type: `auto` (routes to neural or keyword via Exa's internal categorization)
- `numResults`: 8
- `useAutoprompt`: true (lets Exa refine the query for semantic relevance)
- Optional: `startPublishedDate` for time-bounded queries, `category` for entity-type biasing

**Cross-tool deduplication** (per web-search.md Section 8):
- Dedup key: exact URL string equality (no normalization)
- Priority: Tavily entry kept; Exa duplicate silently dropped
- Surviving duplicate tagged `[Tavily+Exa]`; Tavily-only tagged `[Tavily]`; Exa-only tagged `[Exa]`

**Combined status line** (report after both tools complete):
```
Web Search: {N} results (Tavily: {n1}, Exa-only: {n2}, deduped: {n3}) [degraded: {list}]
```

**Tavily fallback chain** (unchanged): `npx firecrawl-cli search` (label: `[Firecrawl fallback]`) → `WebSearch` (label: `[WebSearch fallback]`)

**Exa degradation:** If `EXA_API_KEY` is absent, or Exa returns error/timeout, skip silently. Log: `Exa: unavailable — web search results from Tavily only`. Exa failure does not trigger Tavily fallbacks — they are independent parallel tools.

### Financial (channel-type: financial)

Primary tool: `tvly search` (via Bash)

Execution parameters (from financial.md playbook):
- `--topic finance` for market, earnings, and investment queries
- `--include-domains "sec.gov,finance.yahoo.com,bloomberg.com,reuters.com,wsj.com,ft.com,marketwatch.com"`

Fallback chain: `npx firecrawl-cli search` with `site:` operators in query → `WebSearch` with `site:` operators

### Social Signals (channel-type: social-signals)

Primary tool: `tvly search` (via Bash)

Execution parameters (from social-signals.md playbook):
- `--topic general` or `--topic news` depending on query type
- `--include-domains "reddit.com,news.ycombinator.com,stackoverflow.com,twitter.com,linkedin.com,medium.com"`

Fallback chain: `npx firecrawl-cli search` with `site:` operators → `WebSearch` with `site:` operators

### Domain-Specific (channel-type: domain-specific)

Read the type-channel map's "Domain-Specific Sources" section to identify which type hooks apply to the current research type. Execute ONLY the hooks specified for that research type — do not run all hooks for every research type.

**Patent Search hook** (company-for-profit, technology research types):
- Construct Google Patents URL: `https://patents.google.com/?q={research_subject}&assignee={company_name}`
- Attempt `tvly extract` on the constructed URL to get patent listings. If unavailable, try `npx firecrawl-cli scrape`. If both fail: log the URL as DISCOVERED with note "extraction unavailable — manual review required"
- Status: DISCOVERED (patent content requires individual extraction)

**Industry Databases hook** (for-profit, market-industry types):
- Use `tvly search --include-domains "crunchbase.com,pitchbook.com,cbinsights.com"` per the hook template
- Status: DISCOVERED for paywalled databases, ACCESSIBLE for free-tier results

**Educational Resources hook** (curriculum-research type only):
- Use `tvly search` per the educational resources hook template
- Target curriculum aggregators, open courseware, learning platforms
- Status: ACCESSIBLE for open platforms, DISCOVERED for gated content

**Specialized Registries hook** (person-research type only):
- Use `tvly search` per the specialized registries hook template
- Target LinkedIn, professional association directories, academic profiles
- Status: DISCOVERED (profile content requires individual extraction)

Fallback for all domain-specific hooks: `npx firecrawl-cli search` with `site:` operators → `WebSearch` with `site:` operators.

---

## Channel Execution: HTTP API Channels

For academic and regulatory channels, read the full playbooks at:
- `${CLAUDE_PLUGIN_ROOT}/reference/discovery/channel-playbooks/academic.md`
- `${CLAUDE_PLUGIN_ROOT}/reference/discovery/channel-playbooks/regulatory.md`

These playbooks contain curl templates, response parsing instructions, rate limits, and complete degradation chains. Read them at execution time, not from memory.

### Academic (channel-type: academic)

Primary: `Bash` curl to OpenAlex API

Key parameters:
- Include `mailto=research-agent@example.com` in all OpenAlex requests (activates 10 req/s polite pool)
- Extract per result: title, DOI, authors, citation count, open-access status (`is_oa`), OA URL (`open_access.oa_url`)
- Status determination: `is_oa=true` → ACCESSIBLE, `is_oa=false` → DISCOVERED
- **Citation floor is a per-run choice** (see academic.md Template A note): default `cited_by_count:>10` for established topics; for emerging topics (field or question younger than ~3 years, or fast-moving areas), drop the floor and filter by recency instead — print which floor was used in the channel status line

Rate limit: 10 req/s with mailto, 1 req/s without.

Fallback chain (per academic.md):
1. `tvly search --include-domains "scholar.google.com,arxiv.org,pubmed.ncbi.nlm.nih.gov"` — label: `[via tvly fallback]`
2. `npx firecrawl-cli search` with academic domain keywords — label: `[via Firecrawl fallback]`
3. `WebSearch` with academic domain keywords — label: `[via WebSearch fallback]`

### Regulatory (channel-type: regulatory)

Primary: `Bash` curl to EDGAR EFTS and ProPublica APIs

**EDGAR EFTS (SEC filings):**
- Always include `User-Agent: ResearchAgent (contact@example.com)` header — required by SEC policy
- Rate limit: max 5 req/s; never exceed
- Extract per result: filing date, form type (10-K, 10-Q, 8-K, DEF 14A, etc.), entity name
- Construct filing URL from accession number: `https://www.sec.gov/Archives/edgar/data/{cik}/{accession-number-formatted}/`
- Status: ACCESSIBLE — all SEC filings are public record and legally accessible

**ProPublica Nonprofit Explorer (990 data):**
- Extract per result: EIN, organization name, total revenue, filing year
- Construct 990 profile URL: `https://projects.propublica.org/nonprofits/organizations/{ein_no_dashes}` — remove dashes from EIN (e.g., `13-1837418` → `131837418`)
- PDF link for individual 990: `https://projects.propublica.org/nonprofits/organizations/{ein_no_dashes}/{filing_id}/full`
- Status: ACCESSIBLE — IRS 990 data is public record

Fallback chain (per regulatory.md):
1. `tvly search --include-domains "sec.gov,projects.propublica.org"` — label: `[via tvly fallback]`
2. `npx firecrawl-cli search` with `site:` operators — label: `[via Firecrawl fallback]`
3. `WebSearch` with `site:sec.gov OR site:projects.propublica.org` — label: `[via WebSearch fallback]`

---

## Guardrails

1. **Discovery output goes to `research/discovery/` ONLY.** Never write to `research/notes/`, `research/sources/registry.md`, or any other research file. The boundary between discovery and processing belongs to process-source — do not cross it.
2. **Never auto-process without user approval — but approval is one gate, not many.** After discovery, present the prioritized candidate list and ask the user before processing. Once the user approves the batch, process sources sequentially through the list without asking for re-confirmation between sources. The human gate sits between discovery and processing, not between every source. See "Legitimate Pause Points" below for the exhaustive list of when you MAY pause; a clean source completion is not on that list.
3. **Cap results at 8 sources per channel per query.** If an API returns more results, take the top 8 by relevance score or citation count. Exceeding 8 per channel defeats the purpose of the candidate review step.
4. **Always include `User-Agent: ResearchAgent (contact@example.com)` for SEC EDGAR requests.** This is required by SEC policy — the header value is defined in regulatory.md.
5. **Include `mailto=research-agent@example.com` for all OpenAlex API requests.** This activates the 10 req/s polite pool. Without it, rate limit is 1 req/s.
6. **Do not run all domain-specific hooks.** Only execute the hooks specified in the current research type's channel map. Running patent search for a non-profit research project wastes time and produces irrelevant results.
7. **When a channel fails, continue with remaining channels.** Never abort discovery due to a single channel failure. Log the failure, report it in the summary table, move on.
8. **Label all degraded and fallback results inline.** Every result from a fallback method must be tagged with the actual method used: `[Firecrawl fallback]`, `[WebSearch fallback]`, `[via tvly fallback]`, etc.
9. **Retrieval log write must never block discovery.** If `retrieval-log.json` cannot be read, parsed, or written, print a WARNING and proceed. The candidates file is the primary artifact — the retrieval log is supplementary infrastructure. Never abort discovery, never retry the write, never ask the user to fix the file before continuing.
10. **Every explicit exclusion is ledgered; no exclusion is contested.** When the user declines a candidate, the decline stands — record it in `research/discovery/exclusions.md` with the reason (or `no reason given`) and move on. Do not lobby for a declined source, and do not silently drop the record because the reason seems thin. User curation of the evidence base is legitimate; invisible curation is the defect the ledger exists to prevent.

---

## Legitimate Pause Points During Batch Processing

Once the user has approved a batch of candidates for processing, you drive the workflow forward. You may pause ONLY at these points:

**First, what is NOT a pause: analysis running.** The cross-ref checkpoint (counter hits 5) and the end-of-batch gap check are not pauses — they run automatically, with a one-line heads-up, because their answer is always yes. What they *find* can be a pause (below); the run itself never is. Do not ask permission to cross-reference or to check gaps.

You hand control back to the user only for:

1. **Real access failure.** A source cannot be fetched — domain block, paywall, 403, rendering issue, extraction returned stub content. Present the options defined in `process-source` step 1 and wait for the user.
2. **A material contradiction, or a genuine strategic fork.** A contradiction the (now-automatic) cross-ref surfaces that would move a finding; a gap result that says the phase needs different sources; a discovery that the candidate list is wrong for the phase. The analysis runs on its own — but when it turns up one of these, that is a real decision, and it stops. These are rare and load-bearing.
3. **End of the approved batch.** You finished the last approved candidate. Do not simply ask "what's next" — run the gap check and present what it found (a real gap is a fork, per point 2), then let the user direct from there.

A successful source completion — "processed, note written, no issues" — is NOT a pause point. A one-line status line is fine. An "OK to continue?" prompt is not.

If you catch yourself wanting to ask "should I keep going?" after a clean source, the answer is yes. You were already told yes when the batch was approved. (Full stop list: `${CLAUDE_PLUGIN_ROOT}/reference/workflow-ownership.md`.)

---

## Common Failure Modes

| Failure Mode | Prevention |
|---|---|
| Running discovery with no active phase | Pre-check step 1 reads `research/STATE.md`. If no active phase, error with guidance before any channel execution. |
| Silently re-discovering a phase that was already completed (audit-claims forgot to advance STATE.md) | Pre-check step 1a detects `Verify` already checked on the active phase and refuses to run. `/know-research:audit-claims` owns phase closeout — if it skipped the STATE.md advance, discovery must not paper over it. Surface the inconsistency and make the user (or a targeted STATE.md edit) resolve it before any queries execute. |
| Backgrounding source processing into a subagent or Agent-tool spawn after the user approves a batch | Source processing runs in the main conversation, full stop. A subagent loses the cross-ref checkpoint (it walks past the 5-source trigger silently because the main agent isn't watching), loses per-source STATE.md updates (they either race with the main agent or happen in bulk at the end), loses the user's ability to react to contradictions and access failures in real time, and loses recoverability on `/clear` (STATE.md lags by a whole batch). When the user approves a candidate batch, the main agent processes sources sequentially itself — one at a time, one status line per source, cross-ref at the threshold, done. Do not spawn the Agent tool for batch processing regardless of how many candidates are queued. |
| Building a TodoWrite/TaskCreate task list to drive source processing | The candidates file is the queue, STATE.md is the counter, registry.md is the ledger. A parallel task list ("Process Source 39", "Process Source 40", "Run cross-ref at 5-source threshold", "Process Source 42", …) duplicates state that already exists in authoritative files, lives in a place that disappears on `/clear`, and turns the cross-ref checkpoint from a hard gate into just another checkbox a subagent will happily cross. Read the candidates file in order and process each source inline — no todo list wrapping the batch. |
| Querying channels not relevant to the research type | Pre-check step 4 reads the type-channel map first. Only execute channels in the matched Discovery Group — never execute all 6 channels by default. |
| Overwriting prior discovery work on re-run | Pre-check step 7 checks for existing candidates file. If it exists, append with timestamp separator and deduplicate by URL. Never overwrite. |
| Processing sources without user approval | Guardrail 2: present prioritized candidates and ask the user before processing. Once approved, process sequentially — but the transition from discovery to processing requires explicit user approval. |
| Accountability avoidance — asking "should I continue?" after every clean source completion, or "should I cross-ref now?" at the checkpoint | Once the user approved the batch, you were told yes. Re-asking between successful sources, or asking permission to run cross-ref/gap-check, is friction without value — it hands the steering wheel back instead of holding the workflow. Cross-ref and the gap check run automatically (one-line heads-up, no permission); a clean source completion is a status line. Pause only at the real stops — a real access failure, a material contradiction or strategic fork the analysis surfaces, or the end of the approved batch. Nothing else. |
| Silent channel failure with no status reporting | Print per-channel status lines during execution. Include all channels in summary table with explicit status — even channels that were skipped or errored. |
| Exceeding API rate limits | Follow rate limits from playbooks: EDGAR max 5 req/s, OpenAlex 10 req/s with mailto (1 req/s without), Tavily and Firecrawl usage is credit-based. Space Bash curl calls with brief pauses if running multiple EDGAR queries. |
| Missing User-Agent for SEC EDGAR | Guardrail 4: always include `User-Agent: ResearchAgent (contact@example.com)`. The value is defined in regulatory.md. |
| Assigning PROCESSED status during discovery | Pre-check: PROCESSED is reserved for process-source. Assign only DISCOVERED or ACCESSIBLE during discovery. |
| Running domain-specific hooks for wrong research type | Guardrail 6: read the type-channel map's hook list. Only run hooks that appear in the current research type's channel map. |
| wildcard include-domains failing in tvly | If a playbook lists wildcard domains (e.g., `investor.*.com`), replace with explicit domain list. Wildcards are unconfirmed in tvly's `--include-domains` — use specific URLs instead. |
| Retrieval log write failure blocking discovery output | Step 6a non-blocking contract: if retrieval-log.json cannot be read, parsed, or written, print WARNING and proceed. The candidates file is the primary artifact. Never abort, retry, or ask the user to resolve before continuing. |

---

## Output

Print the completion summary (Step 7 format):

### Discovery: Phase [N] — [Phase Name]

| Channel | Status | Found |
|---------|--------|-------|
| Web Search | found | 6 |
| Academic | found | 4 |
| Regulatory | skipped | 0 |
| Financial | error (timeout) | 0 |

**Total candidates:** N | **Duplicates skipped:** N | Saved to: `research/discovery/{phase}-candidates.md`

---

[Per-channel candidate detail and prioritized list follow below]

After presenting the prioritized candidate list and receiving user approval to process, append the next-action block at the end of the discovery output (after the batch processing offer):

───────────────────────────────────────────────────────────

**▶ NEXT:** `/know-research:process-source <first-url>` — Start processing the approved candidates in priority order.

**Also available:**
- `/know-research:cross-ref` — Cross-reference sources processed so far before continuing.
- `/know-research:check-gaps` — Check coverage against the phase's questions before collecting more sources.

───────────────────────────────────────────────────────────

After discovery is complete and all approved sources have been processed (post-batch), render this block instead:

───────────────────────────────────────────────────────────

**▶ NEXT:** `/know-research:cross-ref` — Cross-reference the [N] sources processed so far before continuing.

**Also available:**
- `/know-research:check-gaps` — Check coverage against the phase's questions before collecting more sources.
- `/know-research:process-source <url>` — Process a specific source not in the candidates list.

───────────────────────────────────────────────────────────

After discovery, the agent should guide the user through source processing — not hand back control and wait for manual URL entry. The user's job is to review and approve; the agent's job is to drive the workflow forward.

The candidates file at `research/discovery/{phase}-candidates.md` is the primary artifact of this skill.
