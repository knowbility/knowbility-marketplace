# Work state — Knowbility marketplace

**Last updated:** 2026-10-30 · **Session focus:** ported `know-researcher` (Phase 7), closed every
open question, walked the cold install, scoped Phase 5

This is a snapshot, not a log. Git history holds the previous versions, each plugin's
`CHANGELOG.md` holds its own story, and `AGENTS.md` holds the conventions and the decisions of
record.

## Where things stand

**The migration is complete.** Six plugins ported, de-branded, validated, registered, and
installable from the private repository. `main` is at `cceef40`, 16 commits, pushed.

| Plugin | Version | Invoked as | State |
|---|---|---|---|
| `know-product-spec` | 0.1.0 | `/know-spec:*` | Ported, manifest validated. Never driven end to end. |
| `know-security` | 0.1.0 | `/know-security:*` | Ported, 66-case suite passing. `init` never run from a cold install. |
| `know-photo-generator` | 0.1.0 | `/know-photo:*` | Ported, key check passing. **No image has ever been rendered** (bills a real generation). **A Knowbility brand style is undefined** — the section is a template awaiting the organization's input, representation guidance included. |
| `know-qa-agent` | 0.1.0 | `/know-qa:*` | Ported, engine and harness verified. **Never driven against a live site.** Needs Node 18+ and Chrome. |
| `know-blueprint` | 0.1.0 | `/know-blueprint:*` | Ported and installed from the marketplace; a skill verified running from the installed copy. No interview run end to end. |
| `know-researcher` | **1.18.0** | `/know-research:*` | Ported and installed. Validator self-test 74/74, and **its output gate verified blocking an unaudited write in a live session**. `init` not run. |

Per-plugin detail lives in each `CHANGELOG.md`. Install verification lives in
`dev/review/install-walk.md`. Provenance and licensing live in `dev/PROVENANCE.md`.

## Done this session

- **Phase 7: `know-researcher` ported** (`fc8cd0f`). 84 files, 15,894 lines, 12 skills, 2 agents,
  3 hooks. Kept 1.18.0. Three defects fixed, all of them silent failures: the output gate allowed
  writes when `jq` was absent, all three hook commands passed an unquoted plugin root, and
  `setup-paths.sh` omitted a directory its own comment promised. Full account in that plugin's
  `CHANGELOG.md`.
- **Every open question closed** (`3b50984`, `9032d45`). Kelsey ruled on the maintenance model and
  repository visibility; provenance and the MIT notice were delegated and decided. The skill-name
  prefix question and the Claude Desktop private-repo concern were both closed on evidence — see
  "What I got wrong" below.
- **Cold install walked** (`9188faa`, `74318ab`, `03791d5`). Recorded in
  `dev/review/install-walk.md`.
- **Phase 5 scoped** (`502e7e4`). `dev/phase-5/REQUIREMENTS.md`. Nothing built.
- **New gate:** `dev/scripts/check-described-commands.mjs`, written after a manifest description
  named a nonexistent command in the install-UI text and two existing gates passed it.

## In flight / uncommitted

**None.** Tree clean, everything pushed.

## Next steps (in order)

1. **Run `/know-research:init` on a real topic.** The last unwalked path and the only one that needs
   something from Kelsey: an actual research subject. Four questions, ~20 minutes of live web
   research, then a phased plan. A fake topic tests the plumbing and says nothing about whether the
   plan is any good. What else it proves is listed in `dev/review/install-walk.md`.
2. **One auditor conversation unblocks both Phase 4 and Phase 5.** Phase 5's eleven questions are in
   `dev/phase-5/REQUIREMENTS.md` and are about current practice, not about the tool; its eleventh
   question decides whether this is a plugin at all. Phase 4 needs real `know-qa-agent` output in
   front of the same person — the grounding is in `dev/review/migration-plan.md` under "The deferred
   accessibility work".
3. **Walk the remaining four plugins' first-run paths** when there is a reason to. `know-qa-agent`
   against a live site is the most valuable and the most expensive (Node 18+, Chrome, a real
   target). An actual image render through `know-photo-generator` bills a generation.

## Also done, after the checkpoint

- **All six releases tagged**, `<plugin>--v<X.Y.Z>`, via `claude plugin tag` which validates that
  each manifest and its catalog entry agree. The **double dash is the convention here** — it is
  what the tool produces, and a single dash is ambiguous about where a hyphenated plugin name ends.
  `AGENTS.md` said single dash and was corrected. All six point at `98e61f6` because they arrived
  in bulk; later releases will not share a commit.
- **A source organization's internal identifiers were found and removed from
  `dev/know-researcher/ARCHITECTURE.md`.** It used a named company's product as an extended
  teaching comparison and described its internals — the product name, an internal content system,
  and an internal runtime service. **The adversarial de-branding sweep ran after Phase 3, so
  nothing brought in during Phases 6 and 7 was ever swept.** The passage's argument is good and was
  kept; it now describes a generic productized guided-session agent. The identifier sweep's
  patterns would not have caught these — they are product and service names, not hostnames or keys.
  **Any future port must sweep its `dev/` imports, not just the plugin directory.**

## The adversarial review, 2026-10-31 (`.team-runs/20261031T015726Z-19f39fc3/`)

Codex and Gemini, cold, both lead-excluded, 62 KB packet: the root README, the root `AGENTS.md`,
the catalog JSON, and `know-researcher/README.md`. `dev/STATE.md` and
`dev/review/install-walk.md` were deliberately **excluded** — they are this session's own account
of the work, and including them would have coached the reviewers. Project config was inspected
first and carries only a timeout and a context limit, no roster or focus override.

