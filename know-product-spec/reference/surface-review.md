# Reviewing a story against the surfaces that implement it

The contract for `ui-review`. It defines the posture, the two assessments, how evidence is classified, how severity is assigned, and when a review is finished.

## Posture

Review each surface as an implementation inside an established product. **The story is the behavioral contract. The design system is the interface contract.** The question is whether someone could build this story without inventing material product or design decisions.

Do not reward novelty. Do not recommend a custom component when a supported one exists. Do not penalize conventional work that correctly follows the system.

**Preference is not a defect.** Every material finding traces to one of six sources, named explicitly:

1. A requirement or acceptance criterion in the story
2. A design-system contract: a token, a component, a documented pattern
3. An established product pattern, evidenced in a current analogous surface
4. An accessibility requirement
5. An observed runtime failure
6. A contradiction between two of the above

A finding you cannot trace to one of those is an opinion. Opinions are legitimate and go in their own section, unranked and unsevered, where a human can take them or leave them. They never become defects, they never move a verdict, and they are never presented as though the system demanded them.

Every material finding answers five questions: what contract is involved, what evidence supports it, how it affects the task or the product's consistency, who owns the correction, and what observable check proves it resolved.

## Assessment A: does the story work

**Requirements coverage.** Every applicable requirement gets one of: met, partially met, missing, contradicted, unverifiable, non-UI, out of scope. The presence of a component is never proof that the behavior satisfies the requirement.

**The primary outcome.** Can the named person understand the surface's purpose, find the primary action, make the decisions it asks of them, complete the task, recognize success, recover from failure, and reverse or exit when that is appropriate?

**Information and action hierarchy.** Does required information appear when it is needed? Do primary and secondary actions carry the right prominence? Does supporting content compete with the task? Does the structure follow the workflow? Do labels use the product's own domain language? Are consequences clear before they are incurred?

**State completeness.** Review only the states the workflow actually has: initial, loading, empty, populated, partial data, validation, error, success, unavailable, permission-restricted, read-only, destructive confirmation, long content and overflow, and responsive states. Tie each gap to a requirement or a credible workflow risk. A state nobody can reach is not a gap.

**Workflow integration.** Entry points, downstream destinations, navigation, cancel, retry, refresh, return, draft persistence, permission changes, and whether selections and context survive.

**Accessibility.** Keyboard access, focus order and visibility, accessible names, semantic structure, form labeling, error identification and recovery, status announcements, contrast, resizing, reduced motion, touch targets.

## Assessment B: does it fit the system

Establish the interface contract before judging against it. Prefer evidence in this order unless the project defines another authority model:

1. The design system's own source: tokens, components
2. Published component documentation or a storybook
3. Product-specific pattern documentation
4. Current analogous surfaces
5. Legacy examples

**An old surface is not authoritative merely because it exists.** Drift is what this review is looking for, so a page that drifted first is not a precedent.

**Component reuse.** Inventory the meaningful elements. Does each use the right component, a supported variant, a supported composition, or a shared product pattern? Flag a bespoke implementation only when a supported equivalent exists, and say which one.

**Token adherence.** Color, typography, spacing, sizing, borders, radius, elevation, motion, breakpoints, z-index, iconography. A raw value that correctly maps through the system is not a defect.

**Pattern consistency.** Compare against the documentation and analogous surfaces: page shell, navigation, headings, tabs, filters, search, forms, tables, lists, cards, dialogs, drawers, notices, empty and error states, destructive actions, save and cancel. Classify each difference as a defect, a justified surface-specific need, an approved exception, a design-system gap, or an unresolved decision.

**Content consistency.** Terminology, capitalization, button labels, helper text, validation and error messages, dates, numbers, units, empty-state language, success messaging. Apply the profile's style rules here, including any words it forbids in user-facing copy.

**Responsive behavior.** Reflow, navigation adaptation, content priority, overflow, fixed elements, dense content, dialogs, touch targets, and whether required actions survive at every width.

## Both directions, always

The obvious review treats the story as authoritative and looks for what the design has not caught up to. Run that, and then run the reverse.

**Design to story.** Every state, treatment, control, and copy string the surface implements that no item covers. These never appear as failures, because nothing asked for them.

The reverse direction is not a nicety. On a team where designing is how the thinking gets done, the design is routinely ahead of the writing, and a one-directional review corrects a shipped surface toward a contract the team already abandoned. That is worse than the gap it went looking for, because it arrives carrying the authority of a check.

## Evidence, kept separate from severity

Classify every finding by kind:

- Surface implementation defect
- Unmet requirement
- Ambiguous or contradictory requirement
- Design-system misuse
- Design-system gap
- Accessibility failure
- Intentional deviation
- Unverified concern
- Human-owned decision
- Opinion

And by how well it is known:

- **Observed.** Directly seen in a rendered, exercised surface.
- **Supported inference.** Follows from cited evidence but was not exercised.
- **Unverified.** Plausible, lacking the evidence to say.
- **Decision.** Needs product, design, content, accessibility, or engineering authority.

**Never phrase an inference as an observed failure.** These two axes are independent: an observed defect can be trivial and an unverified concern can be the thing that sinks the story.

## Severity

- **P0.** Blocks the primary task, causes severe harm, or produces unrecoverable failure.
- **P1.** Violates a core requirement, or causes a major workflow, accessibility, or system failure.
- **P2.** Materially weakens usability or consistency, with a workable path.
- **P3.** Minor inconsistency or polish.

Severity is about the work, never about how confident you are. Opinions carry no severity at all.

## The verdicts

- **Ready for work.** Every completion condition passes and what remains is minor.
- **Conditionally ready.** Named decisions or dependencies remain, and the unaffected work can start safely. Say which work.
- **Not ready for work.** Material requirements, states, dependencies, or decisions are missing.
- **Unable to verify.** Essential product, source, or runtime evidence was unavailable. This is an honest outcome and never a soft "not ready."

## The completion gate

A review is finished only when all of these hold:

- The inventory has no unreviewed surfaces.
- A final pass over the story reveals no new surface, state, transition, or dependency.
- Every explicit requirement is mapped to a surface, a state, or a declared non-UI behavior.
- Every surface has a defined entry, task, outcome, and recovery path.
- Every material viewable surface was rendered and looked at, not read.
- Primary tasks were exercised through visible controls.
- Required states have runtime evidence or are explicitly marked unverifiable.
- Representative responsive behavior was inspected at more than one width.
- Major elements map to existing components or to documented deviations.
- Every dependency has an owner and every ambiguity has a concrete question and an owner.
- No unresolved P0 or P1 is being treated as ready.
- Surfaces that changed during the review were reviewed again.
- The adversarial gate was evaluated, and any review it triggered was reconciled.

**Stop when the gate passes or when the only thing left needs authority you do not have.** A review that loops on a question it cannot answer is not being thorough, it is refusing to hand over.

## Keep it proportionate

The depth above is what a consequential story deserves. Most stories are not that, and a review that costs more than the work it examines will stop being run.

Scale the output to the verdict. A story that is not ready because one surface does not exist needs the verdict, that finding, and its owner. It does not need a full inventory of the surfaces that are fine. Reserve the complete report for a story being called ready, where the claim has to carry its evidence.

---

*Authored for this plugin, adapted from a story-readiness review contract proven outside it. The bidirectional rule and the opinion class are additions; the ledger discipline, evidence levels, and completion gate are the original's and are the reason it works.*
