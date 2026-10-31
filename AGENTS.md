# AGENTS.md — Knowbility marketplace

Start here. This file is the entry point for anyone, human or agent, picking up work in this
repository. Current work state is in `dev/STATE.md`.

## What this is

A Claude Code plugin marketplace owned by Knowbility. Each plugin is a small, focused tool that
does one job well. Plugins here are **standalone**: none depends on another being installed, and
none imports from another.

Install from this marketplace:

```
/plugin marketplace add knowbility/knowbility-marketplace
/plugin install <plugin>@knowbility
```

The repository is private, so anyone installing needs read access on the `knowbility` GitHub
organization and working git credentials. That is a real setup step, not an afterthought.

## Plugins (current state)

| Plugin | Version | Invoked as | What it does | State |
|---|---|---|---|---|
| `know-product-spec` | 0.1.0 | `/know-spec:*` | Interview to PRD, then grades its own draft by decomposing it into workstreams and tasks and reporting every decision it had to invent. Tracker-agnostic. | Ported, manifest validated. Not yet driven end to end. |
| `know-security` | 0.1.0 | `/know-security:*` | Adversarial security and privacy reviewer that reads code the way someone trying to get at the data would. Never probes the system under review; the only network access is the dependency check, which runs your project's own package auditor against your package registry. | Ported, 66-case suite passing. |
| `know-photo-generator` | 0.1.0 | `/know-photo:*` | Plain-language description to a physics-aware image prompt, optionally rendered via the Gemini API. Needs a Gemini key. | Ported, key check passing. **A Knowbility brand style is not yet defined**; the section is a template awaiting the organization's input, representation guidance included. |
| `know-qa-agent` | 0.1.0 | `/know-qa:*` | Tests a web app like a skeptical engineer and reports what broke with the evidence. Two-tier accessibility suite: full axe-core ruleset and exact WCAG AA contrast math, every finding annotated with the success criteria it maps to. | Ported, engine and harness verified. **Not yet driven against a live site from a cold install here**; that and the adversarial de-branding sweep are the remaining gates. |
| `know-blueprint` | 0.1.0 | `/know-blueprint:*` | Interviews you into a written process model — trigger, steps, decision criteria, exception paths, approval authority — and rates every step Automate, Monitor, or Human. No setup, no dependencies, no network. | Ported, manifest validated. No interview run end to end here. |
| `know-researcher` | 1.18.0 | `/know-research:*` | Phased research with every claim audited back to its source note and every note to a declared source. Canonical figure registry, claim graph, integrity agent, and an output directory nothing reaches without passing audit. Works with no API keys; optional search CLIs sharpen discovery, and the optional Tier-1 corpus reviewer is the OpenAI Codex CLI, which reads the whole corpus — opt-in by installation, disclosed in both READMEs. | Ported, validator self-test 74/74, output gate tested with and without `jq`. **No research project run end to end here**; no live discovery call made. |

The four planned plugins are in, plus `know-blueprint` and `know-researcher`, both added after the original scope closed. See `dev/review/migration-plan.md` for the plan the first four arrived under and `dev/STATE.md` for where the work stands.

**On accessibility output:** `know-qa-agent` annotates findings with WCAG success criteria. That
is coverage, not conformance, and `know-qa-agent/reference/wcag-mapping.md` states why in detail.
No plugin here may imply it produces a conformance evaluation, a VPAT, or an accessibility
statement, and none may imply automated passes substitute for assistive-technology or
keyboard-only testing by a person. This is the house rule the organization's own work depends on.

**The same rule binds a plugin that rates work rather than performing it.** `know-blueprint` marks
each step of a process Automate, Monitor, or Human, and an "Automate" mark on a step whose output
is an accessibility determination is the house rule being broken from an unexpected direction — not
a claim about an artifact, but a claim that no person needs to look at one. So: **a step whose
output is an accessibility judgment is rated Human by default**, and a Blueprint that departs from
that default records the departure and what the rating would otherwise have been. Finding a missing
alt attribute is mechanical. Deciding whether the alt text is right, whether an image is
decorative, whether the reading order makes sense, or whether an accessible name means anything to
the person hearing it is judgment about human need, and no automated pass settles it. This
generalizes: before adding a plugin here that assigns autonomy, trust, confidence, or risk levels
to work, check whether its scale can express "no human needed" about an accessibility decision, and
close that off at the default.

