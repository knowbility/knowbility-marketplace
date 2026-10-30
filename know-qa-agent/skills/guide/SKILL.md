---
name: know-qa:guide
description: Inspect project QA state and recommend the next action
argument-hint: "--project <path>"
allowed-tools: Read, Write, Bash, Grep, Glob
---

# /know-qa:guide

Read the current project's QA state from disk and return context-aware guidance on which QA command to use next — works without any prior conversation context.

## Arguments

| Argument | Required | Default | Description |
|----------|----------|---------|-------------|
| `--project <path>` | Yes | — | Path to project containing `.know-qa/` directory (or where one should be created) |

## Usage

```
/know-qa:guide --project ~/Projects/my-app
/know-qa:guide --project .
```

## Purpose

Reads from `.know-qa/` state files and `docs/ORCHESTRATION.md` to produce a short, actionable recommendation. Useful when an orchestrating agent or developer is unsure which QA command to run next.

## Execution Flow

### Step 1: Parse Arguments

Extract `--project` path from user input. Default to current directory if not specified.

### Step 2: Read ORCHESTRATION.md

Read the orchestration reference to ground recommendations in documented guidance (per D-07):

```bash
cat "${CLAUDE_PLUGIN_ROOT}/docs/ORCHESTRATION.md" 2>/dev/null
```

Locate `docs/ORCHESTRATION.md` via `${CLAUDE_PLUGIN_ROOT}` (the plugin's cache copy, not the `--project` path). Use the "Decision Points for Orchestrating Agents" and "Recommended Flow" sections to inform which skill to recommend based on the project state discovered in Step 3.

This is the reference document — read it before inspecting project state so the recommendations align with documented guidance.

### Step 3: Inspect Project State

Run all eight state checks. Use `2>/dev/null` on every command to silence errors when files don't exist.

**Check 1: .know-qa/ directory existence**
```bash
ls {project}/.know-qa/ 2>/dev/null
```
If not found → recommend `/know-qa:init {project}` and stop. No further checks needed.

**Check 2: Spec file count**
```bash
ls {project}/.know-qa/*.md 2>/dev/null | wc -l
```
If 0 specs (but `.know-qa/` exists) → recommend `/know-qa:gen`.

**Check 3: Report count**
```bash
ls {project}/.know-qa/reports/*.md 2>/dev/null | wc -l
```
If specs exist but 0 reports → recommend `/know-qa:run`.

**Check 4: HISTORY.md line count**
```bash
wc -l < {project}/.know-qa/HISTORY.md 2>/dev/null
```
If HISTORY.md has content → note trend data is available, mention `/know-qa:report` for analysis.

**Check 5: Monitor alert presence**
```bash
cat {project}/.know-qa/.monitor-alert 2>/dev/null
```
If alert file exists → surface the alert prominently; recommend `/know-qa:run` to investigate or `/know-qa:report` for full trend context.

**Check 6: Live paired-session state**
```bash
head -5 {project}/.know-qa/QA-SESSION-STATE.md 2>/dev/null
```
If present → a paired/long session is in flight (or was left mid-stream). Surface its "Last updated" line and recommend resuming: read it top to bottom, then `/know-qa:pair` to continue (or `/know-qa:report --file` if it shows unfiled findings).

**Check 7: Area registry**
```bash
cat {project}/.know-qa/areas.json 2>/dev/null
```
If present with a non-empty `areas` array → the project is split into owned areas. As a secondary nudge (not the primary recommendation), surface any area that looks stale or has open findings, tied to its `cadence`: e.g. "Area checkout (owner @kelsey): 3 open findings, last run 9d ago (cadence: daily) → `/know-qa:run --area checkout`." Cross-reference open `FINDINGS.md` entries by their stamped `area` and the most recent `.know-qa/reports/` touching it. If `areas` is empty or the file is absent, skip silently — area features are simply off.

**Check 8: Profiles**
```bash
```

### Step 4: Compose Guidance

Output format is a short narrative with 2-4 bullet recommendations. NOT a checklist or decision tree.

**Priority ordering (first applicable wins as primary recommendation):**
1. Monitor alert present → lead with the alert content, recommend investigation
2. Live `QA-SESSION-STATE.md` → lead with the resume hint
3. No `.know-qa/` directory → recommend `/know-qa:init`
4. No spec files → recommend `/know-qa:gen`
5. Specs exist but no reports → recommend `/know-qa:run`
6. Reports exist → summarize state, suggest `/know-qa:report` for trends or `/know-qa:monitor` for ongoing checks


**Route to `/know-qa:pair` (regardless of the above) when the need is judgment, not volume:** visual/UX calls a human should make, a deployment gated behind SSO/OAuth/2FA no script can reach, ambiguous behavior worth watching live, or figuring out how to test something new. Mention pair-then-automate where it fits: calibrate with `/know-qa:pair`, emit with `/know-qa:gen <name> --from-session <session>`, scale with `/know-qa:run`.

**Output style — terse and actionable:**

Example when `.know-qa/` doesn't exist:
```
QA not initialized for this project.

- Run `/know-qa:init {project}` to scaffold the .know-qa/ directory
- Then `/know-qa:gen` to create test specs from your feature descriptions
```

Example when specs exist but no reports:
```
QA initialized with {N} spec(s), but no test runs yet.

- Run `/know-qa:run --project {project} --url <your-url>` to execute your specs
- After running, `/know-qa:report --project {project}` will show results and trends
```

Example when reports exist:
```
QA active: {N} specs, {M} reports, trend data available.

- Run `/know-qa:report --project {project}` to review trends and recurring issues
- Run `/know-qa:run --project {project}` to re-test with latest code changes
- Consider `/know-qa:monitor --project {project} --url <url>` for continuous regression detection
```

Example with monitor alert:
```
MONITORING ALERT: {alert content}

- Run `/know-qa:run --project {project}` to investigate the regression
- Run `/know-qa:report --project {project}` for full trend context
- The alert was written by /know-qa:monitor — a previously passing scenario is now failing
```

### Step 5: Stop

Output the guidance and stop. Do not run any tests, generate any files, or spawn any agents. This skill only reads and recommends.

## Cross-Session Capability

This skill reads entirely from disk. It does not need prior conversation context. You can run `/know-qa:guide` in a brand new session and get an accurate recommendation based on the current state of `.know-qa/`.

This means:
- An orchestrating agent entering a project for the first time can call `/know-qa:guide` to understand what QA work has been done
- Different engineers get consistent guidance based on the same on-disk state
- No conversation history is needed

## Files Read

| File | Purpose |
|------|---------|
| `docs/ORCHESTRATION.md` | Reference document for grounding recommendations in documented guidance |
| `{project}/.know-qa/` | Directory existence check — QA initialized? |
| `{project}/.know-qa/*.md` | Spec file count — tests defined? |
| `{project}/.know-qa/reports/*.md` | Report count — tests have been run? |
| `{project}/.know-qa/HISTORY.md` | History line count — trend data available? |
| `{project}/.know-qa/.monitor-alert` | Alert file — regression detected by monitor? |
| `{project}/.know-qa/QA-SESSION-STATE.md` | Live session state — paired/long session to resume? |
| `{project}/.know-qa/areas.json` | Area registry — owned areas, for the staleness/open-findings nudge |
