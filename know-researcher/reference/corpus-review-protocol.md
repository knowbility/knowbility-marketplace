# Corpus-review protocol — v1 (the W7 contract spine)

**Status: frozen at W7 stage-2 close.** This file is the normative contract for the
independent adversarial corpus review (the credibility gate). It defines the identities and
hashes, the artifact layout, the receipt and ledger schemas, the completion record, the STATE
transition, the trust contract, and the validator's verdict logic and exit codes.
`reference/validate-corpus-review.py` implements it; the review runner (stage 3) and the
closeout refactor (stage 4) build against it. Design rationale lives in
`dev/know-researcher/W7-corpus-review-design.md` (v3.1) in the marketplace repo — this file is the
mechanics, not the argument.

Consumers at runtime: the `research-review-corpus` runner skill, the `research-audit-claims`
final closeout, and the sentinel readers (`research-progress`, `research-start-phase`). All of
them call the **installed** validator (`research/bin/validate-corpus-review.py`) rather than
re-implementing any rule here.

---

## 1. Identities and hashes

### 1.1 Scope of the decision corpus

The decision corpus is everything decision-bearing on disk, enumerated by a canonical
manifest. Scope is **default-include with named exclusions** — nothing decision-bearing can
hide outside the hash by being new or unanticipated.

Included (relative to the project root):

- `CLAUDE.md` (the project config — carries the audience and evidence calibration), if present.
- Everything under `research/` **except** the exclusions below.

Excluded:

| Path | Why |
|---|---|
| `research/STATE.md` | Mutable position state, hashed separately (§1.3) — it is not decision evidence, and keeping it in the corpus hash makes closeout self-invalidating. |
| `research/reviews/**` | The review's own artifacts — self-reference. Guarded by the allowlist (§2.2) instead. |
| `research/bin/**` | Installed machinery (validator, where-am-i). Scripts are not evidence, and validator upgrades must not invalidate receipts. |
| `research/commonplace.md` | Explicitly outside every gate by its own charter. |
| `research/reference/backstage-tasks.md` | The agent's private prep queue — process, not evidence. |
| Any path with a dot-prefixed component | `.gitkeep`, `.DS_Store`, `.gate-policy.md` — scaffolding and policy docs, not evidence. |

`research/STATE.md` **must exist**; its absence is a manifest error. The reviewer still reads
STATE (it is in scope for *review*); it is excluded only from the corpus *hash* so the two
identities can be compared under different rules.

### 1.2 Canonical manifest

- Paths are relative to the project root, `/` separators, UTF-8, **NFC-normalized**.
- Entries sorted by path, byte-wise (sort the UTF-8 encodings).
- Regular file entry: `{"path": p, "sha256": h, "bytes": n}` — SHA-256 over raw file bytes.
- Symlinks are **not followed**. An in-tree symlink's entry is `{"path": p, "link": target}`
  (the literal link target). A symlink whose resolved target escapes the project root is a
  **manifest error**.
- Two distinct paths equal under Unicode casefold (case collision), or duplicate paths, are a
  **manifest error**.
- An unreadable in-scope file is a **manifest failure** — it blocks, it is never skipped
  silently.

The manifest document:

```json
{
  "schema_version": "1.0",
  "generated_at": "<UTC ISO-8601>",
  "root": "<absolute project root>",
  "files": [ {"path": "...", "sha256": "...", "bytes": 0}, {"path": "...", "link": "..."} ],
  "state": {"path": "research/STATE.md", "sha256": "...", "bytes": 0},
  "decision_corpus_hash": "...",
  "state_hash": "...",
  "file_count": 0,
  "total_bytes": 0
}
```

### 1.3 The two hashes

- **`decision_corpus_hash`** = SHA-256 (lowercase hex) of the canonical JSON serialization of
  the `files` array only. Canonical JSON: UTF-8, sorted object keys, separators `,` and `:`
  with no whitespace, no float values. File entries serialize as written in §1.2.
- **`state_hash`** = SHA-256 of the raw bytes of `research/STATE.md`.

### 1.4 The two comparison rules

The receipt binds `decision_corpus_hash` and `preclose_state_hash` (the `state_hash` at review
time). The completion record (§5) binds `postclose_state_hash` (the `state_hash` after the
allowed transition).

