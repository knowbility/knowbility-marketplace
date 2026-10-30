# The PRD skeleton

The structure every PRD written with this plugin follows. Nothing here assumes what the PRD describes: a set of screens, a pipeline, an integration, a program, or an artifact all fit.

**The test the structure serves:** a capable engineer or agent, handed this document plus the worked example, can build the thing without asking what was meant, knows exactly which questions remain open and who owns them, and can see why it deserves to exist.

## Why it is shaped this way

Three commitments produce every section below.

1. **The case precedes the contract.** Nothing gets specified until a real person, a real problem, and an observable outcome hold, and every line of v1 scope traces back to that outcome. This is the filter that stops teams from building because someone had an idea.
2. **Decided is separated from open.** Decided things read as contract. Open things are named and owned so nothing blocks silently. There are exactly two kinds: an unknown, which lives in §0 with an owner and a line saying what must not be assumed in the meantime, and a provisional decision, which lives in the resolutions log with a stated default and a named confirmer. An unknown never gets a default, because a default there would be the guess §0 exists to prevent.
3. **Behavior is specified by state, not by narrative.** Every state a person or system can be in has a defined rendering or response, and the acceptance criteria key to those states. This is also what makes the worked example load-bearing rather than decorative.

## Numbering

Order and presence matter. Numbering does not. A section that does not apply is kept with a one-line "does not apply because ..." rather than silently dropped, so a reader never wonders whether it was forgotten. The one exception is the case, which can never be "does not apply."

Which sections a given PRD uses depends on its shape. See `shapes.md`.

---

## Header block

Six lines before anything else.

- **Worked example(s).** Paths or URLs to the design source, fixtures, prototype, or reference implementation, and what states each one demonstrates.
- **Scope.** What this covers, named against the project's surface registry if it has one (see `profile.md`). If the thing has no surface of its own, say so explicitly. If the work introduces a new surface or component, adding it to the registry is part of the PRD.
- **Route or entry point.** For routed surfaces: the route, marked locked or proposed, dated. For everything else: the entry point (endpoint, trigger, schedule, command), or one line saying it has none of its own.
- **Owner.** Whoever owns the decision and whoever owns the building, named in whatever roles your project uses. TBD is allowed, unstated is not.
- **Last updated.** A dated change-log line, newest pass first, each pass named. If this PRD folds a predecessor forward or supersedes one, say so here and banner the retired document.
- **Reads with.** The canonical documents this depends on, with what each one owns, so this PRD references rather than duplicates.

## The case

Before the spec, the reason it deserves to exist. Four short subsections, written so a reviewer can reject the PRD at this layer without reading further.

- **The problem and the person.** A real user, not "everyone": who feels this, what they do about it today step by step (the current workaround, inside or around the product), and what it costs in time, money, or trust. If nobody can describe the workaround, that is a flagged gap in the case, not a footnote.
- **The outcome.** What is observably different when this works, in the user's world, six months out. Never a feature list. "A dashboard" is a feature. "Knowing what to restock before running out" is an outcome. The outcome is what v1 scope traces to.
- **The fit.** Which business goal or objective this serves, where it lands in the product, and why this increment is the minimal way to reach the outcome. If the honest answer is not what was proposed (a workflow change, an integration, better copy, a configuration change), the case says so and the PRD stops here.
- **The deal-breakers.** What would make this not worth doing: cost, complexity, timeline, required behavior change. Stated before the work starts.

No case, no PRD.

## §0 · Engineering context (input required)

The consolidated list of everything the PRD cannot lock without engineering input. Each entry carries four things: the question, why it blocks (which sections), a **named owner** who will answer it, and **what must not be assumed** in the meantime.

An item whose answer is already guessable carries the guess in the resolutions log as a provisional decision with a stated default and a named confirmer, not here. §0 is for what the document does not know.

This is the authoritative list of what the document does not know. An agent building from the PRD treats it as its list of forbidden assumptions. Items resolve by writing the answer into the owning section and checking off here with a date.

---

## Part I · Product spec

1. **Overview.** What it is in one paragraph, the core thesis (the one idea the rest of the document elaborates), any hard boundaries stated as rules the build has to honor, and how it connects to the rest of the product.
2. **Variation model.** If the thing flexes by configuration, type, tier, or context: a table mapping each variation field to what changes. Where this exists it is the core of the spec, because it prevents variant-per-instance thinking. If there is no variation, say so in one line.
3. **Intent.** The handful of principles the build must protect, written so a reviewer can use them to reject an implementation that technically meets the letter of the spec.
4. **The experience.** The lifecycle walkthrough from the user's side, moment by moment, in their vocabulary. This is the section a stakeholder can read alone and understand the thing.
5. **Lifecycle states and loops.** The state matrix: every state, its trigger, what renders or happens, and what drives it. Plus any return or engagement loops, each backed by something real rather than a reminder for its own sake.
6. **Structure or model.** The domain objects and their shapes at the conceptual level. Formal shapes go in the appendix.
7. **Mechanics.** How it works internally at the level product needs to specify: pipelines, phases, sources, rules. Reference existing systems, do not re-document them.
8. **Inputs.** What feeds it (data, context, history) and in what priority.
9. **Variants with external parties.** Partner, co-brand, white-label, reseller, or third-party dimensions, including disclosure, trust, and entitlement rules. One line if not applicable.
10. **Worked example(s).** What each worked configuration or demo state proves, named so the acceptance criteria can key to them.

## Part II · Implementation contract

