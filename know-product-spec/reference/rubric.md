# Quality rubric and readiness stages

The scoring instrument for the buildable bar in `skeleton.md`. It turns that bar into repeatable scores, four readiness stages, and one empirical test.

**Who uses this.** A human reviewing a PRD before it enters the pipeline. Anyone asked to grade one. And the `decompose` skill, which runs it on its own output rather than leaving it to a later reviewer. Drafting follows the skeleton; judging scores against this page.

## Readiness stages

A PRD is reported at exactly one stage. Stages are gates, not averages. A fatal gap in one dimension holds the PRD at the earlier stage no matter how strong the rest is.

| Stage | Meaning | Gate |
| --- | --- | --- |
| **Drafted** | Exists, but the case or the contract has holes a reviewer must fill | Below the bar for Case-clear |
| **Case-clear** | The reason it deserves to exist is defensible. A reviewer could kill it or fund it on the case alone | Dimensions 1 and 2 both score 2+ |
| **Backlog-ready** | Workstreams and tasks generate mechanically. Anything still undecided is either safe to default and note, or parked in §0 with an owner. No unstated guess left to a builder would change what ships | Dimensions 3 and 7 score 2+, and the newest qualifying cut of the decomposition test found zero blocking findings |
| **Build-ready** | An engineer or agent can implement without making an unstated product decision | Dimensions 4, 5, 6 score 2+; every open item is either in §0 with a named owner and a what-must-not-be-assumed line, or in the resolutions log with a stated default and a named confirmer; **and no open item blocks a ships row's action or a deal-breaker path** |

**Why Build-ready has that third condition.** Without it, the stage means "the ambiguity is documented" rather than "someone can build this." A PRD can carry a perfectly formatted open item that makes a shipping action impossible to implement, and formatting is not readiness. So check each open item against §12: if resolving it is a precondition for any ships row or for a deal-breaker, the PRD is Backlog-ready at best, however well the rest scores.

### How the stage is assigned

Each stage is an independent gate. Evaluate all four, and report the highest one whose own condition is satisfied. A lower gate failing does not cap a higher one.

So a PRD can be Backlog-ready with a weak measurement section: the work decomposes cleanly even though the case layer has a gap. That reads odd until you see what it is for, which is telling an author the shortest path forward rather than ranking documents. The blocking list is where the lower gate's gap gets reported.

"A fatal gap holds the PRD at the earlier stage" applies within a gate's own dimensions, not across gates.

This is stated because it is genuinely ambiguous otherwise, and the two readings produce different stages for the same scores. It is a **decision**, not a finding: the published audit results this was checked against record a stage and seven scores but not whether the decomposition test passed, and that term gates Backlog-ready and above, so those results cannot settle the question either way. Anyone porting this rubric should state which reading they use rather than assume it.

Release planning (rollout, flags, monitoring ownership) is deliberately not a stage. It belongs to the planned work, not to the PRD author.

The stage names are fixed. Unlike the output vocabulary, they name the instrument rather than the work, so a project's profile does not remap them.

## Dimensions

Score each 0 to 3.

- **0** missing
- **1** directional: present, but the implementer must interpret or invent
- **2** actionable: sufficient with minor clarification
- **3** explicit and testable

| # | Dimension | What a 3 looks like | Anchor |
| --- | --- | --- | --- |
| 1 | **The case** | Real person, today's workaround, observable outcome, fit, deal-breakers. A reviewer can reject at this layer | The case |
| 2 | **Objective and measurement** | Names the business goal it serves, and how we will know it worked: the observable success condition plus the events that would answer it. Sourced numbers only | The case (fit) · §19 |
| 3 | **Scope and decision hygiene** | V1 scope table traces every ships row to the outcome. Decided versus open is absolute: §0 unknowns carry a named owner and a what-must-not-be-assumed line, and provisional decisions in §22 carry a stated default and a named confirmer. Skipped sections carry a "does not apply because" line | §0 · §12 · §22 |
| 4 | **Behavior contract** | Every state has a rendering or response. Every action has a write target. Every failure has a defined behavior. Reachability covers deep-link, unauthorized, and does-not-exist | §5 · §13 to §16 |
| 5 | **Data contract** | Every field the surfaces consume has a shape, a source of truth, and a freshness rule, marked non-authoritative until reconciled, with the reconciliation owned in §0. How the backend produces the data is out of scope by design and is never scored | Appendix · §0 |
| 6 | **Copy and worked example** | Static copy final or explicitly owned elsewhere. A worked example exists and the acceptance criteria key to its states, or its absence is stated with the reason and the criteria say what they key to instead | §10 · §17 · §18 |
| 7 | **Decomposition and traceability** | The PRD-to-work mapping runs mechanically: §12 rows become workstreams, §18 criteria become the done-ness of tasks, §0 items become investigation tasks. Every task names its deliverable, traces up to the outcome, and carries testable criteria | From PRD to planned work |

