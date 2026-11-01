---
name: know-qa:report
description: Generate a cross-session QA report from persisted reports and history, including trend analysis, systemic-theme synthesis, and filing findings into the project's tracker via the learned per-project procedure
argument-hint: "--project <path> --format <format> --since <date-or-duration> --file"
# allowed-tools intentionally unset: when `.know-qa/reporting.json` declares a sink, this
# skill posts the roll-up through the user's wired MCP (e.g. Slack), whose tool name
# can't be enumerated in advance. It inherits the session's tools. With no reporting.json
# (the default) no MCP call is ever made. See reference/reporting-sinks.md.
---

# /know-qa:report

Generate a QA report that reads from persisted files on disk — works without any prior conversation context. Answers three questions: "what just happened?" (latest run), "is this a pattern?" (trend analysis + systemic themes), and "where do these land?" (filing via the learned per-project procedure).

## Arguments

| Argument | Required | Default | Description |
|----------|----------|---------|-------------|
| `--project <path>` | Yes | — | Path to project containing `.know-qa/` directory |
| `--format <format>` | No | `markdown` | Output format: `markdown` or `json` |
| `--since <date-or-duration>` | No | last 5 runs or 7 days | Historical window for trend analysis. Examples: `--since 2026-03-01` or `--since 7d` or `--since 14d` |
| `--area <key>` | No | — | Scope the report to one area — filter latest-run findings and registry entries by their stamped `area` (needs `.know-qa/areas.json`) |
| `--owner <handle>` | No | — | Scope the report to one owner — filter to findings stamped with an area that handle owns |
| `--file` | No | off | File gated findings into the project's tracker via the learned procedure (any tracker — asks, never assumes) |
| `--create-issues` | No | off | Alias for `--file` that pre-selects the GitHub/`gh` path (backward compatible) |

## Usage

```
/know-qa:report --project ~/Projects/my-app
/know-qa:report --project ~/Projects/my-app --format json
/know-qa:report --project ~/Projects/my-app --since 14d
/know-qa:report --project ~/Projects/my-app --file
/know-qa:report --project ~/Projects/my-app --create-issues
```

## Purpose

Reads from `.know-qa/reports/`, `.know-qa/HISTORY.md`, and `.know-qa/FINDINGS.md` to generate an authoritative report across sessions. This skill does not rely on conversation context — all data comes from files on disk.

Use this skill to:
- See what the latest test run found
- Identify patterns and recurring failures across multiple runs
- Synthesize findings into systemic themes pointing at shared fixes
- File findings into the project's tracker, deduped against the registry
- Review regressions and improvement trends

## Execution Flow

### Step 0: Compile and normalize structured data

If the newest `.know-qa/runs/*/run-manifest.json` does not yet have a sibling
`run-summary.json`, compile it:

```bash
node "{project}/.know-qa/engine/compile.mjs" --manifest "{manifest-path}"
```

For sink delivery or filing, generate the corresponding normalized payload:

```bash
node "{project}/.know-qa/engine/payload.mjs" --manifest "{manifest-path}" --type sink
node "{project}/.know-qa/engine/payload.mjs" --manifest "{manifest-path}" --type filing
```

Use `run-summary.json`, `findings-registry.json`, and these payloads as the
machine authority. Markdown remains the human-readable projection. If legacy
`FINDINGS.md` entries exist without a structured registry, stop and require an
explicit migration; never overwrite or guess at them.

### Step 1: Parse Arguments

Extract from user input:
- **project**: Path to project with `.know-qa/` directory
- **format**: `markdown` (default) or `json`
- **since**: Historical window (default: last 5 runs or 7 days, whichever is less)
- **area** / **owner**: Optional scope (needs `.know-qa/areas.json`). `--owner <handle>` expands to that handle's area keys. When set, filter the latest-run findings and the registry entries this report considers to those stamped with a matching `area`, and note the scope in the report header. Absent → whole-project report, unchanged.
- **create-issues**: Whether to create GitHub issues (default: false)

Parse the `--since` value:
- If it's a date (e.g., `2026-03-01`), use it as a cutoff date
- If it's a duration (e.g., `7d`, `14d`), calculate the cutoff date by subtracting from today
- If not provided, use last 5 runs or 7 days (whichever covers fewer runs)

