# security (finder rewrite) — Codex pass-1 blind, 2026-07-26

Reviewer: Codex CLI 0.144.6, `gpt-5.6-sol`, `model_reasoning_effort=high`. Cold read of a
clean-room copy with `AGENTS.md`, `CHANGELOG.md`, and `reference/adversarial-list.md` stripped,
and every reference to prior review history neutralized in the copy so it could not be told
where to look. Read 3,316 lines; ran `node --check`, drove `parseFindings()` directly, and
executed `check-decisions.mjs --json`.

This is a **new pass 1**, not a pass 3: the plugin was rebuilt from a coverage register into a
finder, so the earlier verdicts no longer describe the artifact.

**Verdict:**

> "I would not deploy this as a build-blocking control or allow a clean run to support a launch
> decision. I would permit a limited advisory pilot, with every reported vulnerability manually
> verified and every clean result treated as meaningless."
>
> "The design intent is strong… That is the strongest version of the design. **The
> implementation does not preserve it.**"

**11 findings — 3 Critical, 7 High, 1 Medium. Every citation verified against the files. Zero
refuted.**

## The shape of it, and it is different from the last two rounds

The previous rounds found that the *substrate* was wrong — regex could not carry a coverage
claim. This round says the opposite about the architecture and indicts the **claims**:

- `locate.mjs` "does not call its patterns findings, reports truncation, and surfaces known
  unsupported frameworks as unread work. **That division holds inside the locator.**"
- The archive-laundering check is "**real enforcement**, including the natural accidental
  failure."
- `check-decisions.mjs` "when actually invoked, rejects invalid statuses, empty decided answers,
  expired deferrals, and triggers nothing can resolve."
- Root-cause dedup, confidence separated from severity, and the refusal to probe are "correct
  professional choices."

What failed is that I wrote assertions the code does not back — **which is precisely the defect
class this plugin exists to find.** Four of the eleven are a document promising enforcement that
does not exist.

## Triage

| # | Finding | Verdict |
|---|---|---|
| 1 | **A partial review becomes a green, `current` review.** The review record holds only path/commit/date/lens — no completion artifact — so an agent that exhausts context mid-subsystem still gets recorded as reviewed, and the gate can `PASS`. Worse for PII, which deliberately abandons chunking and runs repository-wide. | **CONFIRMED.** This makes "absence of findings is not evidence of security" *"a disclaimer attached to a green exit code, not a load-bearing invariant."* The corpus names the failure and does not prevent it. |
| 2 | **`/security:review` ignores staged and working-tree code.** `git diff --name-only <base>..HEAD` sees only commits. `origin/main` is hardcoded despite prose claiming default-branch resolution. | **CONFIRMED** (`skills/security-review/SKILL.md:30,37`). *"The cheapest missed vulnerability is a newly written, uncommitted endpoint."* Directly incompatible with "runs alongside development." |
| 3 | **The secret gate judges, and suppresses by path.** `secrets.mjs` says candidates-not-findings and that a benign label is never an exclusion; `check.mjs` blocks every unlabelled candidate as critical without judgment and discards every labelled one unread. Both directions: `const password = "sample"` in ordinary source blocks; a **real** key under `tests/` does not. | **CONFIRMED** (`check.mjs:241`). The boundary the operating model says must never leak, leaking in the gate I wrote. I had narrowed `docs` out of the suppression set an hour earlier from my own probing — that fix was correct and far too small. |
| 4 | **The confidence weld is prose, not a contract.** `parseFindings()` validated only `status` and `severity`. Codex ran it on a two-field entry and got `malformed: []`. | **CONFIRMED, and independently found.** I was mid-fix when the verdict landed. *"No component distinguishes 'I read every branch' from 'I wrote an attack path sentence.'"* |
| 5 | **Accepted risks are not bound to code.** The skill says "`owner=`, `date=`, `expires=`, and `commit=`. All four, or the gate rejects it." The gate requires three; the code-change binding runs only `if (acc.commit && file)`. | **CONFIRMED** (`check.mjs:236,253` vs `SKILL.md:123`). Omit `commit` and the finding stays suppressed until expiry no matter how the code changes. |
| 6 | **Standalone is materially weaker than documented.** `check.mjs` never calls `check-decisions.mjs` (grep: 0 occurrences), yet `honest-limits.md:85` lists "a decision that has come due" among what the gate blocks on. `security-audit` documents `check-decisions.mjs --json`, which has no JSON branch. | **CONFIRMED.** Two false claims plus a documented command that does not work — the same class as pass-1's "reviewer told to run an unavailable command." |
| 7 | **An installed-but-failing external scanner creates a false clean.** `externalScanner()` accepts any process without an OS-level error (`if (run.error) continue`), never checks exit status; `parseExternal()` turns malformed output into `[]`; the built-in table is then skipped. | **CONFIRMED** (`secrets.mjs:163`). A crashed gitleaks reports "used gitleaks, zero candidates" with no fallback. |
| 8 | **Concurrent runs lose updates and collide on IDs.** No lock, atomic append, CAS, run id, or duplicate-id rejection anywhere in the corpus. | **CONFIRMED as a gap.** Two reviewers both pick `S-YYYYMMDD-03`; one overwrites the other's `reviews.json`. |
| 9 | **The no-network claim is contradicted by the workflow.** `safety.md:7` — *"Nothing in this plugin touches a network… in any code path."* The review skill and the agent both instruct `npm audit --json`. | **CONFIRMED** (`SKILL.md:76`, `security-reviewer.md:283,297`). "Enforced by absence" is false. Either the claim narrows or the auditor must be forced offline. |
| 10 | **The anti-false-positive bias may move the whole review into a human queue.** Tie-break always chooses non-filing; eleven default lenses; normal PII egress satisfies PII-04's High condition. | **CONFIRMED as a judgment call**, and correctly labelled unrefutable from prose. Needs a blinded benchmark measuring human-minutes per confirmed defect — *"Do not accept 'few false positives' if the unresolved queue merely absorbed them."* |
| 11 | `README.md:103` points at `dev/security/tests/finder.test.mjs`, absent from the installed corpus. | **CONFIRMED, part staging artifact.** The file exists at marketplace level, outside the plugin. The README still gives a user a path they cannot run, and its "40 cases" is now stale (49). |

