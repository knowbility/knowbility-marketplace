---
name: research-start-phase
description: This skill should be used when the user asks to begin or move to the next research phase (e.g. "start the next research phase", "begin research phase 3", "move to the next phase of the research"). Briefs the next phase — surfaces its questions and relevant carryover from prior phases — updates the Phase Tier Record in STATE.md, and points the user at discovery. (Phase advancement itself is audit-claims' closeout write, not this skill's.)
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
---

# /know-research:start-phase

Prepare to begin the next research phase by gathering all relevant context.

## Current State

!`cat research/STATE.md 2>/dev/null || echo "No STATE.md found — run /know-research:init first."`

## Pre-check 0: Completion sentinel (before anything else)

If STATE.md's Current Position carries a completion sentinel (a `- Completion:` bullet —
`ALL PHASES COMPLETE — validated closeout …` or `CLOSED UNREVIEWED — administrative
archive …`), the claim is validated before any phase work is even considered. Run:

```
python3 research/bin/validate-corpus-review.py check-completion --root . --json
```

(A sentinel or `Review protocol:` line with no installed validator is protocol damage —
say so, name the repair as re-init, and do not start a phase.) Route on the exit code:

- **0 (valid):** the project is validly closed; there is no phase to start. Say so — the
  corpus is frozen and any change invalidates the completion — and point at
  `/know-research:progress` for the dashboard. Stop.