### Step 2: Read Latest Report from Disk

This is the PRIMARY data source. Do NOT rely on conversation context.

```bash
ls -1 {project}/.know-qa/reports/ 2>/dev/null | sort | tail -20
```

Sort report filenames to find the most recent (filenames contain ISO timestamps, so lexicographic sort gives chronological order).

Read the most recent report file:

```bash
cat {project}/.know-qa/reports/{most-recent-file}
```

Evidence boundary: `.know-qa/runs/` is restricted raw harness evidence, not an input
surface for this skill. If a finding references a paired-harness run, use its
text-sanitized `report.md` / `summary.json`. Never attach `*.raw.*` files or
screenshots to this report, a sink, or a filing payload unless a human has
explicitly reviewed and cropped/redacted that exact artifact.

**If no reports exist:**

```
No QA reports found in {project}/.know-qa/reports/

Run tests first to generate reports:
  /know-qa:run --project {project} --url <your-url>
  /know-qa:monitor --project {project} --url <your-url>

Then run /know-qa:report to see results.
```

Stop here. Do not proceed without a report file.

**Fallback:** If `.know-qa/reports/` is empty AND a test was run in this session (results are in conversation context), use conversation context as a fallback. This fallback is exceptional — file-based reading is the expected path.

### Step 3: Present Latest Run Results

Parse the most recent report and present the "what just happened?" section.

Extract from the report file:
- Run timestamp (from filename or frontmatter `run-at`)
- Overall result (Pass / Fail / Pass with Concerns)
- Scenario results (passed, failed, regressions)
- All findings grouped by confidence level

Present in this order:
1. Executive summary (counts, overall result)
2. Definite Issues (High confidence) — need immediate attention
3. Likely Issues (Medium confidence) — need investigation
4. Possible Issues (Low confidence) — worth noting

This section should be immediately useful without scrolling. The user gets the answer to "what just happened?" before any trend context.

### Step 4: Trend Analysis from HISTORY.md

Read the history file:

```bash
cat {project}/.know-qa/HISTORY.md 2>/dev/null
```

**If HISTORY.md does not exist or has fewer than 2 run entries:**

```
Not enough history for trend analysis. Run more tests to build trend data.
(Need at least 2 runs in .know-qa/HISTORY.md)
```

Skip trend analysis and continue to Step 6.

**If history exists with 2+ entries:**

Parse run entries within the `--since` window. Each entry has the format:

```
## Run: {ISO-timestamp}
- **URL**: {url}
- **Tag**: {tag}
- **Results**: {passed} passed, {failed} failed, {concerns} concerns
- **Regressions**: {none | N regressions: scenario-name-1, scenario-name-2}
- **Duration**: {duration}
```

From the history entries in the window, extract:
- Total runs in window
- Per-run pass/fail/concern counts
- Regression events (which scenarios, on which dates)
- Scenarios that appear in failures across multiple runs

#### Compute trend metrics:

**Stability score:** What percentage of scenarios passed consistently across all runs in the window?

```
stability = (scenarios that passed in ALL runs in window) / (total unique scenarios seen) × 100%
```

**Recurring failures:** Scenarios that failed in 2 or more runs in the window. List with:
- Scenario name
- Failure count out of total runs in window
- Dates when failure occurred

**Critical recurring failures:** Scenarios that failed in 3 or more runs in the window. These are flagged with elevated prominence:

```
RECURRING: {scenario name} — failed {N} of last {M} runs (first seen: {date})
```

**Regression timeline:** When did previously-passing scenarios start failing? List regressions with the date they first appeared in the window.

**Improvement trends:** Scenarios that appeared in failures in older runs but passed in the most recent runs. These are positive signals.

### Step 4b: Systemic-Theme Synthesis

The most valuable output of a sweep is usually not any single ticket — it's the observation that most findings trace to one subsystem, pointing at one shared fix instead of many separate ones.

Cluster the findings — the latest run's issues plus any active entries in `{project}/.know-qa/FINDINGS.md` (the filed-findings registry; entry shape per the plugin's `reference/finding-lifecycle.md`) — by shared root-cause hypothesis or affected component. Mechanism is the grouping key, not symptom wording: a 404 avatar on one page and a broken profile photo on another belong to one theme if they share a stale-path cause.