## Found independently by my own probing, same session, before the verdict

These converge with the reviewer's theme and none were re-reported by it:

1. **`adversarial-list.md` D1 claimed identity ratcheting catches a deleted finding.** Standalone
   `check.mjs` holds no state and writes nothing, so it cannot. A false claim in the document
   whose sole purpose is enumerating how the tool can be wrong. Corrected. This is finding 6's
   sibling and I found it the same way Codex did — by asking what the code actually does.
2. **`staleness.mjs` counted the whole subtree for the "files directly in this root" unit** —
   `src/*` reported 3 commits when 1 touched `src/top.ts`. Fixed with `:(glob)`.
3. **A typo in `gate.block_at_severity` silently blocked every finding** (threshold stayed −1).
   Now a stated `config_error` that still fails closed.
4. **`docs` suppressed the staged-secret block**, making "paste it into notes.md" a one-step
   bypass. Narrowed — and finding 3 shows the fix was correct but far too narrow.
5. **Two defects a prior review left PARTIAL were carried in untouched** with
   `check-decisions.mjs`: `revisit 9999-99-99` never expired (`Date.parse` → NaN), and
   `DECIDED | TBD` passed the non-empty-answer check. Both fixed, plus an over-rejection my own
   fix introduced — a deferral naming both its dates was flagged as expired because the check
   matched the *first* date, punishing the exact format its error message asks for.

**The lesson from #5 is the one to carry:** "keep unchanged" is not a review. A file inherited
across a redesign brings its open findings with it.

## Assessment

This is a materially better structural result than either previous round — the architecture is
endorsed and the locator/gate division holds — and a worse *claims* result. Nine of eleven are
fixable without touching the design:

- Findings **2, 5, 6, 7, 9, 11** are claim-vs-code gaps and documented-command errors. Repair is
  either making the code match the document or narrowing the document. Mechanical.
- Findings **3, 4** are boundary violations in `check.mjs` — it judges where it should defer, and
  fails to validate where it should. Both localized.
- Finding **1** is the real design work: a review record needs a **completion artifact** (files
  read, candidates addressed, unresolved paths) so a truncated run cannot be recorded as
  complete. This is the one that decides whether a green run means anything.
- Finding **8** needs a run id and an atomic append protocol.
- Finding **10** cannot be settled by argument and needs the benchmark it names.

Nothing here is committed or tagged. **The plugin should not be described as shippable**, and the
reviewer's own disposition is the right one to adopt verbatim: *advisory prototype, not trusted
control.*

## Repair round — finding → fix location

All eleven addressed. Locations only, for a pass-2 re-attack.

| # | Fix |
|---|---|
| 1 | `staleness.mjs` — a record without `complete: true` is state `partial`, never `current`. `check.mjs` — `REVIEWED` set excludes `partial`, so it cannot satisfy the any-review test; each partial unit emits a finding. `security-review/SKILL.md` Step 5 — the record gains `complete`, `files_reviewed`, `unresolved`. `security-reviewer.md` — a mandatory `## Completion` block, with "if you are unsure whether you finished, you did not." |
| 2 | `security-review/SKILL.md` Step 1 — scope is the **union of four sets**: committed since base, staged, unstaged, untracked. Default branch resolved via `git symbolic-ref refs/remotes/origin/HEAD` instead of assuming `main`, with a root-commit fallback. |
| 3 | `check.mjs` — blocks on the **signal**, never the path. `prefixed-format` and external-scanner hits block wherever they appear, including under `tests/`; a `credential-shaped-assignment` never blocks and is reported for review, because only reading the origin separates a fixture from a live credential. |
| 4 | `check.mjs` `parseFindings()` — active rows require `location`; `confidence: High` requires `attack_path` **and** `concrete_input`. Enforcing it immediately rejected this suite's own fixtures, which claimed High with neither. |
| 5 | `check.mjs` — all four acceptance fields required (`commit` was optional); a missing or unresolvable `location` on an acceptance blocks, since binding needs a file to watch. |
| 6 | `check.mjs` — imports and awaits `check-decisions.mjs`, so standalone matches what the docs promised; `check()`, `run()`, `main()` became async. `check-decisions.mjs` — `--json` implemented. `honest-limits.md` — corrected to say standalone **cannot** detect a deleted finding, and that the review record is the agent's claim. |
| 7 | `secrets.mjs` — exit status checked (0 = clean, 1 = findings, anything else is a failure), output parse-tested, and a failed scanner **falls back to the built-in table with a loud note** instead of reporting an empty strong scan. |
| 8 | `check.mjs` — duplicate finding ids are a blocking finding. Not a lock; `honest-limits.md` says so. |
| 9 | `safety.md` — the absolute "no network in any code path" claim replaced with the accurate narrower one: nothing contacts the *system under review*; the dependency auditor talks to its own registry, prefers offline, is never given a credential, and `deps` can be dropped. Mirrored in `honest-limits.md` and `README.md`, which both carried the same false claim. |
| 10 | Not repairable by argument. Recorded as the open question it is; needs the blinded benchmark the reviewer specified. |
| 11 | `README.md` — path qualified as marketplace-only, count corrected 40 → 54. |