- **Pre-close validation** (gate, before the STATE write): current `decision_corpus_hash` ==
  receipt's, AND current `state_hash` == receipt's `preclose_state_hash`. Any mismatch is
  `stale-hash` — the review no longer describes what is on disk.
- **Post-close validation** (sentinel readers): current `decision_corpus_hash` == receipt's,
  AND current `state_hash` == the completion record's `postclose_state_hash`. Any STATE
  content outside the allowed transition, or any decision-corpus change after close, reports
  as a **stale/invalid completion**.

---

## 2. Artifact layout: `research/reviews/`

### 2.1 Files

| File | Written by | Mutability |
|---|---|---|
| `<review_id>.receipt.json` | runner | immutable after write |
| `<review_id>.report.md` | runner | immutable after write (reviewer's prose analysis; the receipt is authoritative) |
| `<attempt_id>.failed.json` | runner | immutable — a failed attempt record with its failure chain (never a receipt) |
| `resolutions.md` | adjudication (audit-claims / commissioner session) | **append-only** |
| `exceptions.md` | commissioner adjudication | **append-only** |
| `completion.json` | validator (`transition --apply`) | written once at close; **seals** every other reviews/ file (§5) |
| `.gitkeep` | init | — |

### 2.2 The allowlist

`research/reviews/` carries a strict allowlist: exactly the patterns above (plus `.DS_Store`,
which macOS Finder drops everywhere — tolerated and ignored entirely, never sealed or read).
Any other file in `reviews/` is a validator error (`allowlist-violation`) — the directory
must not become a place to park decision-bearing material outside the corpus hash.

### 2.4 Mutability honesty (what the machinery can and cannot see)

Receipts and ledgers are workflow-immutable, not cryptographically immutable. **Pre-close**,
an edit to a receipt or ledger is in the same declared threat class as a manual STATE edit —
detectable only insofar as the identity bindings (§2.3) and internal-consistency rules (§3)
catch it, and otherwise out of scope for a workflow gate (the runner is the only writer; the
gate's honesty section says so out loud). **Post-close**, mutation *is* mechanically caught:
`completion.json` seals the SHA-256 of every reviews/ file at close, and `check-completion`
verifies the seal set exactly — a modified receipt, an edited ledger, or a new unsealed file
in `reviews/` reads as a stale/invalid completion.

### 2.3 Identifiers

- `review_set_id` = `<YYYYMMDDTHHMMSSZ>-<hash8>` — UTC second-stamp at set start + the first 8
  hex of the `decision_corpus_hash` the set reviews.
- `review_id` = `<YYYYMMDDTHHMMSSZ>-<hash8>-<tier>` — UTC second-stamp at the member run's
  start, same `hash8`, and the tier short-code (`t1` | `t2`). (The tier suffix extends the
  design's `<UTC-stamp>-<hash8>` form so two tiers starting in the same second cannot
  collide.)
- The runner **never overwrites**: if the target receipt path exists, the run fails rather
  than replaces (same-day-rerun immutability). Receipts are content-bound: the validator
  rejects a receipt whose filename does not equal `<review_id>.receipt.json`, whose embedded
  `review_id` differs from its filename, or whose `hash8` segment does not equal the first 8
  hex of its embedded `decision_corpus_hash`.

---

## 3. The receipt schema (`schema_version` "1.0")

One receipt per reviewer run. A final-closeout run produces one receipt **per tier**, all
sharing a `review_set_id`; the gate operates on the union of the set. Every field below is
required unless marked optional.

```json
{
  "schema_version": "1.0",
  "review_id": "20260805T171500Z-a1b2c3d4-t1",
  "review_set_id": "20260805T171500Z-a1b2c3d4",
  "run_kind": "final-closeout | on-demand",
  "review_set_plan": {
    "tiers_planned": ["t1", "t2"],
    "note": "optional — why the set is partial, if it is"
  },
  "reviewer": {
    "tier": "t1 | t2",
    "engine": "codex-cli | claude-agent",
    "engine_version": "<captured version string>",
    "sampler_label": "independent cross-family sampler | isolated same-family sampler",
    "fallback_chain": []
  },
  "execution": {
    "started_at": "<UTC ISO-8601>",
    "ended_at": "<UTC ISO-8601>",
    "duration_seconds": 0,
    "timeout_seconds": 1800,
    "exit_status": 0,
    "truncation_detected": false,
    "environment": {}
  },
  "corpus": {
    "decision_corpus_hash": "...",
    "preclose_state_hash": "...",
    "file_count": 0,
    "total_bytes": 0,
    "unreadable_files": []
  },
  "criteria_mode": "structured | legacy-prose",
  "criteria_binding": {
    "path": "research/reference/completion-criteria.md",
    "sha256": "...",
    "criteria": [
      {"id": "SC-1", "disposition": "met"},
      {"id": "SC-2", "disposition": "unmet", "finding_ids": ["F-001"]},
      {"id": "SC-3", "disposition": "waived-with-record",
       "record": "research/notes-to-self.md:12"}
    ]
  },
  "checks": [
    {
      "id": "C1",
      "status": "run | n/a",
      "coverage_outcome": "complete | partial | insufficient-coverage | not-applicable",
      "files_examined": ["research/..."],
      "coverage_note": "...",
      "finding_ids": ["F-001"]
    }
  ],
  "verdict": "ready | not-ready",
  "findings": [
    {
      "id": "F-001",
      "class": "<see §7>",
      "severity": "material | minor",
      "waivability_class_advisory": "waivable | non-waivable",
      "observed": "...",
      "criterion_violated": "...",
      "evidence": ["research/outputs/x.md:123"],
      "decision_impact": "...",
      "closure_evidence_required": "..."
    }
  ]
}
```

Receipt completeness rules (validator-enforced; violation = `incomplete-receipt`):

- All fifteen checks C1–C15 present exactly once; **check ids outside C1–C15 are rejected**.
  `status: "n/a"` requires `coverage_outcome: "not-applicable"` and the applicability rule
  cited in `coverage_note` (and vice versa). **`coverage_note` is required, non-empty, for
  every check** — honest coverage is the contract.
- A `run` check with empty `files_examined` is **`insufficient-coverage` by definition** — the
  validator overrides whatever the receipt claims. Every `files_examined` path must be a
  manifest path (or `research/STATE.md`, which is in scope for review).
- Every nested block is fully required: `reviewer` (tier/engine/engine_version/sampler_label/
  fallback_chain), `execution` (started_at/ended_at/duration_seconds/timeout_seconds/
  exit_status/truncation_detected), `corpus` (all fields, integer counts),
  `review_set_plan.tiers_planned` (non-empty subset of t1/t2).
- **Identity bindings:** `reviewer.tier` must equal the filename's tier segment;
  `review_set_id` must match `<UTC-stamp>-<hash8>` with its `hash8` equal to the first 8 hex
  of the embedded `decision_corpus_hash`; `decision_corpus_hash` must be a full 64-hex
  digest. Within one review set, `run_kind` must be uniform and each tier may appear at most
  once.
- Every finding: non-empty `evidence`, each entry matching `<relative-path>:<line>` **with
  the path present in the manifest**; `class` from the closed enum (§7);
  `waivability_class_advisory` present (advisory only); every finding id referenced by at
  least one check's `finding_ids`, and every referenced id defined.
- **Verdict consistency (verdict asymmetry, both directions):** the verdict must be
  `not-ready` iff the receipt carries ≥1 material finding or any `insufficient-coverage`
  check. A `not-ready` with no blocking evidence, or a `ready` alongside blocking evidence,
  is an internally inconsistent receipt. Reviewer `ready` verdicts are recorded but **never
  sufficient** — the gate unlocks on valid receipts + zero open material findings + no
  insufficient coverage, not on `ready`.
- `execution.exit_status` must be 0 and `truncation_detected` false — anything else should
  have been recorded as a failed attempt, so its presence in a receipt is malformation.
- `corpus.unreadable_files` must be empty (a non-empty list is `unreadable-files` — the run
  should never have produced a receipt).
- **C1 binding:** in `structured` mode, `criteria_binding` must name the completion-criteria
  file with its hash, and `criteria` must enumerate **every** criterion ID present in that
  file exactly once — a missing ID makes C1 `insufficient-coverage`; a duplicate or
  non-canonical ID is a malformed receipt. Per-disposition rules: `unmet` requires
  `finding_ids` linking ≥1 **material** finding that C1 itself references (an unmet criterion
  must gate through a finding); `waived-with-record` requires `record`, a `<path>:<line>`
  citation of the recorded commissioner waiver, with the path in the manifest. In
  `legacy-prose` mode (no `completion-criteria.md` in the project), `criteria_binding.path`
  points at `research/research-plan.md`, `criteria` is `[]`, and C1's `coverage_outcome` can
  be at best `partial` — legacy prose is honest, explicitly weaker C1 coverage, never
  presented as equivalent. `criteria_mode` must match the file's presence on disk.

---

## 4. The two ledgers

Both are append-only Markdown with a strict entry grammar the validator parses. A malformed
entry is a validator error (`ledger-malformed`): duplicate entry ids, missing or **empty**
required fields, a `Date` not in `YYYY-MM-DD`, or a `Binds to decision_corpus_hash` that is
not a full 64-hex digest all fail. Entries are never edited or deleted; corrections are new
entries (append-only holds by workflow pre-close and by the completion seals post-close —
§2.4).

### 4.1 Resolution ledger — `research/reviews/resolutions.md`

How findings get closed. One entry per resolution action:

```markdown
## R-<seq>: <action>
- Refs: <review_id>/<finding_id>[, <review_id>/<finding_id> ...]
- Action: reconciled | rejected-with-record
- Date: YYYY-MM-DD
- Closure evidence: <for reconciled: what changed, where — file paths. For
  rejected-with-record: why the finding is factually wrong, with file:line citations.>
```

- **`reconciled`** means in-scope files changed to close the finding. Any reconciliation that
  changed an in-scope file changes the corpus hash, so **a new review is required** — the
  validator enforces this mechanically: a `reconciled` entry can never close a finding from
  the review set that is bound to the *current* corpus hash (if the corpus really changed, the
  set is stale and the gate already demands a fresh review; if it did not change, nothing was
  reconciled). "Declared reconciled without re-review" therefore cannot close a project.
  Reconciliation shows up as the finding not recurring in the post-fix review.
- **`rejected-with-record`** is the adjudication path for a finding judged factually wrong
  (reviewers disagree on judgment calls; dismissal must leave a record, never be silent). It
  closes the finding **without** a corpus change, and its `Closure evidence` must carry the
  refutation with **≥1 `<path>:<line>` citation resolving to a manifest path** — an
  uncited rejection does not close the finding. *(Spec note: design v3.1 §5's verdict
  sentence lists only reconciliation and exception as closure paths; §4's action list and
  spike lesson 6 include rejection-with-record. This protocol includes it as a closure path —
  the alternative makes the action unusable.)*
- `excepted` is **not** a resolution-ledger action — exceptions live in their own ledger with
  commissioner-owned fields (§4.2).

### 4.2 Exceptions ledger — `research/reviews/exceptions.md`

Commissioner-accepted risks (the waiver analog for corpus findings):

```markdown
## E-<seq>
- Refs: <review_id>/<finding_id>[, ...]
- Class: <finding class>
- Commissioner rationale (verbatim): "<the commissioner's own words — never agent-authored>"
- Decision impact and risk accepted: <...>
- Binds to decision_corpus_hash: <full hash>
- Affected deliverables: <paths>
- Date: YYYY-MM-DD
```

- An exception **expires on corpus change**: it covers a finding only while
  `Binds to decision_corpus_hash` equals the current corpus hash.
- An exception covers a finding only if its `Class` equals the finding's class (it must name
  what it accepts) and every path in `Affected deliverables` is a manifest path.
- **Waivability is validator-owned** (§7 class map, applied to the **finding's** class). The
  reviewer's `waivability_class_advisory` is advisory only; an exception recorded against a
  non-waivable class does not cover the finding.
- **Sequencing rule:** exceptions are disclosed in the affected deliverables' Methodology &
  Limitations **before** the final review runs — so disclosure cannot invalidate the review
  that gates on it. (Verifying that the disclosure text is actually present in each affected
  deliverable is the review runner's preflight duty, stage 3 — the validator checks the
  deliverable paths, not their prose.)

---

## 5. The completion record — `research/reviews/completion.json`

Written once by the validator (`transition --apply`), after the gate passes:

```json
{
  "schema_version": "1.0",
  "protocol_version": 1,
  "closed_state": "validated | closed-unreviewed",
  "closed_at": "<UTC ISO-8601>",
  "review_set_id": "<set id — validated only>",
  "review_ids": ["<member receipt ids — validated only>"],
  "decision_corpus_hash": "...",
  "preclose_state_hash": "...",
  "postclose_state_hash": "...",
  "validator_sha256": "<hash of the installed validator that computed the close>",
  "seals": {"<reviews/ filename>": "<sha256>"},
  "reason": "<closed-unreviewed only: why no review was obtainable>"
}
```

`seals` records the SHA-256 of **every** file in `research/reviews/` at close except
`completion.json` itself, `.gitkeep`, and `.DS_Store` — receipts, reports, failed attempts,
and both ledgers. It is the post-close immutability anchor (§2.4): `check-completion`
verifies the on-disk set equals the sealed set exactly, hash for hash.

---

## 6. The STATE transition

### 6.1 The protocol discriminator (durable)

A project that has adopted this protocol carries, in `research/STATE.md`'s header block (the
lines before the first `##` heading), the line:

```
Review protocol: v1
```

It lives **inside** STATE so it cannot be silently dropped along with the marker file: for any
project whose STATE carries the line, a missing marker, missing installed validator, or hash
mismatch **fails closed** (`validator-mismatch` — "repair via re-init"). Legacy = STATE has no
protocol line AND no marker exists; anything partial is damage, not legacy. **Exactly one**
such line is allowed, and it must appear in the header block — a duplicated line, or a line
that appears only in the body, is damage (a copied or stale discriminator must not
authenticate a damaged header).

### 6.2 The allowed transition (validated close)

At closeout the validator computes the **exact allowed transition** — four textual operations
on STATE, nothing else:

1. **Check Verify** in the final phase's cycle checklist: the single unchecked
   `- [ ] **Verify**` line **inside the final phase's own `### Phase N` subsection** becomes
   `- [x]`. (Preconditions, validator-enforced: the subsection exists, contains exactly one
   each of Collect/Connect/Assess/Synthesize — all already checked — and exactly one
   unchecked Verify. An unchecked earlier step, an ambiguous checklist, or a Verify found
   only outside the final phase's subsection is `state-format` — the closeout completes
   Verify only, never the work before it.)
2. **Mark the final phase complete** in `## Completed Phases`: its `- [ ] Phase N:` line
   becomes `- [x]`. (Precondition: every other phase line already checked.)
3. **Set the completion sentinel** — appended as the last bullet of `## Current Position`:
   `- Completion: ALL PHASES COMPLETE — validated closeout <review_set_id> (review protocol v1)`
4. **Set Next Action to the closeout form** — the `## Next Action` section body becomes:
   `Project closed <YYYY-MM-DD> via validated corpus-review closeout <review_set_id>. The
   decision corpus is frozen at decision_corpus_hash <first-12-hex>…; any change to it
   invalidates this completion (see research/reviews/completion.json). No further research
   actions.`

If STATE's structure does not support the four operations (missing sections, ambiguous
checklist, unchecked non-final phases), the transition fails with `state-format` — repair the
STATE by hand and re-run. The validator records the resulting `postclose_state_hash` in the
completion record.

