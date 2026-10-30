# WCAG success criteria in accessibility output

What the deterministic accessibility passes can and cannot tell you about conformance. Read this
before putting any of their output in front of a client, an auditor, or a procurement reviewer.

## Where the criterion numbers come from

`axe.mjs` does not carry a hand-maintained mapping table. axe-core tags every rule with the
success criteria that rule tests, and the script reads those tags:

| Tag shape | Meaning | Example |
|---|---|---|
| `wcag` + principle + guideline + criterion | the success criterion | `wcag143` → 1.4.3, `wcag2410` → 2.4.10 |
| `wcag` + version + level | conformance level the rule belongs to | `wcag2aa` → 2.0 AA, `wcag22aa` → 2.2 AA |
| `best-practice` | axe's own recommendation, **not** a WCAG requirement | reported with no criterion |

Because the mapping comes from the pinned axe-core's own metadata, it cannot drift from the rules
actually running. Upgrading axe-core updates the mapping for free; it also changes what is tested,
which is a reason to treat the version as part of the result.

`contrast.mjs` is a single-criterion tool: everything it reports is **1.4.3 Contrast (Minimum)**,
AA, judged at 4.5:1 for normal text and 3:1 for large text.

## What the output is

**Coverage, not conformance.** The roll-up at the end of an axe pass names the criteria this page
has a *failing rule* against, and separately the criteria with a *needs-review* result. That is
all it claims.

## Four reasons this is not a conformance evaluation

1. **axe implements rules for only a subset of the success criteria.** Many criteria have no
   automated rule at all. A criterion absent from the output is **untested**, which is not the
   same as satisfied, and nothing in this tooling can tell those two apart.
2. **Several criteria are only partly machine-decidable.** A rule can confirm an image has an
   `alt` attribute; whether the alt text is a useful equivalent is a human judgment. Passing the
   rule is necessary, not sufficient.
3. **`needs-review` results are genuinely undecided.** axe reports these when it cannot resolve a
   question, and `contrast.mjs` reports them when a background will not reduce to a solid color.
   They are surfaced rather than dropped precisely because dropping them would understate the
   work left. They are not failures and they are not passes.
4. **Scope is whatever page was passed in.** A conformance claim is about a defined set of pages
   and states; a run is about one URL as it rendered at one moment, in one browser, at one
   viewport, in one authentication state.

## What a conformance evaluation additionally needs

Assistive-technology testing with real screen readers, keyboard-only traversal of every flow,
testing at magnification and with reduced motion, cognitive-load review, a declared page set and
sampling rationale, a stated baseline (version, level, technologies relied upon), and a human
accountable for the determination. None of that is produced here.

**This tooling shrinks the surface a person has to review. It does not stand in for the person.**

## Honest use

- Good: triage during development, regression detection, narrowing where a human should look
  first, evidencing a specific defect to an engineer.
- Not supported: producing a conformance report or accessibility statement, answering a
  procurement questionnaire, or telling a client a page "passes WCAG AA".
