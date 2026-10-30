# know-security

**Read the code the way someone trying to get at the data would read it.**

A security and privacy reviewer that runs alongside development. It looks for the way in — the
endpoint nobody remembered, the helper everyone uses except here, the log line that seemed
harmless, the personal-data field no deletion path reaches — and reports **findings**: severity,
the attack path as read, the input that exercises it, the blast radius, and the fix.

Before anything else: **[absence of findings is not evidence of security](reference/honest-limits.md).**
That document is short, it is honest about what this cannot do, and it is linked first on purpose.

```
/know-security:init       two questions, then scaffold
/know-security:sweep      the whole codebase, ordered by what nobody has looked at
/know-security:review     what changed, from here on
/know-security:audit      open findings, and what has never been reviewed
```

## Install

```
/plugin marketplace add knowbility/knowbility-marketplace
/plugin install know-security@knowbility
```

## What it looks for

Eleven check families, in `agents/security-reviewer.md`:

| | |
|---|---|
| **AUTHZ** | missing checks, IDOR, missing tenant scope, mass assignment, escalation through user-settable state, export and admin surfaces |
| **PII** | a data-flow walk — what is collected, where it lands (logs, URLs, analytics, third parties, **LLM prompts**), whether it can be deleted, whether it can leave |
| **INJ** | SQL, command, template, NoSQL, path traversal, XXE, deserialization, ORM escape hatches |
| **AUTHN** | password storage, timing-unsafe comparison, session rotation, revocation, token verification |
| **SEC** | credentials in source, config, history, logs, client bundles |
| **XSS · SSRF · CRYPTO · CONF · LOG · DEP** | output encoding, user-influenced destinations, crypto misuse, debug and CORS and grants, missing audit trails, vulnerable dependencies |

The families are a floor, not a ceiling. A checklist finds what somebody already thought of, and
the agent is told so.

## How it avoids crying wolf

A missed vulnerability leaves you where you were. **Three false ones and the tool gets switched
off, which is a complete bypass that nobody chose.** So the design is asymmetric on purpose:

- **Confidence is welded to evidence type.** Path read end to end *and* a concrete input named →
  High. Reachability crossing an indirection nobody followed → Medium, capped. A detector hit
  alone → not a finding at all, a candidate. An agent cannot claim High without having done the
  reading, which makes over-claiming visibly wrong rather than merely discouraged.
- **No exploitability claim without a concrete input.** A missing guard is a fact about the code;
  "an attacker can read every tenant's rows" is a claim about behavior and needs the input that
  produces it.
- **Seven known-benign classes, and a read-before-classify rule.** A hardcoded password in a test
  factory is the correct way to write a test factory. Trace the value to its origin and its sink
  *before* classifying — the detector cannot tell those apart, and that is the entire reason a
  reader is involved.
- **Every discard is reported.** `Discarded 14 candidates: 9 test fixtures, 3 placeholders, 2
  vendored.` A scanner that suppresses silently is worse than one that over-reports, because from
  the outside a quiet run and a broken run look the same.
- **Dedup by root cause, not symptom.** Four routes missing the same tenant scope because they
  bypass the same helper are one finding with four locations — and one fix.

`reference/finding-contract.md` holds all of it, and every skill injects it verbatim into the
reviewer's assignment so five entry points cannot drift.

## Scripts locate; the agent judges

The deterministic layer produces candidates and measurements and **never a verdict**.
`/know-security:init` copies these into your own project at `security/scripts/`, which is
where you will find them after setup:

| | |
|---|---|
| `locate.mjs` | candidate surfaces, jobs, stores, and sinks — plus **`unread`**, the files it could not parse |
| `secrets.mjs` | credential candidates with context; prefers gitleaks, and says so when it cannot |
| `staleness.mjs` | review recency per subsystem, from git |
| `check.mjs` | the gate — registry, scanners, and git only |

**`unread` is the important one.** An earlier version of this plugin was a coverage register that
enumerated every surface and reported "N of M are guarded." It was reviewed twice and judged
untrustworthy both times, and the cause was not the patterns — it was the claim. A register has
to be complete or it lies, and regex over source produces a plausible sample. The same patterns
now produce a map plus a list of what they could not read, and that list is the reviewer's first
assignment rather than a hole in an assertion.

## Findings that are really decisions

Some findings are not defects in code that exists. They are a fork the code is about to be built
on: what the isolation unit is, whether deletion is soft or hard, whether a live session can be
revoked. Filing those as bugs asks someone to fix working code.

They get `disposition: design_decision_due` and route to `security/DECISIONS.md`, whose six seeded
questions fire when the code forces them — the first migration, the first auth file. The point is
not more decisions. It is the decision arriving attached to the file that made it urgent.

## Not a penetration test

Nothing here sends a request to the system under review, holds a credential for it, or executes
the code it reads. That boundary is enforced by absence — no HTTP client, no way to express a
payload — and `reference/safety.md` explains why there is no prober.

The one piece of network access is the `DEP` family running the project's own dependency auditor
against its own package registry, which is what running `npm audit` by hand would do. It is
named rather than hidden, prefers an offline mode where one exists, and can be dropped by
removing `deps` from the lens list.

Findings never carry a credential value, a personal record, or a working exploit. That is what
makes `FINDINGS.md` safe to commit.

## Advisory, on purpose

**This does not replace a human security review, and the gate is advisory by default.**

It was never going to remove the human. What it removes is the *volume* the human is looking at:
the findings are triaged, deduplicated by root cause, and separated into what is a claim, what is
a question for you, and what is a decision that has come due. And it keeps closed problems closed
— so they get dealt with while the code is fresh instead of accumulating into a backlog at the
end of a project.

The registry is a human-editable file whose every field is written by the party a gate would be
checking, so validating those fields is not the same as binding them. Two independent reviews
said so. Blocking on an unverifiable claim only teaches people to write the word that makes it
stop.

`gate.mode: "blocking"` opts in where your process makes the registry trustworthy — a protected
branch, required reviewers on `security/`. That is a decision about your controls.

**One thing blocks either way:** a staged credential of a known format. Everything else here is
recoverable; a key that reaches a remote is rotated, not undone.

## Composition

Standalone. If a compatible project-gate plugin is installed in the same deployment directory, `/know-security:init` wires two gate stages —
`security-decisions` (irreversible, blocks even at prototype) and `security-findings` (costly,
advisory by default). If it is not, the gate runs on its own. Neither plugin imports the other,
and it never degrades to nothing.

## Verification

`node dev/know-security/tests/finder.test.mjs` in the marketplace checkout (the suite lives beside
the plugin, not inside it, so an installed copy does not carry it) — 66 cases, **both
directions**. Sixteen of them assert
the tool stays *quiet*: a map lookup is not a route, a regex `.exec()` is not a shell call, a
parameterized query is not a dynamic one, a fixture credential is labelled rather than filed, a
hash is not a secret. The previous suite had thirty cases and every one asserted the tool goes
red, which tested it only in the direction that could not kill it.

Part of the [Knowbility marketplace](https://github.com/knowbility/knowbility-marketplace).
