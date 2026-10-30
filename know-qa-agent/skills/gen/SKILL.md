---
name: know-qa:gen
description: Generate a QA spec from a description, existing documentation, or by exploring the application
argument-hint: "<spec-name> --from <source> --a11y-depth <level> description"
---

# /know-qa:gen

Generate a QA test specification.

## Usage Modes

### Mode 1: Generate from description
```
/know-qa:gen login "User authentication flow with email/password, including forgot password"
```

### Mode 2: Generate from existing documentation
```
/know-qa:gen checkout --from ~/Projects/store/docs/checkout-flow.md
```

### Mode 3: Generate by exploring the app
```
/know-qa:gen user-profile --from http://localhost:3000/profile "Explore the user profile page and generate a spec for testing it"
```

### Mode 4: Generate from a paired session (pair-then-automate)
```
/know-qa:gen checkout-flow --from-session checkout-calibration
```
Emits the flow a human calibrated during a `/know-qa:pair` session as a runnable spec — calibration by hand, scale by machine.

## Parsing Arguments

From the user's input, extract:

1. **spec-name**: Name for the new spec file (required)
2. **--from**: Source to generate from (optional)
   - If a file path: Read and use as reference
   - If a URL: Explore the page and infer testable behaviors
3. **--from-session**: Name of a paired-session capture under `{project}/.know-qa/runs/` (optional; see Mode 4)
4. **--a11y-depth**: Accessibility depth level (optional). Values: `baseline` (default, Tier 1 only), `deep` (includes `## Accessibility Focus` section in generated spec, triggering Tier 2 structured checks)
5. **description**: Natural language description of what to cover (optional)

## Generation Process

### From Description Only

1. Create a well-structured spec based on the description
2. Include standard sections:
   - Overview (from description)
   - Base URL (placeholder)
   - Test scenarios (inferred from description)
   - Common edge cases for that type of feature
   - Standard things to watch for
3. Mark areas that need human review with `[TODO: ...]`
4. Assign `tags:` to every scenario based on type (see scenario template below)
5. Add `depends_on:` to scenarios that logically require a prior scenario to have run
6. If `--a11y-depth deep`: Add `## Accessibility Focus` section listing all focus areas: `focus-management`, `page-structure`, `interactive-elements`, `form-accessibility`, `contrast`, `aria-widgets`. Add `a11y` tag to any scenarios with accessibility implications.

### From Documentation

1. Read the source document
2. Extract:
   - Feature purpose and intent
   - User flows described
   - Edge cases mentioned
   - Acceptance criteria
3. Transform into spec format
4. Mark assumptions with `[VERIFY: ...]`
5. Assign `tags:` to every scenario based on type (see scenario template below)
6. Add `depends_on:` to scenarios that logically require a prior scenario to have run
7. If `--a11y-depth deep`: Add `## Accessibility Focus` section listing all focus areas: `focus-management`, `page-structure`, `interactive-elements`, `form-accessibility`, `contrast`, `aria-widgets`. Add `a11y` tag to any scenarios with accessibility implications.

### From Live URL

1. Use the qa-tester agent to explore the URL
2. Identify:
   - Page structure and components
   - Interactive elements (forms, buttons, links)
   - Visible states and flows
3. Generate a spec that covers observed functionality
4. Mark as exploratory with `[OBSERVED: ...]` for behaviors that should be verified
5. Assign `tags:` to every scenario based on type (see scenario template below)
6. Add `depends_on:` to scenarios that logically require a prior scenario to have run
7. If `--a11y-depth deep`: Add `## Accessibility Focus` section listing all focus areas: `focus-management`, `page-structure`, `interactive-elements`, `form-accessibility`, `contrast`, `aria-widgets`. Add `a11y` tag to any scenarios with accessibility implications.

### From a Paired Session (Mode 4)

The capture trail of a `/know-qa:pair` session is the source: each `drive.mjs` step recorded its action, final URL, title, and the console/network state around it.

