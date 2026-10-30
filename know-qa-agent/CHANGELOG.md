# Changelog — know-qa-agent

All notable changes to the know-qa-agent plugin. Per-plugin semver; tags are plugin-scoped
(`know-qa-agent-vX.Y.Z`).

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