**Apply semantics (interruption-safe):** `transition --apply` re-runs the full gate, guards
against a STATE change between gate evaluation and the write (TOCTOU → `stale-hash`), then
writes `completion.json` first and STATE second, each atomically (temp + fsync + rename),
verifying the written STATE against `postclose_state_hash`. An interruption between the two
writes leaves a **resumable** half-state: the next `transition --apply` finds
`completion.json` with no sentinel in STATE, recomputes the recorded transition from the
recorded pre-close STATE, verifies it reproduces the recorded `postclose_state_hash`, and
finishes the write. Anything else (STATE matching neither recorded hash) is manual repair.
Nothing conversation-only can affect the close.

### 6.3 `closed-unreviewed` (the administrative archive)

For projects that cannot obtain a review (both tiers permanently unavailable, or the
commissioner abandons): the terminal option is `closed-unreviewed` — an escape *from the
workflow*, never an exception *to the gate*. Its sentinel (same position, ops 3–4 only, no
phase check-offs required):

`- Completion: CLOSED UNREVIEWED — administrative archive, not decision-ready (<YYYY-MM-DD>)`

Visibly distinct in STATE, never described as decision-ready; `research-progress` reports it
as such. The completion record carries `closed_state: "closed-unreviewed"` and the reason.

### 6.4 Sentinel-as-claim

