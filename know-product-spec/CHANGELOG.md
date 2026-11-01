# Changelog

## [0.2.0] 2026-10-31

**The interview now asks how the thing is operated, not only what it does.**

Eight question areas covered every state, every action and its write target, every failure,
reachability, the data, the copy, the measures, and the runtime surface. None of them asked about
a keyboard path, where focus goes, or what an error announces. The PRD had no section for it
either, and no rubric dimension scored it — so a document with nothing on the subject could grade
3, "explicit and testable", on all seven dimensions. The grader endorsed the omission.

The full eleven-item list was already in the plugin, in `reference/surface-review.md`, read only
by `ui-review` — after the build, against requirements nobody had written. This release closes
that loop. It is a cross-reference and an elicitation change, not new standards content.

**Deliberately not a new section.** The first draft of this change added an accessibility section
to the skeleton. That is how the subject becomes somebody else's column, so instead each
requirement went to the section that already owns that behavior:

- **§14 Reachability** now covers keyboard reachability as part of reachability rather than
  alongside it: every action operable without a pointer, tab order where it is not document order,
  and where focus lands on each state change — dialog open and close, step completion, content
  replacement, deletion of the focused element.
- **§15 Actions** gains what each action *announces*. A visual-only result is an unspecified
  announcement, not an exemption.
- **§16 Failures** requires the failing field named in text rather than by color or position, and
  the recovery.
- **§17 Copy** treats control names as copy, because they are, and nothing downstream invents a
  good one.
- **§21 Design references** holds the presentation baseline — contrast, resize and reflow, reduced
  motion, target size — which most products settle once in a design system. "Inherited from the
  design system" is a complete answer; silence is not.
- **§18 Acceptance criteria** replaces three generic bullets with the contract above, and requires
  a PRD with no user-facing surface to say so explicitly rather than omit the criterion — the same
  rule §20 already applied to infrastructure.

**Scored, and blocking.** Dimension 4, Behavior contract, now covers these and anchors §5 · §13 to
§17 · §21. The blocking-versus-deferrable enumeration gained operation and announcement: two
builders guessing differently at a focus destination ship two different products to anyone not
using a mouse, which was always the stated test — the old enumeration just did not list it, and a
list that omits it reads as a licence.

**Scoped by shape.** `system` PRDs carry "does not apply because" for the surface half, the way
they already do for the experience walkthrough and copy. Write targets and failure behavior still
apply to a pipeline.

Numbering is unchanged: no section was inserted, so the exemplar PRDs and every §-reference in the
plugin still resolve. Keywords gained `accessibility`.

## [0.1.0] 2026-10-30

First release in the Knowbility marketplace.

Forked from an existing interview-to-PRD plugin with the original author's clearance, then
de-branded for Knowbility's use. The pipeline itself is unchanged: discovery gate, contract
interview, draft, trace-mode decomposition with a readiness rubric, the clarify revision loop,
plus `groom` and `ui-review` after filing.

What changed in the port:

- **Renamed** to `know-product-spec`, invoked as `/know-spec:<skill>`. The source plugin's skills
  were namespaced by plugin name; they now carry explicit `know-spec:` names so the commands stay
  short and cannot collide with the plugin this was forked from.
- **Output directory** moved from `.product-spec/` to `.know-product-spec/` in the user's project,
  so state never mixes with the source plugin's if both are installed.
- **Provenance footers genericized.** The reference files record that the rubric, skeleton,
  authoring rules, shapes, and profile fields were ported from internal source documents, with the
  retrieval date retained. The source organization's internal page identifiers were removed.
- **Changelog reset.** The source plugin's version history described releases, decisions, and
  cross-plugin dependencies specific to the marketplace it came from, none of which applies here.
- Author, license (MIT), homepage, and repository set to Knowbility's.

Version reset to 0.1.0 deliberately. This is an independently maintained fork, not a continuation
of the original's version line, and carrying the old number would invite diffing against an
upstream that no longer matches.