## The decomposition test (the primary gate)

Scores are opinions. This is the experiment.

Actually attempt the mechanical decomposition into workstreams and tasks. Do not describe how it would go: run it, and record what happened.

1. **Invented decisions.** Every product decision the decomposer had to make that the PRD neither states nor declares open, each tagged blocking or deferrable (the classes are below). **The blocking count is the metric that matters most, and the target is zero blocking findings on a qualifying cut.** The total count is recorded in full and gates nothing. A §0 item becoming an investigation task is not an invented decision: the PRD flagged it open on purpose.
2. **Untestable criteria.** Acceptance criteria that cannot be objectively verified as written: no state to key to, no bound, no fixture.
3. **Orphan requirements.** Settled content the decomposition failed to place: copy strings, failure behaviors, state renderings, or data rules that landed in no task, plus tasks no requirement demands. Decomposition is translation, not summary: the document's settled facts must be conserved into the work items, each in exactly one place, and a decomposition that loses settled detail is incomplete rather than merely imperfect.
4. **Unowned dependencies.** Anything the work waits on that has no named owner.

A PRD is Backlog-ready when the newest qualifying cut finds **zero blocking findings**. Deferrable findings never hold the stage: each one is resolved, parked as an owned §0 item, or carried as a note on its ticket. Zero findings of any kind is an aspiration, never a gate: the instrument's own record shows that number does not converge, and a gate the instrument cannot certify teaches people to stop running it.

### Blocking versus deferrable

Every invented decision gets a severity class when it is recorded. Severity decides what gates filing. It never decides what gets recorded: the full list, both classes, is the instrument's output, and a run that trims the list to look clean has failed as an instrument.

- **Blocking.** A builder's unstated guess would change a ships row's deliverable, or behavior a user or stakeholder can see: which states exist, what the copy says, who can act, what happens on failure, what data shows and how fresh it is.
- **Deferrable.** A reasonable default exists that a builder can take and note on the ticket without changing what ships, or the question can be parked as a §0 item with a named owner and a what-must-not-be-assumed line.
- **The test:** if two reasonable builders guessed differently, would two different products reach the user? Blocking. The same product with different notes in the margin? Deferrable.

When in doubt, blocking. The class exists to stop ceremony around safe defaults, never to launder a real gap.

**Parking is a resolution.** A finding moved into §0 with a named owner stops being an invented decision: it becomes an open item the document declares on purpose, and it decomposes as an investigation task. Most deferrable findings, and some blocking ones, resolve this way in a minute. A finding demands an answer only when neither a noted default nor an owned open question would be honest.

**What the counts across cuts prove.** Independent runs of this test against the same document sample different subsets of its defects: three consecutive runs against one real specification found twelve, then six different, then eight more, with almost no overlap. So a low count says as much about how hard the grader looked as about the document, and successive independent cuts of a maturing document do not trend toward zero. They trend toward harmless: the count stays roughly flat while the severity falls. That pattern, flat counts, falling severity, and no blocking findings on the newest qualifying cut, is the signal to stop grading and file. Past that point another pass measures the grader rather than the document, and the resolution passes themselves begin introducing the findings the next cut reports. A mature, revised document should reach the filing gate in one or two passes. A stage claim cites the cut that produced it, and a later qualifying cut that finds blocking decisions supersedes an earlier claim.

