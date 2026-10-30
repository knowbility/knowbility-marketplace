# security (finder rewrite) — Codex pass-2 disclosed re-attack, 2026-07-26

Fresh context, repaired copy, its own pass-1 report, a locations-only fix map, and three
repair-introduced defects disclosed so it could hunt siblings rather than re-report them.

**Verdict: 1 CLOSED · 9 PARTIAL · 1 OPEN.**

> "I still would not deploy this as a build-blocking control, and a clean run still cannot
> support a launch decision. The repairs generally close their exact examples. **They do not
> close the neighboring routes.**"

## The one sentence that matters

> "The most serious remaining problem is that the system now **mechanically validates agent- and
> developer-authored claims without independently binding them to scope, code state, or valid
> state transitions.**"

That is not a bug list. It is a statement about what the gate is: an integrity boundary over a
human-editable markdown file whose every field is self-asserted. Each repair validates one more
claim; each validation leaves a neighbouring claim unvalidated. Nine PARTIALs is what that
produces.

And on the completion marker — the repair I flagged as my own biggest doubt, and asked it to
attack directly:

> "It has moved the unverifiable claim down one level and made that claim mechanically
> consequential. The system can detect a missing `yes`; **it cannot detect a wrong `yes`**, an
> incomplete aggregation, an incomplete scope, an unresolved path, or code that changed outside
> `HEAD`."

My doubt was correct. The repair is a useful truncation signal and not a closure of the Critical.

## Verified myself, all reproduced

| Route | Result |
|---|---|
| **One-word laundering.** `status: resolved` on a Critical → parsed, skipped, no evidence required. `status: decision-due` → parked, no decision row, no linkage. | **REPRODUCED.** `check.mjs:291,345`. The worst thing found in either pass: the entire gate is one word wide. |
| **`--diff-filter=ACMR` excludes deletions.** Delete the only authorization middleware and the file produces no review input at all — creating the vulnerability while being invisible to scope. | **REPRODUCED.** `SKILL.md:44-46`, `secrets.mjs:246` (`ACM`). |
| **The decisions seam fails open.** Only `verdict === 'fail'` propagates; delete `DECISIONS.md` and `missing_input` is discarded. The seam I added this round. | **REPRODUCED.** `check.mjs:185`. |
| **`expires=9999-99-99` never expires** — lexical string compare, while `check-decisions.mjs` correctly uses `Date.parse`. The same defect I fixed in one file survives in its sibling. | **REPRODUCED.** `check.mjs:319`. |
| **`S-20260726-1` is silently invisible** (no malformed error); **`S-20260726-100` truncates to `-10`.** | **REPRODUCED.** A finding-like block outside the id regex is never validated at all. |

**One refuted as a staging artifact:** `safety.md` referencing `reference/adversarial-list.md`
"not in the corpus" — that file exists in the repository; I stripped it from the review copy
deliberately, as in pass 1. Same class as pass 1's `honest-limits.md` false finding, and the
same lesson: stripping a referenced file manufactures a finding.

## Verdict table

| # | Finding | Verdict |
|---|---|---|
| 11 | README test path | **CLOSED** — "I found no neighboring false claim about the suite's location." |
| 1 | Partial review → green | **PARTIAL** — marker holds; nothing binds `files_read` to assigned scope, `unresolved: 1` still passes, and one scalar summarizes many (subsystem × lens) assignments. Same-day records tie-break to the first, so a complete morning run masks a partial afternoon one. |
| 2 | Staged/working-tree scope | **PARTIAL** — union holds; deletions excluded; recency still bound to `HEAD` only. |
| 3 | Secret gate | **PARTIAL** — path suppression gone; `sk_test_` blocks (I fixed this mid-review after watching it probe); external hits block as Critical while the contract caps them at Medium. |
| 4 | Confidence weld | **PARTIAL** — fires only when the row literally says `confidence: High`. A row with no confidence at all parses. `attack_path: yes` satisfies it. |
| 5 | Acceptance binding | **PARTIAL** — four tokens required; invalid dates, nonexistent locations, index/worktree changes, and secondary affected files all evade. |
| 6 | Standalone | **PARTIAL** — decisions wired and `--json` real; missing ledger fails open. |
| 7 | External scanner | **PARTIAL** — status/parse checks hold; exit 1 with `[]` accepted; **TruffleHog's "staged" mode scans the filesystem, not the index**; its multi-object JSON stream fails the single-parse test. |
| 8 | Concurrency | **PARTIAL** — surviving duplicates detected; a lost update leaves nothing to detect. Correctly disclosed. |
| 9 | No-network | **PARTIAL** — prose fixed everywhere; **the executable instructions still say "Never touch a network" and still run raw `npm audit`**. The "never given a credential" claim is too strong: an invoked package manager inherits registry config. |
| 10 | Anti-FP bias | **OPEN** — and the signal repair *increases* it, since external hits now block as Critical. |

## Assessment, and a recommendation against a third repair round