**And a third direction: a plugin that rates evidence.** `know-researcher` assigns each claim a
confidence tier from its sourcing. The scale cannot express "no human needed" — the blueprint test
passes — but it breaks the rule another way. A well-sourced, High-confidence finding about *what an
accessibility criterion requires* is one claim; that a particular product *meets* it is a different
claim resting on different evidence, and the tier belongs only to the first. So: **a confidence
tier rates the sourcing of a claim, never the state of a thing in the world**, and a draft that
slides from what a standard requires to what a product therefore satisfies is an unsupported claim
no matter how strong the sourcing for its first half. Conformance comes from an evaluation somebody
performed, cited like any other source, not inferred from the standard's text.

Three directions now, and the pattern behind them is worth naming so the next plugin gets checked
against the pattern rather than the examples. The rule is violated whenever a plugin's output could
be **mistaken for a person having exercised the thing**: by describing an artifact (`know-qa-agent`),
by declaring that nobody needs to look at it (`know-blueprint`), or by sounding authoritative about
a requirement in a way that reads as a verdict on a product (`know-researcher`). Ask of any new
plugin: what could a reader conclude about an accessibility outcome from this output that no person
actually checked? Then close that off where the output is produced, not only in the README.

## Conventions (how every plugin here is shaped)

1. **`know-` prefix, at two layers, and the reason is legibility rather than collision.** The
   plugin directory and manifest `name` are prefixed (`know-qa-agent`), and the invocation
   namespace is prefixed too (`/know-qa:run`, `/know-research:init`). Both layers exist so that a
   marketplace card, a `/plugin` list, and a typed command all make it obvious these are
   Knowbility's.

   **Skill-name collisions between plugins are not a problem, and this was checked rather than
   assumed.** An earlier version of this convention claimed the skill layer was load-bearing —
   that two plugins declaring the same skill `name:` would make the short form ambiguous, and that
   only prefixing the skill name prevented a real collision. That is false. Observed on a machine
   with twenty-odd marketplaces installed:

   - Anthropic's own official marketplace ships `telegram`, `imessage`, and `discord`, and **all
     three declare `name: access` and `name: configure`.** Three-way collisions, shipped
     deliberately by the vendor.
   - Two plugins in another marketplace both declare a bare `name: run`, and the host lists them
     as `advisor-evaluation:run` and `aia-queue:run` — both reachable, each qualified by its
     plugin. No bare `run` is offered to disambiguate.

   Installed plugins are keyed `<plugin>@<marketplace>` and skills are addressed
   `<plugin>:<name>`, so the plugin name already disambiguates and a duplicate short name costs
   nothing. **Consequence for this repository: four of the six plugins carry skill `name:` values
   identical to the plugins they were forked from** (`security-audit`, `photo-setup`,
   `blueprint-capture`, `research-init`), and that is fine and stays. `know-product-spec` and
   `know-qa-agent` use colon-prefixed skill names (`know-spec:write`, `know-qa:run`) because they
   ship no `commands/` directory, so their skill name *is* the typed name. Both shapes are
   correct; which one a plugin uses follows from whether it has command wrappers.

   The rule, stated so it does not need revisiting: **prefix the directory, the manifest `name`,
   and whatever a user actually types.** For a plugin with command wrappers that is the
   `commands/` subdirectory. For a plugin without them it is the skill `name:`. Do not rename a
   forked plugin's skills to chase a collision that does not exist.

2. **Version in the description, and the version prefix must match.** Every plugin manifest's
   `description` starts with `v<X.Y.Z> — `, matching its own `version` field *and* its entry in
   `.claude-plugin/marketplace.json`. The browse cards render the catalog description, not the
   manifest's, so a prefix in only one place never shows up where people look. CI checks all three.
