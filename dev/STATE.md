# Work state — Knowbility marketplace

**Last updated:** 2026-11-01 · **Session focus:** released the four 0.2.0 plugins and
`know-researcher` 1.19.0 (a standards discovery channel), then added the routing gate that release
showed was missing

This is a snapshot, not a log. Git history holds the previous versions, each plugin's
`CHANGELOG.md` holds its own story, and `AGENTS.md` holds the conventions and the decisions of
record.

## Where things stand

**The migration is complete and five releases have shipped on top of it.** Six plugins ported,
de-branded, validated, registered, and installable from the private repository. `main` is at
`fe4edc0`, pushed, tree clean, 13 tags.

| Plugin | Version | Invoked as | State |
|---|---|---|---|
| `know-product-spec` | 0.2.0 | `/know-spec:*` | Manifest validated. Never driven end to end. |
| `know-security` | 0.1.0 | `/know-security:*` | 66-case suite passing. `init` never run from a cold install. **A README claim is wrong — see next steps 3.** |
| `know-photo-generator` | 0.2.0 | `/know-photo:*` | Key check passing. **No image has ever been rendered** (bills a real generation). **A Knowbility brand style is undefined** — the section is a template awaiting the organization's input, representation guidance included. |
| `know-qa-agent` | 0.2.0 | `/know-qa:*` | Engine and harness verified; 0.2.0 reports what a run did *not* cover. **Never driven against a live site.** Needs Node 18+ and Chrome. |
| `know-blueprint` | 0.2.0 | `/know-blueprint:*` | Five skills/commands as of 0.2.0 (`validate` added). No interview run end to end. |
| `know-researcher` | **1.19.0** | `/know-research:*` | Output gate verified blocking an unaudited write in a live session. **The new standards channel has never been executed through the discover skill** — see next steps 2. `init` not run. |

Per-plugin detail lives in each `CHANGELOG.md`. Install verification lives in
`dev/review/install-walk.md`. Provenance and licensing live in `dev/PROVENANCE.md`. The two
adversarial/value reviews live in `dev/review/adversarial-review-2026-10-31.md` and
`dev/review/value-review.md`.

**The installed copies on this machine are behind the repo.** Verified by reading the cache:
`~/.claude/plugins/cache/knowbility/` holds `know-blueprint` **0.1.0** and `know-researcher`
**1.18.0**, against 0.2.0 and 1.19.0 in the tree. Anything run from the installed path gets the old
behavior, so the standards channel is not reachable there yet.

## Done this session

- **Four 0.2.0 releases** (`5562eec`, four tags): `know-photo-generator`, `know-product-spec`,
  `know-blueprint`, `know-qa-agent`. Each plugin's `CHANGELOG.md` has the detail. The release was
  one commit, not four, because the shared `marketplace.json` and root `README.md` carry per-plugin
  content and `check-version-prefix.mjs` requires catalog and manifest to agree — four commits
  would each leave three plugins gate-failing. Precedent `340e2e8` already bundles two.
- **A README audit caught a count contradiction** in `know-blueprint/AGENTS.md`: three stale "four
  jobs" claims, two of them contradicting each other in the same file, after an earlier pass had
  supposedly fixed them. Found by sweeping mechanically rather than by eye, and amended into the
  release commit so the tag points at a correct tree. That plugin's CHANGELOG records the same
  drift happening once before.
- **`know-researcher` 1.19.0: a standards discovery channel** (`cc25041`, tag
  `know-researcher--v1.19.0`). Full account in that plugin's `CHANGELOG.md`. The defect was not a
  missing feature: five routing lines across three type-channel maps already told discovery to find
  standards and regulation text and routed them to channels that implement neither, while
  `domain-specific.md` advertised standards bodies in three places and shipped no hook.
- **New gate: `dev/scripts/check-channel-routing.mjs`** (`fe4edc0`). Four checks on discovery
  routing. Verified by injecting six faults, not by watching it pass. It does **not** catch the
  1.19.0 defect and says so in three places — see "Session knowledge" below.

## In flight / uncommitted

**None.** Tree clean, everything pushed.

## Next steps (in order)

1. **Update the installed plugins** so the installed path matches the tree (`know-blueprint`
   0.1.0 → 0.2.0, `know-researcher` 1.18.0 → 1.19.0). Cheap, and it is a prerequisite for step 2.
   Leaving them stale is also a legitimate choice — it preserves a returning-user state at known
   older versions — but then nothing below can be exercised.
2. **Run `/know-research:init` on a real topic, and reach the standards channel.** Still the last
   unwalked path and still the only one needing something from Kelsey: an actual research subject.
   It is now worth more than it was. The standards channel's six query templates were each run
   against the live API by direct `curl` before being written down, **but the channel has never
   executed through the discover skill** — the playbook has never been resolved from an
   `active-channels` list at runtime, no source has ever been written with the new `authority` and
   `edition` fields, and the degradation chain has never been walked. Those are different claims
   from "the APIs work," which is all that was verified. A research subject touching US federal
   accessibility requirements would exercise it directly.
3. **Fix or disprove `know-security/README.md:66`.** It claims "every skill injects it verbatim
   into the reviewer's assignment so five entry points cannot drift," referring to
   `reference/finding-contract.md`. Only `skills/security-review/SKILL.md` references that file;
   the plugin ships 4 skills, 4 commands and 1 agent. Either the wiring is missing or the sentence
   is wrong, and it is a false claim in a shipped README. Flagged twice and not acted on. Small —
   read the five entry points, then either wire them or rewrite the line. `know-security` is at
   0.1.0 and was in neither release, so this would be its first change.
