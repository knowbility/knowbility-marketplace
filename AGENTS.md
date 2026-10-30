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
| `know-security` | 0.1.0 | `/know-security:*` | Adversarial security and privacy reviewer that reads code the way someone trying to get at the data would. Never probes, never touches a network. | Ported, 66-case suite passing. |

Two more are planned (`know-photo-generator`, `know-qa-agent`); see
`dev/review/migration-plan.md` for the plan they arrive under and `dev/STATE.md` for where that
work stands.

## Conventions (how every plugin here is shaped)

1. **`know-` prefix, at two layers.** Plugin directory and manifest `name` are prefixed
   (`know-qa-agent`), and the invocation namespace is prefixed too (`/know-qa:run`). The install
   layer is for legibility: the marketplace card and `/plugin` lists should make it obvious these
   are Knowbility's. The invocation layer is load-bearing: installed plugins are keyed
   `<plugin>@<marketplace>`, so install names never actually collide, but the typed short command
   comes from a skill's own `name:` frontmatter field, and two plugins declaring `name: qa:run`
   make `/qa:run` ambiguous. Prefix both; only the second one prevents a real collision.
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

## Release & versioning

1. Make the change in the plugin directory.
2. Bump `version` in `<plugin>/.claude-plugin/plugin.json`.
3. Update the `v<X.Y.Z> — ` prefix in that manifest's `description`.
4. Update the same prefix in the plugin's entry in `.claude-plugin/marketplace.json`.
5. Add a `CHANGELOG.md` entry in the plugin.
6. Run the gates below. All three must pass.
7. Commit, and tag `<plugin>-v<X.Y.Z>`.

Steps 3 and 4 are the ones that get forgotten, which is exactly what the CI check exists to catch.

## Gates

```
node dev/scripts/check-version-prefix.mjs
claude plugin validate .
claude plugin validate ./<plugin>
```

A plugin that ships executable code or drives a browser needs a functional check too, not just
manifest validation. Validating a manifest proves the manifest parses; it proves nothing about
whether the thing runs.

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
