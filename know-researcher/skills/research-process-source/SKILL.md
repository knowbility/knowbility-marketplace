---
name: research-process-source
description: This skill should be used when the user gives a URL, PDF, or document and asks to process, ingest, or take notes on it (e.g. "process this source", "add this URL to my research", "take notes on this PDF"). Ingests the source, extracts claims with evidence-quality tags, registers it in the source registry, and writes a per-source note under research/notes/.
argument-hint: "[url-or-file-path]"
---

# /know-research:process-source

Process a source into a structured research note.

## Input
The user will provide a URL, file path, or pasted content.

## Pre-check (mandatory)

1. **Read `research/STATE.md`** and check "Sources since last cross-reference."
2. **If the count is 5 or higher, cross-reference is due — run it, don't ask.** Say it in one line ("That's 5 since the last cross-reference — cross-referencing before this source"), then run `/know-research:cross-ref` inline, in the main conversation, before processing this source. Running analysis whose answer is always yes is not a decision the user makes (see the stop list in `${CLAUDE_PLUGIN_ROOT}/reference/workflow-ownership.md`). What the cross-ref *finds* may be a stop — a material contradiction hands control back per that skill — but the run itself proceeds on its own. After cross-ref completes (it resets the counter), continue with this source.
2a. **Verify `research/sources/registry.md` exists and is parseable.** If the file does not exist, create it with the empty header row before proceeding (first-source case — this is normal for a new project):

   ```markdown
   # Source Registry

   | # | Name | Type | Credibility | Date | Note file |
   |---|------|------|-------------|------|-----------|
   ```

   If the file exists but lacks a parseable markdown table (no header row, malformed separator, or structurally corrupted), stop and tell the user: "`research/sources/registry.md` exists but cannot be parsed as a markdown table. This is a registry corruption — restore from git or fix the file manually before processing more sources. Do not proceed." Do not silently recreate or repair a corrupted registry — the user needs to see it.
3. **Check for duplicate processing.** Before fetching the source, search `research/sources/registry.md` for the URL (or filename for local files). Also check `research/notes/` for a note file with a matching URL in its header.
   - If found in registry AND a complete note exists in `research/notes/`: warn the user and present two explicit options: "This source was already processed — see `research/notes/{file}`. Pick one: **(a) overwrite** — I'll re-fetch, regenerate the note from scratch, and update the existing registry row in place. STATE.md counters are NOT incremented because this is not a new source. **(b) skip** — leave the existing note as-is and move on." Wait for `a` or `b`. Do not accept an ambiguous response — re-ask if needed.
   - If found in registry BUT the note file is missing or truncated: warn the user: "This source appears partially processed (registered but note is missing or incomplete). I'll re-process it from scratch." This case is not a user choice — it's recovery from an interrupted prior run, and the fix is always re-process.
   - If a complete note exists in `research/notes/` BUT no registry row exists: this is recovery from a session that died between the note write (step 5) and the registry write (step 6). Verify the note is actually complete — it has every required section through Finding tags, quotes, and origin chain. If complete, do NOT re-fetch or regenerate: backfill the registry row from the note's own header data (title, type, credibility, date, note filename), then check STATE.md's counters — the interrupted run never reached step 7, so increment all three now — "Total count," "Sources for current phase," and "Sources since last cross-reference" (with the same re-read verification as step 7). Report the recovery in exactly one line — "Recovered interrupted processing: registry row backfilled from the existing note; counters updated." — **and then render the ordinary summary block from the note's own contents**, exactly as a normal completion would. **That single line IS the whole disclosure of the repair**, and the summary block is not part of the repair: it is the source assessment, and the user has never seen it. The interrupted run died between the note write and the registry write, both of which precede the Output block, so what the source says and how much weight it carries was never reported to anyone. Suppressing it here would make a resumed session permanently quieter than an uninterrupted one about the same source. (This resolves a contradiction between this branch's older "one line, and nothing more" and the mandated block in Output, open since iteration-4.) Do not narrate the pre-check, the threshold arithmetic, the registry parse, the counter increments, or the re-read verification — those are mandatory and invisible (posture doctrine rule 7). What happened and what it means for the record is disclosure; the mechanism by which you fixed it is machinery. If the note is truncated or missing sections, treat it like the registered-but-incomplete case: warn and re-process from scratch (delete the partial note first so the rewrite is clean).
   - If not found anywhere: proceed normally.

   This prevents duplicate processing after context clears that interrupt mid-source, and avoids wasting extraction calls on sources already in the evidence base.

