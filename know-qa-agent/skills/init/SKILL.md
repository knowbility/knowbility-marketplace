---
name: know-qa:init
description: Initialize QA structure in a project by creating .know-qa directory and template spec
argument-hint: "path"
---

# /know-qa:init

Initialize QA testing structure in a project.

## Usage

```
/know-qa:init ~/Projects/my-app
```

Or if already in the project directory:
```
/know-qa:init .
```

## What This Does

1. Verifies the `playwright-cli` prerequisite is installed (installs it if missing)
2. Creates the `.know-qa/` directory in the specified project
3. Creates a `README.md` with quick reference for spec format
4. Creates a `smoke-test.md` template as a starting point
5. Creates an empty `FINDINGS.md` — the per-project filed-findings registry
6. Creates `environments.json` — the protected-environment allowlist (default-deny; only localhost write-allowed)
7. Creates an empty `areas.json` — the optional area registry (areas, owners, routing; empty by default = disabled)
8. Deploys the paired/authenticated harness into `.know-qa/tools/` and installs its dependency; records the deployed tool set in `.know-qa/tools/harness.json`
9. Writes a `.know-qa/.gitignore` so session secrets and scratch output never get committed
10. Detects host capabilities and records explicit supported/degraded modes

**Re-running on an initialized project is a targeted refresh:** it re-copies `engine/` and `tools/` (the deterministic engine and the harness) and rewrites `harness.json`, and it preserves everything the project owns — `environments.json`, `tools/.auth/`, `FINDINGS.md`, `areas.json`, `reporting.json`, specs, reports, and runs.

## Execution

0. **Verify the browser-driver prerequisite.** The tester agent drives the browser through the global `playwright-cli`; nothing else installs it, so check it first:

   ```bash
   command -v playwright-cli
   ```

   If missing, install it and re-verify:

   ```bash
   npm install -g @playwright/cli && command -v playwright-cli
   ```

   The package is `@playwright/cli` — NOT the unrelated npm package named `playwright-cli`. If `npm` itself is unavailable, stop and tell the user to install Node 18+ first; nothing else in this skill will work without the driver.

1. Parse the path argument (default to current directory if not provided)
2. Create the directory structure:
   ```
   {project}/
   └── .know-qa/
       ├── .gitignore
       ├── README.md
       ├── smoke-test.md
       ├── FINDINGS.md         ← the filed-findings registry (scaffolded in step 2b)
       ├── environments.json   ← protected-environment allowlist (scaffolded in step 2c)
       ├── areas.json          ← optional area registry (scaffolded in step 2d)
       ├── engine/             ← deterministic manifest/result contracts (deployed in step 3)
       └── tools/              ← the paired/auth harness (deployed in step 3; harness.json records the tool set)
   ```

   **If `.know-qa/` already exists**, this is a refresh: do steps 2b through 2d only for files that are missing (never overwrite an existing `FINDINGS.md`, `environments.json`, or `areas.json`), do step 3 in full (the copies replace the deployed engine and tools; `tools/.auth/` and `tools/node_modules/` are untouched because the copy adds and replaces files without deleting), and skip the README and `smoke-test.md` templates if they exist.

