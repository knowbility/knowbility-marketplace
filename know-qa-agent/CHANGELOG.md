# Changelog — know-qa-agent

All notable changes to the know-qa-agent plugin. Per-plugin semver; tags are plugin-scoped
(`know-qa-agent--vX.Y.Z`).

## 0.2.0 — 2026-10-31

**An accessibility run now reports what it did not test.**

The number people misread is "0 violations". A clean axe pass meant 89 rules ran and found
nothing, across the fraction of the standard those rules reach — and the output had no way to say
which fraction, so silence about a criterion looked exactly like a pass on it. `axe.mjs` said as
much in a comment: a per-criterion table was declined because "this script cannot tell untested
from satisfied." It can now, and this is that change.

**Four grades, never merged.**

| Grade | Means |
|---|---|
| Failed | a rule ran and returned a violation — a defect, with the node |
| Needs review | a rule ran and could not decide — a person judges it |
| Checked by rule | a rule ran and found nothing. The automated check is satisfied, **not** the criterion: a rule tests part of one |
| No rule reaches it | untested. Nobody looked. Not a pass |

Every axe pass now ends with that breakdown over all 55 live Level A/AA criteria, and lists the
untested ones by number and name rather than leaving them as an absence.

**What the measurement actually came to**, since the earlier read of this was wrong twice:

- axe-core 4.12.1 ships **105 rules and runs 89** by default. Nine are disabled outright (five
  deprecated, three AAA-only, `target-size`) and seven are experimental.
- Those 89 reach **19 of the 55** live A/AA criteria.
- **`target-size` is now opted in** — the only one of the sixteen that is at A/AA and neither
  deprecated nor experimental, and SC 2.5.8 Target Size (Minimum) is reachable by no other rule.
  That takes the run to **20 of 55**, leaving **35 criteria no rule reaches**, among them 1.4.11
  Non-text Contrast, 2.1.2 No Keyboard Trap, 2.4.3 Focus Order, 2.4.7 Focus Visible and 3.3.1
  Error Identification.
- **Read rule metadata with `axe.getRules()`, never `axe._audit.rules`.** The internal array
  reports the seven experimental rules as `enabled: true` when `axe.run` does not evaluate them.
  Settled by running axe against a DOM and taking the union of violations, passes, incomplete and
  inapplicable: 89 rule ids, not 96. Trusting the internal array overstates coverage by two
  criteria (1.3.4 Orientation, 2.5.3 Label in Name) — the exact error `reference/wcag-mapping.md`
  exists to prevent, now recorded there.
- **The experimental rules stay off.** They would reach those two criteria, and they are
  experimental because their false-positive rate is not production-grade. Three false findings and
  a tool gets switched off, which costs more coverage than it buys. The coverage section names
  them against the criteria they would reach, so the trade is visible instead of invisible.

**The fourth grade is not axe's to claim, and `axe.mjs` does not claim it.** The baseline tier,
`contrast.mjs` deciding 1.4.3 from resolved colors, and the ARIA-widget keyboard checks all examine
criteria axe has no rule for. The script reports only what axe did; `report` merges the others in as
*looked at by a person or a heuristic*, carrying the method rather than a rule id. **So 20 of 55 is
axe's reach, not the plugin's** — quoting it as the plugin's understates the tool, and quoting the
merged figure as axe's overstates the rules.

**One hand-maintained table, and only one.** `harness/tools/wcag-aa-criteria.json` holds the 55
live A/AA criteria with numbers, names and levels, carrying its source URL and retrieval date. It
cannot be derived from rule metadata: a rule's conformance tag is the *lowest* level among all the
criteria that rule touches and assigns a level to none of them individually. Levels have to come
from the WCAG document. Three of the four grades need no table at all — only the untested
complement does. Parsing note recorded in the file: 4.1.1 Parsing is "Obsolete and removed" and
carries no level marker, so the live A+AA total is 55, and a parse that lets a criterion inherit the
next one's marker gets 56.

**`report` gained an Accessibility coverage section** that states the four grades, merges the
fourth, and trends the untested count — with the warning that a falling failure count because a
tier stopped running is a regression that looks like an improvement. The section is omitted
entirely when no accessibility tier ran, because an empty coverage table reads like a clean one.

**`reference/wcag-mapping.md`** no longer says the tooling cannot tell untested from satisfied.
That was true when it was written and is the gap this closes — and distinguishing the 35 is not
closing them. Scoping a manual audit is now a supported use: the untested list is the work list.

Keywords gained `wcag`.

## 0.1.1 — 2026-10-31

**The install-UI description claimed the deep accessibility tier as if it were the default.**

The manifest and catalog descriptions read "Accessibility is first-class: a full axe-core ruleset
pass and exact WCAG AA contrast math." Both are real, and both belong to the **opt-in** tier — the
one turned on per test with an `## Accessibility Focus` section in the spec or `--a11y-depth deep`
when generating one. Baseline accessibility rides along in every test, but it is the narrower set:
keyboard reachability, visible focus, alt text, form labels, obvious contrast problems.

