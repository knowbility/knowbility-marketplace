# The adversarial list

Every way this plugin gets it wrong. **Both directions.**

Written before the code and kept as the acceptance test. Each row maps to a fixture that must
assert the right outcome, or to a **stated limit** — something this plugin does not claim to
do, said out loud rather than left for someone to discover.

The reason this exists rather than a feature list: for a security tool the *wrongness* surface
is the product. A reviewer that finds real problems and also cries wolf three times a week
gets switched off, and a switched-off reviewer is a total bypass that nobody decided to
perform.

**This is a two-sided document, and that is the change from the previous design.** The earlier
version of this plugin was a coverage register, so it only had to fear the false green: 32
routes to reporting *secure* when it was not. A finder has a second and more likely failure.

| Direction | Failure | Why it is on this list |
|---|---|---|
| **Missing** (Classes A–D) | A vulnerability exists and no finding is produced | Leaves you where you already were. Bad, and the classic fear. |
| **Inventing** (Classes E–F) | A finding is produced and it is not real | Spends someone's afternoon. Three of them and the tool is dead. **This is the more probable failure and it is ranked first in the risk list.** |

**How to use it.** Adding a check means adding its wrong answers here first — in both
directions. If a proposed check cannot have its false positives enumerated, it is not ready to
build. When a review finds a route not on this list, the route gets added *and* its class gets
re-read: per *fix the family, not the instance*, the interesting question is never the one
route.

---

# Side one: reporting nothing when something is there

## Class A — blind spots in reading

The locator produces candidates, not a denominator, so a gap here is a limitation rather than
a false claim. It is still a missed vulnerability.

| # | Route | Answer |
|---|---|---|
| A1 | A framework idiom the locator has no pattern for — dynamic mounts, catch-all handlers, a router built in a loop, decorators from a DI container | **Fixture (`unread`).** A file that looks like it serves traffic or holds data and produced no candidates is emitted in `unread` and appears in the report's "Could not resolve" block as work. Loud, and never a pass. |
| A2 | Non-HTTP data paths entirely: cron, admin scripts, ETL, exports to object storage, queue consumers, **LLM context assembly** | **Fixture** for jobs, consumers, and CLI commands. **Stated limit** for anything with no pattern — which is what A1 exists to surface. |
| A3 | The whole stack is one the locator has never seen, so it finds nothing and nothing looks wrong | **Fixture + reported.** `detectFrameworks()` reports what it found and whether it read any of it, **per language and per manifest**, never gated on a project-wide total. The previous design failed exactly here twice: a hard-coded canary written in the scanner's own idiom, then a global `httpBy.size === 0` check where one Express route silenced an unread Fastify app. |
| A4 | The reviewer is given a diff and the vulnerability is the **absence** of a guard, which no diff shows | **Structural.** The diff selects scope; the reading is always whole files plus their call paths. A finding about absence requires reading the path, not the hunk. Enforced in the review skill and restated in the agent. |
| A5 | The vulnerability spans files the reviewer read separately and never connected — the sink in one, the unsanitized origin in another | **Partial, and stated.** No taint analysis. The agent is told to trace origin-to-sink across files for every candidate sink, and a hop it cannot follow yields `unresolved` rather than silence. This is the largest honest gap in the design. |
| A6 | A sweep runs out of context mid-subsystem and the truncated result reads as a clean subsystem | **Fixture.** Chunked by subsystem, one invocation each, and a chunk that returns no result is reported as **not reviewed**, never as clean. |
| A7 | An external tool is absent and its whole category silently disappears — no `gitleaks`, so no history scan | **Fixture.** Absent tools degrade *explicitly*: "gitleaks not installed — history not scanned; the built-in detector covers working-tree only, which is weaker." Never silent, never faked. |

## Class B — the reviewer stopping early

| # | Route | Answer |
|---|---|---|
| B1 | The reviewer finds three findings in a file, reports them, and stops reading the file | **Instruction + fixture.** A file with two independent planted vulnerabilities in different families must yield both. Finding one is not finishing a file. |
| B2 | Only the named check families are run, and the vulnerability is in none of them | **Structural.** The check families are a floor, not a ceiling, and the agent is told so explicitly: a checklist finds what someone already thought of. An unlisted finding is reported with `check: —` and the catalog gains a row. |
| B3 | The reviewer treats an existing mitigation as covering more than it does — a parameterized query two lines above an interpolated one | **Fixture.** Recognizing a mitigation is required *per sink*, never per file or per function. |
| B4 | Personal data handling is examined only where the check families point, so a novel sink (a new analytics SDK, a new LLM call) is missed | **Fixture.** The PII lens is a data-flow walk — collection, propagation, retention, egress — not a list of known sink names. New sinks are found by following the data. |

## Class C — staleness and drift

