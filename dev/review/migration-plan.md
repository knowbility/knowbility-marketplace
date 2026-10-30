# Migration plan: four plugins into a new Knowbility marketplace

Status: proposed, nothing built. This document is the artifact under review.

## Context

Claude Code "plugins" are directories containing skills (Markdown files with YAML
frontmatter), slash commands, agents, hooks, and optional scripts. A "marketplace"
is a git repository with a `.claude-plugin/marketplace.json` catalog listing its
plugins; users run `/plugin marketplace add <owner>/<repo>` then
`/plugin install <plugin>@<marketplace>`. A plugin's skills are invoked as
slash commands. The invocation namespace comes from either the skill's own
`name:` frontmatter field (if present) or the plugin name (if absent).

Two existing private marketplaces belong to different owners:

- **Marketplace A** (a company, proprietary license, 12 plugins). Source of
  `product-spec` and `qa-agent`.
- **Marketplace B** (the author's own, MIT license, 10 plugins). Source of
  `photo-generator` and `security`.

The author has clearance to move all four. The destination is a new, currently
empty private repository owned by a third organization: a digital accessibility
nonprofit. The four plugins must arrive carrying no identifying or
operational detail from either source organization, and must be configurable by
the destination organization for their own use.

The destination organization is a small nonprofit (7-member board, mid executive
director transition, three vacant officer seats). Its core expertise is digital
accessibility auditing, including manual and assistive-technology testing.

## The four plugins

| Plugin | Version | Size | Contents |
|---|---|---|---|
| `product-spec` | 0.21.0 | 420K | 10 skills, interview-to-spec pipeline, a Node lint script |
| `qa-agent` | 0.11.0 | 1.1M | 11 skills, a Node test engine, a Playwright browser harness, hooks, an agent |
| `photo-generator` | 1.2.0 | 164K | 2 skills, 2 commands, a reference library, a Python image-generation script |
| `security` | 0.1.0 | 308K | 4 skills, 4 commands, an agent, a scaffold with Node scan scripts |

## Measured coupling to the source organizations

Counts are from grep over each tree.

**`product-spec`: 2 references.** `author.name` in the manifest, one README line.
Already built tracker-agnostic with an optional profile file for local vocabulary.

**`security`: 4 references.** Manifest author/homepage/repository, three schema
namespace strings of the form `<org>.security.<tool>/1` in scan scripts, and one
dated example comment in a script. Its config template is already fully
parameterized with placeholders and null defaults.

**`photo-generator`: ~12 references.** Manifest author/homepage/repository, plus a
264-line brand-style reference library containing two named house styles belonging
to the source organizations, one brand-neutral style worth keeping, and one
undefined stub. The named styles also appear as the worked examples in command
docs and skill descriptions.

**`qa-agent`: the real coupling.** Two distinct categories.

*Category 1, generic QA that stays.* The test engine, the browser harness
(screen recording, screenshots, network and console inspection, performance
timing), the agent's testing judgment and posture, the finding lifecycle,
the triage and deduplication, and the entire accessibility stack. None of this
is organization-specific. Confirmed with the plugin's owner.

*Category 2, one organization's product automation that goes.* An account-seeding
feature that populates a specific web application from a profile file: 4,748 lines
across 10 files, including a 2,018-line catalog of that one application's UI
controls and a driver that holds scripted conversations with that application's
assistant. The plugin's own docs already state this feature is specific to that
product by design and is not a generic seeder.

The cut is clean. Verified by import graph:
- The two drivers' helper functions have no importers outside the two drivers.
- The test engine never references the seeding path.
- One sibling module imports only the unrelated half of a shared policy file.

Removing it leaves 13 files carrying roughly 50 dangling textual references
(docs, a skill that scaffolds a now-unneeded folder, a safety-reference section,
and four code comments) plus one policy function to delete.

Separately, `qa-agent` ships two example documents containing live operational
detail from one source organization: a tracker identifier and workspace ID, and a
QA environment hostname. Both examples teach genuinely useful deliverable shape,
so the plan rewrites rather than deletes them.

## Naming decision

The author will have the source plugins and the destination plugins installed
simultaneously, so names and invocations must not collide. The proposal prefixes
`know-` at two layers.

| Install name | Invocation | Was | What drives the namespace |
|---|---|---|---|
| `know-qa-agent` | `/know-qa:run` | `/qa:run` | explicit `name:` in 10 skill files |
| `know-product-spec` | `/know-spec:write` | `/product-spec:write` | plugin name (skills have bare `name:`) |
| `know-photo-generator` | `/know-photo:generate` | `/photo-generator:generate-photo` | plugin name (flat commands) |
| `know-security` | `/know-security:audit` | `/security:audit` | a `commands/security/` directory |

Cost: about 1.5 hours, nearly all of it a mechanical rename of 560 `/qa:`
occurrences across 25 files in `qa-agent` (163 in one orchestration doc, 84 in
the README), plus 10 frontmatter edits and one directory rename.

Known tradeoff: renaming later would break muscle memory and any scripting, and
an org-specific prefix reads like a vendor prefix if these are ever published
publicly as a community contribution.

## Repository conventions to adopt

Taking deliberately from both sources rather than inheriting a hybrid:

1. **From Marketplace B: a directory-level composition convention.** Plugins never
   depend on each other. Shared state lives in the user's deployment directory as
   a few well-known JSON files, each row tagged with the producing plugin, each
   plugin creating files if absent and touching only its own rows. The full
   convention document is attached as `inputs/kenzie-contract.md`.
2. **From Marketplace A: build docs separated from shipped code.** Per-plugin
   PRDs, release plans, and verification artifacts live in a repo-root `dev/<plugin>/`
   directory so they are not downloaded into every user's installed plugin cache.
3. **From Marketplace A: CI that catches version drift.** Each plugin embeds its
   own version as a prefix in its description string, in both the plugin manifest
   and the marketplace catalog. A real past incident shipped a bump in one place
   but not the others, so the marketplace card displayed a wrong version. A Node
   script plus a GitHub Actions workflow checks parity and validates every manifest.
4. **MIT license**, destination organization's copyright.
5. **A single current-state file** (`dev/STATE.md`) as the handoff point between
   working sessions.

## Phases

| Phase | Work | Estimated | Gate |
|---|---|---|---|
| 0 | Scaffold: catalog, conventions doc, CI, license, `dev/` | 1-2 hrs | catalog validates |
| 1 | `know-product-spec` + `know-security` | 1.5 hrs | validate, then live install and run |
| 2 | `know-photo-generator`, brand-style library rebuilt | 2 hrs | validate |
| 3 | `know-qa-agent`: the 4,748-line excision, 13 files of reference cleanup, 2 example rewrites, the 560-reference rename | 4-6 hrs | validate, independent de-branding sweep, then a live browser test run |
| 4 | Reposition `know-qa-agent` around accessibility | ~1.5 days | deferred |
| 5 | A conformance-reporting plugin | unscoped | requirements first |

Phases 0-3 total roughly two working days.

Copy by file copy, never by git clone: neither source history travels, and the
`dev/` directories of both sources stay behind (one contains production test
evidence). All four versions reset to 0.1.0, each with a changelog entry naming
the fork origin and what was removed, on the reasoning that a plugin with a major
feature removed is not a later version of the original and carrying the number
invites diffing against an upstream that no longer matches.

## The deferred accessibility work (Phase 4), and why it is deferred

`qa-agent` already contains, as generic QA infrastructure:

- A full-ruleset accessibility rule engine pass (~90 rules) that surfaces the
  engine's own "incomplete" results as needs-review rather than dropping them.
- An exact WCAG 2.x AA contrast-ratio pass computed from resolved styles, which
  reports needs-review when a background cannot be resolved to a solid color
  rather than guessing.
- An existing two-tier model: agent judgment checks by default, deterministic
  passes when a spec declares an accessibility focus section, with six named
  focus areas and a scenario tag.

For a digital accessibility nonprofit this is arguably the most valuable thing in
the migration, and it is currently positioned as a sub-feature of a general test
run. The proposed repositioning: make the deep tier the default, add a direct
entry point that runs the passes against a URL without requiring a full spec, add
a mapping from each rule and contrast failure to its WCAG 2.2 success criterion
and level, and add a per-criterion conformance view to the report.

The plan defers this past the first release. Reasoning: the success-criterion
mapping and conformance view encode how the destination organization's own
auditors structure findings, which is knowable by asking them and is the kind of
thing that is worse when guessed. Phases 0-3 put a working marketplace in their
hands in about two days; Phase 4 follows once one of their auditors has looked at
real output.

A boundary statement ships in the README either way: these passes catch a
deterministic subset only, do not produce a formal conformance report, and do not
replace screen-reader or keyboard-only testing.

## Proposed seam between Phase 4 and Phase 5

Success-criterion mapping and finding annotation stay inside the QA plugin,
because they annotate output that plugin already produces. Formal conformance
document generation becomes a separate plugin, because it must merge manual and
assistive-technology evidence the QA plugin cannot produce, and its output is
quasi-legal.

## Review gates using independent CLI advisors

1. **Planning review** (this one), before anything is written.
2. **Adversarial de-branding sweep**, after Phase 3 and before the first push.
   Criteria: find any residual identifier, internal hostname, tracker ID,
   credential, or organization-specific assumption.
3. **Optional excision review**, with the explicit note that a passing manifest
   validation plus one live browser test run is stronger evidence that nothing
   broke than advisor opinion, and that advisor consensus must not substitute for
   that run.

Gate 2 is deliberately sequenced after the scrub rather than before, so that the
packet sent to third-party providers contains no source-organization internals by
construction. Clearance to move code between organizations is not clearance to
send one organization's internal identifiers to external model providers.