Rules:

- A theme needs **at least two member findings** and a plausible shared mechanism. Don't force singletons into themes — an empty themes section is an honest result.
- Name each theme by the suspected subsystem, list its member findings (registry ids and/or ticket links where they exist), and state the one shared fix it points at.
- Themes are reported **alongside** the individual findings list, never instead of it.

This is cross-finding synthesis — distinct from the trend analysis above (which tracks scenarios across runs) and from the during-a-run failure escalation.

### Step 4c: Area Roll-up (when `.know-qa/areas.json` exists)

Skip this step entirely when there's no area registry — the report is unchanged. When `areas.json` exists, group the **open** `{project}/.know-qa/FINDINGS.md` entries by their stamped `area` and produce a per-area row: area display name, owner, count of open findings, and **last checked** (the most recent `.know-qa/reports/` file whose `area`/`owner` frontmatter — or whose scenarios — touch that area; fall back to the latest run that covered it). This is the answer to "your areas, last checked, open findings."

Findings with no `area` stamp roll up under an "Unassigned" row — don't drop them. Areas in the registry with zero open findings are still listed (with `0 open`) so an owner sees their slice is clean, not missing. When `--area`/`--owner` scoped the report, show only the matching rows.

### Step 5: Filing (if --file or --create-issues)

Only execute this step when `--file` (or its GitHub-presetting alias `--create-issues`) is present. The full procedure — ask → learn the shape → replicate → confirm → cache stable / re-derive volatile — is the plugin's `reference/filing-procedure.md`; read it before filing. `examples/jira-ticket-guide-example.md` is a worked instance of that procedure: copy the method, not its field values. It carries two projects on one Jira site with opposite routing rules (active sprint vs. backlog) precisely so neither reads as the default.

#### 5a. Gate

Collect candidates from the generated `payloads/filing.json`. It contains only
non-duplicate defects with high/medium confidence. Nothing else files —
`needs_design_judgment` items stay surfaced for decision. If empty, say so and
skip to Step 6.

#### 5b. Dedup against the registry

For each candidate, check `{project}/.know-qa/FINDINGS.md` by root cause. A match is a `known_issue`: report it as "skipped — matches {F-id}{ / ticket-link}", update the existing entry's `last_seen` (and attach new blast radius to the entry and its ticket if one exists). Only unmatched candidates proceed.

#### 5c. Resolve the destination

- **Contract cached** (`.know-qa/filing-contract.md` exists): load it, then **re-derive the volatile values** through the connector before filing anything (the active sprint/milestone/iteration — the contract records how). Never trust a cached volatile value. A contract that records *no* sprint/iteration because the destination is a backlog by design has nothing to re-derive; leave it empty rather than filling it in.
- **No contract**: run the learn-the-shape procedure — detect what's wired (tracker MCPs, `gh` auth), ask the human which tracker and destination, fetch one representative recent ticket **from that destination**, and infer the house shape (routing fields, grouping, triage fields, summary/description style, custom-field IDs). Take the destination you're given, including "the backlog": some teams gate on the active board, others file to the backlog on purpose and treat sprint promotion as a human planning commitment. With `--create-issues`, the GitHub/`gh` path is pre-selected; still confirm the repo and learn its issue conventions from a recent issue.

#### 5d. Confirm the first ticket

File **exactly one** ticket in the learned shape and present the link: "did this land where you want findings to land, shaped right?" On "no", adjust from the correction and re-file once; if still wrong, stop and work it out — don't iterate tickets into the tracker. Do not batch-file before the yes. On the GitHub path, `gh issue list --search` remains a secondary duplicate guard before each create.

#### 5e. Batch-file with hygiene

File the remaining candidates in the confirmed shape. For each:
- Run the evidence-redaction pass from `reference/safety.md` over anything attached (no tokens/cookies/headers; mask personal data not needed to demonstrate the finding).
- **Suggested assignee (when the finding carries an `owner`):** propose `owners[<owner>].notify` (from `.know-qa/areas.json`) as the assignee/notify on the ticket. This is a *suggestion layered on the learned destination*, never an override of it — if the tracker has no clean assignee mapping, surface the handle in the description instead. Never auto-notify a person; surface, don't ping.
- Update the registry entry: `status: filed`, `ticket_link`.
- When `.know-qa/QA-SESSION-STATE.md` is live, add it to the "filed this session — do not re-file" list.
- Cross-link same-theme tickets in the tracker where supported.