| # | Route | Answer |
|---|---|---|
| C1 | A subsystem is reviewed once, then rewritten, and nobody looks again | **Fixture (`staleness.mjs`).** Review recency is derived per path from git. Commits since last review are reported. This replaces the old design's denominator ratchet and needs no denominator: *you changed code nobody looked at.* |
| C2 | An `accepted_risk` was accepted against specific code; the code changes and the acceptance silently persists | **Fixture.** Acceptance is bound to the file's content; a change reopens the finding. So does a passed expiry. Both mechanical. |
| C3 | A finding is marked resolved and the fix is reverted later | **Fixture.** Archived findings are re-checked when their file changes; a re-observed archived symptom reopens rather than filing fresh. |
| C4 | Environment drift: the code is safe as written and the deployment disables the protection — row-level security off, debug on, a permissive origin injected at runtime | **Stated limit.** Static reading cannot see runtime configuration. Named first in `honest-limits.md`. |
| C5 | A mitigation moves (middleware → decorator) and the reviewer's recognition of it goes stale in the opposite direction, producing a false *positive* | Crosses to Class E. See E5. |

## Class D — laundering: making a finding disappear

| # | Route | Answer |
|---|---|---|
| D1 | Delete the finding's entry from `FINDINGS.md` | **Partial, and only with trailhead.** `check.mjs` returns every finding id in `identities`, and trailhead's runner ratchets the identity *set* — so a vanished unresolved finding blocks there. **Standalone, it does not.** `check.mjs` holds no state of its own and writes nothing, so it has nothing to compare against and a deleted entry is simply gone. This row previously claimed the defense unconditionally; it was found by probing rather than by a test, and a test that only asserts `identities` is populated measures the precondition, not the property. |
| D2 | Move a finding to `## Archive` without fixing it | **Fixture.** `resolved` requires the symptom to be absent when re-checked; an archived finding whose sink is unchanged reopens. |
| D3 | Accept the risk with no owner, no date, or no expiry | **Fixture.** All three are required; a malformed acceptance is a `config_error`, not a suppression. |
| D4 | Set every finding to `needs_threat_judgment` so nothing ever files | **Reported, not blocked.** The audit prints the disposition distribution and the age of the oldest unresolved item in each bucket. A queue of 40 undecided judgments is visible; forcing them closed would just move the lie. |
| D5 | Lower the gate's severity threshold in `config.json` until nothing blocks | **Fixture, partial.** The threshold in force is recorded in the gate's state and a change is reported. Trailhead catches stage *deletion*, not an enforcement downgrade; this is the same honest ceiling. |
| D6 | Delete `security/` entirely, or uninstall the plugin | **Partial.** With trailhead present: `removed_from_config`, blocking. Without trailhead: **not caught.** Stated plainly rather than implying coverage. |
| D7 | Never run it | **Stated limit, and the real one.** The gate's authority is CI on a protected branch. Everything in-repo is scaffolding for that, and `staleness.mjs` is what makes "never ran it" visible in the audit. |

---

# Side two: reporting something that is not there

**The more likely failure, and the one that kills the tool.** Every row here needs a fixture
asserting the reviewer stays **quiet**. The previous design's 30-plant suite had none of
these — every plant asserted the checker goes red — which is why it was tested only in the
direction that could not kill it.

## Class E — the noise classes

| # | Route | Answer |
|---|---|---|
| E1 | A hardcoded credential in a test factory reported as a leaked secret | **Fixture (must be quiet).** Known-benign class 1. *This already happened*: a conformance test in the first real target built a PEM from a hash and the secrets check reported it. |
| E2 | `.env.example`, `changeme`, `AKIAIOSFODNN7EXAMPLE` and other published example values | **Fixture (must be quiet).** Class 2. |
| E3 | A vendored dependency or a committed bundle scanned as project code | **Fixture (must be quiet).** Class 3. Problems here are `DEP-01`, not code findings. |
| E4 | A high-entropy string that is a hash, UUID, git SHA, test vector, or public key | **Fixture (must be quiet).** Class 4. Entropy is not a secret; *assignment to a credential-shaped name* is the signal. |
| E5 | A guard reached through a helper the reviewer did not open, reported as a missing guard | **Fixture (must be Medium, not a filed finding).** The confirm procedure requires reading the assignment and the sink before classifying, and unfollowed indirection caps at Medium with `reachability: probable`. This is the single most likely false positive in the whole tool. |
| E6 | Dead code — behind an off flag, unexported, orphaned — reported as live | **Fixture (must be `not_reachable`).** Class 6, discarded with an auditable note. |
| E7 | A sink that is already mitigated — a redacting logger, a parameterizing query builder, an autoescaping template | **Fixture (must be quiet).** Class 7, and it must be recognized **per sink**, which is where B3 and E7 meet. |
| E8 | A comment, docstring, or commented-out line read as code | **Fixture (must be quiet).** `stripComments()` is offset-preserving and regex-aware. Both directions of this bit the previous build: a commented-out route became a phantom surface, and `// authorize` satisfied a guard. |
| E9 | The same root cause filed as eleven findings, one per touched file | **Fixture.** Dedup by root cause. Eleven tickets for one missing helper call is a false-positive failure even though every individual item is real. |
| E10 | A field named `name` or `address` treated as personal data when it is a server hostname or a memory address | **Fixture (must be quiet).** The PII lens classifies by what the data *is*, established from its origin, not by field-name pattern. |

## Class F — over-claiming

