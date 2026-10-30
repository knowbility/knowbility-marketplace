---
name: security-init
description: This skill should be used when the user wants to set up the security reviewer in a project (e.g. "set up security review here", "/know-security:init", "install the security gate"). Asks at most two questions, scaffolds security/ with the findings registry, the triggered decisions ledger, config, and scripts, and wires the gate into trailhead if it is present.
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep
model: sonnet
---

# security-init — set it up in under a minute

## Tool discipline

**Never use shell.** Read, Write, Edit, Glob, and Grep only — that is why `Bash` is not in
`allowed-tools`. Cowork prompts on every shell invocation, so a setup skill that shells out
turns a one-minute task into a dozen approval dialogs, and people stop running it. Everything
here is file work; nothing needs a subprocess.

## Two questions, and not a third

Security questions are the ones users least want at t=0, and a five-question interview is how a
security tool gets abandoned during setup. The budget is **two**. Everything else is either
detected by the locator or becomes a triggered decision that surfaces when the code forces it.

1. **What is a subject here?** The unit personal data belongs to and isolation is scoped by —
   a tenant, an organization, a workspace, a single user, or nothing yet. *"Nothing yet"* is a
   real answer and it becomes decision S-1.
2. **Where does subject data live?** The migration or schema path. Offer what Glob finds
   (`**/migrations/**`, `prisma/schema.prisma`, `db/**`) and let them confirm.

If the answers are already obvious from the repository, say what you inferred and ask them to
confirm rather than asking cold.

## Scaffold

Write these into the target project. Every file comes from `${CLAUDE_PLUGIN_ROOT}/scaffold/`;
substitute the placeholders and change nothing else.

```
security/
  FINDINGS.md          from FINDINGS.md.tmpl — the registry. Committable.
  DECISIONS.md         from DECISIONS.md.tmpl — S-1..S-6, triggered
  config.json          from config.json.tmpl — globs, gate thresholds, subject
  scripts/
    locate.mjs         candidates and the unread work list
    secrets.mjs        credential candidates
    staleness.mjs      review recency from git
    check.mjs          the gate
    check-decisions.mjs
    lib/scan.mjs
  .state/              created empty; reviews.json is written by the review skills
```

Placeholders in `config.json.tmpl`:

| Placeholder | Fill with |
|---|---|
| `{{SOURCE_GLOBS}}` | A JSON array of the project's source roots, from what Glob actually finds. Do not paste the defaults if they do not match this repository — a glob that misses a directory means that directory is never reviewed, and the locator will say so only if the framework is declared. |
| `{{MIGRATION_GLOBS}}` | A JSON array, from question 2. |

Then set `subject` from question 1, and leave `declared_stores` and `sensitive_categories`
empty — those fill in as the reviewer finds things.

In `DECISIONS.md.tmpl`, substitute `{{MIGRATION_TRIGGER}}` with the migration glob, and set
`{{ISOLATION_STATUS}}` / `{{ISOLATION_ANSWER}}` from question 1: `DECIDED` with the answer if
they named a subject unit, `UNDECIDED` with an empty answer if they said "nothing yet."

## Wire the gate

**If `gate.config.json` exists** (trailhead is installed), add two stages and write
`scripts/checks/security.mjs` as a three-line re-export of `security/scripts/check.mjs`:

| Stage | `reversibility` | Why |
|---|---|---|
| `security-decisions` | `irreversible` | An unmade isolation or deletion decision cannot be taken back once data is written under it. Blocks even at `prototype` — the answers are one conversation each. |
| `security-findings` | `costly` | Unresolved findings compound but are recoverable. Reports at prototype, blocks from pilot. A gate that blocks a three-route spike is a gate that gets deleted. |

Never declare `optional_if_absent` on either. Trailhead converts an undeclared `n/a` into a
`config_error`, and that boundary is ours to keep.

**If it does not exist**, say so and move on. `check.mjs` runs standalone with the same
semantics and its own exit code — the two plugins compose through files and neither imports the
other. Do not add a dependency on trailhead, and do not degrade to nothing: "uninstall the
other plugin" must never become a documented way to report secure.

## Do not scaffold

- **No hooks.** A security review that fires automatically is a review nobody asked for, at a
  moment nobody chose. `reference/safety.md` states this; the sibling QA plugin rejects hooks
  as false assurance and the reasoning is stronger here.
- **No `.gitignore` entry.** Everything written is committable by design.
- **No baseline run.** Do not sweep during init. Setup and review are separate acts, and a
  sweep buried inside setup is a sweep whose output nobody reads.

## Then say what to do next

```
security/ is set up. Nothing has been reviewed yet — the gate will say so.

  /know-security:sweep              first full pass, ordered by what nobody has looked at
  /know-security:review             from here on, as you change things
  /know-security:audit              registry state and what is unreviewed
```

Be explicit that init established nothing about the code. An empty registry over an unreviewed
repository is the absence of evidence, and the gate reports `missing_input` for exactly that
reason.
