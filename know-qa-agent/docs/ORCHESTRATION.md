# QA Plugin Orchestration Guide

This document is the primary reference for orchestrating AI agents and human developers using the QA plugin. The plugin provides 10 skills for testing web applications via Claude Code: `/know-qa:init`, `/know-qa:start`, `/know-qa:gen`, `/know-qa:run`, `/know-qa:check`, `/know-qa:monitor`, `/know-qa:report`, `/know-qa:guide`, `/know-qa:help`, and `/know-qa:pair`. Read this document from top to bottom the first time; use section anchors for lookup thereafter. No prior knowledge of the plugin source files is assumed.

---

## Quick Reference (For Orchestrating Agents)

Machine-parseable lookup table. Read this first to select the right skill.

| Skill | Purpose | Spawns Agent? | Key Arguments |
|-------|---------|---------------|---------------|
| `/know-qa:init` | Scaffold `.know-qa/` directory and template spec | No | `path` |
| `/know-qa:start` | Front-door wizard: plain-English intent → dispatch to the right skill | No (delegates) | `<intent>` |
| `/know-qa:gen` | Generate a spec from description, docs, or URL | Yes | `<spec-name>`, `--from`, `--a11y-depth` |
| `/know-qa:run` | Execute tests from spec files or ad-hoc instructions | Yes | `--project`, `--spec`, `--url`, `--tag`, `--area`, `--owner`, `--env`, `--browsers` |
| `/know-qa:check` | Verify phase deliverables as a GSD gate check | Yes | `--url`, `--phase` |
| `/know-qa:monitor` | Recurring smoke tests via /loop, persists regression alerts | Yes | `--project`, `--url`, `--tag`, `--area`, `--owner`, `--interval`, `--runs` |
| `/know-qa:report` | Cross-session report: trends, systemic themes, area roll-up, tracker-agnostic filing | No | `--project`, `--format`, `--since`, `--area`, `--owner`, `--file` |
| `/know-qa:pair` | Interactive paired session over a live visible browser (human directs, agent captures) | No (runs in-conversation) | `--project`, `--url` |
| `/know-qa:guide` | Inspect project QA state and recommend next action | No | `--project` |
| `/know-qa:help` | List/explain the skills and all their options | No | `[skill-name]` |

**Agent-spawning skills** (`gen`, `run`, `check`, `monitor`) launch the `qa-tester` agent with a browser session via `playwright-cli`.

Before `/know-qa:run` spawns a tester, the deployed zero-dependency engine at
`.know-qa/engine/manifest.mjs` compiles the requested specs and filters into
`.know-qa/runs/<run-id>/run-manifest.json`. That manifest—not model interpretation—is
authoritative for selected scenarios, dependency auto-inclusion, environment,
and browser × viewport × persona × data-variant cells. Missing engines become
visible blocked cells; requested cells never silently disappear.

The same engine owns legal cell transitions, interruption recovery,
dependency-aware resume, cleanup tracking, deterministic report/history/finding
compilation, monitor baselines, safe connector payloads, and host capability
degradation. Conversation prose is never the execution ledger.

**File-read-only skills** (`init`, `report`, `guide`, `help`) read from disk and produce output without spawning a browser agent.

**`/know-qa:start` is an orchestrator** — it reads a little state, may author a small `.know-qa/` config (an area entry, a reporting sink), and invokes the agent-spawning skills on your behalf. It does not drive a browser itself.

**`/know-qa:pair` is interactive** — it runs in the main conversation with a human directing a visible CDP-attached Chrome; don't invoke it from an unattended orchestration. Its output (findings, `QA-SESSION-STATE.md`, captures) feeds `/know-qa:report --file` and `/know-qa:gen --from-session`.


---

## Interpreting Results

### Result Format

Results from `/know-qa:check` follow one of three structured output blocks an orchestrating agent can match against:

**Pass:**
```
✅ Phase {N} Verification: PASSED

Verified:
- {deliverable 1}: Works
- {deliverable 2}: Works

Confidence: High — all deliverables verified with evidence.

Notes:
- {any observations for later}

Ready to proceed to next phase.
```

**Fail:**
```
❌ Phase {N} Verification: FAILED

Definite Issues:
1. {Issue description}
   - Confidence: High — {rationale}
   - Evidence: {what was observed}
   - Severity: {Blocker / Major / Minor}

Likely Issues:
(if any)

Possible Issues:
(if any)

Recommendation: Address these issues before proceeding.
```

