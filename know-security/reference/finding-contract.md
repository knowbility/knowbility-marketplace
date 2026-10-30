# The finding contract

Every skill that produces, stores, or reports a security finding operates on this one
structure. Skills forward this document **verbatim** into the reviewer's assignment; the
reviewer applies it. If a skill's instructions and this document ever disagree about a
finding's shape, its confidence, or where it routes, **this document wins**.

Finding a vulnerability is the easy third. What separates a security reviewer you can leave
running from a noise generator is what happens after: refusing to file what isn't real,
characterizing what is, not filing it twice, and knowing which findings are actually a
decision wearing a bug's clothes.

**The failure that matters here is not a missed vulnerability. It is a false one.** A missed
finding leaves you where you already were. A false finding spends someone's afternoon, and
three of them get the tool switched off — which is a total bypass, achieved without anyone
deciding to bypass anything.

---

## The finding (data contract)

Every item this contract handles is a *finding* with the shape below. In report prose the
fields can read naturally, but each one must be answerable. A field you cannot answer is
itself information: it usually means the finding is not ready to report.

| Field | What it holds |
|---|---|
| `finding_id` | Assigned when the finding enters the registry: `S-YYYYMMDD-NN`, date plus a per-day sequence. Never reused, even after resolution. |
| `check` | The check ID that surfaced it — `INJ-02`, `AUTHZ-04`, `PII-01`. A finding with no check ID is an observation; say so rather than inventing one. |
| `location` | `file:line` of the **sink** — where the harm happens. Plus the entry point when it differs, and any file on the path between them. |
| `symptom` | Concretely what is wrong in the code. "`req.query.sort` is interpolated into an ORDER BY clause," not "SQL injection risk in the reports module." |
| `attack_path` | Entry point → data flow → sink, **as actually read**. Name each hop. This is the field that distinguishes a finding from a pattern match, and the field a reader uses to check your work. |
| `concrete_input` | The input that exercises it. Required for High confidence — see the ceiling rule. A value or shape (`?sort=1;DROP…`, `id` belonging to another tenant), never a working exploit. |
| `blast_radius` | What an attacker gets. For PII: which fields, belonging to whom, and how many subjects. "Read access to `users.email` for every row" is a blast radius; "data exposure" is not. |
| `severity` | Critical / High / Medium / Low — impact if exploited, not effort to fix. Rubric below. |
| `confidence` | High / Medium / Low, **welded to evidence type**. Not a feeling. Table below. |
| `reachability` | `confirmed` \| `probable` \| `unresolved`. What you established about whether the path can actually be walked. |
| `root_cause_hypothesis` | Your mechanism-level account. "The tenant scope lives in `withTenant()` and these four routes query the model directly" is credible; "missing authorization" is not. **This field drives dedup**, so write it as a cause, not a restatement of the symptom. |
| `remediation` | The fix, specifically enough to act on. Never a payload, never a diff that only moves the problem. |
| `disposition` | What *kind* of finding this is. Decides its routing. Taxonomy below. |
| `duplicate_of` | The `finding_id` this duplicates, if any. |
| `ticket_link` | The tracker ticket, once filed. |
| `status` | `open` → `filed` \| `surfaced-for-decision` \| `decision-due` \| `accepted` \| `resolved`. |
| `first_seen` / `last_seen` | Dates. `last_seen` updates whenever a run re-observes it. |

---

## Disposition taxonomy (what keeps you from over-filing)

Classify the disposition **before** reporting. The disposition is the routing decision, and
choosing it is the moment you decide what you are willing to defend.

| Disposition | Meaning | Routing |
|---|---|---|
| `vulnerability` | Objectively wrong, and a fact in the source backs it — the sink is reachable, the guard is absent on every branch, the input is named. | File it. |
| `likely_vulnerability` | Probably wrong; one more read would settle it. | Read again — the helper, the middleware chain, the other caller. Then file or downgrade. Do not file it in this state. |
| `needs_threat_judgment` | Turns on a trust boundary the human owns: is this endpoint reachable from the internet, is this field personal data in this product, is this admin tool already trusted. | Surface for a decision, in its own block. **Never file unilaterally.** |
| `design_decision_due` | The finding's real content is an architecture decision nobody has made yet — not a defect in code that exists, but a fork the code is about to be built on top of. | Route to `security/DECISIONS.md`. See "Decisions, not bugs" below. |
| `accepted_risk` | A human decided to carry it, with an owner, a date, and an expiry. | Suppressed until the expiry passes or the file changes. Still listed in the audit. |
| `not_reachable` | The pattern is present and the path is dead — unexported, behind an off feature flag, orphaned, test-only. | Discard **with a one-line note**. |
| `test_fixture` | Synthetic credential, seeded personal data, snapshot, example. | Discard **with a one-line note**. |
| `known_issue` | Already in the registry. | Cross-link, set `duplicate_of`, update `last_seen`, attach the new blast radius to the existing entry. |