If the contract was newly learned, write it to `.know-qa/filing-contract.md` with each value marked stable or volatile (and how to re-derive the volatile ones).

**Escalations (when `areas.json` carries an `escalation` matrix):** for each filed/gated finding, check its `(area, severity)` against the matrix (with `area: "*"` as a wildcard). Findings matching an `escalate` row go into a dedicated **"Escalations"** block in the report, each with its owner's notify handle surfaced for a human to act on. `log` rows (and everything when no matrix exists) are filed/reported normally with no escalation. Escalation only *flags* — it never sends anything itself.

#### 5f. Degrade path (no connector)

No tracker MCP and no authenticated `gh`: state it plainly once — "filing requires a connected tracker; none is wired" — and emit a **"Would have filed"** section carrying each gated candidate in full contract shape, ready to file when a connector lands. Never fail the report over a missing tracker; never silently skip filing.

**Report the outcome:**

```
Filed: {N}
  - {ticket-id/url}: {title}

Skipped (registry matches): {N}
  - "{symptom}" — matches {F-id} ({ticket-link})

{Or the "Would have filed" section on the degrade path}
```

### Step 6: Compile and Output Report

#### Markdown format (default)

```markdown
# QA Report

**Generated:** {timestamp}
**Project:** {project path}
**Data source:** .know-qa/reports/{latest report filename}

---

## Latest Run

**Run:** {ISO-timestamp}
**Result:** {Pass | Fail | Pass with Concerns}
**URL tested:** {url from report}

### Executive Summary

| Metric | Count |
|--------|-------|
| Scenarios Run | {N} |
| Passed | {N} |
| Failed | {N} |
| Pass with Concerns | {N} |

**Definite Issues (High confidence):** {N}
**Likely Issues (Medium confidence):** {N}
**Possible Issues (Low confidence):** {N}

### Definite Issues (High Confidence)

{For each high-confidence issue:}

#### {Issue title}

- **Confidence:** High — {rationale}
- **Severity:** {Critical | Major | Minor}
- **Spec/Scenario:** {spec name} > {scenario name}
- **Description:** {what happened}
- **Evidence:** {sanitized console errors and network failures; only human-reviewed/cropped screenshots}
- **Suggested next steps:** {what to fix}

---

### Likely Issues (Medium Confidence)

{For each medium-confidence issue — same structure}

---

### Possible Issues (Low Confidence)

{For each low-confidence issue — same structure}

---

### Passed Scenarios

{List of scenarios that passed}

---

## Trend Analysis (last {N} runs / {N} days)

**Stability score:** {X}% of scenarios passed consistently across all {N} runs in window

### Recurring Failures

{If any scenario failed in 3+ runs:}

> **RECURRING: {scenario name}** — failed {N} of last {M} runs (first seen: {date})
> {brief failure description}

{If any scenario failed in 2 runs:}

**{scenario name}** — failed {N} of last {M} runs ({dates})

{If no recurring failures:}
No recurring failures in this window.

### Regression Timeline

{For each regression in window:}
- **{date}:** {scenario name} started failing (was previously passing)

{If no regressions:}
No new regressions detected in this window.

### Improvements

{For each scenario that was failing but now passes:}
- **{scenario name}** — was failing in older runs, now passing

{If none:}
No improvement trends detected.

---

## Systemic Themes

{For each cluster of 2+ findings sharing a root-cause hypothesis or component:}

### {Suspected subsystem / shared mechanism}

- **Members:** {finding ids / ticket links / issue titles} ({N} of {total} findings)
- **Shared mechanism:** {the root-cause hypothesis these findings have in common}
- **One fix likely clears:** {what a single fix here would resolve}

{If no clusters:}
No systemic themes — the findings appear independent.

---

{If .know-qa/areas.json exists — otherwise omit this whole section:}
## Area Roll-up

| Area | Owner | Open findings | Last checked |
|------|-------|---------------|--------------|
| {area display} | @{owner} | {N} | {date or "never"} |
| Unassigned | — | {N} | — |

{If an escalation matrix flagged any finding — otherwise omit:}
## Escalations

{For each escalated finding:}
- **{severity} · {area}** — {symptom} → notify @{owner handle} ({finding id / ticket link})

---

## Recommendations

### Immediate (from latest run)

{High confidence issues → fix now}
{Medium confidence issues → investigate}

### Recurring Issues (escalated)

{Issues that appear in 3+ runs → prioritize}

### Systemic Fixes

{If themes exist: lead with the shared fix each theme points at — one subsystem fix beats N individual tickets}

### Coverage Gaps

{What wasn't tested, inferred from spec/scenario names in history}

---

## Accessibility coverage

{Only when an accessibility tier ran. Omit the section entirely otherwise — an empty
coverage table reads like a clean one.}

**The number people misread is "0 violations".** Report the four grades separately and never
merge them:

| Grade | Where it comes from | What it means |
|---|---|---|
| **Failed** | an axe rule returned a violation | a defect, with the node and the criterion |
| **Needs review** | axe returned `incomplete` | a rule ran and could not decide; a person judges it |
| **Checked by rule** | a rule ran and found nothing | the automated check is satisfied — **not** that the criterion is met, since a rule tests part of a criterion |
| **Looked at by a person or a heuristic** | the baseline tier (keyboard reachability, visible focus, alt text, form labels), `contrast.mjs` (1.4.3 computed from resolved colors), the ARIA-widget keyboard checks | somebody or something examined it outside axe; carries the method, not a rule id |
| **Untested** | nothing above touched it | nobody looked. Not a pass. |

Take the first three plus the untested list from `axe.md`'s coverage section, which computes
them from the pinned axe-core's own rule metadata. **The fourth is yours to merge:** axe.mjs
reports only what axe did, and deliberately does not claim credit for the other tiers. Move a
criterion out of untested only when a tool or a person in this run actually examined it, and say
which.

```
**WCAG 2.2 Level A/AA — {C} of 55 criteria examined in this run**