**Partial pass:**
```
⚠️ Phase {N} Verification: PASSED WITH CONCERNS

Working:
- {deliverable 1}: Works

Possible Issues:
- {issue that's not a blocker but should be noted}
  - Confidence: Low — {rationale}

Recommendation: Can proceed, but schedule follow-up for noted concerns.
```

Results from `/know-qa:run` follow the same confidence grouping (Definite / Likely / Possible) without the Phase gate framing.

### Confidence Levels

Every finding the agent produces is tagged with one of three confidence levels:

| Level | Meaning | Action |
|-------|---------|--------|
| High (Definite) | Confirmed real AND impactful — agent has strong evidence | Fix before proceeding |
| Medium (Likely) | Probably real, needs investigation — may be context-dependent | Investigate; may not block |
| Low (Possible) | Worth noting, may be intentional behavior | Review at leisure |

All findings are shown in reports — none are filtered. Grouping is by confidence, not severity.

### Parsing Result Data

An orchestrating agent should parse results as follows:

```
# Determine pass/fail from /know-qa:check output:
- Look for line starting with "✅" → PASSED
- Look for line starting with "❌" → FAILED
- Look for line starting with "⚠️" → PASSED_WITH_CONCERNS

# Extract issue severity from FAILED block:
- "Severity: Blocker" → must fix before proceeding
- "Severity: Major" → high priority, likely blocking
- "Severity: Minor" → low priority, can defer

# Check /know-qa:report trend output for:
- "RECURRING: {scenario name}" → escalated recurring failure (3+ runs)
- "Regressions: {count}" lines in HISTORY.md → trend direction

# 3-failure escalation rule:
- If /know-qa:check returns FAILED three times for the same phase:
  → Stop and escalate. The implementation approach may need reconsideration.
  → Do not continue invoking /know-qa:check expecting a different result.
```

---

## Workflow Integration

### Recommended Flow

A typical project lifecycle using the QA plugin:

1. **`/know-qa:init`** — Scaffold the `.know-qa/` directory and a starter `smoke-test.md` spec
2. **`/know-qa:gen`** — Generate specs from feature descriptions or by exploring the running app
3. **`/know-qa:run`** — Execute tests against local or staging URL; reports saved to `.know-qa/reports/`
4. **`/know-qa:report`** — Review latest results and trend analysis across sessions
5. **`/know-qa:monitor`** — Set up recurring smoke checks for deployed applications

For a new feature under development, the sequence is typically: gen → run → (fix issues) → run again → report.

For something hard to test blind (visual judgment, a gated deployment, a flow nobody has specced), the **pair-then-automate** path: a human calibrates it in `/know-qa:pair`, `/know-qa:gen <name> --from-session <session>` emits the calibrated flow as a spec, and `/know-qa:run` scales it autonomously from then on.

### GSD Phase Integration

`/know-qa:check` is designed for use at GSD phase boundaries. Add this to a project's executor methodology:

