Challenge this migration plan before any of it is built.

The plan is `dev/review/migration-plan.md`. The composition convention it
proposes to adopt is `dev/review/inputs/kenzie-contract.md`. Both are attached.
You have no other context, and you should not assume any; if something needed to
judge a decision is missing from the packet, say that it is missing rather than
inferring it.

Judge the decisions that are expensive or impossible to reverse once four
plugins sit on top of them. In rough priority order:

1. **The `know-` prefix at two layers.** Is prefixing both the install name and
   the invocation namespace the right answer to the collision problem, or is
   there a cheaper or more durable one? Is a 560-occurrence mechanical rename
   justified by what it buys? What specifically breaks in a year?

2. **The repository conventions.** The plan takes a composition convention from
   one source, a build-docs separation from the other, and a version-parity CI
   check. Is that combination coherent, or does mixing two marketplaces'
   conventions create a seam that will cause trouble? What is missing that a
   four-plugin marketplace will need and does not have here?

3. **Deferring the accessibility repositioning to Phase 4.** The plan argues the
   most valuable asset for this particular destination organization is
   accessibility tooling that already exists but is positioned as a sub-feature,
   and then defers repositioning it past the first release on the grounds that
   the mapping should not be guessed. Is that the right call, or does it ship the
   destination organization something that under-serves them while the
   information needed to do better was obtainable by asking? Argue the stronger
   opposing case.

4. **The qa-agent cut line.** The plan deletes a 4,748-line feature rather than
   parameterizing it. Given the feature is one product's UI catalog plus drivers,
   is deletion right, or is there a generalizable core being thrown away? What
   evidence in the packet would change the answer, and is that evidence present?

5. **The Phase 4 / Phase 5 seam.** Criterion mapping inside the QA plugin,
   conformance document generation as its own plugin. Is that seam in the right
   place?

6. **Version reset to 0.1.0** for all four, including one currently at 1.2.0.

Also surface, independently of the questions above:

- Any phase ordering problem, in particular work in a later phase that will force
  rework of an earlier one.
- Anything in the plan that is stated as settled but is actually an open question.
- The single largest risk the plan does not mention. The author is interested in
  being told what was missed, not in confirmation.

Do not propose that the destination organization's needs be re-scoped, and do not
recommend additional plugins beyond what the plan names. Ground every finding in
something the packet actually says, and quote or cite the part you are reacting
to. Where you disagree with a decision, state what you would do instead and what
it costs.