Failed: {n} — {list with criterion numbers}
Needs review: {n} — {list}
Checked by rule: {n} — {list}
Looked at by a person or a heuristic: {n} — {list, each with the method}
Untested: {n} — {list}

{When a disabled rule would reach an untested criterion, say so and name it.}

Coverage, not conformance. A criterion nothing touched was not looked at. Automated passes
cannot establish conformance and do not substitute for assistive-technology or keyboard-only
testing by a person.
```

**Trend it the way failures are trended, and the right direction is up.** A run whose untested
count fell because somebody added a manual check is progress; a run whose failures fell because
a tier stopped running is a regression that looks like an improvement. If the untested count
moved, say which of the two happened.

---

## Filed

{If --file / --create-issues was used:}

**Filed:** {N} tickets
{List with ids/URLs}

**Skipped (registry matches):** {N}
{List with F-ids and existing ticket links}

{On the degrade path — no connector:}
### Would have filed
{Each gated finding in full contract shape}

{If filing was not requested:}
Run with `--file` to file gated findings into the project's tracker (any tracker — the skill asks, learns the house shape, and confirms the first ticket before batch-filing).
```

#### JSON format

```json
{
  "generated_at": "{ISO-timestamp}",
  "project": "{project path}",
  "data_source": ".know-qa/reports/{filename}",
  "latest_run": {
    "run_at": "{ISO-timestamp}",
    "url": "{url}",
    "result": "Pass | Fail | Pass with Concerns",
    "summary": {
      "total_scenarios": 0,
      "passed": 0,
      "failed": 0,
      "concerns": 0
    },
    "issues": [
      {
        "confidence": "high | medium | low",
        "confidence_rationale": "{rationale}",
        "severity": "Critical | Major | Minor",
        "description": "{description}",
        "spec": "{spec} > {scenario}",
        "evidence": "{evidence}"
      }
    ]
  },
  "trends": {
    "window": "{N} runs / {N} days",
    "stability_score": 0.0,
    "total_runs_in_window": 0,
    "recurring_failures": [
      {
        "scenario": "{name}",
        "failure_count": 0,
        "total_runs": 0,
        "first_seen": "{date}",
        "severity": "recurring | critical-recurring"
      }
    ],
    "regression_timeline": [
      {
        "scenario": "{name}",
        "first_failed": "{date}",
        "previously_passing": true
      }
    ],
    "improvements": [
      {
        "scenario": "{name}",
        "was_failing": true,
        "now_passing": true
      }
    ]
  },
  "recommendations": {
    "immediate": ["{recommendation}"],
    "recurring": ["{escalated recommendation}"],
    "coverage_gaps": ["{gap}"]
  },
  "issues_created": [
    {
      "title": "{title}",
      "number": 0,
      "url": "{url}",
      "status": "created | skipped-duplicate"
    }
  ]
}
```