```markdown
## Verification
This is a web application. After completing each phase, run `/know-qa:check --url http://localhost:3000`
to verify the deliverables work before proceeding.
```

**How `/know-qa:check` works as a gate:**
1. It reads the active phase's plan to understand what was supposed to be delivered
2. Spawns `qa-tester` to verify deliverables at the provided URL
3. Returns a structured pass/fail result the orchestrator can act on

**3-failure escalation rule:** If `/know-qa:check` fails three times for the same phase, stop retrying. Surface this escalation message to the human:

> "Phase {N} has failed verification three times. The repeated failures suggest the implementation approach may have a fundamental issue. Recommend pausing to review: Is the technical approach sound? Are there missing requirements or misunderstandings? Should this be broken into smaller phases?"

### Decision Points for Orchestrating Agents

Use this decision list to determine which skill to invoke next:

- **Have a goal but don't know the command?** → Run `/know-qa:start "<plain-English intent>"` (intent decides)
- **Want to know what a skill does or its flags?** → Run `/know-qa:help [skill]` (reference)
- **No `.know-qa/` directory exists?** → Run `/know-qa:init {project-path}`
- **No spec files in `.know-qa/`?** → Run `/know-qa:gen {spec-name} "description of what to test"`
- **Need to verify a phase before marking it complete?** → Run `/know-qa:check --url <app-url> --phase N`
- **Need comprehensive testing across all scenarios?** → Run `/know-qa:run --project <path>`
- **Need only smoke tests?** → Run `/know-qa:run --project <path> --tag smoke`
- **Testing just one owned area (or everything one owner owns)?** → Run `/know-qa:run --project <path> --area <key>` or `--owner <handle>` (needs `.know-qa/areas.json`)
- **Want trend data across multiple test sessions?** → Run `/know-qa:report --project <path>`
- **Findings ready to land in the team's tracker?** → Run `/know-qa:report --project <path> --file`
- **Deploying to staging or production?** → Run `/know-qa:monitor --project <path> --url <deployed-url>`
- **Visual/UX judgment, a gated SSO deployment, or ambiguous behavior needing a human watching?** → Hand off to a human-attended `/know-qa:pair --project <path> --url <url>` session (don't run it unattended)
- **A flow was calibrated in a paired session and should scale?** → Run `/know-qa:gen <spec-name> --from-session <session>`, then `/know-qa:run`
- **Unsure what the project needs next?** → Run `/know-qa:guide --project <path>`

---

## Skill Reference

### /know-qa:init

Initialize QA testing structure in a project. Creates the `.know-qa/` directory and a starter `smoke-test.md` spec.

**Does not spawn the `qa-tester` agent.**

#### Arguments

| Argument | Required | Default | Description |
|----------|----------|---------|-------------|
| `path` | No | `.` (current directory) | Path to the project to initialize |

#### Usage

```bash
# Initialize in a specific project
/know-qa:init ~/Projects/my-app

# Initialize in current directory
/know-qa:init .
```

#### What It Produces

Creates:
```
{project}/
└── .know-qa/
    ├── README.md       # Quick reference for spec format
    └── smoke-test.md   # Starter spec with example scenarios
```

#### When to Use

Use `/know-qa:init` exactly once per project before running any other QA skills. If `.know-qa/` already exists, do not re-run — it will overwrite the existing structure.

---

### /know-qa:start

The front-door wizard. Takes a plain-English intent, asks at most 1-3 clarifying questions, and dispatches to the right skill — scaffolding a small `.know-qa/` config when the intent calls for it (e.g. authoring an area entry).

**Does not spawn the `qa-tester` agent directly** — it invokes the owning skill (which may), the way `/know-qa:monitor` invokes `/know-qa:run`.

#### Arguments

| Argument | Required | Default | Description |
|----------|----------|---------|-------------|
| `<plain-English intent>` | No | — | What you want to do, in your own words. Omit to be asked. |

#### Usage

```bash
# Reusable spec for a flow
/know-qa:start "test the checkout flow"

# Stand up an owned, monitored area (authors .know-qa/areas.json, then monitors)
/know-qa:start "set up regular checks on the Opportunities area I own"

# One-off
/know-qa:start "what's broken on staging right now?"
```

#### What It Produces

A dispatch to the owning skill (`init` / `gen` / `run` / `monitor` / `pair` / `seed` / `report` / `check`). For the "set up my area" intent it does more: a merged `.know-qa/areas.json` entry, then a **browser-mapping pass** (dispatched to `/know-qa:gen --from <url>`) that explores the surface and emits observed specs — overall plus per-component — so the area stands up with runnable coverage rather than an empty registry entry; then `/know-qa:monitor` and an optional `.know-qa/reporting.json` sink. The browser map needs a reachable session (run `/know-qa:pair` once first if the app is gated).

#### When to Use

Use `/know-qa:start` when you know what you want but not which command. It is the intent-first counterpart to `/know-qa:guide` (state-first) and `/know-qa:help` (reference). It never re-implements another skill; it routes to it.

---

### /know-qa:gen

Generate a QA test specification from a description, existing documentation, or by exploring a running application.

**Spawns the `qa-tester` agent.**

#### Arguments

| Argument | Required | Default | Description |
|----------|----------|---------|-------------|
| `<spec-name>` | Yes | — | Name for the generated spec file (no `.md` extension) |
| `--from <source>` | No | — | Source to generate from: file path or URL |
| `--a11y-depth <level>` | No | `baseline` | Accessibility depth: `baseline` (Tier 1 only) or `deep` (adds Tier 2 structured checks) |
| `description` | No | — | Natural language description of what to cover |

#### Usage

```bash
# Generate from a plain description
/know-qa:gen login "User authentication flow with email/password, including forgot password"