3. **Standalone, and composition happens in the user's directory.** A plugin never depends on
   another plugin. Where plugins do need to share state with each other, it lives as files in the
   user's own deployment directory, each plugin creating what it needs if absent and touching only
   what it owns. There is deliberately no shared-file schema, no cross-plugin contract, and no
   shared helper library in this repository: none of the plugins here needs one, and inventing the
   contract before a plugin needs it is how you end up maintaining a concurrency model nobody uses.
   Add one when a second plugin genuinely needs to read the first one's output, not before.
4. **Nothing under `dev/` ships.** Users download a plugin directory, so PRDs, build notes, review
   packets, and verification artifacts live at repo-root `dev/<plugin>/`.
5. **Honest boundaries in user-facing docs.** Where a tool produces a partial or automated result,
   its README says so plainly rather than letting a reader infer completeness. This matters most
   for accessibility output: automated passes catch a deterministic subset, do not constitute a
   formal conformance evaluation, and do not replace screen-reader or keyboard-only testing by a
   person. Never let a plugin imply otherwise.

## Build model (who owns what)

- **The plugin directory** is what users get: skills, commands, agents, hooks, reference files,
  scripts. It must be self-contained and work from a cold install.
- **`dev/<plugin>/`** is the build record: requirements, decisions, review output, verification
  evidence. Read it to pick up work; never ship it.
- **`dev/STATE.md`** is the handoff point between working sessions. Write it before clearing
  context so nothing important lives only in a conversation.

## Decisions of record

Settled calls that a fresh session should not reopen. Each was asked and answered rather than
assumed.

- **Repository visibility: private.** Installing requires `knowbility` org read access plus git
  credentials on the installer's machine, which is what the README documents. Verified working
  against the private repository — see `dev/review/install-walk.md`.
- **Maintenance model: it does not matter who maintains these.** Kelsey Ruger is on Knowbility's
  board and can support them either way. **The instruction that follows is the operative part: the
  documentation is written to be solid regardless.** Nothing is trimmed on the assumption that the
  original author will be around to answer questions. This was raised five times during the
  migration before being closed; do not raise it again.
- **Provenance is recorded, under `dev/`.** `dev/PROVENANCE.md` names the source marketplaces, the
  per-plugin licensing, and the reasoning behind the root `LICENSE`. It never ships to a plugin
  user. Kept on maintainability grounds: six plugins from two sources with two different version
  decisions, and without the table those answers live only in one person's memory.
- **The MIT notice is a single Knowbility copyright**, with no retained third-party notice. The
  reasoning is in `dev/PROVENANCE.md`. It is a drafting judgment, not legal advice.
- **Two version decisions, deliberately inconsistent.** `know-photo-generator` reset from 1.2.0 to
  0.1.0 because its brand-style library was genuinely rebuilt. `know-researcher` kept **1.18.0**
  because nothing about the research system was rebuilt and 0.1.0 would misrepresent its maturity.
  Both are explained in their own changelogs; `dev/PROVENANCE.md` has the comparison so the
  inconsistency reads as deliberate.
- **The tag format is `<plugin>--v<X.Y.Z>`, double dash**, because that is what
  `claude plugin tag` produces and a documented convention that fights its own tooling is how
  drift starts. All six plugins were tagged retroactively at `98e61f6`, the checkpoint commit,
  since they arrived in bulk rather than through the release loop — so the six tags share a commit
  and later releases will not.

## Release & versioning

1. Make the change in the plugin directory.
2. Bump `version` in `<plugin>/.claude-plugin/plugin.json`.
3. Update the `v<X.Y.Z> — ` prefix in that manifest's `description`.
4. Update the same prefix in the plugin's entry in `.claude-plugin/marketplace.json`.
5. Add a `CHANGELOG.md` entry in the plugin.
6. Run the gates below. All three must pass.
7. Commit, then tag with `claude plugin tag ./<plugin>`, which validates that the manifest and the
   catalog entry agree before writing anything. It produces `<plugin>--v<X.Y.Z>` with a **double**
   dash, and that is the convention here: a single dash is ambiguous about where a hyphenated
   plugin name ends (`know-photo-generator-v0.1.0`), while the double dash is not. Add `--push`
   to push the tag.

Steps 3 and 4 are the ones that get forgotten, which is exactly what the CI check exists to catch.

## Gates

