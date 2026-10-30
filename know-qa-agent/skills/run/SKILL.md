---
name: know-qa:run
description: Run QA tests against a web application using spec files or ad-hoc instructions
argument-hint: "--project <path> --spec <name> --url <base-url> --tag <tag> --env <profile> --unattended task"
allowed-tools: Read, Write, Bash, Grep, Glob, Agent, Edit
---

# /know-qa:run

Run QA tests against a web application.

## Usage Modes

### Mode 1: Run a spec file
```
/know-qa:run --project ~/Projects/my-app --spec login
```
This runs the spec at `~/Projects/my-app/.know-qa/login.md`

### Mode 2: Run all specs in a project
```
/know-qa:run --project ~/Projects/my-app
```
This runs all `.know-qa/*.md` specs in the project.

### Mode 3: Ad-hoc testing
```
/know-qa:run --url http://localhost:3000 "Test that the homepage loads without console errors and all navigation links work"
```
This runs an ad-hoc test without a spec file.

### Mode 4: Override base URL
```
/know-qa:run --project ~/Projects/my-app --spec login --url https://staging.example.com
```
This runs the login spec but against staging instead of the URL in the spec.

### Mode 5: Run filtered by tag
```
/know-qa:run --project ~/Projects/my-app --tag smoke
```
Runs only scenarios tagged with `smoke` across all specs.

### Mode 6: Run with environment profile
```
/know-qa:run --project ~/Projects/my-app --spec checkout --env staging
```
Runs the checkout spec using the `staging` environment profile.

### Mode 7: Combined filtering
```
/know-qa:run --project ~/Projects/my-app --tag critical --env staging
```
Runs only `critical`-tagged scenarios against the staging environment.

### Mode 8: Run with specific browser engines
```
/know-qa:run --project ~/Projects/my-app --spec checkout --browsers
```
Runs the checkout spec using the browser engines defined in the spec's `## Browsers` section.

### Mode 9: Run a single area
```
/know-qa:run --project ~/Projects/my-app --area checkout
```
Runs only the scenarios that belong to the `checkout` area, resolved from `.know-qa/areas.json`. Requires `.know-qa/areas.json` — see "Area resolution" below.