The catalog description is the text the browse card renders, so a reader choosing this plugin could
reasonably conclude that an ordinary test run gives them the full ruleset and computed contrast
ratios. It does not. For an organization whose credibility rests on how accessibility findings are
described, an overstatement of coverage in the one piece of text people read *before* installing
anything is the house rule being broken at the front door.

The description now names both tiers, says the deeper one is turned on per test, and states that
none of it is a conformance evaluation or a substitute for testing by a person. No behavior
changed; the plugin always worked this way. What changed is that the description now says so.

Found by an independent adversarial review (Codex), which compared the catalog text against the
README's own account of the two tiers. Two existing gates passed it: one checks only the version
prefix, the other checks that command names inside descriptions resolve. Neither reads a
description against the behavior it claims, and no script can — that comparison needs a reader.

## 0.1.0 — 2026-10-30

First release in the Knowbility marketplace.

Forked with clearance from an existing QA plugin, then de-branded and narrowed. The parts that
make it work are unchanged: the deterministic test engine and its run manifest, the browser
harness (screen recording, screenshots, console and network inspection, performance and
loading-state capture, computed-style fingerprinting), the tester agent's judgment and posture,
the finding lifecycle, triage and deduplication, tracker-agnostic filing, areas and owners,
reporting sinks, and the whole accessibility stack.

### Removed: one product's account seeding

The source plugin carried a feature that populated a specific web application from a profile
file: `/qa:seed`, two browser drivers, a profile grammar, and a 2,018-line catalog of that one
application's UI controls. The source plugin's own documentation described it as specific to that
product by design and explicitly not a generic seeder.

4,787 lines across 11 files removed. The cut was verified clean before it was made: the drivers'
helper modules had no importers outside the drivers themselves, and the test engine never
referenced any of it. `seedAllowedForConfig` came out of the environment policy with them;
`writeAllowedForConfig`, which `drive.mjs` actually uses, is untouched.

Removing it left 52 dangling references across eight files, all cleaned: a skill that scaffolded a
profiles directory nobody writes to any more, a safety-reference section on seeding consent, a
routing rule, an orchestration reference section, two skill counts, and four code comments. The
skill count is now ten, matching what is on disk.

### Added: WCAG success criteria on every accessibility finding

`axe.mjs` already ran the full axe-core ruleset and surfaced axe's "incomplete" results as
needs-review rather than dropping them. It was discarding the one piece of metadata that makes
the output usable for conformance work: each rule's `tags` array, which is where axe records the
success criteria the rule tests.

Violations and needs-review results now carry the criteria they map to and the conformance level
(`[WCAG AA: 1.4.3, 4.1.2]`), derived from those tags rather than a hand-maintained table, so the
mapping cannot drift from the pinned axe-core. A run ends with a roll-up of which criteria were
touched, split into failing and needs-review.

Deliberately **not** a per-criterion pass/fail table. axe implements rules for only a subset of
the criteria, so a criterion with no failing rule is untested rather than satisfied, and this
script cannot tell those apart. A per-criterion verdict requires declaring untested scope, which
is a human determination. `reference/wcag-mapping.md` is new and states the four reasons this is
not a conformance evaluation, plus what one additionally needs.

### De-branding

- **Renamed** to `know-qa-agent`, invoked as `/know-qa:<skill>`. 546 command references and 10
  skill namespace declarations updated.
- **Project state directory** moved from `.qa/` to `.know-qa/`, 416 references. This one needed
  care: the code refers to it both as `.qa/` and as a bare quoted `'.qa'`, so a slash-only
  rename would have left the code pointing at the old path while every document described the new
  one.
- **Two worked examples rewritten rather than deleted**, because both teach real deliverable
  shape. The tracker filing guide carried a live Atlassian cloudId, a site host, two real ticket
  keys, a board number, a sprint id, and a component list; it is now the same guide, including its
  counter-instance section where a second project inverts the first's most important field, on two
  fictional projects. The consistency-diff example lost a QA deployment hostname and a ticket key.
- **A real personal email address** was removed from an example reporting-sink config. The
  identifier scan caught it; a scan for organization names would not have.
- Two JSON schema `$id` URLs re-rooted, a computed-style inspector's default selectors relabelled
  as worked-example values rather than one deployment's, a recording example's button text
  genericized, and a component-list reference that named one company's internal wiki page made
  generic.
- Author, license (MIT), homepage, and repository set to Knowbility's. The description no longer
  advertises seeding and leads with accessibility.

Version reset to 0.1.0 from the original's 0.11.0 deliberately. A plugin with a major feature
removed is not a later version of the original, and carrying the number would invite diffing
against an upstream that no longer matches.
