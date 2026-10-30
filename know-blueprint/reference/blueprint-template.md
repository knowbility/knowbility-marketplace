# Process Blueprint — [Process Name]

| | |
|---|---|
| **Business objective** | [What measurable value this process protects or creates] |
| **Operator** | [Who runs it today] |
| **Mode** | [Quick / Deep / Design] |
| **Captured** | [YYYY-MM-DD] |
| **Version** | 1 |
| **Status** | Draft — stakeholder validation not yet done |
| **Last validated** | Not yet validated — [owner who will sign off, once known] |
| **Next review** | Set after validation |

<!-- In quick mode, mark any section the interview didn't cover "Not captured — quick
     mode." Never silently omit a section.
     In DESIGN mode (a process modelled before it has ever run): set Mode to "Design" and Status
     to "Designed — not yet run; validate against the first real executions." Every step is a
     PROPOSAL — write it with the standard fields plus a "Proposed", a "Rests on" (the real fact
     or analog it's built from), and a "Breaks if" (the assumption the first run tests). A
     designed Blueprint must never read as observed practice. See reference/design-doctrine.md. -->


## 1. Purpose and outcome

[What job this process gets done. What counts as success. What business outcome it serves.]

## 2. Trigger and preconditions

**Trigger:** [What starts the work — an event, a date, a request, a threshold.]

**Preconditions:** [What must already be true before starting.]

**Variants:** [Alternate entry points or special-case versions of this process, if any.]

## 3. Inputs

| Input | Where it comes from | Format |
|---|---|---|
| [Input] | [Source system/person] | [Format] |

## 4. Systems and tools

[Every system the process touches, with how it's accessed — UI, API, export, browser.]

## 5. Step sequence

<!-- One block per step. The reason and evidence fields are what make a step executable by
     an agent — don't leave them empty; if unknown, flag in Open Questions.
     A step whose output is an accessibility judgment (decorative or not, is this alt text
     right, is this reading order correct, does this accessible name mean anything to the
     person hearing it) is rated Human by default. If the operator overruled that, say so in
     the autonomy justification and name the rating it would otherwise have carried. -->

### Step 1 — [Action name]

- **Action:** [What happens, in the operator's language]
- **Tool/system:** [Where it happens]
- **Data in → out:** [What's consumed → what's produced]
- **Why this step exists:** [The intent — what it accomplishes]
- **Evidence of success:** [What observably shows the step worked]
- **Missing-input path:** [What the operator does when the expected input isn't there]
- **Autonomy:** [Automate / Monitor / Human] — [one-line justification]

### Step 2 — [Action name]

[Same shape. Repeat for every step.]

## 6. Decision points

| Where | What's evaluated | Criteria / threshold | Who decides |
|---|---|---|---|
| [Step #] | [The question] | [Explicit rule or judgment criteria] | [Person / agent] |

## 7. Exception paths

| Exception | How often | What happens | Escalates to |
|---|---|---|---|
| [Failure or weird case] | [Frequency] | [The handling] | [Person, if anyone] |

## 8. Approval and accountability

[Who can approve, reject, override, or escalate — with real authority, not symbolic review.
What gets recorded when they act.]

## 9. Outputs and done state

**Artifacts produced:** [What, and where each lives.]

**Done means:** [The observable completion criteria.]

**Audit trail:** [What record should exist that this ran and what it did.]

## 10. Timing

[How long a run takes, any deadline or SLA, and how often the process runs.]

## 11. Risks and failure impact

[What a bad run costs — money, compliance, customer trust, brand. This drives the autonomy
ratings above.]

## 12. Improvement loop

[How corrections and overrides feed back into this Blueprint — who updates it, on what
trigger.]

## 13. Open questions

<!-- Everything the interview couldn't resolve. An honest gap beats an invented step. -->

- [ ] [Unknown, and who could answer it]

## 14. Automation notes

**First candidates (Automate-rated, highest payoff):** [Steps]

**Connections needed:** [MCPs, APIs, credentials, or access each candidate requires]

**Checkpoints that stay human:** [The Human-rated steps and why]

**Accessibility judgments in this process:** [Any step whose output is an accessibility
determination, and its rating. These default to Human; if one carries a different rating, name who
moved it and when. "None in this process" is a valid and common answer.]

## 15. Change log

<!-- One line per revision. When the process changes, recapture the changed section, bump the
     Version in the header, and reset validation status — a changed process is unvalidated
     again. Preserves why the model moved, so drift is visible instead of silent. -->

| Version | Date | What changed | By | Re-validated? |
|---|---|---|---|---|
| 1 | [YYYY-MM-DD] | Initial capture | [Operator] | Not yet |