### Mode 10: Run everything an owner owns
```
/know-qa:run --project ~/Projects/my-app --owner jdoe
```
Runs every area owned by `jdoe` (the union of their areas' scenarios), resolved from `.know-qa/areas.json`.

## Parsing Arguments

From the user's input, extract:

1. **project**: Path to the project containing `.know-qa/` specs (optional)
2. **spec**: Name of a specific spec file to run (without .md extension) (optional)
3. **url**: Base URL to test against (optional, can come from spec)
4. **task**: Ad-hoc test description in quotes (optional, used when no spec)
5. **tag**: Tag name to filter scenarios (optional). Only scenarios with this tag will run. Multiple tags can be comma-separated (e.g., `--tag smoke,critical`) — scenario must match ANY listed tag (OR logic).
6. **env**: Environment profile name to activate (optional). Selects the matching profile from the spec's `## Environments` section.
7. **unattended**: Boolean flag (optional, default off). Declares that no human is present for this run. Adds the "Unattended run" block to the tester's assignment (see Agent Invocation). It does NOT change what may be written — `environments.json` remains the sole write authority either way. Callers (e.g. an orchestrating plugin or a `/loop` recurrence) set this explicitly; never infer it.
8. **area**: One or more area keys, comma-separated (optional). Resolved against `{project}/.know-qa/areas.json` into the spec/scenario selection — it is NOT a runtime filter handed to the agent. See "Area resolution" (Step 3.5).
9. **owner**: An owner handle (optional). Expands to every area that handle owns, then resolves exactly like `--area`. See "Area resolution" (Step 3.5).

## Execution Flow

### If a spec is provided:

0. **Compile the deterministic run manifest before spawning an agent.** The
   workspace copy is the execution authority:

   ```bash
   node "{project}/.know-qa/engine/manifest.mjs" \
     --project "{project}" \
     [--spec "{spec}"] [--url "{url}"] [--tag "{tags}"] \
     [--env "{env}"] [--area "{areas}"] [--owner "{owner}"]
   ```

   If `.know-qa/engine/manifest.mjs` is missing, stop and route to `/know-qa:init`; do not
   fall back to model-authored selection. Read the emitted
   `.know-qa/runs/<run-id>/run-manifest.json` in full. It is authoritative for source
   hashes, environment, selected scenarios, auto-included dependencies, browser
   × viewport × persona × data-variant cells, cell IDs, and initial statuses.
   Never silently omit a manifest cell. Browser execution remains delegated
   browser execution to the tester agent, but selection and matrix bookkeeping
   no longer come from prose interpretation.

1. Read the spec file from `{project}/.know-qa/{spec}.md` for test intent and detailed
   steps; do not re-derive selection or matrix dimensions from it.
2. Read the manifest to understand:
   - Base URL (can be overridden by --url flag)
   - Personas to test as
   - Viewports to test at
   - Test scenarios
   - Edge cases
   - Things to watch for
3. **Environment resolution**: use `manifest.environment`. The manifest never
   serializes credentials; when `credentials_present` is true, resolve the
   referenced environment variable or local secret only at execution time.
   Unknown requested environments are a preflight error, never a fallback.

   **3.5. Area resolution** (only when `--area` or `--owner` is provided): this
   is performed by the manifest engine. The rules below define the engine
   contract; the skill verifies the resulting stamps but does not repeat the
   resolution.

   1. Read `{project}/.know-qa/areas.json`. If the file is absent but `--area`/`--owner` was given, stop and tell the user: "`--area`/`--owner` needs a `.know-qa/areas.json` — run `/know-qa:start` or author one (see SPEC-FORMAT.md)."
   2. If `--owner <handle>` was given, expand it to the set of `areas[].key` whose `owner` equals that handle. If none, exit: "no areas owned by `<handle>` in areas.json."
   3. For each selected area, determine its **scenario membership** and **spec universe**:
      - **Membership** — a scenario belongs to an area if it carries the area's membership tag (`match.tag`, default `area:<key>`), OR any tag in `match.tags`, OR lives in a spec file matched by a `match.specs` glob.
      - **Spec universe** — if the area declares `match.specs`, that glob set; otherwise all `{project}/.know-qa/*.md`.
      - If `status: not-implemented`: by default skip the area with a logged note (`area <key> is not-implemented — skipped`). Only when the user **explicitly** named it via `--area` do you run it, restricted to `smoke`-tagged scenarios, and set the not-implemented flag in the Area Scope block so the agent treats the feature's absence as expected (no missing-feature defects).
   4. Build the working scenario list = scenarios in the union of spec universes that satisfy area membership. **Stamp** each surviving scenario with the area whose membership it matched (first listed area wins on ties).
   5. If this resolves to **0 scenarios**, exit like the no-tag case: "`--area <key>` resolved to 0 scenarios — check the `area:<key>` tags or `match.specs` in areas.json."
   The user's `--tag`, if also present, then applies in Step 4 on these survivors (net effect: AND — "checkout scenarios that are also smoke").
4. **Tag filtering**: already compiled into `manifest.scenarios`; report zero
   selection as the manifest engine's preflight error.
5. **Dependency resolution**: already compiled into `scenario.depends_on` and
   `selection.auto_included_dependencies`. Dependency cycles are rejected before
   the manifest is written.
6. Launch the `qa-tester` agent with the spec content and instructions
7. Execute every viewport represented by `manifest.cells`.
8. Execute every persona and data variant represented by `manifest.cells`.
9. The agent will work through the spec systematically
10. **Browser engine preflight**: use each cell's `browser` and `cli_browser`.
    Verify every represented engine is available. Chrome is the installed system
    browser checked by `/know-qa:init`; for Firefox/WebKit run
    `playwright-cli install-browser <engine>` when installation is authorized
    and possible. If an engine remains unavailable, mark its manifest cells
    `blocked`; never shrink the manifest.

    After resolving the host's available CLI browser values, record the result:

    ```bash
    node "{project}/.know-qa/engine/browser-preflight.mjs" \
      --manifest "{manifest-path}" \
      --available "chrome[,firefox,webkit]"
    ```

11. **Reconcile, schedule, and execute through cell lifecycle commands.** Before
    dispatch—and again after any context/process interruption—run:

    ```bash
    node "{project}/.know-qa/engine/cell.mjs" reconcile --manifest "{manifest-path}"
    node "{project}/.know-qa/engine/cell.mjs" next --manifest "{manifest-path}"
    ```

    `next` returns the next dependency-ready pending/incomplete cell, skips
    dependents whose prerequisite failed/blocked/skipped, or prints `DONE`.
    Continue until `DONE`; do not rebuild progress from conversation memory.
    For every returned cell:

    ```bash
    node "{project}/.know-qa/engine/cell.mjs" start \
      --manifest "{manifest-path}" --cell "{cell-id}"
    ```

    This atomically marks the cell `running` and creates its structured scaffold
    at the cell's `result_path`. Give the tester agent that exact cell and result
    path. During execution it appends contract-shaped objects to `actions`,
    `assertions`, `observations`, `evidence`, `findings`,
    `surfaced_decisions`, and `cleanup`; it never changes identity, timestamps,
    or status directly.

    When the tester returns, validate and close the cell:

    ```bash
    node "{project}/.know-qa/engine/cell.mjs" complete \
      --manifest "{manifest-path}" --cell "{cell-id}" \
      --status "{passed|failed|blocked|incomplete}"
    ```

    Use `incomplete` when execution is interrupted or cannot reach a judgment.
    The engine rejects illegal transitions and malformed results. A terminal
    cell cannot silently be rerun. Scenario status is derived from its cells.

12. **Track and close cleanup.** Every created account, record, upload, or other
    reversible mutation must be added immediately:

    ```bash
    node "{project}/.know-qa/engine/cleanup.mjs" add --manifest "{manifest-path}" \
      --cell "{cell-id}" --kind "{kind}" --description "{what was created}" \
      --action "{how to remove it}"
    ```

    Complete or explicitly waive every ledger entry with evidence. Pending
    cleanup forces `pass-with-concerns`; it can never disappear from the report.

13. **Compile authoritative outputs.** After scheduling reaches `DONE`:

    ```bash
    node "{project}/.know-qa/engine/compile.mjs" --manifest "{manifest-path}"
    node "{project}/.know-qa/engine/payload.mjs" --manifest "{manifest-path}" --type sink
    node "{project}/.know-qa/engine/payload.mjs" --manifest "{manifest-path}" --type filing
    ```

    The compiler validates manifest/result agreement and derives the run
    summary, Markdown report, history entry, and findings registry. Skills and
    connectors consume these sanitized derived files, never raw run evidence.

### If ad-hoc task is provided:

1. Verify a URL was provided
2. Launch the `qa-tester` agent with the URL and task description
3. The agent will use its judgment to thoroughly test the described functionality

### If neither spec nor task:

Ask the user what they want to test.

## Agent Invocation

Before spawning, gather two things:

1. **The finding contract**: read `${CLAUDE_PLUGIN_ROOT}/reference/finding-lifecycle.md` in full. It is forwarded verbatim into the assignment below — it defines the finding shape, disposition taxonomy, noise discipline, reliability labels, and registry rules the agent must apply.
2. **The findings registry**: if `{project}/.know-qa/FINDINGS.md` exists and has active (non-Archive) entries, include them in the assignment so the agent can dedup against them.

Spawn the `qa-tester` agent with a prompt structured like:

```
## Test Assignment

**Mode**: [Spec-based / Ad-hoc]
**Base URL**: {url}
**Project**: {project or "N/A"}
**Run manifest**: {manifest-path}
**Manifest cell ID**: {cell-id}
**Structured result**: {absolute path resolved from cell.result_path}

{If spec-based:}
## Spec Content
{full content of the spec file}

{If environment profile active:}
## Active Environment
**Profile**: {profile_name}
**Base URL**: {profile.base_url}
**Credentials**: {profile.credentials or "use spec defaults"}
**Timeouts**: {profile.timeouts or "use defaults"}

{If tag filtering active:}
## Tag Filter
**Active tags**: {tag_list}
**Scenarios to run**: {filtered scenario names}
**Auto-included dependencies**: {dependency scenario names, if any}

{If area resolution active (Step 3.5):}
## Area Scope
**Area(s)**: {key (display)} — owner @{owner handle}
**Status**: {implemented | not-implemented}
{If the area declares invariants:}
**Invariants to assert** (treat as always-true; flag any violation): {areas[].invariants}
These scenarios are ALREADY scoped to this area — do NOT re-filter by area. Stamp every finding with `area={key}` and `owner={handle}` so it routes (for multi-area runs, use the area each finding's scenario was stamped with).
{If status is not-implemented:} This area is not-implemented — the feature is EXPECTED to be absent. Do a smoke-level presence check only; do NOT file missing-feature findings as defects (an absence is at most an observation).

{If spec has dependencies:}
## Execution Notes
- Scenarios have dependencies. If a dependency fails, skip dependent scenarios.
- Process scenarios in listed order — dependencies resolve top-to-bottom.

{If spec has data-driven scenarios:}
## Execution Notes
- Some scenarios have data sets. Run each data set as a separate variant.
- Report per-variant: "Scenario X [variant-name]: PASS/FAIL"

{If spec has Visual Focus section:}
## Visual Focus
**Areas**: {area list, or "all (full Tier 2)" if present but empty}
Run Tier 2 visual checks per your Visual Focus Trigger.

{If spec has Design Reference section:}
## Design Reference
{full content of the ## Design Reference section from the spec, including viewport subsections and image paths}

{If spec has Browsers section:}
## Browser Engines
**Engines to test**: {comma-separated engine list from spec}
**Active engine for this run**: {current engine}
**playwright-cli browser value**: {chrome for chromium; otherwise current engine}
Run the full test once per engine. Report results labeled by engine: "[chromium] Scenario X: PASS"

{If spec has no Browsers section:}
## Browser Engines
**Engine**: chromium (default)
**playwright-cli browser value**: chrome

{If --unattended was passed:}
## Unattended run
No human is present for this run. Do not pause to ask anyone anything.
- `{project}/.know-qa/environments.json` remains the sole write authority — default-deny stands, and nothing about unattended mode loosens it. Origins it write-allows may be driven, including actions a spec deliberately marks as abuse attempts; origins it doesn't stay read-only, full stop.
- Where your methodology would normally check in with a human (a destructive-looking action on a write-allowed origin, an ambiguous spec step, an unexpected dialog), take the conservative action that keeps the run going and record what you chose and why as an observation or finding.
- needs_design_judgment items still go in your "Surfaced for decision" block — being unattended never means resolving design judgment yourself.

{If ad-hoc:}
## Task
{user's task description}

## Finding Contract
{full content of ${CLAUDE_PLUGIN_ROOT}/reference/finding-lifecycle.md}

{If the project has a FINDINGS.md with active entries:}
## Findings Registry (current active entries from {project}/.know-qa/FINDINGS.md)
{active entries — dedup new findings against these by root cause; matches are known_issue}

## Instructions
Execute this test assignment following your QA methodology. Remember to:
- Execute only the assigned manifest cell. Do not alter its browser, viewport,
  persona, data variant, dependencies, or evidence policy.
- Keep the structured result current as you work: append actions, assertions,
  observations, sanitized evidence references, findings, surfaced decisions,
  and cleanup records to the scaffold created by `cell.mjs start`. Do not edit
  its identity, timestamps, or status; `cell.mjs complete` owns those fields.
- Take screenshots at key points — and look at them; the rendered screen is one of your four signals in every mode
- Check console after every interaction
- Monitor network requests
- Try relevant edge cases
- Report findings with full context
- Escalate if you see repeated failures
- Apply the Finding Contract above to every finding: noise-filter against the known-benign classes (warm/cold confirm) before reporting, reproduce once and label reliability, classify disposition, and dedup against the registry when one is provided
- Group findings in your summary by confidence: "Definite Issues" (high), "Likely Issues" (medium), "Possible Issues" (low) — confidence per the contract (certainty x severity), with a brief rationale for each
- Route by disposition: needs_design_judgment items go in a separate "Surfaced for decision" block, spec_ambiguity items are asked as questions, environment_noise discards get a one-line audit note
- Show ALL findings — do not filter out low-confidence items
- Apply the visual corroboration rule: visual-only findings cap at Medium confidence and never gate pass/fail
- Monitor network requests during every interaction:
  - Flag failed requests (4xx/5xx) and correlate with what the UI shows
  - Flag slow API calls (> 1s default) — note the endpoint and response time
  - Note any mixed content (HTTP on HTTPS) or over-fetching patterns
  - Include network findings in your confidence-grouped summary
- Test across viewports: Run each scenario at each viewport defined in the spec (default: mobile/tablet/desktop). Check for responsive issues, touch target sizes at mobile, and horizontal scrolling
- Test across personas: If spec defines personas, run scenarios as each persona. Handle login/logout between persona switches. Verify role-based content visibility
- When testing forms, apply exhaustive form testing methodology:
  - Test all validation states (empty, invalid, boundary values, injection strings)
  - Verify error messages are visible, associated with correct fields, and helpful
  - Test all submission states (loading indicator, success feedback, error handling, double-submit prevention)
  - Check field type attributes and autofill behavior
  - For multi-step forms: test back/forward navigation and data persistence across steps
- Check for SPA-specific issues during navigation:
  - Verify URL and page title update on route changes
  - Test browser back/forward through client-side routes
  - Check state persistence across navigation (form data, filters, selections)
  - Watch for hydration mismatches (console warnings, content flashing)
- Test error recovery for critical flows:
  - Use `playwright-cli route` to simulate API failures when spec requests error testing
  - Verify error messages are user-friendly (no raw stack traces)
  - Check that recovery paths exist (retry button, navigate away, dismiss error)
- Perform structured accessibility checks on every page/flow:
  - Focus management: When modals/dialogs open, verify focus moves in, is trapped (Tab cycles within), and returns to trigger on close
  - Skip links: Tab once on page load — check for skip link, activate it, verify focus moves to target
  - Heading hierarchy: Audit h1-h6 tree — single h1, no skipped levels. Flag component-internal gaps as Medium confidence
  - Landmark regions: Verify main, banner, contentinfo, navigation roles exist
  - Page title: Verify title updates on SPA route changes
  - Lang attribute: Check html element has valid lang attribute
  - aria-live: When dynamic content appears, verify aria-live region exists and receives content
  - Touch targets: At mobile viewport, measure all interactive elements — flag any below 44x44px
  - Color sole indicator: When testing state changes, verify non-color indicators exist (text, icon, border)
  - Reduced motion: Use `playwright-cli eval` or `playwright-cli run-code` to set prefers-reduced-motion: reduce, verify animations stop
  - Zoom: At desktop viewport, simulate 200% text zoom and check for overflow or content loss
  - Form errors: After submission with errors, check for error summary, links to fields, aria-invalid on errored fields, and focus on first error
  - Deterministic passes (Tier 2, when the project has `.know-qa/tools/` deployed): run `contrast.mjs` (exact WCAG AA ratios; solid-background failures are High confidence with the measured ratio; gradient/image cases are needs-review) and `axe.mjs` (full axe-core ruleset; critical/serious → High, moderate/minor → Medium; "incomplete" items judged, never dropped) per distinct page
  - ARIA widget keyboard conformance (Tier 2): drive composite widgets (menu buttons, comboboxes, tabs, disclosures) through their ARIA Authoring Practices keyboard contracts and observe focus and aria state — a mouse-only widget is a High confidence finding

Begin testing.
```

## Output

The agent will provide:
- Step-by-step progress through the test
- Screenshots as evidence
- Console/network observations
- Final summary with:
  - Overall result (Pass / Fail / Pass with Concerns)
  - Definite Issues (high confidence) — these need immediate attention
  - Likely Issues (medium confidence) — should be investigated
  - Possible Issues (low confidence) — worth noting for future review
  - Surfaced for decision (needs_design_judgment items — questions for the human, not bugs)
  - Observations (things that worked but are worth noting)
  - Recommendations (if any)
  - Network observations (slow calls, failed requests, over-fetching, mixed content)
  - SPA issues (route sync, history, state persistence, hydration)
  - Error recovery observations (how the app handles failures)
  - Accessibility findings (focus management, page structure, skip links, landmarks, touch targets, reduced motion, zoom, form error patterns)

Each issue in the report carries its contract fields (symptom, expected/actual, evidence, severity, confidence, reliability, root-cause hypothesis, disposition) so `/know-qa:report` and the findings registry can consume it without re-derivation.

### Registry update (when the project has `.know-qa/FINDINGS.md`)

After the agent completes, append findings dispositioned `defect` or confirmed `likely_defect` that are **not** dedup matches to `{project}/.know-qa/FINDINGS.md` with `status: open`, using the entry shape from the finding contract (next `F-YYYYMMDD-NN` id). For dedup matches, update the existing entry's `last_seen` instead. Don't add `environment_noise` or `spec_ambiguity` items to the registry; `needs_design_judgment` items enter only if the human decides they're defects.

**Area/owner stamping** (only when `{project}/.know-qa/areas.json` exists): record the optional `area` and `owner` fields on each new entry. If the run was area-scoped (Step 3.5), use the area each finding's scenario was stamped with. If the run was not area-scoped, derive the area by matching the finding's `scenario`/spec against each area's `match` (first match wins; none or ambiguous → leave both fields blank). Stamping is metadata only — it never changes a finding's disposition or confidence.

### Session state (multi-spec sweeps)

When running **all specs** (Mode 2) or a multi-spec tagged sweep, maintain `{project}/.know-qa/QA-SESSION-STATE.md` so a context clear mid-sweep is resumable: create it from `${CLAUDE_PLUGIN_ROOT}/examples/qa-session-state-template.md` if absent (or resume the existing one), and update it between specs — environment under test, specs completed/remaining in order, findings so far (with dispositions), and open questions. Single-spec and ad-hoc runs don't need it.

## Examples

**Run the checkout spec on local:**
```
/know-qa:run --project ~/Projects/store --spec checkout
```

**Run all specs against staging:**
```
/know-qa:run --project ~/Projects/store --url https://store.staging.example.com
```

**Quick ad-hoc test:**
```
/know-qa:run --url http://localhost:3000 "Verify the search function returns relevant results and handles empty queries gracefully"
```

**Test a specific flow on mobile viewport:**
```
/know-qa:run --url http://localhost:3000 "Test the checkout flow on mobile viewport (375x667), ensure all buttons are tappable and forms are usable"
```

**Run only smoke tests:**
```
/know-qa:run --project ~/Projects/store --tag smoke
```

**Run critical tests on staging:**
```
/know-qa:run --project ~/Projects/store --tag critical --env staging
```

**Run multiple tags:**
```
/know-qa:run --project ~/Projects/store --tag smoke,regression
```

**Run a single area:**
```
/know-qa:run --project ~/Projects/store --area checkout
```

**Run everything one owner owns, smoke only:**
```
/know-qa:run --project ~/Projects/store --owner jdoe --tag smoke
```

**Unattended run (no human present — e.g. from /loop or an orchestrating plugin):**
```
/know-qa:run --project ~/Projects/store --tag smoke --unattended
```

**Run across browser engines defined in spec:**
```
/know-qa:run --project ~/Projects/my-app --spec homepage
```
If the homepage spec has a `## Browsers` section listing chromium and webkit, the skill runs the full test suite once per engine.