## Process

1. **Check tool availability** (once per process-source invocation, not per source). Run via Bash:
   ```bash
   which tvly 2>/dev/null && echo "TIER1_OK" || echo "TIER1_MISSING" && which npx 2>/dev/null && echo "TIER2_OK" || echo "TIER2_MISSING"
   ```

   CLI invocations use bare names — `tvly extract "..."`, `npx firecrawl-cli scrape "..."`. The plugin's `SessionStart` hook (`hooks/setup-paths.sh`) puts the relevant bin directories on PATH for every Bash call in the session. Do not prepend an inline `export PATH=...` — bare names match the project `settings.json` pre-allow patterns (`Bash(tvly:*)`, `Bash(npx:*)`) and suppress per-call permission prompts; a compound `export ... && tvly ...` does not match and prompts every time.

   If a tier appears missing, run a diagnostic:
   ```bash
   ls "$HOME/.local/bin/tvly" 2>/dev/null && echo "EXISTS_ON_DISK" || echo "NOT_INSTALLED"
   ls "$HOME/.volta/bin/npx" 2>/dev/null || ls /usr/local/bin/npx 2>/dev/null || ls /opt/homebrew/bin/npx 2>/dev/null && echo "EXISTS_ON_DISK" || echo "NOT_INSTALLED"
   ```
   Print a one-line status: "Tool check: tvly ✓, npx ✓" or "Tool check: tvly ✗ (not installed), npx ✓" or similar. Skip confirmed-missing tiers for the rest of this invocation.

2. **Fetch the content.** For URLs, try each extraction tier in order, starting from the highest available tier confirmed in step 1:
   - **Tier 1:** `tvly extract "{url}" --format markdown` (via Bash)
   - **Tier 2:** `npx firecrawl-cli scrape "{url}" --format markdown --only-main-content` (via Bash)
   - **Tier 3:** `WebFetch` (built-in — always available, no CLI needed)
   - **Floor:** `npx playwright pdf "{url}" /tmp/extract-$(date +%s).pdf` then Read the PDF

   If a tier fails for a specific source at runtime (API error, timeout, 403 — not "command not found"), try the next tier for that source only. On the next source, start from the highest available tier again. Runtime failures are per-source, not per-session — a timeout on one URL does not mean the tool won't work on the next.

   For local files: if the file is a PDF, try `pdftotext "{path}" /tmp/{basename}.txt` first (via Bash), then read the text file. If `pdftotext` is not installed (command not found), fall back to reading the PDF directly with the Read tool. For non-PDF files, read them directly. Do not work from search snippets.

   **If the source cannot be fetched** (domain blocks agents, paywall, 403, timeout, or any other access failure): do NOT silently skip the source or decide you have enough without it. Present the situation to the user and offer options:

   ```
   I can't access this source: {title / URL}
   Reason: {what happened — domain block, paywall, etc.}

   Options:
   1. You grab it — paste the FULL article body here (not just the abstract, lede, or a summary — the full body including any tables, captions, and pullquotes the note will need to cite). Alternatively, save the full text to source-material/ with a filename matching the original title or URL slug and I'll read it from there.
   2. Skip this source — I'll note it as inaccessible and move on
   3. Try an alternative URL — if you have a cached/archived version
   ```

   If the user chooses option 2, append the source to `research/discovery/exclusions.md` (create with the ledger header from `/know-research:discover` if absent) with disposition `inaccessible — skipped by user` and whatever reason they gave (or `no reason given`). The skip is honored without argument; the ledger keeps it visible to `/know-research:check-gaps` and `/know-research:cross-ref`.

   **Option 1 disambiguation:** if the user pastes content that looks like an abstract, an article preview, a list of bullet points from a marketing page, or anything notably shorter than a real article body, do not silently accept it. Ask: "That looks like a preview or abstract — is that the full article text, or is there more? If it's just the preview, I'll process it as an abstract-only source with reduced credibility weight and note the limitation in the source note. Tell me which one." Wait for the user to confirm before processing.

   Wait for the user to respond. Do not proceed until they choose. In a real research project, you wouldn't just ignore a source because it was hard to access.