Every sentinel reader treats "complete" as a **claim to validate**, not a fact: on seeing
either sentinel, run `check-completion` and report its verdict (valid completion /
stale-or-invalid / closed-unreviewed). `check-completion` **re-derives the claim** — it never
trusts the sentinel line: completion-record schema (non-empty `review_ids`, matching set id),
seal-set verification (§5), allowlist, current-corpus and post-close STATE hash comparisons
(§1.4), full reload and re-validation of every recorded receipt, and re-computation of the
closure state over the ledgers. A sentinel with no record, a record with no receipts, a
broken seal, or an open re-derived finding is a stale/invalid completion.

**Honesty:** this is a strong workflow gate on both surfaces, not tamper-proofing — manual
STATE edits can still lie, and Cowork has no hooks. The gate's value is that no *workflow*
path can close a project unreviewed, and every reader re-derives the claim from receipts.

---

## 7. Finding classes and waivability

Closed class enum (the validator rejects classes outside it):

| Class | Waivable |
|---|---|
| `completion-integrity` | yes |
| `conclusion-vs-brief` | yes |
| `cross-phase-consistency` | yes |
| `status-coherence` | yes |
| `falsifiability` | yes |
| `prerequisite-honesty` | yes |
| `instrument-validity` | yes |
| `evidence-selection` | yes |
| `load-bearing-confidence` | yes |
| `decision-rule-drift` | yes |
| `alternatives-risk-completeness` | yes |
| `corpus-standard-compliance` | yes |
| `temporal-coherence` | yes |
| `provenance-integrity` | yes |
| `quantitative-validity` | yes |
| `deliverable-missing` | **no** — a promised deliverable that does not exist |
| `internal-contradiction` | **no** — the corpus factually contradicts itself |
| `other` | yes |