11. **Prior art disposition.** If there is a prototype, legacy system, or predecessor: a keep / improve / drop table, so nothing is silently ported and nothing is silently lost. When the predecessor is another PRD, this may instead be a folds-forward or supersedes statement in the header plus resolutions entries, with the retired document bannered. One line if greenfield.
12. **V1 scope and non-goals.** A table: every area, marked ships / post-v1 / not planned / permanent non-goal. Post-v1 rows say what v1 does instead. Every ships row traces to the case's outcome. A row that cannot trace is cut or moved post-v1.
13. **State machine.** The formal states and transitions, plus a visibility matrix (state by surface) when more than one surface renders it. Multi-surface work adds the navigation contract: a From / Affordance / To / What travels table, naming distinct verbs wherever two affordances must never collapse into one.
14. **Reachability and access.** How every state is reached and by whom, including the deep-link, unauthorized, and does-not-exist cases.
15. **Actions (mutations).** A table: every action a user or system can take, and what it writes to.
16. **Empty, loading, error, and degradation.** Every failure and absence, each with a defined behavior. Regions degrade independently. Trust-bearing content (disclosure, consent, entitlements, money, safety) fails closed and logs. Convenience content degrades gracefully. The section says which is which.
17. **Copy.** Final static copy, ready to implement, plus an explicit "owned elsewhere" list (generated content, legal copy, partner-supplied values) so nothing ships blank and nothing is hardcoded that should not be. Copy that varies by partner or configuration is written as a template with variable fields marked and invariant lines called out. Copy needing legal review is flagged.
18. **Acceptance criteria.** Given/Then, keyed by name to the worked example's states. This is the section that becomes tests. Two standing criteria in any PRD with a user-facing surface: naming hygiene (retired words appear nowhere in copy, routes, components, class names, or analytics) and accessibility (focusable named controls, correct roles, correct heading level).
19. **Measurement.** The events or metrics this needs, each written with the question it answers first, flagged for reconciliation with the real tracking plan. A PRD whose outcome cannot be measured says so here and names what would make it measurable.
20. **Infrastructure and security.** What this increment changes about the runtime surface: new endpoints or queries, data classifications touched, auth or role changes, external services introduced, and expected cost drivers (compute, storage, egress, token spend). One line per item. State "no change" explicitly when true, so review never has to infer it.
21. **Design references and open items.** Reused patterns, new components and their promotion path, and open design *tasks*, which are distinct from open *decisions* (those live in §0 or §22). Promotion entries name the canonical class or token they become, verified against the design system source before the PRD locks them, so a promotion never collides with an existing name.
22. **Resolutions log.** Dated decision passes, append-only. Provisional items carry a stated default and a named confirmer.

## Appendix · Data contract

Proposed shapes concrete enough to build against, loudly marked non-authoritative until reconciled. §0 owns the reconciliation item.

Every field the surfaces consume gets a shape, a source of truth, and a freshness rule. How the backend produces the data is out of scope by design.

---

## From PRD to planned work

The decomposition is mechanical when the PRD meets the bar. The words below are the defaults; a project whose profile sets other words gets those instead (see `profile.md`).

- Each area row in §12 that ships becomes a **workstream**, or one workstream for a small PRD, labeled with the surface name.
- The acceptance criteria in §18 become the **done-ness of tasks**, not the tasks themselves. A task is one deliverable, the thing that exists after the work that did not exist before, plus the criteria that verify it. Several criteria that verify one deliverable share one task; a criterion whose deliverable is already covered adds itself to that task rather than spawning another. Each Given/Then travels as written, and each task links the PRD sections and worked-example states its criteria key to.
- Each open §0 item becomes an **investigation task**, owned by whoever the item names, with the "what must not be assumed" line riding along.
- Measurement events (§19) become instrumentation tasks once reconciled with the tracking plan.

**Decomposition freezes the document.** The work items are cut from a specific version, named once in each item's provenance line, and from that point the split is absolute: the document is the historical record of what was decided, and the work items are the living record of the work. Changes discovered during the build are recorded on the affected work items, not written back into the document. Revising the document (the clarify pass) happens before decomposition, never after work has started; if the document must change that much mid-build, the honest move is to re-cut the affected items from the new version, not to maintain both.

**Every work item is executable with the document closed.** The freeze is what makes this safe: copies of frozen content cannot drift. So everything load-bearing travels into the item verbatim, the copy strings, the state rules, the field shapes, the failure behavior. A builder, human or agent, works entirely inside the item. Section references appear in exactly one place, the item's provenance line, for the auditor checking that nothing was invented; they never appear inside instructions, contracts, or acceptance criteria, because "per section 16" inside a ticket sends the builder back into a document the freeze already retired.

---

## Definition of done (the buildable bar)

A PRD meets the bar when:

- the case names a real person, today's workaround, and an observable outcome, and every v1 ships row traces to that outcome
- every §0 item names what may not be assumed
- every state in the matrix has a rendering or response
- every action has a write target
- every failure has a defined behavior
- every acceptance criterion is testable against the worked example
- all static copy is final or explicitly owned elsewhere
- the data contract is concrete enough to stub

When those hold, the remaining engineering questions are real engineering questions rather than ambiguity.

---

*Ported from an internal PRD structure-and-authoring guide, retrieved 2026-07-26. Product-specific vocabulary was generalized to profile fields during the port. Page version number not captured; see the pinning item in the plugin's grounding docs. Re-porting is a deliberate act, never an automatic refresh.*
