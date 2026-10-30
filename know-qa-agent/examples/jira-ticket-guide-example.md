# How to File Jira Tickets That Land on Board 42 (WEB) — Release Triage

> **Read this first: everything below is one project's answers, not the rule.**
>
> This is a complete worked *instance* of the plugin's learned, per-project, tracker-agnostic filing procedure (`reference/filing-procedure.md`): ask where tickets land → sample a recent ticket from that destination to learn the house shape → replicate it → confirm the first ticket landed where the team expects it → re-derive volatile values (the active sprint) each session. The values are concrete rather than abstract so the example stays usable as a template.
>
> Those values are WEB's, learned from WEB: the project key, board 42, the epic, the custom-field IDs, the `App` label, and the rule that a filed finding belongs in the active sprint. **None of them are defaults, and the sprint rule in particular is not a property of Jira or of QA filing.** §8 is a counter-instance on the same Jira site whose answer is the opposite. Derive your own project's contract the same way and cache it in your `.know-qa/`.

**Audience:** Any agent (Claude Code, Cursor, Codex, Gemini, etc.) filing tickets during or after a testing session.

**Why this exists:** Board 42 in project **WEB (Web Platform)** is the board engineers track for the current release. WEB's release-triage workflow treats a finding as in front of the team only once it is **on the active board** rather than sitting in the backlog. This guide is the contract for that, reverse-engineered from a ticket already on the board (WEB-4212).

**The whole thing in one line:** File into **WEB** as a **Bug**, put it in the **active sprint**, set **Epic Link = WEB-4190**, add label **`App`**. That replicates a confirmed on-board ticket and is what makes it appear where WEB's release triage is looking.

---

## 1. The target

- **Project:** `WEB` (Web Platform)
- **Board:** 42 — `https://<your-site>.atlassian.net/jira/software/c/projects/WEB/boards/42`
- **Site / cloudId:** your Jira site host and its cloudId, both read from your own instance

**Board 42 is a scrum board.** It has two screens that are both "board 42" but are different views:
- **Active sprint board** — the columns the team triages for the release. This is what we are tracking in.
- **Backlog tab** — everything in WEB not in a sprint.

An issue with **no sprint set falls into the Backlog and does NOT show on the active board.**

**In WEB's release-triage workflow, that makes sprint membership the gate, and it is the single most important field here.** This is a fact about how this team works, not about Jira and not about QA filing generally. A project can just as reasonably decide that the backlog is exactly where filed work belongs and that promoting it to a sprint is a human planning decision. See §8 for such a project on this same Jira site.

---

## 2. What actually puts a ticket on the board (verified against WEB-4212)

WEB-4212 is on the board. Its config tells us what matters:

| Field | Value on WEB-4212 | Verdict |
|---|---|---|
| Project / Type | WEB / Bug | required |
| **Sprint** (`customfield_10020`) | active sprint, `boardId 42` | **the gate, in WEB** |
| **Epic Link** (`customfield_10014`) | WEB-4190 "Checkout Rework Feedback" | match it (groups the batch) |
| **Labels** | `App` | match it |
| Priority | Medium | set it |
| Fix Version | empty | not needed |
| Severity (`customfield_10032`) | empty | optional |
| Environment (`customfield_10415`) | empty | optional |
| Component | empty | optional |

**Required to land on board 42 for this testing batch:**
1. Project `WEB`
2. Issue Type `Bug` (or `Task` / `Spike`, see §4)
3. Summary (see §3)
4. **Sprint = the active sprint** (see §2.1)
5. **Epic Link = `WEB-4190`** (Checkout Rework Feedback)
6. **Label includes `App`**

Reporter auto-fills to the authenticated account. Do not set it.