Validator-level conditions that are non-waivable by construction (they are exit codes, not
findings): review missing/malformed/stale, unreadable in-scope files, protocol damage.

Check IDs C1–C15 map to the battery (C1 completion integrity … C14 recommendation provenance
as in the review brief, plus **C15 quantitative/model validity**). The brief text itself ships
in stage 3 (`reference/corpus-review-brief.md`); the IDs, the coverage-outcome enum, and the
class enum freeze here.

**The completion-criteria contract** (structured mode): the canonical file
(`research/reference/completion-criteria.md`) must define a **non-empty, duplicate-free** set
of stable IDs, and the research plan's generated criteria section must reference **exactly**
that ID set — any drift in either direction is `criteria-drift` and blocks the gate before
any receipt is considered. An empty canonical file cannot gate C1 and is likewise
`criteria-drift`, not a free pass.

---

## 8. The trust contract

- **The trust anchor lives in the shipped plugin, not the project.** The plugin ships
  `reference/review-protocol-contract.json`:

  ```json
  {
    "schema_version": "1.0",
    "protocols": {
      "1": {"validator_sha256": "<sha256 of the shipped validator>", "schema_version": "1.0"}
    }
  }
  ```

  At closeout (and in every `gate` / `check-completion` run) the expected hash is read from
  `${CLAUDE_PLUGIN_ROOT}/reference/review-protocol-contract.json` and compared against the
  SHA-256 of the installed `research/bin/validate-corpus-review.py`. Mismatch, an
  unreachable or unparseable plugin contract, or a contract/entry `schema_version` other
  than the one this protocol pins, fails closed (`validator-mismatch`) for any
  protocol-adopted project.
