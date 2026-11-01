# AGENTS.md — know-researcher

Maintainer/agent guidance for working **on** the know-researcher plugin. Standalone,
self-contained research system. (Current version lives in `plugin.json` and `CHANGELOG.md`.)

## What it is

Turns Claude Code or Claude Desktop into an audited research partner: a phased plan grounded in
preliminary research, then collect → cross-reference → gap-check → synthesize → audit every claim
before it reaches `outputs/`. The point is traceability and anti-drift, not summarization — every
claim traces to a specific source note, and every note to a declared source.

## Structure

- `commands/know-research/` — 12 thin command wrappers: `init`, `discover`, `process-source`,
  `cross-ref`, `check-gaps`, `summarize-section`, `audit-claims`, `start-phase`, `phase-insight`,
  `progress`, `graph-analysis`, `review-corpus` (the corpus credibility review runner; closeout
  gating is wired, so the final phase closes only through the validator).
- `skills/research-*/` — the 12 engines the wrappers delegate to.
- `agents/research-integrity.md` — the integrity-checking subagent (no web dependencies);
  `agents/corpus-reviewer.md` — the Tier-2 corpus reviewer (cold, read-only; dispatched only by
  the review runner).
- `reference/` — read-only knowledge base: root guides, templates, and per-type discovery
  playbooks and channel maps (11 research types).
- `hooks/` — Claude Code hooks: the `outputs/` gate, the `PreCompact` save warning, and a
  session-start PATH fixup.

**End-to-end operating model, two files**, at repo-root `dev/know-researcher/`:

- `ARCHITECTURE.md` — the explanation. What it does, how the cycle works, what it remembers, who
  decides what, and what it does not protect against. Read this first, and hand it to anyone who
  needs to understand the system.
- `MAINTAINERS.md` — the ledger. Decision and write ownership, the seam register, the
  workstream-to-version map, evidence labels. Read it before non-trivial changes; **update it in
  the same change** when a boundary, judgment home, principle, or seam moves.

`dev/know-researcher/README.md` says what came across in the port and what did not.

## Key mechanics

- **Outputs gate.** Nothing reaches `research/outputs/` without passing
  `/know-research:audit-claims`. On Claude Code this is a `PreToolUse` hook that blocks
  Write/Edit/MultiEdit to `outputs/` unless an audit authorized the write within the last 120s
  (via a row in `research/audits/gate-log.md`). In Claude Desktop hooks don't run; the gate holds
  as a structural rule — `audit-claims` is the only skill that writes to `outputs/`.
- **The gate fails closed without `jq`.** This was changed during the port and the reason matters:
  the hook parses its payload with `jq`, and when `jq` was absent the parse returned empty, the
  script exited 0, and **the write was allowed** — the plugin's central guarantee vanished with
  nothing but `jq: command not found` on stderr to show for it. A gate that cannot verify
  authorization must not grant it, so a missing `jq` now refuses writes that name the outputs
  directory and says what to install. Nothing outside `research/outputs/` is affected. If you
  touch `hooks/gate-outputs.sh`, keep that direction: over-blocking announces itself,
  under-blocking does not.
- **3-tier discovery:** Tavily CLI → Firecrawl CLI → built-in WebSearch/WebFetch. Works with zero
  CLIs installed (built-ins are the floor). `retrieval-log.json` records the tier per run; a
  Tier-3 banner appears in candidate files when CLIs were unavailable. Exa runs in parallel with
  Tavily on the web-search channel when `EXA_API_KEY` is set, and is skipped silently otherwise.