4. **One auditor conversation unblocks both Phase 4 and Phase 5.** Phase 5's eleven questions are
   in `dev/phase-5/REQUIREMENTS.md` and are about current practice, not about the tool; its
   eleventh question decides whether this is a plugin at all. Phase 4 needs real `know-qa-agent`
   output in front of the same person — grounding in `dev/review/migration-plan.md` under "The
   deferred accessibility work".
5. **Walk the remaining plugins' first-run paths** when there is a reason to. `know-qa-agent`
   against a live site is the most valuable and the most expensive (Node 18+, Chrome, a real
   target). An actual image render through `know-photo-generator` bills a generation.

Two optional items, offered and declined or not yet taken: the README/doc slash-command sweep
(found 0 problems across 18 docs, so insurance rather than a fix — the throwaway script is gone
and is ~20 lines reusing `check-described-commands.mjs`'s invocation logic), and
`know-blueprint`'s two different "fives" (the README table lists discover/capture/design/validate/
guide; the `guide` command lists discover/design/quick capture/deep capture/validate). Each is
internally correct and the split predates this session. Left alone deliberately.

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

Most of what this session learned went to a permanent home rather than here: the four live-probe
API facts are in `know-researcher/reference/discovery/channel-playbooks/standards.md`, the rejected
prose check is in `dev/scripts/check-channel-routing.mjs`'s header, the staleness rewrite is in
`know-researcher/reference/source-assessment-guide.md` §1, and the routing-gate conventions are in
both `AGENTS.md` files.

**Three WCAG versions are operative at once**, verified from regulation text rather than recall:
36 CFR 1194 incorporates WCAG **2.0** Level A and AA, 28 CFR 35.200 adopts WCAG **2.1** Level AA,
and the current W3C Recommendation is **2.2**. A 2008 document is the live Section 508 requirement.
No age-based staleness heuristic can represent that, which is why 1.19.0 replaced age with
`authority` and `edition`. This is the fact most likely to be "corrected" to something simpler by
someone who assumes the newest version is the requirement.

**A gate's limits belong in the gate.** `check-channel-routing.mjs` does not catch the defect that
motivated it: on the broken 1.19.0 tree the channel resolved, the playbook existed, the frontmatter
agreed, and the routing was still wrong, because the map asked a channel for something it does not
implement. That is stated in the script header, in the root `AGENTS.md` entry, and in the commit
message — three places on purpose, because a reader hitting only one still learns that green does
not mean correct. Writing it otherwise would have been the same overclaim 1.19.0 removed from
`domain-specific.md`.

**The stronger version of that gate does not work, and the evidence is worth not re-deriving.**
Checking that channels named in a map's *prose* appear in its `active-channels` flagged three
files, and all three were correct: `customer-safari.md`, `opportunity-discovery.md` and
`presentation-research.md` each carry a "Channel scope note" naming a channel in order to say it is
**excluded**. Separating that from a real mis-route means parsing English negation, which fails in
both directions.

**Maintainer docs inside a plugin directory ship without a version bump.** Settled by reading:
`581b2ea`, `9032d45` and `b6f8d9a` each changed a plugin's `AGENTS.md` with no `plugin.json`
touched. Now also recorded in `AGENTS.md` → Release & versioning, which is its real home.

**Carried forward because the pattern keeps costing work** (from the previous checkpoint, still
true): establish tool, file and host facts by reading, hashing, diffing or running the thing — a
session asked to report its own state generates plausible text, not a register. And a fact is only
a finding if some decision changes depending on it. This session's version of the first one:
`axe.getRules()` does expose `enabled`, confirmed by running it, which is the only reason the
shipped inventory code is sound rather than marking all 105 rules as having run.

**zsh does not word-split unquoted parameters.** `for p in "a b"; set -- $p` leaves `$1` as the
whole string, which silently broke a loop over file/pattern pairs this session. Write the calls out
or use `python3`.

**Scratch artifacts, all in the session scratchpad and therefore gone:** the gate fault-injection
harness (a copy of `reference/discovery/{channel-playbooks,type-channel-maps}` plus
`skills/research-discover/` beside a copy of the gate script, so the script's `import.meta.url`
root resolution finds them — recreate with `cp -R` in four lines), the axe-core measurement script,
and the README slash-command sweep.

**Deliberately left running:** the Playwright MCP servers, which belong to the harness rather than
to this session's work. Nothing here starts or stops browsers at checkpoint.

**Left installed on this machine:** the `knowbility` marketplace, plus `know-blueprint` and
`know-researcher` at user scope, both at the older versions noted above. This machine is no longer
cold for a future walk, which is the returning-user state and fine.

## How to resume

1. Read `AGENTS.md` — orientation, conventions, decisions of record, gates.
2. Read this file.
3. For the next task specifically: `dev/review/install-walk.md` before any further install testing,
   `dev/phase-5/REQUIREMENTS.md` before touching Phase 5, and the relevant plugin's
   `dev/<plugin>/` directory before changing it. For anything touching discovery channels, read
   `know-researcher/AGENTS.md` → editing cautions first; it names the four places a channel lives.