```
node dev/scripts/check-version-prefix.mjs
node dev/scripts/check-described-commands.mjs
node dev/scripts/check-namespace.mjs
claude plugin validate .
claude plugin validate ./<plugin>
```

`check-described-commands.mjs` exists because a manifest description named a command that did not
exist, in the one piece of text shown in the install UI, and two other gates passed it — one
compares only the version prefix, the other compares the manifest description to the catalog
description, which agreed because both carried the same wrong name. Neither looked inside the prose.

`check-namespace.mjs` enforces convention 1 — it exists because an adversarial review pointed out that the convention was written as a rule and mapped to no gate, so a new plugin could drift without anything noticing. A rule nothing enforces is a rule that quietly stops being true.

Two more are worth running when the relevant thing changed:

```
node dev/scripts/identifier-sweep.mjs <plugin> [<dir> ...]   # after any port or de-branding
node dev/scripts/ground-truth.mjs > dev/review/readiness/ground-truth.md
```

The sweep returns candidates, not findings; read every line. `ground-truth.mjs` writes to stdout,
so redirect it — running it without redirecting leaves the file stale while looking like it worked.

A plugin that ships executable code or drives a browser needs a functional check too, not just
manifest validation. Validating a manifest proves the manifest parses; it proves nothing about
whether the thing runs.

**When a plugin has no test of its own, the minimum functional check is this.** Two reviewers
flagged that the rule above says a functional check is required without saying what passing one
looks like, which leaves each maintainer to decide and lets two releases claim the same rule at
different standards. So:

1. **Install it from the marketplace**, not from the working tree — `claude plugin install
   <plugin>@knowbility` after a `marketplace update`. A plugin that works in the repository and
   not from a cold install is the failure this catches, and it is the common one.
2. **Run its own entry point and look at what it produced.** Not "it did not error" — open the
   file, read the output, confirm it says what the README promised it would say.
3. **Exercise one refusal.** Every plugin here has something it declines to do: a gate, an unfilled
   template it will not invent values for, a determination it leaves to a person. Trigger that
   path and confirm it refuses. A plugin whose guardrail has never been observed working does not
   have a guardrail, it has a comment.
4. **Record what you ran and what you saw**, in `dev/review/install-walk.md`, including what you
   did not cover.

A release may ship with a functional check still outstanding, but only if the plugin's row in the
table above says so in plain words. "Ported, manifest validated" is an honest status; silence is
not.

The browser-driving case is the expensive one and is named rather than hidden: `know-qa-agent`
needs Node 18+, Chrome, and a real target before step 2 means anything, which is why its row says
it has never been driven against a live site. Where a plugin carries its own test or self-test, that is the functional
gate: `node dev/know-security/tests/finder.test.mjs` (66 cases) and
`python3 know-researcher/reference/validate-corpus-review.py self-test` (74 cases). The latter also
has `hash-self`, whose output must match `validator_sha256` in
`know-researcher/reference/review-protocol-contract.json` — a cheap way to prove a text pass did not
corrupt the validator.

## Adding a plugin

1. Create `<plugin>/.claude-plugin/plugin.json` with `name`, `version`, `description` (v-prefixed),
   `author`, `license`, `keywords`.
2. Add skills under `<plugin>/skills/<name>/SKILL.md`. Set an explicit `name:` in frontmatter to
   control the invocation namespace.
3. Write `<plugin>/README.md` (what it is and why someone would use it) and
   `<plugin>/CHANGELOG.md`.
4. Register it in `.claude-plugin/marketplace.json` with a matching v-prefix.
5. Put build docs in `dev/<plugin>/`.
6. Run the gates.

## Independent review

Substantive planning and pre-release review go through independent CLI advisors
(`cli-team`, modes `planning`, `review`, `adversarial`). Reports land in `.team-runs/`, which is
git-ignored: they are private review material.

One rule about packets, learned the hard way: **scrub before you send, and do not treat a scrub as
proof.** A de-branding sweep exists precisely to find what the scrub missed, so run a scripted
local check first and state residual risk honestly rather than claiming a packet is provably clean.
Clearance to move code between organizations is not clearance to send one organization's internal
identifiers to an external model provider.