- **The project-local marker** `research/reference/review-protocol.json`
  (`{"protocol_version": 1, "adopted": "<date>"}`) records only which protocol version the
  project adopted — it is a version pin, never the authority: a project-local file cannot
  authenticate itself.
- The marker must be consistent with STATE's discriminator line (§6.1); any partial state is
  damage → fail closed, "repair via re-init".
- `--self-test` runs the embedded fixture battery against the installed copy; the closeout
  runs it before trusting a verdict.

---

## 9. Validator: modes, verdict logic, exit codes

`python3 research/bin/validate-corpus-review.py <mode> [--root DIR] [--plugin-root DIR] [--json]`

| Mode | Job |
|---|---|
| `manifest` | Build the canonical manifest; print it (the runner's manifest source — one implementation, not two). |
| `validate-receipt --receipt PATH [--filename NAME]` | Validate a **candidate** receipt document (staged outside `reviews/`) against the frozen schema and the current corpus — the runner's preflight (§2's duty that an unparseable or incomplete reviewer result is a failed attempt, never a receipt), through the one implementation. *(Added at stage 3; additive — no schema or verdict-logic change.)* |
| `gate` | Full pre-close verdict (below). |
| `transition [--apply] [--closed-unreviewed --reason "…"]` | Compute the allowed STATE transition; with `--apply`, re-run the gate, then write `completion.json` + STATE per §6.2's interruption-safe apply semantics (a half-applied close resumes deterministically). Dry-run prints the resulting STATE and record. |
| `check-completion` | Post-close validation for sentinel readers (§6.4). |
| `--self-test` | Embedded deterministic fixture battery. |
| `hash-self` | Print the file's own SHA-256 (contract maintenance). |

