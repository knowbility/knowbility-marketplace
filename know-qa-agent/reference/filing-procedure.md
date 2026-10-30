# The Filing Procedure (tracker-agnostic, learned per project)

Filing is a **procedure the agent runs per project, not a tracker feature**. A universal plugin cannot assume Jira vs. Linear vs. GitHub, or where a team wants findings to land. So the deliverable is the procedure; the field values are project config cached in `.know-qa/`. A complete worked instance — one real project's contract reverse-engineered from a live ticket, plus a second project on the same Jira site whose routing rule is the opposite — ships at `examples/jira-ticket-guide-example.md`. Read it as one project's answers, never as defaults; derive each new project's contract the same way.

**Evidence precondition:** `.know-qa/runs/` contains restricted raw harness evidence.
Filing may quote only text-sanitized `report.md` / `summary.json` material.
Screenshots and `*.raw.*` files may be attached only after a human reviews and
crops/redacts the exact artifact. A successful test run is not evidence-review
approval.

**Precondition:** filing requires a connected tracker — a wired tracker MCP (Jira/Atlassian, Linear, etc.) or the `gh` CLI for GitHub. This is a precondition, not an implication: without one, the agent still detects, classifies, dedupes, and synthesizes — it just has nowhere to file, and degrades to a report (see Degrade path).

**Gate on what files:** only findings dispositioned `defect` or *confirmed* `likely_defect` flow to filing (per `reference/finding-lifecycle.md`), and only after dedup against `.know-qa/FINDINGS.md`. Design-intent items are surfaced, never filed.

## The procedure

### 1. Ask — never assume the destination

Detect what's available (wired tracker MCPs; `gh` auth state), then ask the human which tracker and destination: which project/board/team, and where the team wants findings to land (active sprint? a specific board? a milestone? the backlog?). If `.know-qa/filing-contract.md` already exists, skip to step 4 (re-derive volatile values) unless the human says the destination changed.

**Take the answer you're given, including "the backlog."** Some teams treat the active board as the only place a finding counts; others deliberately file into the backlog, where promotion into a sprint is a human planning commitment and may also be the line automation is not allowed to cross. Both are correct destinations. Filing is not queueing unless the team says it is.

### 2. Learn the shape from a real ticket

Fetch one representative, recent ticket **from that destination** through the connector and infer what makes a ticket well-formed **in this house**:

- **Routing** — what the destination requires: sprint field (and the live sprint id), board/column, milestone, iteration. If the destination is a backlog by design, the correct value here is *no sprint / no iteration* — an empty routing field, not a gap to fill in.
- **Grouping** — epic/parent link, labels, components, project.
- **Triage fields** — priority/severity conventions, environment fields.
- **House style** — how summaries are written (lead with surface + defect, one line, specific), what the description template looks like (environment / steps / expected / actual / evidence).

Custom-field IDs (Jira's `customfield_*` and kin) are part of the learned shape — record them, they are invisible in the UI but required by the API.

### 3. Replicate, file one, confirm

File **exactly one** ticket in the learned shape, show the human the link, and ask: *did this land where you want findings to land, shaped right?* Do not batch-file until the answer is yes.

- On "no": adjust the contract from their correction and re-file once. If it's still wrong, stop and work it out with the human — don't iterate tickets into their tracker.
- This confirm step is also the guard against faithfully replicating a **bad** house convention: the human sees one concrete instance before it multiplies.

### 4. Cache the stable, re-derive the volatile

Write the learned contract to `.know-qa/filing-contract.md`: tracker, destination, field map (including custom-field IDs), grouping values, house style notes. Mark each value **stable** or **volatile**:

- **Stable** — project, board, epic/parent, labels, field IDs, style conventions. Cache and reuse.
- **Volatile** — anything that rolls, *when the destination uses it*: the active sprint (rolls every couple of weeks), current milestone/iteration. A backlog-first contract has no volatile routing value to re-derive; record that deliberate emptiness so a later session doesn't read it as a missing lookup. **Otherwise, re-derive these from the connector at the start of every filing session** — never trust the cached value. The cached entry records *how* to re-derive (e.g., "read the sprint field from any current on-board ticket"), not just the last value.

### 5. Batch-file with hygiene

With the first ticket confirmed: file the remaining gated findings in the same shape. For each — run the evidence-redaction pass from `reference/safety.md` over anything attached; set `status: filed` and `ticket_link` on the registry entry; add it to `QA-SESSION-STATE.md`'s "filed this session — do not re-file" list when that file is live. Cross-link related tickets (same systemic theme) in the tracker where the tracker supports it.

**Owner as a suggested assignee (optional).** When a finding carries an `owner` (stamped from `.know-qa/areas.json`), propose that owner's `notify` handle as the ticket's assignee/notify — a *suggestion layered on* the learned house shape, never a replacement for it. If the tracker has no clean assignee mapping, put the handle in the description instead. This surfaces ownership; it never auto-notifies a person.

## Degrade path (no connector)

No tracker MCP and no authenticated `gh`: say so plainly, once — "filing requires a connected tracker; none is wired" — and emit a **"Would have filed"** section in the report carrying each gated finding in its full contract shape, ready to paste or to file when a connector lands. Never fail the report over a missing tracker, and never silently skip filing: the degrade is explicit.