2b. **Scaffold the findings registry.** Write `{project}/.know-qa/FINDINGS.md`:

   ```markdown
   # Findings Registry

   <!-- The durable, per-project register of QA findings. One `##` entry per finding,
     shape per the plugin's reference/finding-lifecycle.md: F-YYYYMMDD-NN id, status,
     disposition, severity/confidence/reliability, symptom, expected/actual,
     root_cause_hypothesis, evidence, duplicate_of/ticket_link, first_seen/last_seen.
     Skills check this before filing (dedup by root cause, not symptom string) and
     /know-qa:monitor reads it every run so known issues are cross-linked, not re-raised.
     Resolved entries move to ## Archive. -->

   ## Archive
   ```

   This file is committable — it holds findings, never secrets.

2c. **Scaffold the protected-environment allowlist.** Write `{project}/.know-qa/environments.json`:

   ```json
   {
     "_note": "Origins the QA harness may perform write actions against. Default-deny: any origin not listed, or listed with write_allowed: false, is read-only. Add live/staging origins explicitly — a human decision, not the agent's.",
     "environments": [
       { "origin": "http://localhost", "write_allowed": true },
       { "origin": "http://127.0.0.1", "write_allowed": true }
     ]
   }
   ```

   Local dev servers are disposable, so they scaffold as write-allowed; every other origin must be added by a human. The harness's `drive.mjs` enforces this mechanically for destructive-looking clicks, and the tester agent checks it before any write in every mode — see the plugin's `reference/safety.md`. Committable — no secrets.

2d. **Scaffold the area registry.** Write `{project}/.know-qa/areas.json` — an empty but documented registry. It is optional: while `areas` is empty, area features are simply disabled and every skill behaves exactly as without it. Authoring it (by hand or via `/know-qa:start`) lets the team split the app into owned areas and run/monitor/report by `--area`/`--owner`.

   ```json
   {
     "_note": "Optional area registry. Maps product areas to the specs/scenarios that cover them, plus owners and optional routing. Areas resolve up front into the existing --spec/--tag selection — they are NOT a filter inside the tester. Empty areas = disabled (default behavior). Committable — holds owners/handles, never secrets. An area's scenarios are matched by the reserved tag area:<key> (or match.specs globs). See examples/SPEC-FORMAT.md.",
     "owners": {},
     "areas": [],
     "escalation": []
   }
   ```

   Committable — area keys, owners, and notify handles are not secrets.

3. **Deploy the deterministic execution engine and paired harness.** Copy both
   into the workspace. The engine is zero-dependency and creates the run
   manifest before agent/browser work; the harness provides paired/authenticated
   browser tools.

   ```bash
   mkdir -p "{project}/.know-qa/engine"
   cp -R "${CLAUDE_PLUGIN_ROOT}/engine/." "{project}/.know-qa/engine/"
   mkdir -p "{project}/.know-qa/tools"
   cp -R "${CLAUDE_PLUGIN_ROOT}/harness/tools/." "{project}/.know-qa/tools/"
   cd "{project}/.know-qa/tools" && PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install
   ```

   Then record what was deployed, so later refreshes can tell whether the harness is current. Write `{project}/.know-qa/tools/harness.json` from the plugin's own manifest and the files it ships (a project may keep scripts of its own in `tools/`; those are not the harness and are not listed):

   ```bash
   node -e '
     const fs = require("fs"); const path = require("path");
     const root = process.argv[1], dest = process.argv[2];
     const version = JSON.parse(fs.readFileSync(path.join(root, ".claude-plugin/plugin.json"), "utf8")).version;
     const walk = (d, b = "") => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.name === "node_modules" || e.name === ".auth" ? [] : e.isDirectory() ? walk(path.join(d, e.name), path.join(b, e.name)) : [path.join(b, e.name)]);
     fs.writeFileSync(path.join(dest, "harness.json"), JSON.stringify({ plugin: "know-qa-agent", version, deployedAt: new Date().toISOString(), tools: walk(path.join(root, "harness/tools")).sort() }, null, 2) + "\n");
   ' "${CLAUDE_PLUGIN_ROOT}" "{project}/.know-qa/tools"
   ```

   Then record the host contract:

   ```bash
   node "{project}/.know-qa/engine/capabilities.mjs" --project "{project}"
   ```

   Read `.know-qa/capabilities.json` and report every degradation. Initialization is
   still successful when browser control is unavailable: manifest, compilation,
   and reporting remain usable. Never imply autonomous, paired, recurring-loop,
   sink, or tracker support that the capability record does not establish.

   Verify the engine independently:

   ```bash
   node "{project}/.know-qa/engine/manifest.mjs" --help
   ```

   If harness `npm install` fails, report it but continue — the manifest engine
   and autonomous path (`/know-qa:run` via `playwright-cli`) work without the paired
   harness. The harness is documented in
   `${CLAUDE_PLUGIN_ROOT}/docs/HARNESS-GUIDE.md`.

4. **Write `.know-qa/.gitignore`** (session secrets and scratch must never be committed):

   ```
   # Live auth sessions — personal, never committed
   tools/.auth/

   # Harness dependencies
   tools/node_modules/
   tools/package-lock.json

   # Deployed execution engine (refresh via /know-qa:init)
   engine/

   # Account profiles are committable when they describe synthetic businesses;
   # nothing here excludes them. Review a profile copied from a real account
   # before committing it.

   # Transient capture output; copy keepers to assets/
   runs/

   # Per-machine owner identity (for the SessionStart area roll-up) and
   # transient reporting-sink thread refs — both workspace-specific, never committed
   .me
   .reporting-state.json
   ```

5. Confirm creation to the user

## Template: README.md

````markdown
# QA Specs

This directory contains test specifications for automated QA testing.

## Running Tests

```bash
# Run all specs
/know-qa:run --project .

# Run a specific spec
/know-qa:run --project . --spec smoke-test

# Run against a different URL
/know-qa:run --project . --spec smoke-test --url https://staging.example.com
```

## Writing Specs

Specs are Markdown files with the following structure:

- **Overview**: What is being tested and why
- **Base URL**: Default URL to test against
- **Personas**: User types to test as (with credentials)
- **Viewports**: Screen sizes to test
- **Test Scenarios**: Step-by-step tests with expected outcomes
- **Tags**: Label scenarios with `tags: [smoke, critical, regression, a11y]` for selective execution
- **Dependencies**: Use `depends_on: Scenario Name` when scenarios require prior scenarios to pass
- **Environments**: Define `## Environments` with profiles for local/staging/production
- **Accessibility Focus**: Add `## Accessibility Focus` section to trigger deep a11y testing
- **Edge Cases**: Specific edge cases to verify
- **Things to Watch For**: Performance, security, accessibility concerns

See `smoke-test.md` for an example.
````

## Template: smoke-test.md

```markdown
# Smoke Test

## Overview
Quick health check to verify the application is running and core functionality works.

## Base URL
http://localhost:3000

## Environments

### local
- **base_url**: http://localhost:3000

## Test Scenarios

### 1. Application Loads
tags: [smoke]
**Steps:**
1. Navigate to the home page

**Expected:**
- Page loads without errors
- No console errors
- Main content is visible

### 2. Navigation Works
tags: [smoke]
**Steps:**
1. Click each link in the main navigation

**Expected:**
- Each page loads
- No 404 errors
- No console errors

### 3. Core Feature Works
tags: [smoke]
**Steps:**
1. [Describe your app's core feature]

**Expected:**
- [Describe expected behavior]

## Things to Watch For
- Page load time should be under 3 seconds
- No JavaScript errors in console
- No failed network requests (except expected 401s for auth)
```

## After Initialization

Inform the user:
1. The `.know-qa/` directory has been created
2. They should customize `smoke-test.md` for their application
3. They can add more spec files as needed
4. Run tests with `/know-qa:run --project {path}`
5. Specs support tags, dependencies, data-driven scenarios, environments, and accessibility depth — see `${CLAUDE_PLUGIN_ROOT}/examples/SPEC-FORMAT.md` for the full reference
6. To split the app into owned areas (so each owner runs/monitors their slice), author `.know-qa/areas.json` — by hand or with `/know-qa:start` — then use `/know-qa:run --area <key>` / `--owner <handle>`. Leaving it empty keeps area features off.