# Generate from existing documentation
/know-qa:gen checkout --from ~/Projects/store/docs/checkout-flow.md

# Generate by exploring a running app
/know-qa:gen user-profile --from http://localhost:3000/profile "Explore the user profile page"

# Generate with deep accessibility checks included
/know-qa:gen dashboard --a11y-depth deep "Main dashboard with charts and data tables"
```

#### What It Produces

Creates `{project}/.know-qa/{spec-name}.md` — a spec file in the v2 format that can be run immediately with `/know-qa:run`.

#### When to Use

Use `/know-qa:gen` when starting testing on a new feature or page. It saves time compared to writing specs manually and ensures the correct spec format.

---

### /know-qa:run

Execute QA tests from spec files or ad-hoc instructions. The most frequently used skill.

**Spawns the `qa-tester` agent.**

#### Arguments

| Argument | Required | Default | Description |
|----------|----------|---------|-------------|
| `--project <path>` | No* | — | Path to project containing `.know-qa/` specs |
| `--spec <name>` | No | all specs | Specific spec name to run (no `.md` extension) |
| `--url <base-url>` | No* | from spec | Base URL to test against (overrides spec's Base URL) |
| `--tag <tag>` | No | all scenarios | Filter to scenarios matching this tag. Comma-separated for OR logic: `--tag smoke,critical` |
| `--area <key>` | No | — | Run only one area's scenarios, resolved from `.know-qa/areas.json` into the spec/tag selection |
| `--owner <handle>` | No | — | Run every area that handle owns (union), resolved from `.know-qa/areas.json` |
| `--env <profile>` | No | first profile | Environment profile name from spec's `## Environments` section |
| `--browsers` | No | from spec | Use browser engines from spec's `## Browsers` section (chromium, webkit, firefox). Defaults to chromium if `## Browsers` absent. |
| `task` (quoted) | No* | — | Ad-hoc test description when not using a spec file |

*Either `--project` or (`--url` + ad-hoc `task`) must be provided.

#### Usage

```bash
# Run all specs in a project
/know-qa:run --project ~/Projects/my-app

# Run a specific spec
/know-qa:run --project ~/Projects/my-app --spec login

# Run against a different URL (overrides spec's Base URL)
/know-qa:run --project ~/Projects/my-app --spec login --url https://staging.example.com

# Run only smoke-tagged scenarios across all specs
/know-qa:run --project ~/Projects/my-app --tag smoke

# Run with a specific environment profile
/know-qa:run --project ~/Projects/my-app --spec checkout --env staging

# Ad-hoc test without a spec file
/know-qa:run --url http://localhost:3000 "Test that the homepage loads without console errors"
```

#### What It Produces

- Writes a report to `.know-qa/reports/{timestamp}-{spec-name}.md`
- Appends a summary line to `.know-qa/HISTORY.md`
- Terminal output with pass/fail per scenario, grouped by confidence

#### When to Use

Use `/know-qa:run` for comprehensive testing against specs. Use `/know-qa:check` instead for quick phase gate verification. Use `--tag smoke` for fast health checks before deeper test runs.

---

### /know-qa:check

Verify that a GSD phase's deliverables actually work. A targeted gate check, not a full QA pass.

**Spawns the `qa-tester` agent.**

#### Arguments

| Argument | Required | Default | Description |
|----------|----------|---------|-------------|
| `--url <base-url>` | Yes | — | URL of the running application to test |
| `--phase <number>` | No | inferred from GSD context | Phase number to verify |

#### Usage

```bash
# Verify the active phase (inferred from GSD context)
/know-qa:check --url http://localhost:3000

# Verify a specific phase
/know-qa:check --url http://localhost:3000 --phase 3
```

#### What It Produces

A structured pass/fail result (see Interpreting Results section above). If issues are found:
- Lists findings grouped by Definite / Likely / Possible
- Includes evidence (console errors, network failures, screenshots)
- Provides severity: Blocker / Major / Minor

#### When to Use

Use `/know-qa:check` at GSD phase boundaries before marking a phase complete. It is not a replacement for `/know-qa:run` with full spec coverage — it only tests the key deliverables of the just-completed phase.

