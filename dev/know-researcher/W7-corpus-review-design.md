# W7 design v3 — independent adversarial corpus review (the credibility gate)

Status: **v3.1 — the build contract, verification-passed.** History: v1 (concept) → Codex
adversarial review ("rethink": 4 blockers) → v2 (deterministic gate) → Codex re-review
("rethink again": 4 gate-spine blockers + build-order rejection) → **vertical spike executed**
(both reviewer tiers run against the real known-bad engine corpus) → v3 → Codex targeted
verification ("fix-first": 8/11 resolved, 3 spec defects) → **v3.1** (the three fixes applied:
STATE split out of the corpus hash with pre/post comparison rules; validator trust anchored in
the shipped plugin + STATE-resident discriminator; mechanically enforceable coverage outcomes).
Buildable.

## The problem (unchanged; compressed)

A completed real project closed with every per-claim gate green and STATE declaring all phases
complete — and was not decision-ready. Corpus-level failures (completion criteria unmet,
conclusions exceeding evidence, cross-phase reversals, unfalsifiable recommendations) are
visible only to a reviewer holding the whole corpus + the brief + the plan's own criteria.
Per-claim gates structurally cannot reach them. W7 formalizes that reviewer and gates project
completion on it. **Hard gate with commissioner exceptions** (Kelsey's call), made
deterministic by the machinery below.

## What the spike proved (design inputs, not aspirations)

1. **Feasible:** one cold bounded reviewer traverses a 209-file/4MB corpus and returns a
   complete, parseable, cited 14-check result. No batching needed at this scale.
2. **Reviews are samplers.** Coverage 22–69/209 files; recall partial and **strongly
   complementary** across engines (union ≈ 16 distinct real findings vs 7–13 for either alone;
   each found material issues the other missed). → Tier 2 is a **second sampler**, not a
   degraded fallback; the final gate runs **both when available and gates on the union**.
3. **Verdict asymmetry.** `not-ready` is trustworthy (cited findings); `ready` from a
   partial-coverage run is weak evidence. The gate never unlocks on a `ready` verdict — it
   unlocks on *valid receipts + zero open material findings*.
4. **Honest coverage works** when the brief demands per-check `files_examined` +
   `coverage_note` — both engines complied, including disclosing what they could not see.
5. **Environment contract is real:** Codex refuses untrusted dirs (needs
   `--skip-git-repo-check` or a trusted root); both runs took 11–15m → **timeout default 30m**,
   configurable.
6. **Reviewers disagree** on judgment calls → findings need an adjudication path
   (reconcile / except / reject-with-record), not silent dismissal.

---

## Architecture: seven pieces

| Piece | What it is | Trust property |
|---|---|---|
| **Runner** | orchestrates a review run; the only writer of review artifacts | owns all execution metadata — the reviewer cannot forge its own receipt |
| **Reviewers** | Tier 1 Codex CLI + Tier 2 cold Claude agent — dual samplers, same brief | read-only; return a result schema (checks/findings/verdict) only |
| **Receipt** | immutable per-run record: manifest hash + execution metadata + results | content-addressed; never edited after write |
| **Resolution ledger** | append-only; how findings get closed | keyed `review_id + finding_id`; receipts stay immutable |
| **Exceptions ledger** | commissioner-accepted risks (the waiver analog) | validator-owned eligibility; verbatim rationale; hash-bound |
| **Validator** | project-local script; computes the gate verdict | deterministic; versioned + hash-pinned by a protocol marker |
| **The gate** | closeout preflight → validator → one atomic STATE write | plus every sentinel-reader treats "complete" as a claim to validate |

## 1. Identities and hashes (fixes v2-review Blocker 1 + Medium 10)

- **`decision_corpus_hash`** — SHA-256 over the canonical manifest of the reviewed corpus,
  **excluding `research/STATE.md`** (mutable position state is not decision evidence; keeping
  it in the corpus hash is what made v3's closeout self-invalidating). Manifest spec: relative
  paths, UTF-8 NFC, `/` separators, byte-wise sorted; per-file SHA-256 over raw bytes;
  canonical JSON serialization (sorted keys, no whitespace variance); symlinks not followed
  (entry records the link target; out-of-tree targets are a manifest error); case-collision
  and duplicate paths rejected; **unreadable in-scope file = manifest failure** (blocks, never
  skips silently).
- **`state_hash`** — separate SHA-256 of `research/STATE.md`. The reviewer still *reads* STATE
  (it is in scope for review); it is hashed apart so the two identities can be compared under
  different rules.
- **Scope:** the full decision corpus (v2 §3 list — plan, evidence-standard, outputs, audits +
  gate-log, **notes**, registry, claim-graph, canonical-figures, discovery record, STATE,
  assumptions, cross-reference, gaps, commissioner directives, source-material digest).
  **Excluded:** `research/reviews/**` (self-reference). `reviews/` carries an **allowlist**
  (reports, receipts, the two ledgers); unexpected files there are a validator error — it must
  not become a place to park decision-bearing material.
- **STATE transition identities + the two comparison rules (integrated into the verdict):**
  the receipt binds `decision_corpus_hash` + `preclose_state_hash` (STATE at review time).
  At closeout the validator itself computes the **exact allowed transition** (check Verify,
  mark final phase complete, set the completion sentinel, set Next Action to the closeout
  form — nothing else) and records the resulting `postclose_state_hash` in the completion
  record. The two rules:
  - **Pre-close validation** (gate stage 2): current `decision_corpus_hash` == receipt's AND
    current `state_hash` == receipt's `preclose_state_hash`.
  - **Post-close validation** (sentinel readers): current `decision_corpus_hash` == receipt's
    AND current `state_hash` == the completion record's `postclose_state_hash`. Any STATE
    content outside the allowed transition — or any decision-corpus change after close —
    reports as a stale/invalid completion.

## 2. The runner (fixes v2-review Blocker 3)

`research-review-corpus` = a **runner** that:
1. Builds the canonical manifest + `decision_corpus_hash` (via the validator's manifest mode —
   one implementation, not two).
2. Invokes the reviewer(s) read-only with exactly four inputs: the fixed brief, the manifest,
   the corpus root, the result schema. **Nothing else** — no conversation, no summary, no
   authorial context (structural coldness for both tiers; fixes v2-review High 6).
3. Owns execution metadata: start/end, duration, timeout (default 30m), exit status,
   stdout/stderr capture, truncation detection, env preconditions (Codex trusted-dir handling,
   version capture).
4. Parses the reviewer's result schema; **validates completeness** (all checks present with
   coverage records; findings well-formed and cited). An unparseable or incomplete result is a
   **failed attempt**, recorded with its failure chain — never a receipt.
5. Atomically writes report + receipt to `research/reviews/` with a collision-proof
   `review_id` (`<UTC-stamp>-<hash8>`).

**Tier policy:** Final-closeout runs invoke **both tiers when available** (union gate); a tier
that fails at runtime is recorded in the fallback chain. Minimum for a valid final review set:
**one valid receipt**; the receipt records the set's composition, so a single-sampler close is
visible, never silent. Mid-project on-demand runs may be single-tier. Both tiers permanently
unavailable → review-missing (non-waivable) → the project cannot take the normal completion
sentinel; its terminal option is `closed-unreviewed` (§6).

## 3. The reviewers

- **Tier 1 — Codex CLI:** `codex exec -s read-only` (+ trusted-dir handling), 30m bound.
- **Tier 2 — `agents/corpus-reviewer.md`** (new, named agent): cold context, read-only tools,
  receives only the four inputs. Labeled in receipts as `isolated same-family sampler` —
  honest about correlated blind spots, which the spike showed still leaves large complementary
  value.
- Both produce the same result schema; both are judged by the same runner validation. Neither
  writes files.

## 4. Receipt, resolution ledger, exceptions ledger (fixes v2-review Blocker 4)

- **Receipt (immutable):** review_id, timestamps, reviewer set (tier/engine/version/fallback
  chain per member), execution record, `decision_corpus_hash` + file count/bytes +
  unreadable-file list (must be empty), `criteria_mode` (§7), per-check
  `{id, status, coverage_outcome, files_examined, coverage_note, finding_ids}`, verdict, findings
  (id/class/severity/waivability-class/observed/criterion/evidence/decision-impact/
  closure-evidence-required). **Statuses live elsewhere** — the receipt is the assessment,
  frozen.
- **Resolution ledger** (`research/reviews/resolutions.md`, append-only): one entry per
  resolution: `review_id + finding_id`, action (`reconciled | excepted | rejected-with-record`),
  the closure evidence (for reconciled: what changed, where), date. **Any reconciliation that
  changed an in-scope file changes the corpus hash → a new review is required**; the validator
  enforces this mechanically, so "declared reconciled without re-review" cannot close a project.
- **Exceptions ledger** (`research/reviews/exceptions.md`, append-only): finding ID, class,
  commissioner's **verbatim** rationale (never agent-authored), decision impact + risk
  accepted, the `decision_corpus_hash` it binds to (expires on corpus change), affected
  deliverables. Exceptions are disclosed in affected deliverables' M&L **before** the final
  review runs (sequencing rule — so disclosure cannot invalidate the review that gates on it).
- **Waivability is validator-owned** (closed class mapping; the reviewer's `waivability-class`
  is advisory only). **Non-waivable:** review missing/malformed/stale; promised deliverable
  missing; internal factual contradiction; unreadable in-scope files. Everything else:
  commissioner-exceptable.

## 5. The validator + trust contract (fixes v2-review Blocker 2)

`research/bin/validate-corpus-review.py` — installed by init/re-init, hash-pinned:

- **Trust anchor lives in the shipped plugin, not the project.** The plugin ships
  `reference/review-protocol-contract.json` mapping `protocol_version → expected
  validator_sha256 + schema_version`; the closeout reads the **expected** hash from
  `${CLAUDE_PLUGIN_ROOT}` at runtime and compares the installed `research/bin/` copy against
  it. The project-local marker (`research/reference/review-protocol.json`) records only which
  protocol version the project adopted — it is a version pin, never the authority (a
  project-local file cannot authenticate itself).
- **Durable migrated-project discriminator:** re-init writes a `Review protocol: v<N>` line
  into STATE.md's header. It lives inside the corpus, so it cannot be silently dropped with
  the marker: for any project whose STATE carries the line, a missing marker, missing
  validator, or hash mismatch **fails closed** ("repair via re-init") — deleting marker +
  script no longer downgrades a migrated project to the legacy path. Legacy = STATE has no
  protocol line AND no marker exists; anything partial is damage, not legacy.
- **Coverage is mechanically enforceable.** Each check's `coverage_outcome` comes from a
  constrained enum: `complete` (every input the check's brief entry names was examined) /
  `partial` (gaps disclosed in `coverage_note`) / `insufficient-coverage` /
  `not-applicable` (with the applicability rule cited). Hard rules the validator applies:
  a `run` check with empty `files_examined` is `insufficient-coverage` by definition; **any
  `insufficient-coverage` check blocks the gate** exactly like an open material finding; for
  **C1**, the receipt must bind the completion-criteria file's path + hash and enumerate
  **every criterion ID with a per-ID disposition** — a missing ID is `insufficient-coverage`.
  A zero-finding review earns nothing unless its coverage outcomes support it.
- **Verdict logic (gate semantics):** PASS iff — protocol contract satisfied (shipped-plugin
  expected hash matches the installed validator; marker consistent with STATE's protocol
  line); latest final review set exists with ≥1 valid receipt; the **pre-close comparison
  rule** (§1) holds; no check in the set is `insufficient-coverage`; **zero open material
  findings across the union** of the set (each either `reconciled` in the resolution ledger —
  with the post-reconciliation re-review — or covered by an unexpired exception of a waivable
  class). Reviewer `ready` verdicts are recorded but **never sufficient** (verdict asymmetry).
- Distinct exit codes: valid / no-marker(legacy) / validator-mismatch / no-review /
  stale-hash / incomplete-receipt / open-material-findings / unreadable-files — so callers
  report the reason, not just "blocked."
- **Self-test:** `--self-test` runs embedded fixtures against the installed copy; the closeout
  runs it before trusting the verdict.

## 6. The gate: closeout refactor + side doors (fixes v2-review Blocker 2, High 5, High 8)

`research-audit-claims` final-phase closeout becomes three strict stages:
1. **Read-only preflight — terminal for the invocation.** Deliverable manifest + cycle-artifact
   reconciliation as *checks only*. Discrepancies end the turn with the remedy. **The
   conversational authorization branch is removed for final closeout:** authorizing a missing
   cycle artifact now requires a written commissioner directive in an in-scope file
   (`notes-to-self.md`), after which preflight — and, since the corpus changed, the review —
   rerun. Nothing conversation-only can affect what a cold reviewer sees.
2. **Validator run** (which itself self-tests). Anything but `valid` blocks with the named
   reason.
3. **One atomic STATE write** — exactly the allowed transition from §1.

Side doors closed in the same change: init's scaffolded CLAUDE.md + STATE template scope manual
completion to non-final phases; discover's inconsistency menu drops manual final completion;
**progress and start-phase treat the completion sentinel as a claim** — they run the validator
and report stale/invalid completions. (Both need Bash added to skill *and* command frontmatter
— spike/v2-review catch.)

**Terminal states:** `all phases complete` (validator-passed) — or **`closed-unreviewed`** —
an administrative archive state for projects that cannot obtain a review (reviewer permanently
unavailable, or commissioner abandons). Visibly distinct in STATE, never described as
decision-ready, and progress reports it as such. This is an escape *from the workflow*, never
an exception *to the gate*.

**Honesty:** a strong workflow gate on both surfaces; not tamper-proof against manual STATE
edits; Cowork has no hooks. Docs say so. (Optional future hardening: a PreToolUse hook guarding
the sentinel on Claude Code.)

## 7. The battery (v2 §4, amended per v2-review High 6/9)

C1–C14 as in v2, plus:
- **C15 — Quantitative/model validity** (restored): denominator changes across phases,
  aggregation errors, sensitivity of headline figures to contested constants, unit-economics
  arithmetic. Applies when the corpus carries quantitative models; `needs-domain-expert`
  escalation available.
- Every check's brief entry adds the **required-evidence** field (what a finding of this class
  must cite to count).
- **Completion-criteria enabler:** init writes `research/reference/completion-criteria.md`
  (stable-ID checkbox list) as **canonical**; the plan's prose criteria section is generated
  from it. The validator rejects ID drift between the two. Receipts record
  `criteria_mode: structured | legacy-prose` — legacy prose is honest, explicitly weaker C1
  coverage, never presented as equivalent.
- The spike-tested brief (scratch `spike/review-brief.md`) is the base text for
  `reference/corpus-review-brief.md` — it already produced compliant output from both engines.

## 8. Verification (fixes v2-review High 7 — release-blocking)

- **Validator fixtures (deterministic, scriptable):** valid passes; no-review, stale-hash,
  incomplete/truncated receipt, open-material, expired exception, non-waivable exception
  attempt, unreadable file, missing/mismatched validator, legacy no-marker, same-day rerun
  immutability, manual sentinel without receipt (progress reports stale) — **plus**
  Tier-2-incomplete-result, both-tiers-unavailable, and the Cowork/no-hooks path.
- **Corpus-scale fixtures:** known-bad corpus → not-ready with seeded classes found (the spike
  already proved this live, both engines); clean corpus → no material findings. Distilled
  mini-corpora ship in the eval pack so this is repeatable.
- Standing loop: drift lint, plugin validate, eval regression, **Codex review of the built
  change**, map sync, release batch. **Gate blocking does not switch on until the corpus-scale
  fixtures pass.**
- **Live proof:** run the real dual-tier review against the *remediated* engine corpus —
  should catch what remains (the spike's Tier-2 findings F-005/F-009/F-013 are candidates if
  unaddressed), not re-raise what was genuinely reconciled; and the validator applied to the
  original pre-remediation state must block its premature closeout.

## 9. Touches (complete — fixes v2-review Medium 11)

- **New:** `skills/research-review-corpus/` + `commands/know-research/review-corpus.md`;
  `reference/corpus-review-brief.md`; `reference/validate-corpus-review.py` (plugin copy);
  `agents/corpus-reviewer.md`; `reference/review-protocol.json` template.
- **Edit:** `research-audit-claims` (closeout refactor); `research-init` (install validator +
  marker; completion-criteria artifact; reviews/ + ledgers scaffold; narrowed completion
  language; pre-allow additions `Bash(codex:*)`, `Bash(python3:*)`); `research-discover`
  (drop manual final completion); `research-progress` + `research-start-phase` (sentinel-as-
  claim; **Bash in skill + command frontmatter**); `reference/tools-guide.md` (Codex CLI:
  install, auth, trusted-dir, timeout); `reference/workflow-ownership.md` (the review in the
  stop list: material corpus findings are a stop).
- **Docs/release:** `know-researcher/README.md` + `know-researcher/AGENTS.md` (command count/tables),
  CHANGELOG, five version surfaces, migration note (re-init required for the gate; un-migrated
  projects keep pre-W7 behavior *plus* a visible "no credibility gate" notice — they do not
  silently hard-gate, and they cannot claim the validated completion state).
- **Map sync:** `dev/know-researcher/MAINTAINERS.md` — Layer 9 (the Tier-2 review layer and its
  build status), Layer 2 ownership rows (runner owns review artifacts; validator owns the
  completion verdict), seam updates.

## 10. Build order (v2-review's revision, spike stage done)

1. ~~**Vertical spike**~~ — **done** (results above; brief validated on both engines).
2. ~~**Contract spine**~~ — **done** (2026-08-05): shipped as
   `know-researcher/reference/corpus-review-protocol.md` (the frozen protocol v1 — normative over
   this design on mechanics), `reference/validate-corpus-review.py` (64-case embedded
   battery), `reference/review-protocol-contract.json`, marker + completion-criteria
   templates. Hardened by a second Codex adversarial review (fix-first: 9 blockers → all
   addressed in-scope; receipt/ledger *post-close* immutability implemented as completion
   seals, with pre-close mutation explicitly assigned to the manual-tamper class the design
   already discloses). **Schemas are frozen** — changes from here are a protocol version
   bump.
3. **Reviewer implementation + proof — built 2026-08-05; proof pending.** Implementation
   shipped: `skills/research-review-corpus/` + `commands/know-research/review-corpus.md` (the
   runner: four-inputs coldness, exclusive-create publishes, failed attempts in both run
   kinds, fail-closed disclosure preflight), `reference/corpus-review-brief.md` (spike
   base + C15 + required-evidence + the frozen receipt-schema deltas + a
   read-nothing-outside-the-manifest rule), `agents/corpus-reviewer.md` (Tier 2).
   Validator gained the additive `validate-receipt` runner-preflight mode (battery 64→69;
   contract hash regenerated). Corpus-scale fixtures ship in the eval pack
   (`eval/targets/know-researcher/fixtures/`: `corpus-a` = known-bad, 7 seeded classes;
   `corpus-b` = clean — neutral names so the blind runner can't infer the condition)
   behind two golden `review-corpus` scenarios, a Credibility Gate rubric dimension, and
   a deterministic `review_receipt_validates` gate. Codex fix-first review applied (5
   blockers / 5 majors). **The stage closes when the two goldens pass** — that pass is
   the stage-4 switch-on precondition; cold reviewer behavior is proven at stage 5.
4. **Gate wiring:** closeout refactor, side doors, sentinel readers, init/migration,
   permissions.
5. **Live proof + release:** remediated-corpus dual review, Cowork path, docs/map/versions,
   Codex review of the whole change, ship.