### Step 7: Post to Configured Sinks

Run this after Step 6 so the posted roll-up mirrors the report just compiled (including any filing results from Step 5). Follow the delivery procedure in `${CLAUDE_PLUGIN_ROOT}/reference/reporting-sinks.md` — read it before posting. In brief:

1. **Detect.** `cat {project}/.know-qa/reporting.json 2>/dev/null`. **Absent or empty `sinks` → do nothing.** This is the whole degrade path; report behaves exactly as before.
2. **Build** from `payloads/sink.json`; apply each sink's `scope` and `include`.
3. **Per sink, gate on `post_when`** against the run result; skip silently if it doesn't fire.
4. **Resolve the MCP for `type`.** If the matching MCP isn't wired this session, print one line — "reporting sink '{target}' configured but no {type} MCP is wired; wrote the report file only" — and continue. Never fail the report over a missing sink.
5. **Apply `identity`** (native sender override, else header fallback) and **threading** (look up/create the `thread_ref` in `{project}/.know-qa/.reporting-state.json`), then send via the wired MCP's message tool.
6. **Record** the returned `thread_ref` for threaded sinks; report posted/skipped per sink in the terminal output.

## Report Structure Design

The report is structured to answer two questions in order:

1. **"What just happened?"** — Latest Run section comes first. This is always immediately useful, regardless of how much history exists.

2. **"Is this a pattern?"** — Trend Analysis section follows. This adds longitudinal context once the immediate picture is clear.

Recommendations are last because they synthesize both views.

## Cross-Session Capability

This skill reads entirely from disk. It does not need prior conversation context. You can run `/know-qa:report` in a brand new session and get a complete picture of what was tested and what was found — as long as `.know-qa/reports/` has report files.

This means:
- Reports accumulate value across sessions
- Different engineers can run `/know-qa:report` and see the same data
- CI/CD pipelines can call this skill to generate reports without session state

## Files Read

| File | Purpose |
|------|---------|
| `.know-qa/reports/{most-recent}.md` | Latest run results — primary data source |
| `.know-qa/HISTORY.md` | Run log across all sessions — used for trend analysis |
| `.know-qa/FINDINGS.md` | Filed-findings registry — dedup, systemic themes, and the area roll-up |
| `.know-qa/areas.json` | Optional area registry — area/owner roll-up, scoping, escalation, assignee suggestion |
| `.know-qa/reporting.json` | Optional sink config — where the roll-up posts (Step 7); absent = no posting |
| `.know-qa/.reporting-state.json` | Thread references for threaded sinks (read and written; gitignored) |
| `.know-qa/tools/runs/axe-*/axe.md` | Per-run axe output, including its WCAG A/AA coverage section — the first three grades and the untested list |
| `.know-qa/tools/wcag-aa-criteria.json` | The 55 live Level A/AA criteria, for naming an untested criterion rather than only numbering it |

## Example: Recurring Failure Detection

If `.know-qa/HISTORY.md` shows:

```
## Run: 2026-03-09T10:00:00Z
- Regressions: 1 regression: Login flow

## Run: 2026-03-10T10:00:00Z
- Regressions: 1 regression: Login flow

## Run: 2026-03-11T10:00:00Z
- Regressions: 1 regression: Login flow
```

The report will flag:

```
> RECURRING: Login flow — failed 3 of last 3 runs (first seen: 2026-03-09)
```

And escalate this in the Recommendations section as a priority fix.