Only `vulnerability` and *confirmed* `likely_vulnerability` flow to filing. Everything else
routes to surface, decide, accept, discard, or dedup.

**The tie-break, and it is deliberately biased away from filing:** when you are torn between
`vulnerability` and `needs_threat_judgment`, choose `needs_threat_judgment`. When you are torn
between `vulnerability` and `likely_vulnerability`, choose `likely_vulnerability` and go read
again. Speculative findings bury real ones, and the reader cannot tell them apart from the
outside — only you know which of your findings you actually traced.

A finding's confidence never silently changes its disposition. A Low-confidence
`vulnerability` is reported as a possible vulnerability, not discarded.

---

## The confidence weld

Confidence is a function of **what kind of evidence you have**, not how sure you feel. This
is the primary false-positive defense, and it works by making over-claiming visibly wrong
rather than merely discouraged: each level names what you must have done to claim it.

| What you have | Ceiling |
|---|---|
| The path read end to end in source — entry point, every hop, the sink, and **every branch that could guard it** — plus a named `concrete_input` | **High** |
| The code reads as vulnerable, but reachability crosses an indirection you did not follow: a helper you did not open, a middleware chain you could not order, a decorator, dependency injection, a dynamic dispatch | **Medium**, `reachability: probable` |
| A detector hit whose surrounding context you read, but whose origin or sink you could not establish | **Low**, `reachability: unresolved` |
| A detector hit alone | **Not a finding.** A candidate. It does not enter the registry and it does not appear in the findings list. |
| An external tool's output you did not verify against the source | **Medium** at most, and say which tool. A `semgrep` rule id is a citation, not a confirmation. |

Two corollaries that come up constantly:

- **Absence is harder to establish than presence.** "There is no authorization check on this
  route" requires reading every middleware, decorator, and wrapper that could supply one. If
  you did not, the finding is Medium, not High — and say which one you did not read.
- **A guard you cannot follow is not a missing guard.** It is `unresolved`. Report it as a
  path you could not clear, which is useful, rather than as a hole you did not find.

### The ceiling rule

> **No finding claims exploitability without naming a concrete input that exercises it.**

A missing guard is a fact about the code. "An attacker can therefore read every tenant's
rows" is a claim about behavior, and behavior needs the input that produces it. Without one,
the finding is `likely_vulnerability` at Medium and the `blast_radius` field says what you
believe, marked as belief.

This is the analogue of the sibling QA plugin's refusal to claim what a screen reader
announces: the structural fact is reportable, the behavioral consequence is not, and the
honest report says which is which.

---

## Reachability classification

Separate from confidence, and about the *defect* rather than about your evidence:

- **`confirmed`** — you followed the path from an entry point a real caller can reach to the
  sink, and nothing on it stops the input.
- **`probable`** — the sink is real and the entry looks reachable, but a hop is opaque to
  reading. Pair it with what you could not resolve: "reaches `handleUpload` through the
  plugin registry; registration order not determinable statically."
- **`unresolved`** — you found the sink and could not establish that anything reaches it.
  Report it; do not file it. This is where the honest half of a static reviewer's output
  lives, and dropping it is how a tool becomes quietly useless.

---

## Noise discipline

Without this section, a sweep of any real repository files dozens of false findings per
directory, most of them in test code. This is the highest-value part of the contract.

### Known-benign classes

Signals that look like vulnerabilities and usually are not:

1. **Test fixtures and factories.** Synthetic credentials, seeded personal data, snapshot
   payloads, a PEM assembled from a hash. A hardcoded password in a factory is the correct
   way to write a factory.
2. **Documented placeholders.** `.env.example`, `changeme`, `xxx`, `your-key-here`,
   `AKIAIOSFODNN7EXAMPLE` and the other vendor-published example values.
3. **Vendored and generated code.** `vendor/`, `node_modules/`, lockfiles, codegen output,
   committed build artifacts, minified bundles. Real problems here are dependency problems
   (`DEP-01`), not code problems.