Three rounds across this plugin now show the same arc: repairs close their examples, neighbours
open. Pass 1 → 11 findings. Repair → I found 6 more myself. Pass 2 → 9 PARTIAL plus 6
repair-adjacent. The recurrence has stopped being a discipline problem and become evidence about
the design.

**The gate is trying to be an integrity boundary over self-asserted markdown.** Every field the
registry carries — status, severity, confidence, completion, acceptance — is written by the
party the gate is meant to check. Validation of a self-assertion is not a binding, and the
supply of unvalidated neighbouring assertions is effectively unbounded.

Three ways out, and only one is cheap:

1. **Narrow the claim — ship advisory, not blocking.** Both passes independently arrived at
   *advisory prototype, not trusted control*. The findings, the locator, the staleness map, and
   the decisions ledger are all genuinely useful without the gate asserting integrity it cannot
   hold. This costs nothing and is honest today.
2. **Bind the claims** — per-assignment records keyed by (subsystem, lens, scope hash, tree
   hash); required-field and state-transition validation; content fingerprints instead of
   `commit..HEAD`. Real work, and it makes the claim falsifiable rather than true.
3. **Change the substrate** — structured storage with enforced transitions, which gives up the
   human-readable registry that made the design pleasant.

**Recommendation: (1) now, (2) as 0.2.0 if it must ever block.** The individually cheap fixes
worth taking regardless — deletions in scope, `Date.parse` on acceptance expiry, propagating
non-`fail` decisions verdicts, rejecting unrecognized finding-like headings, and the one-word
laundering guard — are each a few lines and each closes a demonstrated hole.

Still uncommitted, still untagged, and now with two independent reviews saying the same thing
about its disposition.

## Disposition taken — advisory, plus the five cheap fixes

Kelsey's ruling, and it reframes what the gate is rather than just lowering it:

> "This plugin was never going to allow us to skip HITL for security anyway. It should allow us
> to reduce the surface the human has to review and truly close out problems that prevent a huge
> backlog of issues at the end of a project."

That makes advisory the *correct* posture, not a retreat. The value is surface reduction and
keeping closed problems closed — neither needs the gate to be an authority, and both are
undermined by blocking on a claim the gate cannot verify, which only teaches people to write the
word that makes it stop.

**`gate.mode: "advisory"` is the default.** `"blocking"` opts in where a team's process makes the
registry trustworthy — that is a decision about their controls, not about this script.

**One carve-out blocks in either mode**, on this codebase's own reversibility doctrine: a staged
credential of a known format. Everything else here is recoverable — an unresolved finding is
still there tomorrow, a late review can be run late, a due decision can be made next week. A key
that reaches a remote is rotated, not undone.

### The five fixes

| Fix | What it closes |
|---|---|
| **One-word laundering** | `resolved` must cite `resolved_in: <sha>` and the sha must be reachable; `decision-due` must name a row that exists in `DECISIONS.md`. The gate was one word wide. |
| **Deletions in scope** | `--diff-filter=ACMRD`, plus `git show <base>:<path>` and a caller grep. Removing the only authorization middleware produced *no review input at all*. |
| **Real dates on acceptance** | `Date.parse`, not lexical compare. `expires=9999-99-99` was unexpired forever — the same defect I had already fixed in `check-decisions.mjs`, surviving in its sibling. |
| **Decisions fail closed** | Every non-`pass` verdict propagates, not only `fail`. Deleting `DECISIONS.md` returned `missing_input`, which was discarded — one command removed the check on the mechanism this plugin values most. |
| **Malformed ids are visible** | `\b`-anchored; `S-20260726-1` was silently invisible and `S-20260726-100` silently truncated to `-10`. Anything heading-shaped that fails to parse is now reported. |

### Two more the end-to-end run found, both the same early-return seam

Neither showed up in the unit tests; both came from running the thing against a real repository:

1. **The irreversible carve-out never ran on a fresh project.** The credential scan sat after the
   empty-registry early return, so on a day-one repo — no registry yet, someone commits a key —
   the one finding that blocks in every mode was skipped entirely.
2. **Moving it earlier was not enough.** The early returns build their own findings array and
   return `missing_input`, which exits 0 in advisory mode, so the key was detected, dropped from
   the result, and exited clean. The carve-out has to survive the *return path*, not just reach
   it.

That is the third instance of this exact seam in this file — the decisions call hit it too. Worth
recording as a caution: **in `check.mjs`, anything that must always run has to run before the
early returns AND be carried through them.**

**Suite: 59 → 66 cases.** Advisory default, the irreversible carve-out in both directions
(`sk_live_` blocks on a fresh repo, `sk_test_` does not), and one case per fix.

## Raw

`~/Projects/_scratch/kenzie-blind-reviews/security/VERDICT-pass2.md` (19,907 bytes), with
`PASS-2-PROMPT.md`, `PASS-1-REPORT.md`, and the staged copy beside it.