2. **Read `research/reference/source-standards.md`** for credibility assessment criteria and `${CLAUDE_PLUGIN_ROOT}/reference/source-assessment-guide.md` for deeper assessment methods (methodology quality, conflict of interest, sample size, replication status).
3. **Verify this source is about the research subject.** Before writing anything, confirm the fetched content is actually about the subject defined in `research/research-plan.md` (the "Research Subject" line at the top). If the content is about a similarly-named but different thing (different company, product, plugin, person, etc.), stop and tell the user: "This source appears to be about [what you found], not [the research subject]. Please confirm whether this is the correct source before I process it." Do not process a mismatched source.
4. **Determine the author.** Only use an author name that appears explicitly as a byline in the extracted content. Do not infer an author name from the site name, domain, URL slug, or any other source. If no byline is present in the extracted text, record the author as "Unknown — no byline in extracted content." A human would either already know whose site it is or look for an about page — never treat the site name as the author name.
5. **Create a structured note** at `research/notes/<slugified-source-title>.md` with:
   - Source title, and — on its own line, verbatim and machine-readable — `**Source URL:** <the url, or the file path for a local source>`. This line is the source's stable identity: it is what links this processed note back to the discovery candidate it came from. The workflow-position helper matches a candidate's URL against this field to decide, exactly, which candidates are still unprocessed — so it must be the real URL on its own labeled line, never folded into prose or paraphrased. For pasted content with no URL, record `**Source URL:** (pasted content — no URL)`.
   - Date accessed, source type
   - Author (verified byline only — see step 4)
   - Credibility assessment based on the project's source credibility hierarchy
   - Origin chain — whether this source is primary (original data/research) or secondary (reporting on someone else's findings). If secondary, record the original source it cites (name, author, date if available). If the source cites multiple original sources for different claims, record the origin for each major claim separately.
   - Key findings — the important claims, data points, and arguments from this source
   - Relevance — which research plan phases this source informs
   - Finding tags applied to key claims. Tag set fallback chain: **(1)** read `CLAUDE.md` and use the Finding Tags section; **(2)** if that section is missing (init drifted or project predates the convention), fall back to the type template at `${CLAUDE_PLUGIN_ROOT}/reference/templates/types/{research-type}.md` where `{research-type}` comes from CLAUDE.md's `research-type` field; **(3)** if neither source yields a tag set, do not invent tags — record "Tag set unavailable — CLAUDE.md and type template both missing the Finding Tags section. Tags not applied to this note." in the note's Finding Tags field and continue. Never fabricate tags.
   - Contradictions or tensions with previously processed sources (if any)
   - **A figure record for every quote and every number a later draft might cite** — the structure below, one block each. This replaces the old free-form "direct quotes with context" line, and it is the note's most load-bearing content: everything downstream validates against this note and nothing ever re-reads the original, so whatever is imprecise here is imprecise forever.

     ```markdown
     - **figure:** 60–70%
       **measures:** share of surveyed mid-market SaaS teams reporting any reduction in time-to-value
       **not:** the size of the reduction
       **basis:** n=212 self-selected survey respondents, vendor-run, fielded 2026-03
       **carries-to:** the surveyed population only — the source does not generalise it
       **locator:** §3, "Adoption Outcomes" table, row 2
       **verbatim:** "60–70% of mid-market SaaS teams report that onboarding automation reduced time-to-value"
     ```

     - **`measures`** — what the figure is a measurement *of*, in a full phrase, including its population and what is being counted. This is the field that stops a number from changing meaning while keeping its digits. "60–70%" is not a fact; "60–70% *of surveyed teams*, reporting *any* reduction" is. Never write a bare unit like "percent" — the question is percent **of what**.
     - **`not`** — optional, and worth writing whenever a plausible neighbouring reading exists. The failure this prevents is not a wild misreading; it is the *nearby* one — a share-of-population figure read as a magnitude-of-effect figure. Naming the reading the figure does not support turns a judgment call into a check.
     - **`basis`** — what the number was computed from: sample size, how the sample was selected, who ran the study, when it was fielded. `source-assessment-guide.md` §2 and §4 already tell you what to look for; this is where what you find survives. **When the source does not say, the field records that** — "undisclosed sample size", "proprietary methodology, no detail" — in the guide's own words. **An absent basis is a finding, and writing "unknown" is how it survives to be one**; omitting the field loses the fact that nobody could tell.
     - **`carries-to`** — the population the figure supports a claim *about*, which is **not always the population it was measured on**. This is §4's extrapolation flag, kept rather than dropped. Where the source generalises beyond its own sample, record the wider population *and that the source made that leap*. Where it does not, `carries-to` is the sample — and a later draft that speaks more widely has drifted past what the note supports. Per figure, never per source: a single study routinely carries a well-founded headline number and a throwaway aside computed from nothing.
     - **`locator`** — where in the source it sits: section, heading, page, table, timestamp. Enough that a person could open the source and land on it. If the source has no addressable structure, say what it does have ("single-page post, 4th paragraph"). Never write "throughout" or leave it blank to mean "somewhere in there."
     - **`verbatim`** — the source's own words, exactly. Not a tidy version.

     **Why these two fields exist here rather than in a guide.** The criteria were always written down — `source-assessment-guide.md` §2 Methodology Quality and §4 Sample Size and Representativeness — and they were read at assessment time, used to pick a credibility tier, and then dropped. Nothing carried them forward. Meanwhile the integrity agent runs on the draft, the plan, and the digest, **never on notes**. So by the time anything examined a number's basis, the number was prose in a draft and its sample was three steps upstream. **The defect was positional, not analytical** — no reader was failing to understand the criteria; the criteria were being discarded before anyone could apply them.

     **A quote or figure you cannot locate is a finding, not a formatting problem.** If you cannot point at where a number came from, say so in the `locator` field in those words — "not locatable in the extracted content" — and keep the record. That is a true fact about the evidence, and it is the kind of thing a reader needs before the number reaches a recommendation. Do not drop the figure to avoid the awkward field, and do not write a vague locator to fill it.

     **Old notes without figure records.** Projects predating this schema have notes with prose findings and no records. That is not an error and never gets reported as one. But if you are reading such a note for any reason and the source material is still available to you, build its figure records then — the corpus converges by contact rather than by a migration event.
5a. **If the note carries any figure record, run the research-integrity agent on it.** Pass the note's filepath. The agent's check 10 reads `basis` and `carries-to` against `measures` and the note's own prose — a missing basis, prose that widens a figure past the population it was measured on, a figure treated as solid on a methodology nobody disclosed.

   **A note with no figures skips this silently.** No invocation, no "not applicable" line — a step that usually says nothing is a step people learn to ignore.

   **This is the promise the agent has always made.** Its own usage list has said "invoke after writing a source note" since it was written, and no skill ever did — so every quantitative check first ran on a *draft*, three steps downstream, by which point the sample was in another file and the number was prose. Fixing the ordering is the whole of it; nothing here asks for judgment the agent could not already make.

   Findings are surfaced to the user and recorded in the note. **They do not block** — a source with undisclosed methodology is ordinary and often the only thing available. What is not ordinary is using one without saying so.

6. **Add the source to `research/sources/registry.md`** — new row with source number, name, type, credibility rating, date, and note filename.
6a. **Mark the candidate PROCESSED in its candidates file.** Search `research/discovery/*-candidates.md` for an entry whose URL matches this source's URL. If one exists, change its status tag to `[PROCESSED]` (the status the discovery taxonomy reserves for exactly this moment). This keeps the candidates file the live batch ledger: the workflow-position helper derives the next source to process as the first candidate that is neither `[PROCESSED]` nor recorded in `research/discovery/exclusions.md`, so a session resuming after a clear or a long conversation can compute where it is in the batch from the file instead of inferring it. If the URL appears in no candidates file — a standalone source the user handed you directly, not one from discovery — there is nothing to mark; skip this. This write is silent (posture rule 7).
7. **Update `research/STATE.md`** — increment all three source counters: "Total count," "Sources for current phase," and "Sources since last cross-reference." All three advance by one for every new source; leaving "Sources for current phase" behind while "Total count" moves is a silent desync that makes the phase-level state untrustworthy. **After the edit, re-read STATE.md and confirm all three counters reflect the new value (old value + 1).** If the re-read shows any counter unchanged, do not report the source as processed — surface the write failure with the expected vs. actual values, and stop before moving on to the next step. The cross-ref checkpoint depends on "Sources since last cross-reference" being correct; silent drift here produces a silently-overdue cross-reference.
8. **Update the source material digest (if applicable).** If the source being processed is a file located in `source-material/`, check whether it is listed in `research/source-material-digest.md`. If the digest exists and the file is not listed, add it to the "Files Read" table with read status "full" and append any new named entities, dates, credentials, stated facts, or assumptions to the corresponding digest sections. If the digest does not exist but `source-material/` contains multiple files, note to the user that the digest is missing and suggest running `/know-research:start-phase` (which will prompt for retroactive digest generation). If the source is a URL or a file outside `source-material/`, skip this step.

## Guardrails

1. Process sources only for the current phase. If a source contains information relevant to a future phase, note the relevance but do not extract findings for that phase.
2. Never infer an author from the domain name, URL structure, or site branding. If no byline appears in the extracted text, the author is "Unknown."
3. Assess credibility against the project's specific credibility hierarchy, not a generic one. Read `research/reference/source-standards.md` every time.
4. Preserve the source's own qualifiers, ranges, and uncertainty language in the structured note. Do not clean up hedging.
5. If the source contradicts previously processed sources, flag the contradiction explicitly in the note — do not leave it for cross-ref to discover.
6. Record the origin chain for every source. If a source presents its own original research, record it as primary. If it reports on others' findings, record each cited original with enough detail (title, author, date) for cross-ref to match origins across sources.
7. **Run in the main conversation, not in a spawned subagent.** `/know-research:process-source` is meant to execute in the main agent's context — the one the user is talking to — not as a task delegated to the Agent tool. This is non-negotiable and applies equally to single-source invocations and to batch processing after `/know-research:discover`. The reasoning: each call reads STATE.md, updates STATE.md's "Sources since last cross-reference" counter, writes to `research/sources/registry.md`, consults the commonplace book and prior source notes for contradiction detection, and may surface an access failure or contradiction the user needs to react to in real time. A subagent running this in a cold context races with the main agent over STATE.md, can't see contradictions the main agent already surfaced earlier in the session, can't be interrupted by the user mid-source, and turns the mandatory cross-reference checkpoint into a silent threshold that gets walked past. If you are tempted to spawn a subagent to "process the remaining N sources in parallel" or "work through the queue while I do something else," stop — that is the failure mode, not the solution. Process one source, print the status, process the next.
8. **Do not wrap batch processing in a TodoWrite/TaskCreate task list.** The candidates file at `research/discovery/{phase}-candidates.md` is the work queue. `research/STATE.md`'s counter is the checkpoint trigger. `research/sources/registry.md` is the completion ledger. A parallel todo list ("Process Source 39", "Process Source 40", "Run cross-ref", "Process Source 42"…) duplicates state into a place that disappears on `/clear`, drifts from the authoritative files, and — most importantly — reframes the cross-ref checkpoint as just another checkbox in a list. The checkpoint is a hard interrupt on the batch, not a queue item. Read the candidates file in order, process each source inline, print one status line per completion, stop when STATE.md shows the counter has hit the threshold.

## Common Failure Modes

| Failure Mode | Prevention |
|---|---|
| Misattributing the author — using site name or domain as author name | Only record an author name that appears as a byline in the extracted content. "Unknown" is correct when no byline exists. |
| Accepting source claims at face value without credibility assessment | Every note must include a credibility assessment. A company's blog post about its own product is low-credibility for performance claims regardless of how detailed it is. |
| Processing sources for future phases instead of the current one | Check STATE.md for the active phase. Extract findings relevant to the current phase only. Note future-phase relevance in the Relevance field but do not tag those findings. |
| Working from search snippets instead of full content | Always extract or read the full source content. Search snippets are for discovery, not for note-taking. Partial content leads to missing context and qualifier stripping. |
| Processing a file from source-material/ without updating the digest | When the source path begins with `source-material/`, after writing the note, update `research/source-material-digest.md` with the file's contents (add to Files Read table, append new entities/dates/credentials/facts/assumptions). The digest is the reconciliation anchor for `/know-research:start-phase` — drift produces false blockers or misses real drops. |
| Silently skipping blocked or paywalled sources | Never decide on your own to skip a source you can't access. Present the access failure to the user with options: they provide the content, explicitly skip it, or offer an alternative URL. The user decides, not the agent. |
| Sticky fallback — using a lower tier for all sources after one failure | Fallbacks are per-source, not per-session. Always start from the highest available tier (per step 1 pre-flight) on every source. A runtime failure on one URL (timeout, 403, API error) does not mean that tier won't work on the next. Reset to the highest available tier on every new source. But if step 1 confirmed a tier is missing (binary not installed), skip it for all sources — don't retry a missing binary. |
| Assuming "command not found" means "not installed" | The harness shell has a different PATH than your terminal. Step 1's diagnostic distinguishes "not on PATH" from "not installed." If a binary exists on disk but isn't callable, tell the user which directory to add to settings.json env.PATH — don't silently degrade for the whole session. That disclosure fires **only on a failure**: a tier that works is not news, and a clean pre-flight is never spoken ("Tool check: tvly ✓, npx ✓" is exactly the pre-check narration the Output section forbids). |
| Silently resolving contradictions within a source | When a source contains contradictory figures for the same metric, flag both values. Do not pick the one that fits the narrative. |
| Missing origin chain — not recording whether a source is primary or secondary | Every source note must include an origin chain field. If the source's originality status is unclear from the content, record "Origin unclear — could not determine from extracted content" rather than omitting the field. Downstream, an unclear origin means independence is UNKNOWN, not assumed — cross-ref and check-gaps will not count the source as independent corroboration until its origin is established. |
| Undefined recovery state after a mid-source interruption | The duplicate pre-check covers all four states: registry+note (user choice), registry+missing-note (re-process), note-without-registry (backfill the registry row from the note and update counters — do not re-fetch), and neither (proceed normally). A session dying between the note write and the registry write is expected, not exceptional — the backfill branch exists so the re-run neither duplicates work nor double-counts. |
| Delegating source processing to a spawned subagent (Agent tool) — individual or batch | `/know-research:process-source` runs in the main conversation, not a subagent. A spawned subagent has a cold context (no commonplace book, no prior source notes in memory, no in-session contradictions), races with the main agent over STATE.md and registry.md, can't be interrupted by the user mid-source, and — in batch mode — silently walks past the cross-reference checkpoint because the main agent isn't watching the counter. Process each source inline. If the candidate list is long and you are tempted to "parallelize" by spawning subagents, resist: the bottleneck isn't agent throughput, it's the cross-ref cadence and user visibility. |
| Wrapping batch processing in a TodoWrite/TaskCreate task list | The candidates file is the queue, STATE.md is the counter, registry.md is the ledger. A parallel todo list ("Process Source 39", "Run cross-ref at 5-source threshold", "Process Source 42"…) duplicates state into a place `/clear` destroys, drifts from the authoritative files, and — the real bug — converts the cross-reference checkpoint from a hard interrupt into a queue item a task-list-driven loop will simply tick past. Read the candidates file top-to-bottom and process sources inline. One status line per source is the correct cadence; a progress bar is not. |

## Output

**Register (read `${CLAUDE_PLUGIN_ROOT}/reference/posture-register.md` — this is rule 7 applied to this skill).** Report what the source *says* and how much weight it carries. **Open with the read, not with the work.** "I've processed the brief and written it up" spends the first sentence on the fact that a task completed, which the user already knows because they asked for it; the read is what they don't have. Seen across iterations 76-80, and it survives every silence rule because nothing in it names a mechanism — it is the *shape* of the opener, not a leaked step. **The pipeline is silent — the reader gets its result, never its reasoning about itself.** That covers every step below: no pre-check narration, no registry parse, no counter arithmetic ("Total count 4 → 5"), no threshold status, no write verification, and no announcing which branch you took or why ("this source was standalone, so the transition block renders below"). The batch-vs-standalone decision two paragraphs down is addressed to you, not to the user: they see a status line or a transition block, and the shape already tells them which. Treat that list as examples of the rule, not its boundary — a mechanism it does not happen to name is still silent. The counters below are the summary block's fields, not sentences to speak.

**Source:** [title]
**Credibility:** [tier]
**Key findings:** [N] findings tagged for Phase [N]
**Contradictions:** [N found / none]
**Sources since last cross-ref:** [N]/5

**A note may record `Figure records: None — this source carries no quotable numbers.` and that is not a check disposition.** It states a property of the source, exactly as `Contradictions: None` does, and durable artifacts are allowed to record what a reader would otherwise have to re-derive. The line that would be wrong is one naming the check: "figure validation not applicable" or "no quantitative checks needed" describes machinery. Two judges raised this independently and both scored it clean; settling it here so it stops being re-argued per run.

**When a field comes out empty, say what it means — never how you got there.** An empty
field looks like an error, and the pull is to explain it. Explain the *consequence*, which
the user needs, and not the *route*, which is machinery. "No findings speak to this
phase — the paper is a funding announcement, not trial data" is the read. "None tagged, since
CLAUDE.md has no Finding Tags section and no `research-type` field to fall back through to
a type template" is the fallback chain read aloud: it names steps the user has no use for
and cannot act on. If a degenerate result means the *project* is missing something the user
should fix, say that plainly as its own sentence — "this project has no tag set defined
yet, so findings aren't being tagged to phases" — which is a fact about their setup, not a
trace of which branch you took to discover it.

**A check that didn't apply is not a thing to mention.** The same pull produces the
mirror error on fields that aren't empty: justifying why some assessment *wasn't* relevant.
"Not a data source, so the usual sampling and methodology checks don't apply" reads as
diligence and is machinery — it tells the user a routine exists and was bypassed, which is
the pipeline describing itself. Assess the source on what it *is*: "High for the
administrative fact — it's the regulator speaking about its own authority" is complete.
Nothing is owed about the criteria that went unused, and "the usual" is a tell that you are
about to name one.

**Then: are you mid-batch, or was this a standalone source?** This decides whether you stop.

**Mid-batch** (the user approved a set of candidates and more remain unprocessed) — do NOT render a `▶ NEXT` block. The one-line status above IS the whole output for this source. Continue to the next candidate yourself: the batch was approved once, and a clean source completion is a status line, not a decision point (see the stop list in `${CLAUDE_PLUGIN_ROOT}/reference/workflow-ownership.md`). You already know the next source — it is the first candidate that is neither `[PROCESSED]` nor in `exclusions.md`, which `research/bin/where-am-i.py` will name if you need it. If this source pushed the counter to the checkpoint, cross-ref runs itself first (pre-check step 2) — you do not ask. Stop only for something on the stop list: an access failure, a material contradiction, a genuine fork, or the end of the approved batch.

**Standalone** (the user handed you this one source directly, not from an approved batch) — render the transition block:

───────────────────────────────────────────────────────────

**▶ NEXT:** `/know-research:process-source <next-url>` — Process another source, or move on.

**Also available:**
- `/know-research:cross-ref` — Cross-reference the sources so far.
- `/know-research:check-gaps` — Check coverage before processing more.

───────────────────────────────────────────────────────────

**End of an approved batch** (that was the last unprocessed candidate) — do not stop and ask what's next. Run `/know-research:check-gaps` yourself and present what it finds; a real gap is a fork (a stop), but running the check is not. The batch finishing is the trigger to assess coverage, which the user was always going to do next. Do **not** check the `Collect` box here: the batch finishing gathers sources, but whether that is *enough* is the gap check's call — it owns the `Collect` state (adequate → checks it and advances the cycle; gaps → keeps it open and routes back to discovery).