---

### /know-qa:monitor

Run recurring smoke tests against a deployed application. Detects regressions across multiple automated runs and surfaces alerts at the start of the next session.

**Spawns the `qa-tester` agent repeatedly via `/loop`.**

#### Arguments

| Argument | Required | Default | Description |
|----------|----------|---------|-------------|
| `--project <path>` | Yes | — | Path to project containing `.know-qa/` specs |
| `--url <base-url>` | Yes | — | Target URL to monitor |
| `--tag <tag>` | No | `smoke` | Tag filter — only runs scenarios with this tag |
| `--area <key>` | No | — | Monitor only this area (forwarded to `/know-qa:run`; needs `.know-qa/areas.json`) |
| `--owner <handle>` | No | — | Monitor every area this handle owns (forwarded to `/know-qa:run`) |
| `--interval <minutes>` | No | `5` | Minutes between runs |
| `--runs <count>` | No | `continuous` | Number of runs before stopping, or `continuous` |

#### Usage

```bash
# Monitor with defaults (smoke tag, 5 min interval, continuous)
/know-qa:monitor --project ~/Projects/my-app --url https://my-app.example.com

# Monitor only critical scenarios every 10 minutes
/know-qa:monitor --project ~/Projects/my-app --url https://staging.example.com --tag critical --interval 10

# Monitor for a fixed number of runs (e.g., during a deployment window)
/know-qa:monitor --project ~/Projects/my-app --url https://my-app.example.com --runs 12
```

#### What It Produces

- Report files in `.know-qa/reports/monitor-{timestamp}.md` after each run
- Updated `.know-qa/HISTORY.md` after each run
- `.know-qa/.monitor-alert` marker file if a regression is detected — surfaced by the SessionStart hook at the start of the next session

#### When to Use

Use `/know-qa:monitor` for deployed applications where you need regression detection between manual test sessions. It runs indefinitely (or for `--runs` iterations) in the background. The `smoke` tag filter keeps it fast — full spec runs are for manual or CI invocations.

---

### /know-qa:report

Generate a cross-session QA report with trend analysis. Reads entirely from disk — no prior conversation context needed.

**Does not spawn the `qa-tester` agent.**

#### Arguments

| Argument | Required | Default | Description |
|----------|----------|---------|-------------|
| `--project <path>` | Yes | — | Path to project containing `.know-qa/` directory |
| `--format <format>` | No | `markdown` | Output format: `markdown` or `json` |
| `--since <date-or-duration>` | No | last 5 runs or 7 days | Historical window for trend analysis. Examples: `--since 2026-03-01` or `--since 7d` |
| `--area <key>` / `--owner <handle>` | No | — | Scope the report (and its area roll-up) to one area or owner (needs `.know-qa/areas.json`) |
| `--file` | No | off | File gated findings into the project's tracker via the learned procedure (any tracker) |
| `--create-issues` | No | off | Alias for `--file` that pre-selects the GitHub/`gh` path (backward compatible) |

#### Usage

```bash
# Standard report
/know-qa:report --project ~/Projects/my-app

# Report as JSON (for CI/CD pipelines)
/know-qa:report --project ~/Projects/my-app --format json

# Trend analysis for the last 2 weeks
/know-qa:report --project ~/Projects/my-app --since 14d

# Create GitHub issues from critical findings
/know-qa:report --project ~/Projects/my-app --create-issues

# Historical report from a specific date
/know-qa:report --project ~/Projects/my-app --since 2026-03-01 --create-issues
```

#### What It Reads

| File | Purpose |
|------|---------|
| `.know-qa/reports/{most-recent}.md` | Latest run results — primary data source |
| `.know-qa/HISTORY.md` | Run log across all sessions — used for trend analysis |

#### What It Produces

- Latest run summary (pass/fail counts, findings)
- Trend analysis (recurring failures flagged with `RECURRING:` prefix)
- Optional: GitHub issues created via `gh cli` for High confidence findings

#### When to Use

Use `/know-qa:report` after completing a testing session, or from CI/CD pipelines to surface results without a browser session. Reports accumulate across sessions — each run adds to the history that trend analysis reads from.

---

### /know-qa:guide

Inspect the project's QA state and recommend which skill to use next. Context-aware guidance based on what exists in the `.know-qa/` directory.

**Does not spawn the `qa-tester` agent. Reads from disk only.**

