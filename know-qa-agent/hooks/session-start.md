---
name: session-start-qa-context
description: Load last QA results and known issues at session start
---

# Session Start Hook: Load QA Context

When this hook fires (at the start of a Claude Code session), follow these steps exactly.

## Step 1: Check for QA Setup

First, check if this project has QA configured:

```bash
ls .know-qa/ 2>/dev/null
```

If `.know-qa/` directory does not exist → **exit silently**. This project has not been initialized for QA. Do not show any output.

If `.know-qa/` exists, continue to Step 2.

## Step 2: Load Last QA Report

Find the most recent QA report:

```bash
ls -t .know-qa/reports/ 2>/dev/null | head -1
```

If no reports exist (directory empty or missing) → skip this section silently.

If a report exists, read its full content:

```bash
cat ".know-qa/reports/$(ls -t .know-qa/reports/ 2>/dev/null | head -1)"
```

### Present the Report

Parse the report's frontmatter or filename to determine the date and result. If the filename starts with `monitor-`, note that this report came from automated monitoring (not a manual run) — prefix it with "Automated Monitor Run" instead of "Last QA Run".

**If the last report was a clean pass with no concerns:**

```
Last QA Run: [date] — All clear, no issues.
```

Or for a monitor report:

```
Automated Monitor Run: [date] — All clear, no issues.
```

**If the last report had findings (Fail or Pass with Concerns):**

```
Last QA Run: [date from report filename or frontmatter]
Result: [Pass / Fail / Pass with Concerns]

[Full report content]
```

Or for a monitor report:

```
Automated Monitor Run: [date from report filename or frontmatter]
Result: [Pass / Fail / Pass with Concerns]

[Full report content]
```

Show the full report content — do not summarize or truncate it. The user needs full context to make informed decisions about the current session's work.

## Step 2.5: Check for Monitoring Alerts

After loading the last report, check for regression alerts written by `/know-qa:monitor`:

```bash
cat .know-qa/.monitor-alert 2>/dev/null
```

If the file does not exist → skip this section silently.

If the file exists, present the alert prominently before any other QA context:

```
MONITORING ALERT: Regression detected in recent monitoring run

[contents of .monitor-alert file]

Run `/know-qa:report` for full trend analysis or `/know-qa:run` to investigate.
```

After presenting the alert, delete the marker file so it does not repeat on the next session start:

```bash
rm .know-qa/.monitor-alert 2>/dev/null
```

## Step 2.7: Per-Owner Area Roll-up (opt-in)

This section is **off by default** — it only activates when the project both has an area registry and an identity is configured for this machine. It never guesses who you are.

```bash
cat .know-qa/.me 2>/dev/null            # the owner handle for this machine, e.g. "kelsey"
ls .know-qa/areas.json 2>/dev/null
```

If either is missing → skip this section silently (do **not** infer identity from git config or anything else). If both are present, read `.know-qa/areas.json` and `.know-qa/FINDINGS.md`, and for each area whose `owner` matches the `.know-qa/.me` handle, print one terse line:

```
Your areas (owner: [handle]):
- [area display] — last checked [N]d ago — [M] open findings
```

Keep it to one line per owned area; this is a nudge, not a report. Point to `/know-qa:report --owner [handle]` for the full picture. If the owner has no areas or all are clean and current, a single "Your areas: all clear" line is enough.

## Step 3: Load Known Issues from Memory

Check for persisted QA memory:

```bash
ls .know-qa/memory/ 2>/dev/null
```

If no memory files exist, skip this section silently.

If memory files exist, read each one (excluding the `gsd-suggested` marker file):

```bash
for f in .know-qa/memory/*.md 2>/dev/null; do cat "$f"; done
```

Extract and present known issues or patterns in this format:

```
Known QA Issues:
- [issue or pattern from memory file 1]
- [issue or pattern from memory file 2]
```

Only include items that represent active known issues or recurring patterns. Skip expired entries (those with `updated` dates older than 30 days).

## Step 4: Presentation Guidelines

- If both report and memory are clean → one brief line is enough:
  ```
  Last QA Run: [date] — All clear, no issues.
  ```
- If findings exist → show full report, then known issues below it
- Keep framing factual and informative, not alarming
- Present this context at the start of the session so it informs the work ahead

## Step 5: Silent Exit Conditions

Exit without any output if:
- `.know-qa/` directory does not exist (project not initialized for QA)
- `.know-qa/reports/` is empty and `.know-qa/memory/` is empty or missing

The goal is zero noise for projects that don't use this QA agent.