**Which run can claim the stage.** Only a qualifying cut establishes a stage claim: a fresh cut, or an independent verification cut. A re-cut carries the prior cut's bodies forward, so it inherits that cut's blind spots; it reports progress, preserves identities, and never claims the stage on its own. A stage claim survives resolution sessions by accounting, not re-grading: the claim is the newest qualifying cut's blocking list, minus findings whose resolution is in the resolutions log or in §0 with an owner. When resolutions since that cut have rewritten whole sections rather than settled listed findings, the accounting no longer covers the new text, and a fresh qualifying cut is the honest basis for the claim.

The invented-decision list is also the feedback loop for the skeleton and these skills. Patterns that recur across PRDs are what those get updated to prevent.

### Product decision versus engineering choice

The count is of invented *product* decisions, so the line has to be stated or the metric is not repeatable.

- A **product decision** determines what a person experiences or what the business commits to: which states exist, what the copy says, who can see or do something, what happens on failure from the user's side, what data is shown and how fresh it must be, what ships in v1.
- An **engineering choice** determines how committed behavior is achieved: storage layout, framework, query shape, caching, file structure, algorithm, deployment.
- **The test:** if two reasonable implementers could choose differently and a user or stakeholder could tell which one they got, it is a product decision, and the PRD owes either an answer or a §0 item.

### Trace mode, not author mode

Every task carries one provenance line citing the document version and sections it was cut from. Anything that cannot be cited is not written as a task, it is recorded as an invented decision. The citation serves the auditor, never the builder: the task body must be executable with the document closed, so load-bearing content is copied in verbatim and section references never appear inside instructions, contracts, or acceptance criteria.

**And every task is a completable unit of work.** It names its deliverable: the artifact or observable change that exists when it is done. The test a reader applies to any task: what exists after this that did not exist before, and how would I know it is finished? A task that restates a property to verify ("isolation holds", "the flow is accessible") without naming what gets built or changed is not a unit of work; fold it into the task whose deliverable it verifies.

Beyond completable, each task holds five qualities a reader can check: independent (doable from its parent and its own content, real blockers listed), valuable (an intent line names who wants it and why), estimable (the contract is concrete enough to size), small (one deliverable; "and" in the deliverable means split), and testable (criteria checkable by someone who was not in the room). Each carries its user intent and its business impact, both traced from the document's case, in plain language.

This is what makes the output an instrument rather than a backlog, and it is why the decomposition is not built on a story generator. A generator that smoothly fills gaps is the worst possible tool for detecting them: every gap it papers over is a hole that ships uncounted.

## Reporting format

```
PRD name (id or path) · Stage: <stage> · Cut: <fresh cut | re-cut | verification cut>
Scores: case 3 · measurement 1 · scope 3 · behavior 2 · data 3 · copy 1 · decomposition 2
Verdict: <file now, with N deferrable findings parked or noted | resolve M blocking findings first>
Blocking: <the gaps holding it at this stage, one line each, with the minimum addition to advance>
Invented decisions: <numbered list, each tagged blocking or deferrable, each with the smallest
  resolution that clears it: an answer, a default to note, or a §0 parking with a proposed owner>
```

Always give the minimum addition to advance, not a wish list. The point is to tell the author the shortest path to the next gate.

A score reported without that path reads as a grade on the author, and an author who reads it that way stops running the instrument.

## Scope notes for the grader

- Score against the skeleton as configured for this project, including its shape (see `shapes.md`). A PRD that renumbers or reshapes sections loses nothing if presence and order hold.
- A PRD with no surface of its own is scored on dimensions 4 and 6 against its consuming surfaces and interfaces, not against a page it does not have.
- Reference-don't-duplicate is honored. A value owned by another canonical document counts as specified if the reads-with link names which document owns it.
- Style violations are noted but never move a stage.
- Do not reward length. A short PRD that closes every question outscores a long one that leaves them open.
- The scores inform a human. They never block the author from proceeding.

---

*Ported from an internal PRD quality rubric, retrieved 2026-07-26. Output vocabulary was generalized during the port; the stage names and dimensions carry over unchanged. Page version number not captured; see the pinning item in the plugin's grounding docs. Re-porting is a deliberate act, never an automatic refresh. Revised locally 2026-07-28: the Backlog-ready gate now counts blocking findings on a qualifying cut rather than all findings on any run, from live-drive evidence that the total count does not converge. The divergence from the source page is deliberate.*
