---
name: know-qa:monitor
description: Run recurring smoke tests against a live URL via /loop, detect regressions, and persist results across sessions
argument-hint: "--project <path> --url <base-url> --tag <tag> --area <key> --owner <handle> --interval <minutes> --runs <count>"
# allowed-tools intentionally unset (was: Read, Write, Bash, Grep, Glob, Agent): when
# `.know-qa/reporting.json` declares a sink, the end-of-run post goes through the user's wired
# MCP, whose tool name can't be enumerated. Inherits the session's tools; no reporting.json
# (the default) means no MCP call is ever made. See reference/reporting-sinks.md.
---

# /know-qa:monitor

Run recurring smoke tests against a live application. Detects regressions, persists results to `.know-qa/reports/` and `.know-qa/HISTORY.md`, and writes alert markers for the SessionStart hook to surface on next session.

## Arguments

| Argument | Required | Default | Description |
|----------|----------|---------|-------------|
| `--project <path>` | Yes | — | Path to project containing `.know-qa/` specs |
| `--url <base-url>` | Yes | — | Target URL to monitor |
| `--tag <tag>` | No | `smoke` | Tag filter — only runs scenarios with this tag |
| `--area <key>` | No | — | Area filter — monitor only this area (resolved from `.know-qa/areas.json`, forwarded to `/know-qa:run`) |
| `--owner <handle>` | No | — | Owner filter — monitor every area this handle owns (forwarded to `/know-qa:run`) |
| `--interval <minutes>` | No | `5` | Minutes between runs |
| `--runs <count>` | No | `continuous` | Number of runs before stopping, or `continuous` |

## Usage

```
/know-qa:monitor --project ~/Projects/my-app --url https://my-app.example.com
/know-qa:monitor --project ~/Projects/my-app --url https://staging.example.com --tag critical
/know-qa:monitor --project ~/Projects/my-app --url https://my-app.example.com --interval 10 --runs 12
```

## Execution Flow

### Step 1: Parse Arguments