**Optional, helps triage but is NOT a gate** (all blank on WEB-4212, so skip if it slows you down): Priority, Severity (Critical/High/Medium/Low), Environment (Prod/Stg/Dev), Component (whatever your project's component list holds). Setting Priority and Severity is encouraged because it speeds the engineer's triage call.

### 2.1 Finding the active sprint (it rolls every two weeks)

A sprint id read today is stale in two weeks, so **do not hardcode it. At the start of each filing session, read the live active sprint:**

1. `getJiraIssue` on any recent on-board WEB bug (e.g. WEB-4212), fields `["customfield_10020"]`.
2. In the returned `customfield_10020` array, find the entry where `state == "active"` and `boardId == 42`.
3. Use that entry's `id` as the sprint value on every ticket you create this session.

---

## 3. Summary line convention

The summary is what engineers scan on the board. Make it specific and self-contained.

- **Lead with the surface, then the broken behavior.** `Checkout: totals duplicate on submit`
- **State the defect, not the fix.** `Confirmation card stays on Home after completion`, not `Make confirmation card disappear`.
- **No vague summaries** (`checkout broken`, `bug on home`).
- **One line.** Detail goes in the description.
- **No em dashes.** Use commas, periods, parentheses, or a colon. (Project-wide convention; em dashes read as AI-authored and copy badly into Slack.)

Match the style already on the board, whatever that is. Read three recent summaries before writing your first one.

---

## 4. Which issue type

- **Bug** — something is broken or behaves wrong. Default for testing findings.
- **Task** — work that is not a defect (copy change, small feature, config).
- **Spike** — investigation needed before scoping.
- Do not use Story, Epic, Initiative, Theme, or Roadmap from a testing session.

Same routing rules (sprint + epic + `App` label) apply whatever the type.

---

## 5. Description template (Bug)

```
**Environment:** Stg (or Prod/Dev) — browser + URL if relevant

**Steps to reproduce:**
1.
2.
3.

**Expected:** What should happen.

**Actual:** What actually happened.

**Evidence:** Screenshot link, console error, network response, or recording.
```

For a **Task**, a short what-and-why paragraph is enough.

---

## 6. Exact MCP call (`createJiraIssue`)

This replicates WEB-4212. Read the active sprint id first (§2.1) and substitute it.

```
createJiraIssue({
  cloudId: "<your-site>.atlassian.net",
  projectKey: "WEB",
  issueTypeName: "Bug",
  summary: "Checkout: totals duplicate on submit",
  contentFormat: "markdown",
  description: "**Environment:** Stg\n\n**Steps to reproduce:**\n1. Open Checkout\n2. Complete the form\n3. Submit\n\n**Expected:** One order total.\n**Actual:** The total renders twice.\n\n**Evidence:** <screenshot link>",
  additional_fields: {
    customfield_10020: 0,               // Sprint id — REPLACE with the live active sprint (see 2.1)
    customfield_10014: "WEB-4190",      // Epic Link: Checkout Rework Feedback
    labels: ["App"],
    priority: { name: "Medium" }
    // optional triage aids (not gates):
    // customfield_10032: { value: "High" },  // Severity
    // customfield_10415: { value: "Stg" }    // Environment
  }
})
```

**Custom field IDs (WEB):**
- Sprint = `customfield_10020` (value = sprint **id**, integer)
- Epic Link = `customfield_10014` (value = epic key, e.g. `"WEB-4190"`)
- Severity = `customfield_10032` ({value: Critical/High/Medium/Low})
- Environment = `customfield_10415` ({value: Prod/Stg/Dev})

If a create call rejects a field, re-fetch metadata with `getJiraIssueTypeMetaWithFields` (projectIdOrKey `WEB`, and the Bug issueTypeId your instance reports). Custom field IDs can differ between instances, so do not blindly trust these across other Jira sites. Read them from your own.

**After the first ticket of a session, open board 42 and confirm it appears on the active board.** If it does, the rest will. If it does not, the sprint id was wrong or stale — re-read it per §2.1.

---

## 7. Pre-flight checklist

- [ ] Project `WEB`, type `Bug`/`Task`/`Spike`
- [ ] Summary leads with the surface, names the defect, one line, no em dash
- [ ] **Sprint set to the live active sprint** (read it this session, §2.1)
- [ ] **Epic Link = WEB-4190**
- [ ] **Label includes `App`**
- [ ] Priority set (Severity/Environment optional but helpful)
- [ ] Bug has steps, expected, actual, evidence
- [ ] First ticket confirmed visible on board 42's active board

This checklist is WEB's. Do not run it against another project.

---

## 8. Counter-instance: MOB, where the backlog is the destination

Everything above is WEB's contract. **MOB ("Mobile App")** is a company-managed Scrum project on the same Jira site, board **77**, and it is where mobile bugs go. Its answer inverts §1's single most important field.

In MOB:

- **The backlog is deliberately where filed work lands.** A QA finding sitting in the MOB backlog is correctly filed, not half-filed and not lost.
- **Sprint membership is a human commitment made at sprint planning**, not a field a filing agent sets.
- Sprint membership is also **the line agents will not cross.** An agent picks up a MOB issue only when it is (a) in an active sprint, (b) labelled `agent:<code>`, and (c) assigned to that agent's operator. A QA run that files six regressions straight into the active sprint bypasses that gate and can consume an agent's next six runs.

So MOB's filing shape is:

| Field | Value | Why |
|---|---|---|
| Project / Type | `MOB` / Bug | |
| Status | To Do | filed, awaiting triage |
| **Sprint** | **leave empty** | filing is not queueing; the sprint is a planning decision |
| **Label** | **no `agent:` label** | that label is a dispatch signal, not a triage tag |
| Assignee | leave unset | assignment is part of the same human decision |
| Summary / description | same craft as §3 and §5 | house style travels; routing does not |

**"Filing is not queueing" is the intended behavior in MOB, not a defect.** A ticket that lands in the backlog with no sprint, no agent label, and no assignee is a complete and correct filing there. Do not promote it to the active sprint to "finish" it, and do not report it as an incomplete filing.

**What the two projects share is the procedure, not the values.** In both, you ask where the team wants findings to land, sample a real ticket from *that* destination, replicate its shape, and confirm the first one. The answers diverge on the field that matters most: WEB says the active board, MOB says the backlog. Carry neither answer into a third project.

---

_This file is an illustrative worked example, not a live contract. Both projects are fictional; the field mechanics are real Jira mechanics. When you derive your own project's shape, record who confirmed it and when, and note what would invalidate it — a changed sprint cadence, tracking epic, agent-dispatch rule, or board setup. A filing guide nobody dates is a filing guide nobody trusts._