### Acted on

- **The catalog overclaimed accessibility coverage.** `know-qa-agent`'s description advertised
  "a full axe-core ruleset pass and exact WCAG AA contrast math" with no indication that tier is
  **opt-in**, while the README says plainly it is turned on per test via an `## Accessibility
  Focus` section or `--a11y-depth deep`. Since the catalog description is what the install UI
  renders, a reader could reasonably believe ordinary tests include the full ruleset. For this
  organization that is the house rule being broken in the one piece of text people read before
  installing anything. Rewritten to name both tiers and to state that none of it is a conformance
  evaluation. Manifest and catalog updated together and asserted identical.
- **`know-researcher`'s egress section contradicted its own table.** It said everything but Codex
  sends "a search query derived from your topic" and that "every call goes through Bash." Both
  were wrong: extraction sends a URL and pulls the page back, three services receive an
  identifying parameter (`mailto`, an email, a `User-Agent`), and the default floor tier —
  `WebSearch` and `WebFetch` — are Claude's own tools and are *not* visible as shell commands.
  Rewritten with the three cases named. This was my sentence, written the same day, in the section
  users rely on to decide what is safe to research.
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

### Verified and dismissed

- **Gemini: the README hides a `jq` dependency behind "Nothing to start."** The same table cell
  names `jq` and what it is for. False positive.
- **Gemini: the README omits the browser-tools prerequisite for `know-product-spec`.** The cell
  already reads "the UI review needs browser tools and somewhere your designs live." False
  positive.
- **Gemini: the README never mentions Slack though the catalog advertises it.** True, and left
  alone. The root README is a summary that routes to each plugin's own guide, and
  `know-qa-agent/README.md` documents reporting sinks thoroughly. Promoting every catalog feature
  into the root table would bloat the document a reader uses to choose.

### Both reviewers made the same larger point, and it is not a defect

Each one led with handoff readiness being contradicted by the repository's own disclosures: QA has
never been driven against a live site, researcher has never run a project end to end. That is
exactly what the status rows and the "what hasn't been exercised here" sections say. The
documentation is honest; what was overstated was **my framing of the task to them** — "ready to
hand to staff" — when the defensible claim is narrower: ready to install, read, and maintain, with
functional validation outstanding and named. Worth keeping because it is the same error as calling
something a finding when nothing turns on it: the words claimed more than the evidence.

## Open questions / decisions pending

- **Knowbility's photographic house style**, including disability representation guidance.
  `know-photo-generator` ships the section as an unfilled template with a note saying why, and
  `/know-photo:generate` refuses to invent values for it. Unblocked by: someone at Knowbility who
  owns visual identity.
- **Two Knowbility marketplace repositories exist.** `knowbility/knowbility-marketplace` (this one,
  everything is here) and `knowbility/knowbility-plugin-marketplace` (private, created 2026-08-14,
  2 KB, effectively empty). Near-identical names are a way for someone to add the wrong one.
  Unblocked by: Kelsey deciding to delete, archive, or leave it. No action taken.
- **Claude Desktop's plugin UI labels** are unobserved. The install mechanism underneath is the one
  verified in `dev/review/install-walk.md`, so the risk is label accuracy rather than function.
  Unblocked by: anyone installing once through the Desktop app.

## Session knowledge worth keeping

Most of what this session learned went to a permanent home rather than here:
`dev/review/install-walk.md` (what installing actually does, plus two `claude -p` traps that cost
an hour), `AGENTS.md` → Decisions of record and the corrected Gates list, `dev/PROVENANCE.md`
(licensing reasoning), and each plugin's `CHANGELOG.md`.

**What I got wrong, because the pattern cost real work.** Six times this session I turned an
untested assumption into an open issue, and each dissolved on contact with the machine in under a
minute:

- Claude Desktop private-repo install "might not work" — it demonstrably works, and Kelsey already
  installs from a private marketplace daily.
- Skill-name collisions across plugins needed fixing — they do not. Anthropic's own marketplace
  ships three plugins that all declare `name: access`. This nearly triggered a four-plugin rename.
- A documented command form was missing from a session's listing — I had misread the listing; the
  leading segment is the plugin prefix, which drops.
- A hook's block message named a pre-rename command — the session had paraphrased it; both copies
  were byte-identical and correct.
- Plugin token cost was "undocumented" and needed a decision — it needed nothing. Always-on cost is
  what plugins are, roughly 4% of context for all six, and no choice follows from knowing it. A
  README paragraph was written and reverted.

Two rules came out of it. **Establish tool, file and host facts by reading, hashing, diffing, or
running the thing** — a session asked to report state generates plausible text, not a register.
And **a fact is only a finding if some decision changes depending on it**; otherwise it is trivia,
and escalating it converts curiosity into someone else's work.

**Scratch fixtures** from the gate testing are in the session scratchpad and are gone. How to
rebuild them is in `dev/review/install-walk.md`.

**Left installed on this machine:** the `knowbility` marketplace, plus `know-blueprint` and
`know-researcher` at user scope. Deliberate. It means this machine is no longer cold for a future
walk, which is fine — that is the returning-user state.

## How to resume

1. Read `AGENTS.md` — orientation, conventions, decisions of record, gates.
2. Read this file.
3. For the next task specifically: `dev/review/install-walk.md` before any further install testing,
   `dev/phase-5/REQUIREMENTS.md` before touching Phase 5, and the relevant plugin's
   `dev/<plugin>/` directory before changing it.