Extract from the user's input:
- **project**: Path to the project with `.know-qa/` specs
- **url**: Base URL to test against
- **tag**: Tag filter (default: `smoke`)
- **area**: Area key(s) to monitor (optional; resolved from `.know-qa/areas.json`)
- **owner**: Owner handle to monitor (optional; expands to that owner's areas)
- **interval**: Minutes between runs (default: `5`)
- **runs**: Number of iterations (default: `continuous`)

### Step 2: Validate Setup

Check that the project has QA specs configured:

```bash
ls {project}/.know-qa/ 2>/dev/null
```

If `.know-qa/` does not exist, stop and tell the user to run `/know-qa:init` first.

Search for specs containing the requested tag:

```bash
grep -rl "tags:.*{tag}" {project}/.know-qa/*.md 2>/dev/null
```

If no specs have scenarios tagged with the requested tag (default: `smoke`), warn the user:

```
No scenarios tagged "{tag}" found in {project}/.know-qa/

To use monitoring, add tags to your scenario frontmatter:
  tags: smoke

Or run with a different tag:
  /know-qa:monitor --project {project} --url {url} --tag critical
```

Do not proceed if no tagged scenarios exist.

**If `--area`/`--owner` was given:** confirm `{project}/.know-qa/areas.json` exists (if not, stop and tell the user to run `/know-qa:start` or author one). Area/owner resolution itself is delegated to `/know-qa:run`, which Step 5a forwards the flags to — don't re-implement it here. The `--tag` default of `smoke` still applies and AND-composes within the area (monitor watches the smoke scenarios of that area). If you want the area's full set, pass an explicit `--tag` that the area's scenarios carry.

### Step 3: Verify Engine and Capability State

Require `{project}/.know-qa/engine/monitor.mjs` and read
`{project}/.know-qa/capabilities.json`. If the engine is missing, route to
`/know-qa:init`. If `native_monitor_loop` is false, say that monitoring needs an
external scheduler or an open-session loop; do not claim it is durable.

The engine owns `.know-qa/.monitor-baseline.json`; do not create or edit it by hand.
It is initialized only after the first fully clean compiled run.

**Confirm monitoring is starting:**

```
[Monitor] Starting monitoring of {url}
  Tag: {tag}
  Interval: {interval} minutes
  Runs: {runs}
  Project: {project}

Press Ctrl+C or end the session to stop monitoring.
```

### Step 4: Set Up Recurring Execution via /loop

Use `/loop` to run the monitoring iteration on the specified interval. The loop body is the monitoring iteration described in Step 5.

Configure `/loop` with:
- **Interval**: `{interval}` minutes
- **Iterations**: `{runs}` (or indefinite if `continuous`)
- **Task**: The monitoring iteration (Step 5) for each cycle

If `/loop` is not available, run iterations manually in sequence, pausing the specified interval between each. Notify the user that manual sequencing is being used.

Recurrence constraints worth stating to the user up front: `/loop` fires only while this session stays open and the machine stays awake (no catch-up for missed fires — a sleeping laptop just skips cycles). For an overnight stretch, the user should disable sleep and consider `--unattended` on the underlying runs so no cycle stalls waiting for an approval. For true cross-day, always-on monitoring, point them at an external scheduler (desktop scheduled task, cron, GitHub Actions) driving `claude -p "/know-qa-agent:run ... --unattended"` — cloud routines can't reach a locally saved browser session.

### Step 5: Monitoring Iteration (Each Loop Cycle)

Each iteration follows this sequence:

#### 5a. Run QA Tests

Invoke `/know-qa:run` with the tag filter, forwarding `--area`/`--owner` when present (resolution lives in `/know-qa:run` alone):

```
/know-qa:run --project {project} --url {url} --tag {tag} [--area {area}] [--owner {owner}]
```

Capture the complete results, including:
- List of scenarios run and their pass/fail status
- Any failures with details
- Overall result (Pass / Fail / Pass with Concerns)
- Duration

#### 5b. Detect Regressions Deterministically

Use the manifest path emitted by `/know-qa:run`:

```bash
node "{project}/.know-qa/engine/monitor.mjs" --manifest "{manifest-path}"
```

Read `monitor-summary.json` and `monitor-alert.md`. A regression is strictly a
scenario that was `passed` in the last clean baseline and is now non-passing.
Only an overall `passed` run replaces the baseline.

#### 5b-bis. Check the Findings Registry

The run compiler has already reconciled contract-shaped findings into
`.know-qa/findings-registry.json` and rendered `.know-qa/FINDINGS.md`. Exact dedup keys
update `last_seen` and occurrences; explicit `duplicate_of` links are honored.
When root cause is uncertain, the tester records a proposal for human/agent
judgment rather than guessing a merge. Never edit the Markdown projection
directly.

#### 5c. Update Baseline

**After a clean run (all scenarios passed):** Update the baseline file to reflect current state.

Write to `.know-qa/.monitor-baseline.json`:

```json
{
  "{scenario-name-1}": "pass",
  "{scenario-name-2}": "pass"
}
```

This keeps the baseline current so new scenarios get added over time and the regression signal stays accurate.

**After a run with failures:** Do NOT update the baseline. The baseline represents the last-known-good state.

#### 5d. Write Timestamped Report

Generate an ISO timestamp:

```bash
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
```

Write a report to `.know-qa/reports/monitor-{ISO-timestamp}.md`:

```markdown
---
type: monitor
run-at: {ISO-timestamp}
url: {url}
tag: {tag}
area: {area, if --area/--owner was used; else omit}
owner: {owner, if --owner was used; else omit}
result: {Pass | Fail | Pass with Concerns}
regressions: {count}
---

# Monitor Run: {ISO-timestamp}

**URL:** {url}
**Tag filter:** {tag}
**Result:** {Pass | Fail | Pass with Concerns}
**Regressions:** {count}

## Scenario Results

| Scenario | Result | Note |
|----------|--------|------|
| {scenario-name} | PASS / FAIL | (regression) and/or (known: F-id / ticket) if applicable |

## Regression Details

{If regressions exist:}
These scenarios previously passed but now fail:

{For each regression:}
### {scenario-name}
- **Status in baseline:** pass
- **Current status:** fail
- **Failure:** {failure details}

{If no regressions:}
No regressions detected.

## Failures (Non-Regression)

{Any new or pre-existing failures not flagged as regressions, or "None"}
```

#### 5e. Append to HISTORY.md

Append a one-line summary entry to `.know-qa/HISTORY.md`:

```markdown
## Run: {ISO-timestamp}
- **URL**: {url}
- **Tag**: {tag}
- **Results**: {passed} passed, {failed} failed, {concerns} concerns
- **Regressions**: {none | N regressions: scenario-name-1, scenario-name-2}
- **Duration**: {duration}

```

#### 5f. Write Alert Marker (If Regressions Detected)

If any regressions were detected, write `.know-qa/.monitor-alert`:

```bash
cat > {project}/.know-qa/.monitor-alert << 'EOF'
{ISO-timestamp} — {N} regression(s) detected

Regressions (previously passing, now failing):
{For each regression:}
- {scenario-name}: {brief failure summary}

Latest report: .know-qa/reports/monitor-{ISO-timestamp}.md
Run `/know-qa:report` for trend analysis or `/know-qa:run --tag {tag}` to investigate.
EOF
```

This file is read by the SessionStart hook on the next session. The hook will present the alert and delete the file.

**If no regressions:** Do not write or modify the alert file. If a previous alert file exists from an older run, leave it — SessionStart will handle clearing it.

#### 5f-bis. Post to Configured Sinks (optional)

If `{project}/.know-qa/reporting.json` exists, post this iteration's roll-up to its sinks following the delivery procedure in `${CLAUDE_PLUGIN_ROOT}/reference/reporting-sinks.md` (the same config and helper `/know-qa:report` uses). Build the normalized payload from this run's result and apply each sink's `scope`/`include`; most monitor sinks will set `post_when: regressions-only` so a quiet channel only hears about regressions. If `reporting.json` is absent, do nothing — the monitor loop is unchanged. Never let a sink failure stall the loop: on a missing MCP or send error, note it once and keep monitoring.

#### 5g. Print Status Line

After each iteration, print a brief status to the user:

```
[Monitor] Run {N}: {passed}/{total} passed — {no regressions | N regression(s) detected}
```

If regressions: also print the scenario names on the next line, indented:

```
[Monitor] Run {N}: {passed}/{total} passed — 2 regression(s) detected
  - Login flow (was passing)
  - Checkout completes (was passing)
```

### Step 6: End Monitoring

When the loop completes (either `--runs` count reached or user stops):

Print a summary:

```
[Monitor] Monitoring complete.
  Runs completed: {N}
  Total regressions detected: {total}
  Reports saved to: {project}/.know-qa/reports/
  Full history: {project}/.know-qa/HISTORY.md
```

## Files Written

| File | Purpose |
|------|---------|
| `.know-qa/reports/monitor-{timestamp}.md` | Full report for each run |
| `.know-qa/HISTORY.md` | Append-only run log across all sessions |
| `.know-qa/.monitor-baseline.json` | Baseline scenario states for regression detection |
| `.know-qa/.monitor-alert` | Alert marker written when regressions detected; read by SessionStart |
| `.know-qa/.reporting-state.json` | Thread references for threaded sinks (written only when `reporting.json` declares sinks; gitignored) |

## Regression Detection Algorithm

A regression is specifically: a scenario that **passed** in the most recent baseline but **fails** in the current run.

This means:
- **Scenario passes** → not a regression
- **Scenario fails, not in baseline** → new failure (not a regression — no prior passing state to compare)
- **Scenario fails, baseline shows "fail"** → known failure (not a regression — was already failing)
- **Scenario fails, baseline shows "pass"** → regression (was working, now broken)

The baseline only updates on clean runs. This preserves the "last known good" state so regressions remain detectable across multiple consecutive failure runs.

## Examples

**Start continuous monitoring of production:**
```
/know-qa:monitor --project ~/Projects/store --url https://store.example.com
```

**Monitor staging every 10 minutes, run 6 times (1 hour):**
```
/know-qa:monitor --project ~/Projects/store --url https://store.staging.example.com --interval 10 --runs 6
```

**Monitor critical paths (not just smoke):**
```
/know-qa:monitor --project ~/Projects/store --url https://store.example.com --tag critical
```