4. **Entropy without context.** A high-entropy string that is a hash, a UUID, a test vector,
   a git SHA, a base64 asset, or a public key. Entropy is not a secret; an *assignment to a
   credential-shaped name* is the signal.
5. **Documentation and comments.** README samples, migration comments, docstrings, a commented-out
   line showing the wrong way to do it.
6. **Dead and unreachable code.** Behind a feature flag that is off, unexported and uncalled,
   orphaned after a refactor, inside a branch a constant makes unreachable.
7. **Already-mitigated sinks.** A logger that redacts, a query builder that parameterizes, an
   ORM method that escapes, a template engine with autoescape on. Recognize the mitigation
   before reporting its absence.

### The confirm procedure

**Do not classify a detector hit without reading the assignment and the sink.** This is the
static analogue of re-running a flaky test, and it is cheap:

1. Trace the value to its **origin**. Where does it come from — a literal, a fixture, an
   environment variable, a request?
2. Trace it to its **sink**. What happens to it — a comparison, a log, a query, a network
   call, nothing?
3. *Then* classify.

`password` assigned from a literal in a factory and passed to a test client is benign.
`password` assigned from `req.body` and passed to `logger.info` is `SEC-04` at High. The
detector cannot tell those apart. That is the whole reason a person or an agent reads the
code, and skipping step 1 is how a security tool earns its reputation.

If it matches a benign class **after** that read, discard it. If it does not, judge it on its
merits — a benign-looking class is not a licence to skip the read.

### Auditable discards

**Every discard appears in the report.** One line each, grouped:

```
Discarded 14 candidates: 9 test fixtures, 3 documented placeholders, 2 vendored.
Suppressed 2 findings under accepted_risk (S-20260714-02 expires 2026-10-01).
```

A security scanner that silently suppresses is strictly worse than one that over-reports,
because from the outside a quiet run and a broken run are the same run. The discard list is
how a reader audits the noise filter — and the noise filter is the component most likely to
be eating real signal.

---

## Severity

Impact if exploited. Independent of confidence and of how hard the fix is.

| Severity | Bar |
|---|---|
| **Critical** | An unauthenticated actor reaches data or control across subject boundaries; credential or key disclosure; code execution; authentication bypass. |
| **High** | An authenticated actor crosses a subject boundary or escalates privilege; personal data reaches a third party, a persistent log, or a URL; a store of personal data has no deletion path. |
| **Medium** | Requires an unusual precondition; exposure bounded to the actor's own data; personal data in a place with restricted but non-zero access; a weakness that needs another to be useful. |
| **Low** | Defense in depth. Hardening. No path demonstrated and none apparent. |

Two rules that stop severity from drifting:

- **Do not discount for difficulty of exploitation.** That belongs in `reachability` and
  `concrete_input`, where a reader can see it, not folded silently into a lower severity.
- **Do not inflate for category.** "SQL injection" is not automatically Critical. An
  interpolated integer from an admin-only settings page that a human already typed is not the
  same finding as an interpolated string from an open endpoint, and calling both Critical
  destroys the reader's ability to triage.

---

## Decisions, not bugs

Some findings are not defects in code that exists. They are a fork the code is about to be
built on, where the expensive outcome is picking wrong rather than shipping wrong: what the
isolation unit is, whether deletion is soft or hard, whether a live session can be revoked.

Those get `disposition: design_decision_due` and route to **`security/DECISIONS.md`**, not to
the findings list. Add or update a row there with the question, the trigger that surfaced it,
and what the code currently assumes by default. Then say in the report that a decision is due
and why now.

This is the point of catching them by reading: the decision arrives when the code forces it,
attached to the file that forced it, rather than as a question on a checklist at the start of
a project or as a migration at the end. Filing it as a bug asks someone to fix code that is
working; surfacing it as a decision asks the question that is actually open.

---

## The registry: `security/FINDINGS.md`

The durable, per-project register — read before filing, updated when filing, consulted by
every subsequent run. Human-readable, because the human and the agent read the same file.

**Entry shape** — one `##` block per finding:

```markdown
## S-20260726-03 — Reports export queries the model without tenant scope
- status: filed
- check: AUTHZ-03 · disposition: vulnerability
- severity: High · confidence: High · reachability: confirmed
- location: src/routes/reports.ts:88 (sink) · entry: GET /reports/export
- symptom: buildExport() calls Report.findAll() directly; the other 11 read paths go through withTenant()
- attack_path: GET /reports/export → requireAuth (identity only, no scope) → buildExport() → Report.findAll()
- concrete_input: any authenticated session; the response includes rows whose tenant_id differs from the caller's
- blast_radius: read access to every tenant's report rows — title, body, author email
- root_cause_hypothesis: tenant scope is applied in withTenant(), which is a convention rather than
  an enforced boundary; any direct model call bypasses it
- remediation: route the export through withTenant(), or move the scope into a model-level default
  so a direct call cannot omit it
- duplicate_of: — · ticket_link: NOB-412
- first_seen: 2026-07-26 · last_seen: 2026-07-26
```

**Rules:**

- IDs assigned at append time, never reused.
- New findings append with `status: open`. Filing sets `filed` and `ticket_link`. Human-routed
  items sit at `surfaced-for-decision`. Decision-routed items sit at `decision-due` and name
  the `DECISIONS.md` row. Accepted items sit at `accepted` with owner, date, and expiry.
- Fixed and verified → `status: resolved`, moved to `## Archive` at the bottom, so the active
  list stays short enough to actually read.
- `last_seen` updates whenever a run re-observes the symptom.
- **An `accepted_risk` reopens when the code changes.** Acceptance was a judgment about
  specific code; different code is a different judgment. It also reopens when its expiry
  passes. Both are mechanically checkable and both are checked.

**Committability.** This file is committed, which is only safe because of what it does *not*
contain — see "What never enters a finding." A finding names the location, the mechanism, and
the fix. It never carries a working exploit, a credential value, or a personal record. A
finding that needs a payload to be understood is written wrong.

### Dedup: by root cause, not symptom string

Before filing anything, read the active entries and ask: **does this share a mechanism with
one already here?**

Four routes missing the same tenant scope because they all bypass the same helper are **one
finding with four locations**, not four findings. Two log statements leaking email because
the same serializer includes it are one finding. Match on `root_cause_hypothesis`, never on
the symptom text — the same cause produces differently-worded symptoms in every file it
touches, and a symptom-string match will miss all of them.

On a match: `known_issue`, set `duplicate_of`, update the existing entry's `last_seen`, and
attach the broader blast radius **there** rather than opening a duplicate. One cause, one
entry, one fix.

The inverse error matters too: two findings that share a *category* but not a mechanism are
two findings. "Both are SQL injection" is not a shared root cause.

---

## Routing in your summary

Route by disposition, in separate blocks, so a reader never has to guess which items are
claims and which are questions:

- **Findings** — `vulnerability` and confirmed `likely_vulnerability`, ordered by severity
  then confidence. These are the claims you will defend.
- **Surfaced for decision** — `needs_threat_judgment`. Clearly not the findings list, never
  described as vulnerabilities. Each one states the boundary question a human must answer.
- **Decisions due** — `design_decision_due`, with the `DECISIONS.md` row.
- **Could not resolve** — `reachability: unresolved`, plus every file the locator could not
  read. This is a work list, and it is the honest core of a static review.
- **Discarded** — the counted, classified one-liners.

Show **all** findings, including Low confidence. Grouping is by severity and confidence, never
by hiding the weak end — a reader who cannot see your low-confidence items cannot calibrate
your high-confidence ones.

### Systemic themes

The most valuable output of a sweep is usually not any single finding. It is the observation
that seven of nine trace to one missing boundary, which points at one fix instead of seven
tickets. A theme needs at least two member findings and a plausible shared mechanism; do not
force singletons into themes, and do not let a theme replace the individual entries.

---

## What never enters a finding

These are absolute, and they are what makes the registry safe to commit. They come from
`safety.md` and they are binding on every skill and agent here.

1. **Never the value of a credential.** Not in a finding, not in a report, not in an
   evidence excerpt, not in chat. Report the path and the fact of it and let a human move it.
   This holds even when the credential is what the finding is about — especially then.
2. **Never a working exploit.** `concrete_input` names the shape of an input that reaches the
   sink. It is not a payload, not a proof-of-concept, not a `curl` line that would work.
   Describe the property that fails and the fix.
3. **Never a personal record.** Name the column, the table, and the count. Never the value.
   `users.email, 12,400 rows` is a finding; a single real email address in a report is a new
   privacy incident created by the tool meant to prevent them.
4. **Never a network call.** Nothing here probes, requests, or authenticates. A finding is
   established by reading.

If a finding cannot be written under these rules, it cannot be written. That has not yet
happened, and if it does, the finding goes to a human directly rather than into a file.