- **Integrity spine:** canonical figures registry (numbers can't drift across phases), a claim
  graph (claims as nodes with edges to sources and figures), and the integrity agent that runs
  after every write to catch fabrication, range-narrowing, and qualifier stripping.
- State lives in `STATE.md`; phases are sequential and resumable across sessions.

## Surface differences (Claude Code vs Claude Desktop)

Hooks (the `outputs/` gate, `PreCompact`, the PATH fixup) and the `.claude/settings.json`
pre-allow are Claude Code only; in Claude Desktop the gate holds structurally and the plugin
detects the surface automatically. Plan generation in `/know-research:init` runs inline on all
surfaces — full stop.

## Arrival locks

These were decided during the port into this marketplace. Change them deliberately or not at all.

- **Confidence tiers rate evidence, never products.** A tier says how well the sources support a
  claim. The house rule in the root `AGENTS.md` forbids any plugin here from implying automated
  output is a conformance evaluation, and this plugin can break it from a direction the others
  cannot: a well-sourced, High-confidence research finding about *what an accessibility standard
  requires* is not a determination that anything *conforms*. The distinction is written into
  `skills/research-audit-claims/SKILL.md` where the tier is assigned, into the manifest
  description, and into the README. If you soften it, soften it in all three or in none.
- **The invocation namespace is `/know-research:<command>`**, carried by the `commands/`
  subdirectory, matching `know-blueprint`, `know-security` and `know-photo-generator`. The plugin
  this was forked from used two forms for the same commands — a hyphen form (366 references) and a
  colon form (36) — and its own changelog argues for the hyphen. This port uses one form
  everywhere. Skill `name:` frontmatter was left un-prefixed (`research-init`, not
  `know-research-init`), which is correct and settled: skills are addressed `<plugin>:<name>`, so
  the plugin name already disambiguates, and duplicate short skill names across plugins are normal
  — Anthropic's own marketplace ships three plugins that all declare `name: access`. Convention 1
  in the root `AGENTS.md` carries the evidence. Do not rename these to chase a collision that does
  not exist.
- **The version was not reset.** `1.18.0` came across as-is rather than restarting at `0.1.0`.
  A twelve-skill system with an adversarial corpus-review protocol is telling the truth about its
  maturity; `0.1.0` would deny it. `know-photo-generator` reset and said why; this one didn't and
  says why. The arrival entry in `CHANGELOG.md` records both.
- **Pre-fork history is preserved verbatim** in `CHANGELOG.md` under its own heading, version
  numbers and all. Those numbers belong to the original lineage. A global rename during the port
  silently rewrote command names inside those historical entries; the file was restored from
  source and the new entry written on top. Don't re-run a blanket substitution over it.

## Maintaining this plugin

- **Release:** follow **Release & versioning** in the root `AGENTS.md`. Bump `version` in
  `plugin.json`, update the `v<X.Y.Z> — ` prefix in both descriptions (`plugin.json` + the catalog
  entry in `.claude-plugin/marketplace.json`, which carries the manifest description verbatim),
  the README "Plugins at a glance" row, and the root `AGENTS.md` plugin list; add a `CHANGELOG.md`
  entry; then `node dev/scripts/check-version-prefix.mjs`,
  `node dev/scripts/check-described-commands.mjs`, `node dev/scripts/check-channel-routing.mjs`,
  and `claude plugin validate ./know-researcher`
  + `claude plugin validate .`; commit, then `claude plugin tag ./know-researcher --push`, which
  writes **`know-researcher--v<X.Y.Z>`** (double dash) after checking the manifest and the catalog
  entry agree.
- **Editing cautions specific to this plugin:**
  - Adding or renaming a discovery channel touches four places, and
    `dev/scripts/check-channel-routing.mjs` checks all four: the playbook file in
    `reference/discovery/channel-playbooks/` (the filename is what resolves), its `name:` and
    `channel-type:` frontmatter, the `active-channels` list in every type-channel map that should
    reach it, and a `(channel-type: <name>)` section in `skills/research-discover/SKILL.md` giving
    the channel its tool guidance. What the gate cannot check is whether a channel can actually
    answer what a map asks it for — read the playbook's "Cannot find" against the map's routing
    lines before adding an entry. That mismatch, not a missing file, is what 1.19.0 fixed.
  - The `outputs/` gate is the hard backstop. Don't add another writer to `outputs/`, and don't
    loosen the hook without preserving both the structural rule and the fail-closed behavior.
  - Each command in `commands/know-research/` is a thin wrapper that delegates to its matching
    `skills/research-*` engine — change behavior in the **skill**, not the wrapper, and keep the
    wrapper's `description` and the skill's trigger description in sync.
  - Plan generation in `/know-research:init` runs **inline** on all surfaces — never delegated to
    a subagent. Keep Claude Desktop and Claude Code identical.
  - The integrity spine (canonical-figures registry, claim graph, `research-integrity` agent) is
    load-bearing anti-drift — it tests sourcing and consistency, not prose. Preserve the registry
    and the post-write integrity pass; numbers must not drift across phases.
  - `reference/validate-corpus-review.py` is installed **into each project** at init
    (`research/bin/`), so an existing project keeps the copy it was initialized with. Changing the
    validator here does not change it for projects already underway; those adopt it through
    `/know-research:init upgrade`.
