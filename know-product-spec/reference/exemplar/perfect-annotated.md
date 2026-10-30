# What earns each score in `perfect.md`

A reading guide for the fixture. Each dimension names the passage that earns the 3 and why that passage rather than a weaker version of the same section.

---

## 1 · The case → 3

**Earned by** "The problem and the person", specifically the seven numbered steps.

The workaround is the load-bearing part. Not "swaps are handled over text" but seven steps with a named person at each one, and the observation that steps 3 through 6 are all Dana's reconciliation. That is what makes the fit paragraph's claim ("the eligibility check is the part that removes Dana's five hours") checkable rather than asserted.

The outcome names three numbers with their current values, so a reviewer can tell what would count as success. "Nobody arrives to find an uncovered desk" is the outcome; "two per quarter at zero" is how you know.

The deal-breakers are stated as conditions that would kill the work, before the work starts, including one that fires against the PRD itself: if the roster has no write path, the second deal-breaker applies and the case needs revisiting. A case that can be falsified by its own §0 is doing its job.

## 2 · Objective and measurement → 3

**Earned by** the fit paragraph plus §19 read together.

The fit names the goal (staffing reliability without agency rates). §19 gives five events, each written as the question it answers rather than as an event name looking for a purpose. And the last line closes the loop most PRDs leave open: the outcome's three numbers all derive from these five events, so dropping one makes the outcome unmeasurable.

Every number in the case carries its current value from a stated source. Nothing is a round figure that appeared for rhetorical effect.

## Why this one is Build-ready, and what would have stopped it

Both §0 items are explicitly non-blocking: the eligibility rule and the approve write are implementable as specified, and the items ask about failure frequency and data staleness. That is what the third Build-ready condition tests.

An earlier version of this fixture said the roster write mechanism was unknown and that the approve action could not be implemented until it resolved, while still claiming Build-ready. That is a contradiction, and it is the most common way the stage gets misread: a correctly formatted open item is not a resolved one. If an open item has to be answered before a shipping action can be built, the ceiling is Backlog-ready.

## 3 · Scope and decision hygiene → 3

**Earned by** §12, and by where the open items are not.

Every ships row has a Traces to entry pointing at the outcome or a deal-breaker. The post-v1 rows say what v1 does instead, which is the line that stops a deferral from becoming an ambiguity. Notifications are the clearest case: post-v1, v1 relies on the board being worth opening, and there is a stated trigger for revisiting.

Two permanent non-goals are marked as such rather than as "later", because "later" invites someone to build them.

Open items appear only in §0 and §22. No contract section hedges. §9 does not apply and says so with a reason, rather than being absent.

## 4 · Behavior contract → 3

**Earned by** §5, §13, §15, and §16 read as one unit.

Six states, each with a trigger, a rendering, and what drives it. The visibility matrix exists because three viewer roles see the same request differently, which is the kind of thing narrative prose hides. Every action in §15 has a write target, and the approve action's two targets are ordered explicitly, with the failure case stated: roster write first, and if it fails, no state change.

§14 covers the deep link, the unauthorized viewer, and the does-not-exist case, and it says which of those is not an error and why.

§16 classifies every failure as graceful or fails-closed and says which paths are trust-bearing. The row worth studying is the claim that was eligible at claim time and is not at approval time. That is a state a narrative spec never notices, and it exists because the roster can change in between.

## 5 · Data contract → 3

**Earned by** the appendix, and by the `roster_write` row in particular.

Every field has a shape, a source of truth, and a freshness rule. `shift_id` is read at post time and re-read at approval, and the reason is given: the eligibility rule depends on it.

`roster_write` is the row that earns the 3 rather than costs it. Its shape is unknown, it says so, it names the §0 item that owns it, and it states the consequence: until that resolves, no shape may be assumed and the approve action cannot be implemented. A concrete-looking guess there would have scored lower than an honest blank, because the guess reads as decided.

How the roster actually performs the write is out of scope, and the rubric never scores it.

## 6 · Copy and worked example → 3

**Earned by** §17 and §10 together.

Fourteen final strings with their variables marked, and an explicit owned-elsewhere list so nothing ships blank and nothing gets hardcoded that should not be. The eligibility lines are the interesting ones: three variants, because the overnight rule adds a condition and the failing case has to name the failed rule.

§10 names six worked-example states, and every criterion in §18 keys to one of those names. That is the whole mechanism: criteria that key to named states can be executed by someone who was not in the room.

## 7 · Decomposition and traceability → 3

**Earned by** the shape of §12 and §18.

Eleven scope rows become workstreams. Twenty-five criteria group by deliverable into completable tasks, each naming what exists when it is done. Two §0 items become investigation tasks, each carrying its must-not-assume line. Every criterion is objectively checkable, and criteria 19 and 20 are the two standing ones.

Run the decomposition and nothing needs inventing, which is the only test that matters.

---

## The three ways real drafts drop to 1

Observed in a scored review of this plugin's own specification, which failed all three in its first version.

**1 · States without renderings, actions without write targets.**

The draft lists six states and describes the happy path in prose. Nobody wrote down what the third state renders, or what the approve action writes to. It reads complete because the narrative is fluent. Two implementers will build different things and both will believe they followed the spec.

The tell: a states table with columns for name and description but not for what renders.

**2 · A data contract that defers its own ownership.**

Fields are named, sometimes typed. No source of truth, no freshness rule. Often marked "non-authoritative until reconciled" with nothing named as owning the reconciliation, which turns a hedge into a permanent gap. In the version of this plugin's spec that scored 1 here, the appendix defined two of six persisted files and gave one sentence to the rest.

The tell: "TBD during implementation" appearing in an appendix.

**3 · Criteria that key to nothing.**

Acceptance criteria written before a worked example exists, so they key to states that have no fixture, or they use unbounded qualifiers ("the result is correct", "the difference is explainable") that can never fail. Copy is deferred to "at build time" with no owner, which means it will be written by whoever implements the screen.

The tell: a criterion you cannot execute without asking the author a question.

---

*Annotation for the product-spec plugin's `perfect.md` fixture. The three failure modes are drawn from a real scored review rather than composed, so they reflect what drafts actually do.*
