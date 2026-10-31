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

1. **Tag the six current releases.** `AGENTS.md` step 7 specifies `<plugin>-v<X.Y.Z>` and no tags
   exist, because all six arrived in bulk rather than through the release loop. `claude plugin tag`
   validates that the manifest and the catalog entry agree, so it is the right tool. Six tags:
   `know-product-spec-v0.1.0`, `know-security-v0.1.0`, `know-photo-generator-v0.1.0`,
   `know-qa-agent-v0.1.0`, `know-blueprint-v0.1.0`, `know-researcher-v1.18.0`.
2. **Run `/know-research:init` on a real topic.** The last unwalked path and the only one that needs
   something from Kelsey: an actual research subject. Four questions, ~20 minutes of live web
   research, then a phased plan. A fake topic tests the plumbing and says nothing about whether the
   plan is any good. What else it proves is listed in `dev/review/install-walk.md`.
3. **One auditor conversation unblocks both Phase 4 and Phase 5.** Phase 5's eleven questions are in
   `dev/phase-5/REQUIREMENTS.md` and are about current practice, not about the tool; its eleventh
   question decides whether this is a plugin at all. Phase 4 needs real `know-qa-agent` output in
   front of the same person — the grounding is in `dev/review/migration-plan.md` under "The deferred
   accessibility work".
4. **Walk the remaining four plugins' first-run paths** when there is a reason to. `know-qa-agent`
   against a live site is the most valuable and the most expensive (Node 18+, Chrome, a real
   target). An actual image render through `know-photo-generator` bills a generation.

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
