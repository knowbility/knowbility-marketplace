# Changelog — know-security

All notable changes to the know-security plugin. Per-plugin semver; tags are plugin-scoped
(`know-security-vX.Y.Z`).

## 0.1.0 — 2026-10-30

First release in the Knowbility marketplace. Forked with the original author's clearance from an
MIT-licensed plugin of the same design, then de-branded: renamed to `know-security` and invoked as
`/know-security:<command>`, the three evidence-producer schema namespaces re-rooted to
`knowbility.security.*`, and an acceptance-comment example stripped of a real owner name and
commit sha. The scanners, the finding contract, and the gate are otherwise unchanged, and the
66-case suite passes against them. Capability description from the original release follows.

Initial release. An adversarial security and privacy reviewer that runs alongside development
and reports findings.

- **`agents/security-reviewer.md`** — reads code looking for the way in, not for whether a
  control exists. ~15% posture and ~85% named check families across eleven areas: `AUTHZ`
  (missing checks, IDOR, tenant scope, mass assignment, escalation, export surfaces), `PII`,
  `INJ`, `AUTHN`, `SEC`, `XSS`, `SSRF`, `CRYPTO`, `CONF`, `LOG`, `DEP`. Each check ID names its
  trigger, what to read, what earns High confidence, and its ceiling.
- **`reference/finding-contract.md`** — the spine, injected verbatim by every skill and
  declaring its own primacy. The finding record, the eight-way disposition taxonomy, the
  confidence weld, the ceiling rule, seven known-benign classes, the read-before-classify
  confirm, auditable discards, and dedup by root cause.
- **PII as a data-flow walk** rather than a control row: collection → propagation (logs, URLs,
  analytics, third parties, LLM prompts) → retention → egress, with what the data *is*
  established from its origin rather than from field names.
- **`/know-security:review`** on a diff and **`/know-security:sweep`** on the whole codebase, chunked by
  subsystem × lens. Scope resolves before any agent is spawned; a diff selects what to look at
  and the reading is always whole files plus their call paths, because the absence of a guard
  never appears in a hunk.
- **`locate.mjs`, `secrets.mjs`, `staleness.mjs`** — evidence producers. They emit candidates,
  measurements, and an explicit `unread` list, and never a finding, a severity, or a verdict.
- **`check.mjs`** — a gate on the findings registry, the deterministic scanners, and git. It
  asserts nothing about whether code is safe.
- **`staleness.mjs` is the anti-skip mechanism**: review recency per subsystem, from git. Not
  "you added a surface nothing covers" but *you changed code nobody looked at* — which needs no
  denominator and is exactly decidable.
- **`DECISIONS.md`** with six triggered architecture questions (S-1..S-6). A finding whose real
  content is an unmade decision routes there instead of being filed as a bug.
- **Never contacts the system under review** — no requests, no credentials, no probing, enforced
  by absence. The only network access is the `deps` lens invoking the project's own package
  auditor against its own registry, named in `safety.md` rather than hidden. No credential value, no
  personal record, and no working exploit ever enters a finding, which is what makes
  `FINDINGS.md` safe to commit.
- **`reference/honest-limits.md`** leads with *absence of findings is not evidence of security*
  and is the first link in the README.
- **`dev/know-security/tests/finder.test.mjs`** — 56 cases in both directions. Sixteen assert the tool
  stays **quiet**.

### Built twice

0.1.0 was first implemented as a **SOC 2 invariant-coverage register**: four falsifiable
invariants verified over a mechanically enumerated denominator of every surface and store,
reporting "N of M surfaces are guarded." Two blind Codex reviews judged it not trustworthy, and
the requirement turned out to be different — a tool that finds vulnerabilities in
work-in-progress, not one that tracks whether controls were considered.

The root cause of the review failures was not the patterns. **It was the claim.** A coverage
register has to be complete or it lies, and regex over arbitrary source produces a plausible
sample; every gap became a false statement, and every repair closed the named case while opening
a neighbouring one. Findings across both rounds are in `dev/know-security/blind-reviews/`.

The same patterns survive in `locate.mjs`. What changed is the contract: they produce a map of
candidates plus an explicit list of what could not be read, so incompleteness is the output
instead of a hole in an assertion. Deleted with the register: `register.json`, the criteria
inventory, the surface denominator and its content hash, the exemptions table, and the
three-part verdict.

Defects found and fixed while building the replacement, each now a test case: `/regex/.exec()`
read as a shell call (3 false positives of 4); `.prepare()` missing from the SQL patterns, so a
SQLite app with 174 prepared statements reported zero SQL sinks; server-rendered HTML template
literals invisible to React-oriented patterns (50 in one codebase, zero detected); 216 literal
redirects and 177 parameterized queries reported as candidates until each pattern was narrowed to
where the interesting thing is; Flask `methods=['GET','POST']` yielding only GET; a
project-wide framework check letting one Express route silence an unread Fastify app;
`requirements.txt` pins never matching an anchored regex; and an unresolved finding below the
`## Archive` heading producing a false green on a High-severity finding — found by this suite's
own first run.
