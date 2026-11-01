# Adversarial review — 2026-10-31

Moved here from `dev/STATE.md` on 2026-11-01. It was written there when the review ran, but
STATE.md is a snapshot of work state and this is a durable record of findings and what was done
about them. The raw reports are in `.team-runs/20261031T015726Z-19f39fc3/`, which is **gitignored**,
so before this file existed the only committed account of the review was a section of a file meant
to be overwritten.

## Composition

Codex and Gemini, cold, both lead-excluded, 62 KB packet: the root README, the root `AGENTS.md`,
the catalog JSON, and `know-researcher/README.md`. `dev/STATE.md` and `dev/review/install-walk.md`
were deliberately **excluded** — they are the authoring session's own account of the work, and
including them would have coached the reviewers. Project config was inspected first and carries
only a timeout and a context limit, no roster or focus override.

## Acted on

- **The catalog overclaimed accessibility coverage.** `know-qa-agent`'s description advertised
  "a full axe-core ruleset pass and exact WCAG AA contrast math" with no indication that tier is
  **opt-in**, while the README says plainly it is turned on per test via an `## Accessibility
  Focus` section or `--a11y-depth deep`. Since the catalog description is what the install UI
  renders, a reader could reasonably believe ordinary tests include the full ruleset. For this
  organization that is the house rule being broken in the one piece of text people read before
  installing anything. Rewritten to name both tiers and to state that none of it is a conformance
  evaluation. Manifest and catalog updated together and asserted identical. (`86e7d68`)
- **`know-researcher`'s egress section contradicted its own table.** It said everything but Codex
  sends "a search query derived from your topic" and that "every call goes through Bash." Both
  were wrong: extraction sends a URL and pulls the page back, three services receive an
  identifying parameter (`mailto`, an email, a `User-Agent`), and the default floor tier —
  `WebSearch` and `WebFetch` — are Claude's own tools and are *not* visible as shell commands.
  Rewritten with the three cases named. This was the authoring session's own sentence, written the
  same day, in the section users rely on to decide what is safe to research.
- **The update sequence listed four plugins of six.** `know-blueprint` and `know-researcher` were
  added in later phases and never added here.
- **Convention 1 had no gate.** Gemini noted it was written as a rule and mapped to no CI check.
  It is mechanically checkable, so `dev/scripts/check-namespace.mjs` now checks it: the commands
  subdirectory where a plugin has wrappers, the skill names where it does not. Verified to catch a
  deliberate violation and to clear when removed.
- **The functional gate had no acceptance condition.** Codex pointed out that "needs a functional
  check" never said what passing looks like, so two maintainers could claim the same rule at
  different standards. `AGENTS.md` now gives a four-step minimum for a plugin with no test of its
  own — install from the marketplace rather than the tree, run the entry point and *read* the
  output, exercise one refusal path, record what was and was not covered — plus the rule that a
  release may ship with the check outstanding only if the plugin's status row says so.

## Verified and dismissed

- **Gemini: the README hides a `jq` dependency behind "Nothing to start."** The same table cell
  names `jq` and what it is for. False positive.
- **Gemini: the README omits the browser-tools prerequisite for `know-product-spec`.** The cell
  already reads "the UI review needs browser tools and somewhere your designs live." False
  positive.
- **Gemini: the README never mentions Slack though the catalog advertises it.** True, and left
  alone. The root README is a summary that routes to each plugin's own guide, and
  `know-qa-agent/README.md` documents reporting sinks thoroughly. Promoting every catalog feature
  into the root table would bloat the document a reader uses to choose.

## Both reviewers made the same larger point, and it is not a defect

Each one led with handoff readiness being contradicted by the repository's own disclosures: QA has
never been driven against a live site, researcher has never run a project end to end. That is
exactly what the status rows and the "what hasn't been exercised here" sections say. The
documentation is honest; what was overstated was **the framing of the task given to them** —
"ready to hand to staff" — when the defensible claim is narrower: ready to install, read, and
maintain, with functional validation outstanding and named. Worth keeping because it is the same
error as calling something a finding when nothing turns on it: the words claimed more than the
evidence.

## Follow-on

A value review ran the next day and is recorded separately in `dev/review/value-review.md`; its
conclusion drove the four 0.2.0 releases (`5562eec`). A self-audit of this review and the
proposals it had been missing is at `32925d5`, and one unsupportable claim about `know-qa-agent`'s
cold install was corrected at `467bf49`.