1. Reconstruct the action sequence: read `{project}/.know-qa/runs/{session-name}-step*/summary.json` (and each step's `report.md`) in step order — the step captures; the passive monitor's `{session-name}-watch/` dir holds an events log, not step summaries — every step's `action` field ("navigate …", "click text …") and `finalUrl` chain into the flow the human drove. Cross-check against the session narrative in `{project}/.know-qa/QA-SESSION-STATE.md` (routes visited, what was being calibrated) and the session report in `.know-qa/reports/` if present.
2. Emit scenarios whose **steps mirror the calibrated flow** — the same navigations and interactions, in order, described by intent ("click 'Delete draft' in the row's overflow menu") rather than raw selectors where the captures make the intent clear.
3. Derive **expected results from what was actually observed**: settled page state, requests that fired and their statuses, console quiet/noisy. Mark each with `[OBSERVED: ...]` — they describe what the app *did* during calibration, which the human treated as correct.
4. Findings made during the session do **not** become expected results — a calibrated spec asserts the healthy path. Where the session surfaced a judgment call (a `needs_design_judgment` item, an ambiguous state), flag it `[CONFIRM: ...]` for the human to resolve before the spec runs autonomously.
   - **When calibration observed known-defective state** (the flow crossed pages with open registry entries): neither bake the broken behavior in as `[OBSERVED]` nor assert a healthy path that fails every run until fixes land. Emit the healthy-path expectation wrapped in a `[CONFIRM: ...]` block that cites the registry ids ("expected once F-…-01/-02 are fixed — confirm whether this scenario should gate before then") and let the human decide.
5. Assign `tags:`/`depends_on:` as in the other modes. If the session ran against a gated deployment, note in the spec's Environments section that the target requires the harness's saved auth session (`.know-qa/tools/.auth/` via `login.mjs`) — credentials never enter the spec.
6. Tell the human: review the `[OBSERVED]`/`[CONFIRM]` markers, then `/know-qa:run --project {project} --spec {spec-name}` runs it autonomously with the same four-signal inspection the paired session used.

## Output

Write the generated spec to the project's `.know-qa/` directory (prompt for project path if not clear).

Structure the output as:

```markdown
# {Feature Name}

## Overview
{Generated overview}

## Base URL
{URL from --from flag or [TODO: Set base URL]}

## Viewports
- Mobile: 375x812
- Tablet: 768x1024
- Desktop: 1280x800

## Environments (optional)
### local
- **base_url**: http://localhost:3000
- **credentials**: Use test accounts

### staging
- **base_url**: [TODO: Set staging URL]
- **credentials**: [TODO: Set staging credentials]

## Personas
### Default User
- **Role:** Regular user
- **Auth:** [TODO: Set login credentials or auth method]

### Admin (if applicable)
- **Role:** Administrator
- **Auth:** [TODO: Set admin credentials or auth method]

## Test Scenarios

### 1. {Scenario Name}
**tags:** [smoke, critical]
{Generated happy-path scenario}

### 2. {Scenario Name}
**tags:** [regression]
**depends_on:** {Prior scenario name, if applicable}
{Generated error/validation/edge-case scenario}

...

## Edge Cases to Verify
{Standard edge cases for this feature type}

### Form Testing (if forms are present)
- Empty submission of all required fields
- Invalid formats for typed fields (email, phone, date)
- Boundary values (min/max length, special characters)
- Rapid double-submit
- Multi-step navigation (if applicable): forward, backward, data persistence

## Things to Watch For
{Standard concerns plus any inferred from source}

## Accessibility Focus (when --a11y-depth deep)
- focus-management
- page-structure
- interactive-elements
- form-accessibility
- contrast
- aria-widgets

---
*This spec was generated and should be reviewed for accuracy.*
*Items marked [TODO], [VERIFY], or [OBSERVED] need human attention.*
```

## Tag Assignment Guide

When generating scenarios, assign tags based on scenario type:

- **First/happy path scenario**: `tags: [smoke, critical]`
- **Error/validation scenarios**: `tags: [regression]`
- **Edge case scenarios**: `tags: [regression]`
- **Accessibility-focused scenarios**: `tags: [a11y]`

Custom tags are allowed — these are standard defaults. Users can add or change tags after generation.

## Examples

**Generate auth spec from scratch:**
```
/know-qa:gen auth "Login, logout, password reset, and session management"
```

**Generate from a PRD:**
```
/know-qa:gen search --from ./docs/search-feature-prd.md
```

**Generate by exploring:**
```
/know-qa:gen settings --from http://localhost:3000/settings "Document all the settings options and generate tests for each"
```

**Generate spec with deep accessibility:**
```
/know-qa:gen dashboard --a11y-depth deep "Admin dashboard with data tables, filters, and export"
```

**Generate from app with accessibility focus:**
```
/know-qa:gen settings --from http://localhost:3000/settings --a11y-depth deep
```

## After Generation

Inform the user:
1. The spec has been created at `.know-qa/{spec-name}.md`
2. They should review items marked with [TODO], [VERIFY], or [OBSERVED]
3. Customize edge cases and thresholds for their specific needs
4. Tags can be customized — add, remove, or change tags on any scenario. Additional custom tags (e.g., `payment`, `auth`) are fully supported alongside the standard ones.
5. If the spec includes `## Environments`, fill in real base URLs and credentials for each profile before running against those environments.
6. If generated with `--a11y-depth deep`, the spec includes an `## Accessibility Focus` section — this activates Tier 2 structured accessibility checks when run with `/know-qa:run`.
7. Run with `/know-qa:run --spec {spec-name}` when ready