- **22 (stale-or-invalid-completion):** surface it prominently: STATE claims completion
  but the claim is stale or unbacked (show the validator's reasons). Do not start a
  phase on top of a broken completion — the user resolves it first via the documented
  manual repair: remove `research/reviews/completion.json`, revert the
  sentinel/closeout lines in STATE by hand, record why in `research/notes-to-self.md`;
  the project then reads as open and a fresh final review can run. Never edit sealed
  receipts or ledgers, and never perform the repair for them. Stop.
- **23 (closed-unreviewed):** the project is an administrative archive — not
  decision-ready and not active. **Do not start a phase, with or without confirmation**
  — the protocol defines no reopen transition, so a conversational yes cannot write
  into an archive the record still seals. Say so plainly: the archive stands; if the
  commissioner genuinely wants to resume research, that is a manual protocol repair
  (removing the archive record and sentinel by hand, documented as such — the next
  `check-completion` will then report the project as open), and it is theirs to
  perform, not this skill's. Stop.
- **21 (not-closed) or 10 (no-marker):** proceed normally (on 10, the project has no
  credibility gate — legacy).

If no sentinel is present, skip this pre-check.

## Pre-check: Source Material Reconciliation (mandatory)

Users sometimes drop files into `source-material/` mid-project. If an unprocessed drop is sitting there and you proceed to the next phase without integrating it, the phase framing will be wrong in the same way `/know-research:init` would have been wrong with an unread file at start.

1. **List `source-material/`** — enumerate every non-dotfile (ignore `.gitkeep`, `.DS_Store`, dotfiles).
2. **Read `research/source-material-digest.md`** if it exists. Extract the filename list from the "Files Read" table.
3. **Diff the two lists.** Before flagging any file as "new," cross-check it against the existing evidence base: search `research/sources/registry.md` for the filename and scan `research/notes/` for a source note whose URL/path field matches the file. If the file was already processed as a source in a prior phase (it has a registry row and a complete note), it is not actually new — the digest just wasn't updated when it was processed. In that case, silently add the file to the digest's "Files Read" table with read status "processed in Phase [N] — see research/notes/<note-filename>.md", do NOT prompt the user, and remove it from the "new files" list before continuing. Only files that are genuinely unprocessed (no registry entry, no note) reach the user prompt below.
   - **New files present in `source-material/` but not in the digest:** stop the phase briefing. Tell the user, in your own words, that new files arrived after init and must be integrated before Phase [N] starts (name them), and present the three options with their real consequences: **(a)** run `/know-research:process-source` on each — they become citable source notes and the digest updates; **(b)** read them now and extend the digest only — each file read in full, its named entities, dates, credentials, stated facts, and assumptions appended to the digest's sections with a "full" read-status row, contradictions with existing digest entries flagged explicitly rather than silently overwritten, and the files remain raw source material, NOT citable in drafts until processed later; **(c)** mark them out of scope with a reason. The (b) consequences — not-citable, contradictions-flagged — must reach the user before they choose, not after. Do not present the phase briefing until the user chooses and the chosen action completes. For **option (c)**, the user must provide a concrete one-line reason in the format `Out of scope because <reason>`. The reason is recorded verbatim in the "Out of Scope" section of `research/source-material-digest.md` alongside the filename and date. If the user's reason is empty, vague ("not needed", "don't care"), or refers only to user state rather than the file ("I don't want to deal with it"), re-ask concretely — name the kinds of reason that qualify (wrong language, duplicate, superseded, outside the research subject's scope, irrelevant to any phase) and say the reason is recorded verbatim. Do not accept the out-of-scope mark until the reason is concrete enough to explain the decision to a future reader who wasn't in this conversation. After integration, re-invoke the research-integrity agent against the updated plan and digest to confirm the new facts are reflected.
   - **Files in the digest but missing from `source-material/`:** warn but do not block. "The digest references [filename] but it is no longer in source-material/. The user may have moved or deleted it — flag if the plan still depends on it."
   - **Lists match exactly:** proceed to the Process section.
4. **If `research/source-material-digest.md` does not exist** but `source-material/` contains non-dotfiles: this is a project initialized before the digest convention existed, or init failed silently. Tell the user: "source-material/ contains files but there is no digest. I will read every file now and generate research/source-material-digest.md, then verify the existing plan against it using research-integrity. Proceed?" Wait for confirmation, then perform the same Step 2b/2c logic from `/know-research:init` (full read, structured digest), then run the integrity check against the existing plan.
5. **If `source-material/` is empty AND no digest exists:** this is the common case for projects that rely entirely on discovery. Skip this pre-check entirely and proceed to the Process section.

## Process

1. **Read `research/STATE.md`** to determine the current active phase.
2. **Read `research/research-plan.md`** to get the details for the next phase — its name, what needs to be validated/explored/analyzed, and the specific questions.
3. **Read `research/gaps.md`** to check if any gaps from previous phases are relevant to this phase.
4. **Read `research/cross-reference.md`** to identify any patterns from earlier phases that inform this one.
5. **Check for skipped or folded phases** in STATE.md. If any exist, report them to the user with context.
5a. **Read `research/assumptions.md`** (if it exists) and identify any `Open` assumptions whose "What would validate" or "What would challenge" criteria overlap with this phase's questions. An assumption is relevant if:
    - Its topic directly relates to a question this phase will investigate
    - This phase's source collection could plausibly produce evidence that validates or challenges it
    - It was logged in a prior phase (not the current one)

    **Say how long each has been open, in phases.** An assumption logged last week and one that has
    been `Open` across four phase starts are different facts, and the count is the only thing that
    distinguishes them — the entry's `Added` date and `Phase` field give it to you. "Open since phase
    1, so this is the fourth phase that could have tested it" is a fact about the project the
    commissioner is entitled to; "there is an open assumption about warranty thresholds" is the same
    sentence they have now read four times and can safely ignore. **Repetition without a count reads
    as noise, and noise is how a standing item becomes invisible** — which is the failure this step
    exists to prevent, not one it is allowed to cause.

    This step opens the loop. `Status` closes it (see `research-summarize-section` step 8a's four
    values) — surfacing a criterion is not the same as recording that it was run, and until v1.14.x
    only the first half existed.
5b. **Read `research/gaps.md`** (if it exists) and extract the Coverage Dashboard for the current phase. If gaps.md has been generated for any prior phases, show a coverage snapshot so the user can see existing coverage status and lopsided flags before deciding what to collect.
5c. **Read `research/commonplace.md`** (if it exists) and scan it for entries from prior phases whose subject or observation overlaps with this phase's questions. **Working Read entries** (hook: "Working Read at [step] boundary") from the current or immediately prior phase are always relevant — silently re-adopt their hypotheses and half-formed reads as the current working stance rather than merely listing them; the point of those entries is that the return feels like continuity, not a cold start. Surface up to 3 most relevant entries as part of the briefing. Entries are indexed by date and phase in the H2 headers — use those plus the body text to judge relevance. An entry is relevant if its subject matches a question in the current phase, if it flagged a cross-cutting issue that affects the current phase, or if the user explicitly asked to remember something that connects to current work. If the file is empty or no entries are relevant, surface nothing — do not mention the commonplace book at all.
5d. **Read `research/reference/backstage-tasks.md`** (if it exists) and work through any unchecked items relevant to this phase — silently. These are the agent's own prep queue (a figure to re-verify, a suspected shared-origin cluster to trace, a source type to prioritize), written at prior phase closes. Fold their outcomes into the briefing where they matter (e.g., a re-verified figure shows up as a prior finding with its check noted; a source-type priority shapes the discovery recommendation) and check items off in the file with a one-line outcome. Do not narrate the queue to the user or announce that you are "processing backstage tasks" — the user sees the results, not the machinery. Items that need the user's decision are surfaced as part of the briefing content on their own merits.

6. **Determine if this is a synthesis phase** — check whether the current phase has discovery channels mapped:
   - Read `research/discovery/strategy.md` if it exists. Look up the current phase name. If the phase is listed with channels, it is a discovery phase. If the phase is absent, listed as "no discovery," or has an empty channel list, it is a synthesis phase.
   - If `strategy.md` does not exist, fall back to reading the type-channel map at `${CLAUDE_PLUGIN_ROOT}/reference/discovery/type-channel-maps/{research-type}.md` (get the research type from `CLAUDE.md`). Check whether any Discovery Group's phase keywords match the current phase name. No match = synthesis phase.
   - Store the result (discovery vs. synthesis) for use in the transition prompt.

7. **Record the discovery tier for this phase in STATE.md.** Read `research/reference/retrieval-log.json`. Filter entries to those whose `phase` field matches the current active phase. From those entries, compute the **highest tier number that actually returned results** (`tier` values 1, 2, or 3 — see `/know-research:discover` Step 2.i for the field definition). The highest tier is the one to record: a phase that ran Tier 1 successfully is "Tier 1," a phase whose Tier 1 failed and Tier 3 returned results is "Tier 3."

   - **If no retrieval-log entries match this phase yet:** record `no tier recorded — discovery hasn't run yet for this phase.`
   - **If retrieval-log.json doesn't exist or fails to parse:** skip this step. Do not block the briefing on a missing log.

   Update `research/STATE.md` by ensuring a `## Phase Tier Record` section exists and contains a row for the current phase. If the section is absent, append it after the `## Sources Processed` block. If a row for this phase already exists (e.g., phase was re-briefed mid-cycle), overwrite it. Row format:

   ```
   ## Phase Tier Record

   | Phase | Discovery tier | Recorded at |
   |---|---|---|
   | 1 | Tier 1 (Tavily primary) | 2026-06-08T14:23:01Z |
   | 2 | Tier 3 (WebSearch fallback — CLIs unavailable) | 2026-06-09T09:11:00Z |
   ```

   Use the phase number and name from STATE.md's Active phase. Format the tier label as `Tier <N> (<short reason>)` — examples: `Tier 1 (Tavily primary)`, `Tier 2 (Firecrawl fallback)`, `Tier 3 (WebSearch fallback — CLIs unavailable)`, `no tier recorded — discovery hasn't run yet for this phase`. Use the current UTC timestamp as `Recorded at`. The table provides per-phase visibility into discovery quality across the project's lifetime.

   This is one of this skill's two writes (the other is backstage-tasks check-offs, step 5d); the rest of the briefing is read-only.

## Output

Present a briefing for the phase:

### Phase [N]: [Name]

**Questions to answer:**
- [List each question from the research plan for this phase]

**Relevant prior findings:**
- [Any findings from completed phases that connect to this phase's questions]
- [Any cross-reference patterns that are relevant]

**Gaps carried forward:**
- [Any unresolved gaps from previous phases that overlap with this phase]

**Coverage snapshot** (from last gap check):
- Total questions: N | Direct coverage: N | Lopsided: N | Adjacent-only: N
- [If lopsided flags exist] Questions with only 1 independent source: [list question text]
- [If adjacent-only matches exist] Questions with only adjacent matches (not counted as covered): [list question text]
- [If gaps.md does not exist] No gap check has been run yet. Run `/know-research:check-gaps` after processing sources.

**Open assumptions to revisit:**
- [Assumption description] (from Phase [N]): [basis]. Look for evidence that [what would validate/challenge].
- [If none] No open assumptions from prior phases relate to this phase's questions.

**Relevant commonplace entries:**
- [Date] — Phase [N] — [one-line hook from the H2 header]: [1-2 line summary of why it matters for this phase]
- [Only include this section if there are actually relevant entries. If commonplace.md is empty, does not exist, or has no entries relevant to this phase's questions, omit the section entirely — do not print a placeholder.]

**Skipped/Folded phases:** [List any, or "None"]

Then render the appropriate transition prompt based on whether this is a discovery or synthesis phase (determined in step 6):

**If this is a discovery phase** (channels are mapped):

───────────────────────────────────────────────────────────

**▶ NEXT:** `/know-research:discover` — Find candidate sources for Phase [N]'s questions using the type-channel map.

**Also available:**
- `/know-research:process-source <url-or-file>` — Skip discovery and process a specific source you already have.
- `/know-research:progress` — See where you are in the overall project before deciding.

**What to expect:** Discovery will surface a prioritized candidate list for this phase's channels. After you approve, processing runs sequentially with a mandatory cross-reference checkpoint every 5-8 sources.

───────────────────────────────────────────────────────────

**If this is a synthesis phase** (no discovery channels mapped):

───────────────────────────────────────────────────────────

**▶ NEXT:** `/know-research:summarize-section` — This is a synthesis phase. No new source collection is needed — draft outputs from existing Phase 1–[N-1] findings.

**Also available:**
- `/know-research:check-gaps` — Verify coverage is adequate before drafting.
- `/know-research:cross-ref` — Refresh cross-reference patterns before synthesis.
- `/know-research:progress` — See where you are in the overall project before deciding.

**What to expect:** Collect, Connect, and Assess are no-ops for synthesis phases (mark them complete when ready). The core work is Synthesize and Verify.

───────────────────────────────────────────────────────────

## Guardrails

1. Do not present a phase briefing if the previous phase's cycle is incomplete. Check STATE.md first — all five steps must be checked.
2. If STATE.md records skipped or folded phases, surface them explicitly before presenting the next phase's briefing.
3. Do not pre-collect sources or begin research as part of the briefing. This skill prepares context; source collection is a separate step.
4. Carry forward only documented gaps and cross-reference patterns — do not carry forward interpretations or conclusions from conversation history.
5. Do not silently skip `assumptions.md`. If the file exists and has Open entries, evaluate each against this phase's questions. Missing a relevant assumption means the user won't know to look for validating or challenging evidence.
6. If gaps.md exists, always show the coverage snapshot. Do not skip it even if coverage looks adequate — lopsided flags and adjacent-only matches are not obvious from source counts alone.
7. Do not silently skip `commonplace.md`. If the file exists and has entries from prior phases, scan them for relevance to the current phase. Missing a relevant entry means losing context the agent captured specifically so it would survive to this moment. If no entries are relevant, omit the section from the briefing — do not announce "no entries."

## Common Failure Modes

| Failure Mode | Prevention |
|---|---|
| Starting a phase before the previous one is complete | Read STATE.md's cycle checklist. If any step is unchecked, tell the user what remains before presenting the next phase. |
| Presenting stale prior findings from conversation memory instead of files | Read cross-reference.md and gaps.md fresh. Do not rely on what was discussed earlier in the session. |
| Overwhelming the briefing with prior-phase detail that obscures the current phase's questions | Keep prior findings to bullet points directly relevant to the new phase's questions. The full prior output is in research/outputs/ if needed. |
| Missing carried-forward gaps that affect the new phase | Always check gaps.md for unresolved items from prior phases. An unresolved gap about market size from Phase 2 matters if Phase 5 asks about revenue projections. |
| Ignoring prior assumptions that this phase could resolve | Always read `assumptions.md` if it exists. For each Open assumption, check whether this phase's questions could produce evidence that validates or challenges it. An assumption about market size from Phase 2 is relevant if Phase 5 asks about revenue projections. |
| Ignoring prior commonplace entries at phase start | Always read `commonplace.md` if it exists. Prior observations may flag cross-cutting issues, strategic context, or user-requested reminders that apply to this phase. The file exists specifically so these survive context clears — using it is the whole point. Surface up to 3 relevant entries; omit the section entirely if none apply. |
| Skipping coverage snapshot when gaps.md exists | Always read and display gaps.md coverage data if the file exists. Lopsided coverage and adjacent-only matches are invisible without it — the user needs this to decide what sources to pursue. |
| Skipping source-material reconciliation and starting a phase with an unprocessed user drop | Always diff `source-material/` against `source-material-digest.md` before presenting the phase briefing. A new file is a blocker, not a warning — the phase framing depends on its contents being integrated first. |

This skill performs **two writes**: a single `## Phase Tier Record` row in `research/STATE.md` (see Process step 7), and check-offs with one-line outcomes in `research/reference/backstage-tasks.md` for prep items worked through at phase start (see Process step 5d). Everything else is read-only.