**Gate verdict — PASS iff all of:**

1. Protocol contract satisfied: marker + STATE line consistent; installed validator's hash
   equals the shipped contract's expected hash for the pinned protocol version.
2. `research/reviews/` satisfies the allowlist.
3. The manifest builds cleanly (no unreadable files, no symlink/case/duplicate errors).
4. The completion-criteria contract holds (§7 — no `criteria-drift`), and both ledgers parse
   cleanly.
5. The latest final review set (greatest `review_set_id` among `run_kind: final-closeout`
   receipts) exists with **≥1 valid receipt**, uniform `run_kind`, and at most one receipt
   per tier. Set composition is visible in each receipt — a single-sampler close is visible,
   never silent.
6. The pre-close comparison rule (§1.4) holds for every valid receipt in the set.
7. No check in the set is `insufficient-coverage` (it blocks exactly like an open material
   finding).
8. **Zero open material findings across the union of the set** — each material finding either
   closed by a **cited** `rejected-with-record` in the resolution ledger, or covered by an
   unexpired, class-matching exception of a waivable class. (`reconciled` closures require
   the post-reconciliation re-review by construction — §4.1.)

**Exit codes** (distinct, so callers report the reason, not just "blocked"):

| Code | Meaning |
|---|---|
| 0 | valid (gate PASS / completion valid / self-test green) |
| 2 | usage error |
| 3 | internal error |
| 10 | `no-marker` — legacy project (no STATE line, no marker): pre-W7 behavior, no credibility gate |
| 11 | `validator-mismatch` — hash mismatch, unreachable plugin contract, or partial/damaged protocol state (fail closed; repair via re-init) |
| 12 | `no-review` — no final review set with at least one receipt |
| 13 | `stale-hash` — corpus or STATE changed since the reviewed snapshot |
| 14 | `incomplete-receipt` — malformed/truncated/incomplete receipt (a failed attempt, never a verdict) |
| 15 | `open-material-findings` — open material findings and/or insufficient-coverage checks (detail lists each, incl. expired or non-waivable exception attempts) |
| 16 | `unreadable-files` — in-scope files that could not be read |
| 17 | `manifest-error` — symlink escape, case collision, duplicate path, missing STATE |
| 18 | `allowlist-violation` — unexpected file in `research/reviews/` |
| 19 | `state-format` — STATE does not support the allowed transition |
| 20 | `ledger-malformed` — unparseable resolution/exception entry |
| 21 | `not-closed` — (`check-completion`) no completion sentinel present |
| 22 | `stale-or-invalid-completion` — (`check-completion`) sentinel present but unbacked, drifted, or out-of-transition STATE |
| 23 | `closed-unreviewed` — (`check-completion`) administrative archive; not decision-ready |
| 24 | `criteria-drift` — canonical completion-criteria file empty, duplicated, or out of ID agreement with the plan |

