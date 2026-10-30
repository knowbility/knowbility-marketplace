# Shapes

Not every PRD needs every section. The shape decides which sections apply, and it is chosen during discovery and confirmed by the user before it takes effect.

Getting this wrong costs in two directions. Too heavy, and a copy fix has to survive a full contract interview, so people route around the process entirely. Too light, and a change that alters who can see what ships as a one-line document nobody reviewed.

## The four shapes

| Signal | Shape | Sections required |
| --- | --- | --- |
| No solution is settled yet, or the minimal path may not be software | `problem-brief` | The case, current state, outcome, solution-type recommendation, open questions |
| Users interact with it directly: pages, screens, flows | `surface` | Full skeleton. §6 to §9 may reshape into one section per surface |
| No user-facing surface of its own: pipeline, service, integration, scheduled job | `system` | Full skeleton, with the experience walkthrough and copy carrying "does not apply because". Data contract and interfaces carry more weight |
| Copy fix, bug fix, token or style drift, with no change to who sees what or what is stored | `small-change` | The case in three sentences, plus the affected contract sections only |

## The trap case

A change that presents as copy or styling but alters permissions, visibility, retention, or what data is displayed is **not** a small change.

Before `small-change` is applied, ask explicitly: does this change who can see or do something, or what is stored? Any yes moves it to `surface` or `system`, and the reason is stated.

This is the one classification error with real consequences. A permission change dressed as a copy tweak skips the interview, ships as a three-sentence document, and nobody discovers the visibility rule until it is live.

## Confirmation

The user confirms the shape in every case, including when the signals are unambiguous. Shapes are proposed, never assumed.

## The `problem-brief` shape

Worth its own note, because it is the shape people skip and the one that saves the most work.

Use it when the solution is not settled. Its job is to establish whether there is a problem worth solving and what kind of intervention fits, which may not be software at all: a workflow change, an integration, a configuration change, or better copy.

A `problem-brief` that concludes "this is a workflow change" is a complete and successful deliverable. It is also the cheapest document in this system, and the most expensive one to skip.

Its solution-type recommendation names the concrete alternative rather than a category, because a recommendation the reader cannot act on is not a recommendation.

## Reshaping within a shape

The `surface` shape commonly reshapes when the subject is a set of pages and zones: sections 6 to 9 become one section per surface, each a self-contained render contract, zone by zone, with the domain model folding into the variation table and the appendix.

Reshaping is fine. Presence and order are what matter, not numbering.

## Section omission

A section the shape does not require is kept with a one-line "does not apply because ...", never silently dropped. An absent section and a deliberately omitted one look identical to a careless reader and completely different to a reviewer, and the line is what makes a short PRD trustworthy rather than suspicious.

The case is the one section no shape may omit.

---

*Authored for this plugin. The four shapes generalize a surface-PRD reshaping rule from an internal structure-and-authoring guide (retrieved 2026-07-26) and the problem-space brief from the interview it was paired with.*