Plus one contradiction the repairs surfaced: `security-sweep` told the agent to run the PII lens
**repository-wide in one context**, which contradicted its own chunking rationale two sections
above and reintroduced finding 1's truncation risk on the lens most likely to span a large
codebase. Now chunked, carrying forward only the small inventory rather than the source. Its
"do not write a record for a chunk that returned nothing" instruction also contradicted the
corrected recording rule and now writes `complete: false`.

**Suite: 40 → 54 cases**, adding the partial-review path (E19/E20), the mechanical confidence
weld (E17/E18), the signal-based secret rule (E14/E15/E15b), the acceptance binding, the
config-typo path, the staleness pathspec, and five decisions-gate cases.

**E15 had asserted the defect.** It required that a real AWS key under `tests/` *not* block —
encoding the path-suppression bug as intended behavior. Inverted. A test that enshrines the bug
is worse than no test, and it is the second time this codebase has produced one.

## Verification of the repairs

- 54/54 cases pass; every script syntax-clean; `claude plugin validate` and the version-prefix
  check pass.
- Finding 2 demonstrated closed against a real repository: old scope returned **nothing** with a
  staged file, a modified file, and an untracked file present; new scope returns all three.
- `check-decisions.mjs --json` verified emitting JSON.

Still not committed, still not tagged, and **still not shippable** — the reviewer's disposition
of *advisory prototype, not trusted control* stands until a pass-2 re-attack says otherwise. Nine
findings were claim-vs-code gaps whose repairs are mechanical and verifiable; finding 1's repair
is the one that changes what a green run means, and it rests on an agent honestly reporting its
own completion, which is posture backed by a default-to-partial, not a guarantee.

## Self-attack on the repairs, before pass 2 returned

Six more, found by probing my own repair round. Every one is the same shape the reviews keep
naming — **a fix that closes the named case and opens a neighbouring one** — which is now
predictable enough that hunting it deliberately pays.

1. **The repairs created a perverse incentive.** Partial reviews blocked unconditionally while
   `never_reviewed` was waved through by default, so a unit nobody opened passed and a unit
   someone partly reviewed failed. That punishes attempting a review. Both mean "not reviewed";
   both now sit on `block_on_never_reviewed`.
2. **Every external-scanner hit was blockable**, including gitleaks' entropy-driven
   `generic-api-key` — reintroducing the undecidable-candidate class one level up, in the fix
   for it. Generic and entropy rules now report; named-format rules block.
3. **The completion claim was never cross-checked.** A record claiming `complete: true` while
   naming no files read is self-contradictory and is now `complete_unsupported`. The limit is
   stated: a low-but-nonzero count cannot be judged, because a lens-scoped review legitimately
   reads only some files.
4. **Due decisions were hidden on exactly the projects that need them.** The decisions call was
   placed after the empty-registry early return, so on a brand-new repository — empty registry,
   first migration just written — three due decisions were invisible. Moved ahead of both early
   returns.
5. **Two command files still carried the corrected claims**: `sweep.md` promised a
   repository-wide PII walk and both promised "never touches a network." Found by watching the
   pass-2 reviewer read them.
6. **A vendor test-mode key now blocked.** `sk_test_…` is Stripe sandbox — real format, synthetic
   value, committed on purpose. Blocking every prefixed format regardless of path fixed the
   false negative under `tests/` and created this false positive one step over. Test-mode
   prefixes report; `sk_live_` under the same path still blocks. **Found by watching the pass-2
   reviewer probe `PATTERNS` with exactly that string** — the instrument earning its keep before
   its verdict arrived.

**Suite: 54 → 59 cases.**

## Raw

`~/Projects/_scratch/kenzie-blind-reviews/security/VERDICT-raw.md` (19,797 bytes), with
`PROMPT.md`, `PASS-2-PROMPT.md`, and the staged copy beside it. The pass-2 verdict lands in
`VERDICT-pass2.md` and gets its own note.