Every row here is a real finding described more strongly than the evidence supports, which
costs the reader's trust in all the others.

| # | Route | Answer |
|---|---|---|
| F1 | "An attacker can read every tenant's data" from a missing guard, with no input traced | **Structural — the ceiling rule.** No exploitability claim without a named `concrete_input`. Without one it is `likely_vulnerability` at Medium and the blast radius is marked as belief. |
| F2 | High confidence from a detector hit, or from an external tool's output not verified against source | **Fixture.** The confidence weld: a detector hit alone is a *candidate*, not a finding. An unverified tool result caps at Medium and names the tool. |
| F3 | Every SQL-injection-shaped finding rated Critical regardless of reachability or input source | **Fixture.** Severity is impact given the actual path. An interpolated integer from an admin settings page a human typed is not the finding an open endpoint is. Inflating by category destroys triage. |
| F4 | Absence asserted without reading every branch that could guard it | **Instruction + fixture.** "There is no authorization check here" requires reading every middleware, decorator, and wrapper on the path. If one was not read, Medium — and say which. |
| F5 | A remediation that moves the problem, or is an exploit written as advice | **Rule.** The remediation is reviewed against the root cause, and `safety.md`'s no-payload rule applies to it as much as to `concrete_input`. |
| F6 | Confidence silently downgrading a finding out of the report | **Structural.** All findings are shown, grouped by severity and confidence. A Low-confidence `vulnerability` is reported as a possible vulnerability, never dropped. A reader who cannot see the weak end cannot calibrate the strong end. |

---

# Class G — the tool itself

| # | Route | Answer |
|---|---|---|
| G1 | A script crashes and that reads as a skip | **Fixture.** A throw is `error`, in the fail class. |
| G2 | The gate returns `n/a` on its own initiative | **Fixture.** The stage never declares `optional_if_absent`, so trailhead converts an undeclared `n/a` to `config_error`. Standalone mode enforces the same rule. |
| G3 | **The empty-set pass.** No findings recorded → "0 unresolved" → green, on a repository nobody has ever reviewed | **Fixture.** An empty registry with no review history is `missing_input`, never a pass. This is where "absence of findings is not evidence of security" becomes mechanical. |
| G4 | A script scans its own files and matches its own pattern table, or counts its own fixtures | **Fixture.** Self-exclusion is explicit and tested. `suppression.mjs` reported itself on its first real run in the sibling plugin. |
| G5 | A CLI entry-point guard fails through a symlink, so the script silently does nothing and exits 0 | **Fixture.** Compared through `realpathSync`. For a gate this is the worst available failure mode, and it shipped once already. |
| G6 | A fixture "proves" a defense that is inert, because the state was hand-written into the fixture rather than produced by the shipping path | **Process rule, and the one that has burned this codebase hardest.** For every plant, verify the shipping code path produces the outcome. The sibling plugin's ratchet test measured the fixture, not the ratchet. |
| G7 | A finding leaks what it was meant to protect — a credential value, a personal record, a working payload | **Fixture + rule.** `safety.md` and the finding contract's "What never enters a finding." Tested: a fixture whose vulnerability *is* a credential must produce a finding naming the path and never the value. |
| G8 | The registry becomes an attacker's roadmap in a public repository | **Structural.** Findings name location, mechanism, and fix. A finding that needs a payload to be understood is written wrong, and that is what makes `FINDINGS.md` committable. |

---

# Class H — the frame

The most dangerous class, because the failure looks like success to everyone in the room.

| # | Route | Answer |
|---|---|---|
| H1 | A clean run read as "the application is secure" | **Standing rule, stated first in `honest-limits.md`:** *absence of findings is not evidence of security.* Every report says what was reviewed, what could not be resolved, and what was never looked at. A clean run over an unreviewed subsystem says so. |
| H2 | The output drifts back toward compliance — a criteria table, a coverage percentage, a green checkmark next to a control ID | **Standing rule.** No output contains "compliant," "SOC 2 ready," or a percentage adjacent to a criterion ID. This plugin produces findings. If a coverage table reappears anywhere, the design has regressed to what it replaced. |
| H3 | An auditor or a customer accepts the findings list as evidence of a security program | **Stated limit, prominently.** A findings list is evidence that someone looked, not that the looking was complete. `honest-limits.md` is the first link in the README. |
| H4 | The tool is treated as a substitute for penetration testing | **Stated limit.** This reads code. It does not send a request, hold a credential, or touch a network. Real testing against a running system is a different tool and the docs say so. |

---

# Class I — deferred, listed so they are not forgotten

These become live the moment anything here reaches a network. Recorded now so that building
it means answering them first rather than discovering them afterwards.

- A probe finds nothing → "no vulnerabilities found." Absence of finding sold as presence of
  security. **This is why nothing here probes.**
- A probe blocked by a WAF or a rate limiter, read as "protected."
- A probe run with an admin credential — everything works, so "no isolation issue."
- An agent writing its own probe findings into the registry and grading its own homework.

The structural rules that would apply are written down in `safety.md` under "If a prober is
ever added," including the default-deny allowlist shipped **empty** — not even localhost,
because a forwarded port can reach production.