When multiple failures apply, the gate evaluates every independent category (allowlist,
manifest, criteria, ledgers, review set), exits with the first applicable code in the order
11/10 → 18 → 17/16 → 24 → 20 → 12 → 14 → 13 → 15, and lists **every** accumulated reason in
the output. Categories that depend on a failed prerequisite (e.g. receipt staleness after a
manifest failure) are skipped, not guessed.

---

## 10. The deterministic fixture battery (`--self-test`)

Embedded, hermetic (temp dirs, synthetic plugin root, the running script as the
installed-validator fixture), no network, no clock dependence beyond "now". 74 cases
(64 at the stage-2 freeze; +5 additive `validate-receipt` cases at stage 3; +2 archive
drift cases and +3 legacy-prose/final-plan tightening cases at stages 4–5):

- **Gate:** valid close passes · no-review · stale-hash (corpus and STATE edits after
  receipt) · incomplete receipt (missing check) · truncated receipt · open material finding ·
  valid waivable exception passes · expired exception blocks · non-waivable exception
  attempt blocks · exception class-mismatch and out-of-corpus-deliverable do not cover ·
  cited rejected-with-record closes · uncited rejection stays open ·
  `reconciled`-against-current-set blocks · malformed ledger · unreadable file ·
  validator-mismatch · installed validator missing · legacy no-marker · partial protocol
  state fails closed · duplicated and body-only discriminator lines fail closed · allowlist
  violation · insufficient-coverage blocks · forced insufficient (run + empty
  files_examined) blocks · verdict-asymmetry inconsistencies (not-ready with no blocking
  evidence; ready alongside findings) · C1 missing criterion ID blocks · unmet-without-
  material-finding and waived-without-record rejected · waived-with-in-corpus-record passes ·
  plan/canonical criteria drift · empty criteria file · receipt id/hash binding mismatch ·
  bogus set id · filename/reviewer tier mismatch · mixed run_kind · duplicate tier ·
  evidence and files_examined outside the corpus · failed-attempts-only = no-review
  (both-tiers-unavailable) · one-valid-receipt-plus-failed-attempt passes
  (Tier-2-incomplete-result) · union-of-set gating · cross-category reason accumulation.
- **Runner preflight (`validate-receipt`, stage-3 additive):** valid candidate passes
  from outside `reviews/` · missing check is `incomplete-receipt` (a failed attempt) ·
  corpus changed during the review is `stale-hash` · malformed member shapes are
  `incomplete-receipt`, never a crash · the mode's flags are rejected outside the mode
  (pre-existing modes unchanged).
- **Manifest:** determinism · STATE split out of the corpus hash · golden canonical hash
  (canonicalization frozen — a change is a protocol version bump) · NFD/NFC path
  equivalence · reviews/ non-self-invalidation · out-of-tree symlink · symlinked STATE ·
  case collision.
- **Transition/completion:** exact four-op diff (line-level, nothing else changes) →
  `check-completion` valid · refuses unchecked Collect–Synthesize · interrupted apply
  resumes deterministically · manual sentinel without record → stale · fabricated completion
  record with no receipts → stale · post-close corpus drift → stale · post-close STATE edit →
  stale · post-close receipt mutation breaks the seal → stale · post-close ledger addition
  unsealed → stale · closed-unreviewed reported distinctly · not-closed · unsupported STATE
  structure → state-format.

The design-§8 items the battery cannot own are explicitly stage-3+ scope: the runner's
refuse-to-overwrite behavior, disclosure-presence preflight, the Cowork/no-hooks workflow
path, and the sentinel readers actually *reporting* what `check-completion` returns.
Corpus-scale fixtures (known-bad and clean mini-corpora) are stage-3 scope and live in the
eval pack; gate blocking does not switch on until they pass.
