---
name: research-progress
description: This skill should be used when the user asks where the research project stands or what to do next (e.g. "research progress", "where am I in the research", "what's next"). Read-only dashboard — reports the active phase, per-phase source counts, discovery-strategy status, the Phase Tier Record, and the next recommended action.
allowed-tools: Read, Grep, Glob, Bash
---

# /know-research:progress

Show the current state of the research project as a dashboard.

## Current State

!`cat research/STATE.md 2>/dev/null || echo "No STATE.md found — run /know-research:init first."`

## Process

1. **Run infrastructure health checks** — collect all check results into a failures list (empty list = all pass):

   **1a. Plugin hooks manifest sound** — Read `${CLAUDE_PLUGIN_ROOT}/hooks/hooks.json` (the plugin ships its hooks here — NOT in the project's `.claude/settings.json`) and verify:
   - It parses as valid JSON with a `hooks` key.
   - `hooks.PreToolUse` contains an entry whose `matcher` covers Write, Edit, and MultiEdit (the shipped form is the combined matcher `"Write|Edit|MultiEdit"` — a combined matcher passes this check) and whose command invokes `gate-outputs.sh` — failure name: "outputs gate hook missing from plugin hooks.json" — failure description: "this hook blocks unaudited Write/Edit/MultiEdit to research/outputs/ on Claude Code; in Cowork hooks don't run and the gate holds structurally (audit-claims is the only writer)"
   - `hooks.PreCompact` contains an entry invoking `state-staleness-check.sh` — failure name: "PreCompact staleness hook missing from plugin hooks.json" — failure description: "this hook warns when STATE.md is stale before context compacts"

   **1b. Project pre-allow present** — Read `.claude/settings.json`. If it exists, confirm it parses as valid JSON and `permissions.allow` is an array (this is the pre-allow list `/know-research:init` writes so researcher's tools don't prompt per call — it does not carry hooks).
   - Failure name: "project settings.json invalid or missing pre-allow"
   - Failure description: "without the permissions.allow list from /know-research:init, Claude Code prompts on every tool call; the audit gate itself is unaffected (it ships in the plugin's hooks.json). Inert in Cowork."
   - If the file does not exist, report this same failure (init writes it); if running in Cowork, note it as informational rather than a failure.

   **1c. STATE.md structurally sound** — Read `research/STATE.md` and confirm it contains a `## Current Position` section with an `Active phase:` field and a `## Current Phase Cycle` section with a five-step checklist. (STATE.md has no YAML frontmatter — the init template never writes one; do not check for frontmatter.)
   - Failure name: "STATE.md missing required sections"
   - Failure description: "STATE.md must carry Current Position (with Active phase) and Current Phase Cycle — these are what session resume and the cycle skills read; without them the project position is unrecoverable"
   - If `research/STATE.md` does not exist, this check passes silently (no active research project)

   **1d. Reference files present** — Glob `${CLAUDE_PLUGIN_ROOT}/reference/` for these specific items: `coverage-assessment-guide.md`, `evidence-failure-modes.md`, `pattern-recognition-guide.md`, `source-assessment-guide.md`, `tools-guide.md`, `writing-standards.md`, `templates/` directory.
   - Failure name: "[filename] missing from ${CLAUDE_PLUGIN_ROOT}/reference/"
   - Failure description: "reference files guide source assessment, evidence evaluation, and output formatting — missing files degrade research quality"

   **1e. Discovery strategy present** — When `research/` directory exists (active research project), check for `research/discovery/strategy.md` (the canonical path written by `/know-research:init` Step 4).
   - Failure name: "discovery strategy missing"
   - Failure description: "a discovery strategy guides source finding — `/know-research:init` writes `research/discovery/strategy.md` and `/know-research:discover` reads it; without one, source selection is ad-hoc."
   - If no `research/` directory exists, this check passes silently

1f. **Completion is a claim, not a fact — validate it.** If STATE.md's Current Position
   carries a completion sentinel (a `- Completion:` bullet saying `ALL PHASES COMPLETE —
   validated closeout …` or `CLOSED UNREVIEWED — administrative archive …`), never repeat
   it as true without checking. Run:

   ```
   python3 research/bin/validate-corpus-review.py check-completion --root . --json
   ```

   (If `research/bin/validate-corpus-review.py` is missing while the sentinel or a
   `Review protocol:` line is present, that is protocol damage — report "completion
   claim cannot be validated: the installed validator is missing; repair via re-init"
   and treat the claim as unverified.) Route on the exit code and carry the result into
   the dashboard:
   - **0 (valid):** report the completion as **validated** — frozen corpus, backed by
     the recorded review set (name its `review_set_id` from the output).
   - **22 (stale-or-invalid-completion):** report prominently: the completion claim is
     **stale or unbacked** — the corpus or STATE changed after close, or the record
     doesn't support the sentinel. Show the validator's reasons verbatim. The project
     is NOT validly complete, whatever STATE says. The remedy is the **documented manual
     repair** (the validator refuses to run a new transition while a completion record
     and sentinel coexist): the commissioner removes
     `research/reviews/completion.json` and reverts the sentinel/closeout lines in
     STATE by hand, records why in `research/notes-to-self.md`, and the project then
     reads as open — after which a fresh `/know-research:review-corpus final` and closeout
     can run. Never suggest editing sealed receipts or ledgers, and never perform the
     repair yourself from this read-only skill.
   - **23 (closed-unreviewed):** report it as an **administrative archive — not
     decision-ready** (never as a completed, validated project).
   - **21 (not-closed):** no sentinel actually present — proceed normally.
   - **10 (no-marker):** legacy project, no credibility gate — if a completion claim is
     present, label it "unvalidated (pre-protocol project — no credibility gate)".
   - Anything else: report the validator's named reason as an infrastructure failure.

   If STATE has no completion sentinel, skip this step entirely.

2. **Read `research/STATE.md`** for current position, active phase, and completed phases.
3. **Count files:**
   - `research/notes/` — total source notes
   - `research/drafts/` — drafts pending audit
   - `research/outputs/` — audited outputs
   - `research/audits/` — audit reports
4. **Read `research/research-plan.md`** to get the full phase list.
5. **Read `research/cross-reference.md`** and count the number of identified patterns.
6. **Read `research/gaps.md`** to identify any blocking gaps.

## Output

### Infrastructure Health

When all 5 checks pass, output a single compact line:
```
### Infrastructure Health
Infrastructure: 5/5 checks passed
---
```

When any checks fail, output a summary line plus only the failures (do not enumerate passing checks):
```
### Infrastructure Health
Infrastructure: [N]/5 checks passed

- **outputs gate hook missing from plugin hooks.json** — this hook blocks unaudited Write/Edit/MultiEdit to research/outputs/ on Claude Code; in Cowork the gate holds structurally
- **project settings.json invalid or missing pre-allow** — without the permissions.allow list from /know-research:init, Claude Code prompts on every tool call; the audit gate itself is unaffected

---
```

### Research Progress

| Phase | Status | Sources | Draft | Audit | Output |
|-------|--------|---------|-------|-------|--------|
| 1. [Name] | Complete/Active/Pending | [N] | [Yes/No] | [Pass/Fail/Pending/—] | [Yes/No] |
| 2. [Name] | ... | ... | ... | ... | ... |
| ... | | | | | |

**Completion-verdict override (applies before rendering the table).** When step 1f ran,
its verdict caps what the table may claim: on exit **22** (stale/unbacked completion),
the final phase's row — and any project-level "complete" wording — renders as
`Stale/unbacked completion`, never `Complete`, whatever STATE's checkboxes say; on exit
**23** (closed-unreviewed), every row renders against status `Archived (unreviewed)` and
no phase renders as `Active`. The validator's verdict outranks STATE's own text
everywhere in this dashboard.

**Audit column values:**
- **Pass** — `/know-research:audit-claims` ran and passed; draft was promoted to `outputs/`.
- **Fail** — `/know-research:audit-claims` ran and returned failures; draft is still in `drafts/` awaiting fixes.
- **Pending** — a draft exists in `drafts/` for this phase but `/know-research:audit-claims` has not been run on it yet.
- **—** — no draft exists for this phase yet (phase not yet at Synthesize step, or not started).

**Source notes:** [N] total
**Cross-reference patterns:** [N] identified
**Blocking issues:** [Any gaps or issues preventing progress, or "None"]

### Discovery Tier per Phase

Read the `## Phase Tier Record` section from `research/STATE.md`. If the section exists, reproduce its table here verbatim — one row per phase that's been briefed. If the section is missing from STATE.md, print:

```
No tier records yet — `/know-research:start-phase` writes a row per phase as it begins. Each row reflects the highest discovery tier that returned results for that phase (Tier 1 = Tavily, Tier 2 = Firecrawl, Tier 3 = built-in WebSearch).
```

Do not synthesize a table from `retrieval-log.json` directly — start-phase is the system of record for this data, and reading it twice from different sources risks drift.

### Completion status (only when a completion sentinel is present)

Render the step-1f verdict in plain words, before Next Action: "Project completion:
validated (review set <id>)" / "Project completion claim is STALE OR UNBACKED — [the
validator's reasons]. The project is not validly complete." / "Administrative archive —
closed unreviewed; not decision-ready." / "Completion unvalidated — this project
predates the credibility gate." Never render a completion row as settled when the
validator said otherwise.

**Next action:** [If health failures exist: "Fix infrastructure issues above before continuing — " then the original next action from STATE.md. If no health failures, show the original next action from STATE.md unchanged. If the completion claim was stale/unbacked, the next action is the validator's remedy — typically a fresh `/know-research:review-corpus final` run or ledger adjudication — not STATE.md's stale text.]

## Guardrails

1. Report exactly what STATE.md and the files say. Do not editorialize on progress quality.
2. If STATE.md and the actual file counts disagree (e.g., STATE.md says 5 sources but there are 7 files in notes/), report the discrepancy.
3. Do not recommend skipping phases or batching work to "speed things up."
4. Show blocking issues prominently — a stale cross-reference or undone gap check is a blocker, not a footnote.
5. Report all infrastructure check results honestly. Do not skip checks or suppress failures to make the dashboard look clean.
6. A completion sentinel is a claim to validate, never a fact to repeat. The dashboard reports what `check-completion` returned — a stale or unbacked completion is reported as exactly that, prominently, even though the words "ALL PHASES COMPLETE" sit in STATE.md.

This skill is read-only — it does NOT write any files (`check-completion` is a read-only validator mode).