#### Arguments

| Argument | Required | Default | Description |
|----------|----------|---------|-------------|
| `--project <path>` | Yes | — | Path to project containing (or missing) `.know-qa/` directory |

#### Usage

```bash
# Get recommendations for a project
/know-qa:guide --project ~/Projects/my-app

# Get recommendations for current directory
/know-qa:guide --project .
```

#### What It Reads

| File | Purpose |
|------|---------|
| `{project}/.know-qa/` | Existence check — determines if QA is initialized |
| `{project}/.know-qa/*.md` | Spec count — determines if specs exist |
| `{project}/.know-qa/reports/` | Report count — determines if tests have been run |
| `{project}/.know-qa/HISTORY.md` | Line count — determines trend data readiness |
| `{project}/.know-qa/.monitor-alert` | Presence check — surfaces active monitoring regressions |

#### What It Produces

A short narrative (2-4 bullet recommendations) grounded in the actual project state. Example output:

```
- No spec files found in .know-qa/. Run /know-qa:gen to create a spec from your feature descriptions or by exploring the app.
- 3 spec files found, no reports yet. Run /know-qa:run --project . to execute your first test pass.
- Last report (2026-04-19): 2 High confidence findings remain open. Run /know-qa:run --project . --tag regression to recheck.
- MONITORING ALERT active — a regression was detected. Run /know-qa:report --project . for trend analysis.
```

#### When to Use

Use `/know-qa:guide` when entering a project for the first time, when unsure which skill fits the current situation, or when you want the plugin to tell you what's needed next based on current state.

---

### /know-qa:help

The reference manual. Lists every skill and its options, or drills into one. Discovers skills by globbing the plugin's `skills/` directory at run time, so it never drifts as skills are added.

**Does not spawn the `qa-tester` agent. Reads only the plugin's own files — never a project's `.know-qa/`.**

#### Arguments

| Argument | Required | Default | Description |
|----------|----------|---------|-------------|
| `[skill-name]` | No | — | A skill to drill into (`run` or `know-qa:run`). Omit to list every skill. |

#### Usage

```bash
# List every skill with its one-liner and key args
/know-qa:help

# Full arguments and usage for one skill
/know-qa:help run
```

#### When to Use

