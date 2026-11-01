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

**One table is hand-maintained, and only one:** `harness/tools/wcag-aa-criteria.json`, the 55 live
Level A and AA criteria with their numbers, names and levels. It cannot come from rule metadata,
because a rule's conformance tag is the *lowest* level among all the criteria that rule touches and
assigns a level to none of them individually. Levels have to come from the WCAG document. The file
carries its source URL and retrieval date, and its own note on how to regenerate it.

**Read rule metadata with `axe.getRules()`, never `axe._audit.rules`.** The two disagree: the
internal array reports axe's seven *experimental* rules as enabled when `axe.run` does not evaluate
them. Verified by running axe against a DOM and taking the union of violations, passes, incomplete
and inapplicable — 89 rule ids, not 96. Getting this wrong overstates coverage by two A/AA criteria
(1.3.4 Orientation and 2.5.3 Label in Name), which is exactly the kind of error this document
exists to prevent.

`contrast.mjs` is a single-criterion tool: everything it reports is **1.4.3 Contrast (Minimum)**,
AA, judged at 4.5:1 for normal text and 3:1 for large text.

## What the output is

**Coverage, not conformance.** An axe pass ends with a coverage section over all 55 live A/AA
criteria, which grades each one into exactly one of four states and never merges them:

| Grade | What it means |
|---|---|
| **Failed** | a rule ran and returned a violation — a defect, with the node |
| **Needs review** | a rule ran and could not decide — a person judges it |
| **Checked by rule** | a rule ran and found nothing. The automated check is satisfied. **Not** that the criterion is met: a rule tests part of a criterion |
| **No rule reaches it** | untested. Nobody looked. Not a pass |

**The measured state of the pinned version.** axe-core 4.12.1 ships 105 rules and runs 89 by
default: nine are disabled outright (five deprecated, three AAA-only, and `target-size`) and seven
are experimental. Those 89 rules reach **19 of the 55** live A/AA criteria. `axe.mjs` opts
`target-size` back in — the only one of the sixteen that is at A/AA and neither deprecated nor
experimental, and SC 2.5.8 is reachable by no other rule — which brings the run to **20 of 55, with
35 criteria no rule reaches at all.**

The experimental rules stay off. They would reach two more criteria and they are experimental
because their false-positive rate is not production-grade; a findings tool that cries wolf gets
switched off, which costs more coverage than it buys. The coverage section names them against the
criteria they would reach, so the trade is visible rather than invisible.

**The fourth grade is wider than axe.** `axe.mjs` reports only what axe did and claims no credit
for the other tiers. The baseline checks (keyboard reachability, visible focus, alt text, form
labels), `contrast.mjs` deciding 1.4.3 from resolved colors, and the ARIA-widget keyboard checks
all examine criteria axe has no rule for. The report skill merges those in as *looked at by a
person or a heuristic*, carrying the method rather than a rule id. So **20 of 55 is axe's reach,
not the plugin's** — quoting it as the plugin's coverage understates the tool, and quoting the
merged number as axe's overstates the rules.

## Four reasons this is not a conformance evaluation

1. **axe implements rules for only a subset of the success criteria.** 35 of the 55 live A/AA
   criteria have no rule that runs. A criterion no rule reaches is **untested**, which is not the
   same as satisfied. The tooling now distinguishes those two and lists the untested ones by
   number and name — an earlier version of this document said it could not, which was true then
   and is the gap the coverage section closed. Distinguishing them is not the same as closing
   them: the 35 are still untested, and now you can see which.
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
  first, evidencing a specific defect to an engineer, and **scoping a manual audit** — the
  untested list is a work list for the person doing the parts no rule reaches.
- Not supported: producing a conformance report or accessibility statement, answering a
  procurement questionnaire, or telling a client a page "passes WCAG AA".