Use `/know-qa:help` to learn what a skill is and what its flags do. It is the reference counterpart to `/know-qa:guide` (what's next, by state) and `/know-qa:start` (set up my goal, by intent).

---

## Visual Testing

Visual testing is Tier 2 opt-in functionality. Tier 1 visual observations (noting anomalies during functional testing) always run. Tier 2 structured visual checks activate only when a spec includes a `## Visual Focus` section — parallel to how `## Accessibility Focus` activates Tier 2 accessibility checks.

### Activating Visual Testing

Add a `## Visual Focus` section to the spec:

```markdown
## Visual Focus
- design-verification
- layout-integrity
```

Available areas:

| Area | What It Checks |
|------|---------------|
| `design-verification` | Compare live page against design reference images |
| `ux-states` | Verify empty, loading, error, and interaction states |
| `layout-integrity` | Spacing, alignment, grid integrity, content clipping |
| `performance-responsive` | Core Web Vitals, cross-browser rendering, viewport sweep |

- Present with no items listed: All four areas run (full Tier 2)
- Present with specific areas listed: Only those areas run
- Absent: Tier 1 only (visual anomalies noted during functional testing)

### Design Reference

Provide mockup images for visual comparison during `design-verification`. Add a `## Design Reference` section to the spec:

```markdown
## Design Reference

### desktop
- home-logged-out: .know-qa/designs/desktop-home.png

### mobile
- home-logged-out: .know-qa/designs/mobile-home.png
```

If a viewport subsection is absent, the agent skips visual diff for that viewport and notes "no design reference for [viewport]" in the report.

### Cross-Browser Testing

Specify which browser engines to run by adding a `## Browsers` section to the spec:

```markdown
## Browsers
- chromium
- webkit
- firefox
```

Valid engines: `chromium` (Chrome/Edge), `webkit` (Safari), `firefox` (Gecko). When the section is absent, only Chromium runs (backward compatible).

Invoke via: `/know-qa:run --project <path> --browsers`

The agent reports findings per engine: `[webkit] Scenario X: FAIL — rendering divergence on nav menu`

### Tier 2 Coverage Summary

| Area | Runs When |
|------|-----------|
| Design verification | `design-verification` in `## Visual Focus` AND `## Design Reference` section present |
| UX state verification | `ux-states` in `## Visual Focus` |
| Layout & content integrity | `layout-integrity` in `## Visual Focus` |
| Performance & responsive | `performance-responsive` in `## Visual Focus` |
| Breakpoint sweep (continuous) | `performance-responsive` active AND `breakpoint-sweep: continuous` in `## Visual Focus`, OR any Phase 1 breakpoint fails |

---

## Areas, Owners, and Routing

A project can split its app into **areas**, each with an **owner**, by authoring `.know-qa/areas.json` (optional; empty by default = off). This lets a large product be distributed — each owner runs and watches just their slice.

- **Define areas** in `.know-qa/areas.json`: each area has a `key`, `display`, `owner`, and a `match` that claims its scenarios — primarily the reserved tag `area:<key>` on scenarios, or `match.specs` globs over spec files. An optional `status: not-implemented` makes the agent smoke-check rather than file "missing feature."
- **Run by area or owner:** `/know-qa:run --area <key>` / `--owner <handle>` and `/know-qa:monitor --area …` resolve up front into the normal spec/tag selection — areas are not a filter inside the tester.
- **Routing falls out of the registry:** findings get stamped with `area`/`owner`; `/know-qa:report` rolls findings up per area (owner, open count, last checked), suggests the owner as assignee when filing, and surfaces an Escalations block when `areas.json` declares an `escalation` matrix.
- **Authoring:** `/know-qa:start "set up regular checks on the <area> I own"` authors the entry conversationally. The schema is documented in `examples/SPEC-FORMAT.md` (the `area:` tag) and scaffolded by `/know-qa:init`.

This is project config — the plugin ships the primitive; the actual areas/owners live in the project's `.know-qa/`.

## Reporting Sinks

`/know-qa:report` (and optionally `/know-qa:monitor`) can deliver a roll-up to a **sink** — a Slack channel or other destination — declared in `.know-qa/reporting.json` (optional; absent = no posting, behavior unchanged).

- The plugin ships only the **formatting and routing**; delivery uses whatever MCP the session has wired (e.g. a Slack MCP). `/know-qa:report` and `/know-qa:monitor` therefore don't restrict `allowed-tools`, so they can reach that MCP.
- A sink declares its `type`, a posting `identity` (name + emoji), a `target`, optional `threaded` replies, `post_when` (`always` / `findings-only` / `regressions-only`), an optional `scope` (by area/owner), and which roll-up sections to `include`.
- Canonical definition — schema, the normalized payload, identity/threading, and the degrade path — is `reference/reporting-sinks.md`.

## Getting Started (For Developers)

### Installation

The QA plugin requires two things:

1. **Plugin installed in your project** — Clone or add the plugin to your Claude Code plugins directory. The plugin directory follows Anthropic's Claude Code plugin convention.

2. **`playwright-cli` installed globally** — All browser automation runs through `playwright-cli`. Install it before running any agent-spawning skill:
   ```bash
   npm install -g @playwright/cli
   ```

### First Test Walkthrough

If you're starting fresh on a new project:

**Step 1 — Initialize:**
```
/know-qa:init ~/Projects/my-app
```
This creates `.know-qa/` with a starter `smoke-test.md` spec. Open the spec and customize it for your application's base URL and core flows.

**Step 2 — Generate a spec (optional but recommended):**
```
/know-qa:gen login "User authentication: email/password login, logout, forgot password flow"
```
This generates a more detailed spec than the smoke-test starter. Review the generated spec and adjust as needed.

**Step 3 — Run tests:**
```
/know-qa:run --project ~/Projects/my-app --spec smoke-test --url http://localhost:3000
```
The agent opens a browser, walks through the spec scenarios, and writes a report to `.know-qa/reports/`.

**Step 4 — Review results:**
```
/know-qa:report --project ~/Projects/my-app
```
The report shows what passed, what failed (grouped by confidence), and trend analysis once you have multiple runs.

### Spec Format Overview

Specs are Markdown files in `.know-qa/`. The format is human-readable and supports:

- **Personas** — test as multiple users (admin, guest, etc.) with credentials
- **Viewports** — mobile (375px), tablet (768px), desktop (1280px) by default
- **Tags** — label scenarios for selective execution (`smoke`, `critical`, `regression`, `a11y`)
- **Dependencies** — declare `depends_on: Scenario Name` when order matters
- **Environments** — define `local`, `staging`, `production` profiles with different URLs and credentials
- **Accessibility Focus** — add `## Accessibility Focus` section to trigger Tier 2 deep accessibility checks

See `examples/SPEC-FORMAT.md` for the complete spec format reference with examples.

### Where Reports Live

All QA output goes into the target project's `.know-qa/` directory:

- **Reports:** `.know-qa/reports/{timestamp}-{spec-name}.md` — one file per test run
- **History:** `.know-qa/HISTORY.md` — running log used for trend analysis
- **Memory:** `.know-qa/memory/` — patterns and known issues the agent learns across sessions

Reports accumulate automatically — you do not need to manage them.

---

## Data Architecture

QA data lives in the `.know-qa/` directory of each target project. The plugin never writes outside this directory.

```
{project}/
└── .know-qa/
    ├── *.md                  # Spec files — test definitions
    ├── README.md             # Quick reference (created by /know-qa:init)
    ├── FINDINGS.md           # Filed-findings registry (created by /know-qa:init)
    ├── environments.json     # Protected-environment write allowlist (created by /know-qa:init)
    ├── areas.json            # Optional area registry: areas, owners, routing (scaffolded empty)
    ├── reporting.json        # Optional reporting-sink config (user-authored)
    ├── HISTORY.md            # Running log of all QA activity (top-level)
    ├── reports/              # Test reports (generated by /know-qa:run, /know-qa:check, /know-qa:monitor)
    ├── memory/               # QA-specific memory: patterns, known issues, baselines
    │   └── *.md              # Memory files (auto-expire after 30 days of no update)
    ├── tools/                # Paired/authenticated harness (deployed by /know-qa:init)
    ├── .monitor-alert        # Regression alert marker (written by /know-qa:monitor, deleted by SessionStart)
    ├── .me                   # Per-machine owner identity for the SessionStart roll-up (gitignored)
    └── .reporting-state.json # Transient sink thread refs (gitignored)
```

**Committable vs. not:** `FINDINGS.md`, `environments.json`, `areas.json`, and `reporting.json` are committable (they hold no secrets). `tools/.auth/`, `.me`, `.reporting-state.json`, and any `env.local` are gitignored — they hold per-machine sessions, identity, or credentials. Spec files should use `$ENV_VAR` placeholders for any secrets.

---

## Hooks (Automatic Behavior)

The plugin includes two hooks that run automatically in Claude Code sessions:

### SessionStart Hook

When a Claude Code session starts in a project with a `.know-qa/` directory, the hook:

1. Checks for the most recent report in `.know-qa/reports/` and presents a one-liner if clean, or the full report if findings exist
2. Checks for a `.know-qa/.monitor-alert` marker file and surfaces monitoring regressions prominently
3. If a `.know-qa/.me` owner identity is configured AND `.know-qa/areas.json` exists, prints a one-line-per-owned-area roll-up (last checked, open findings) — off by default, silent otherwise
4. Reads `.know-qa/memory/*.md` and surfaces known issues or recurring patterns

If `.know-qa/` does not exist, the hook exits silently — zero noise for projects that don't use QA.

### Stop Hook

When a Claude Code session ends after making changes to source files, the hook checks whether any changed files are test-relevant (source, styles, config, API routes). If so, it suggests running `/know-qa:run` or `/know-qa:check` to verify the changes. The suggestion is informational only — not a blocker.

---

## Cross-Session Capability

The following skills and hooks read entirely from disk and require no conversation context:

- **`/know-qa:report`** — reads `.know-qa/reports/` and `.know-qa/HISTORY.md` from any session
- **`/know-qa:guide`** — reads `.know-qa/` state from any session
- **SessionStart hook** — reads `.know-qa/reports/` and `.know-qa/memory/` at session open

This means reports and guidance accumulate value across sessions. Different engineers working on the same project see the same QA data. CI/CD pipelines can invoke `/know-qa:report` without a running browser session.

Agent-spawning skills (`run`, `check`, `gen`, `monitor`) always start fresh — they inspect the live application, not cached state. Each run adds to the persistent history that file-read skills consume.
