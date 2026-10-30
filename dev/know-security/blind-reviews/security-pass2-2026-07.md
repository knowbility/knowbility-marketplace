# security — Codex pass-2 (disclosed re-attack), 2026-07-26

Fresh context, repaired copy, its own pass-1 report, a locations-only fix map, and the two
self-introduced defects disclosed so it could hunt siblings rather than re-report them.

**Verdict: 2 CLOSED · 11 PARTIAL · 0 OPEN.**

> "Still not trustworthy as a security gate. 'No OPEN' is not an endorsement — the surviving
> PARTIAL defects still permit an insecure overall `pass`."

## The two that matter, and they are the same shape as before

### INV-4 now evaluates the wrong file

Stores enter scope correctly — that part of the repair worked. But `mechanismPresent` reads
`s.file`, and for a store that is the **migration**, not the declared deletion path. So:

- `deleteSubject` appearing anywhere in a migration vouches for every store in it.
- A real `src/delete.ts` calling `deleteSubject('secrets')` **fails**, because the marker is
  not in the migration.

The behavior is exactly inverted. I fixed "the invariant does not evaluate" and produced
"the invariant evaluates the wrong thing."

### Framework detection repeats the canary's mistake at a different scope

The canary was removed because one recognized syntax vouched for everything. Its replacement
gates on `httpBy.size === 0` — **project-wide**. So one Express health route silences a
wholly unread Fastify registration, and a `router.route('/users').get(leakAllTenants)` file
is only a non-blocking candidate. Codex reproduced an overall `pass` with `/users` outside
the denominator.

Also: `requirements.txt: Django==5.2.1` is not detected, because the anchored dependency
regexes are tested against raw manifest text.

I replaced a mechanism with one that has the identical flaw one level up.

## Verdicts

| # | Finding | Verdict |
|---|---|---|
| 11 | `--quiet` writes / no rows | **CLOSED** — `--json` exits before state creation, returns rows, no neighbouring write path found |
| 12 | Reviewer told to run an unavailable command | **CLOSED** |
| 1 | INV-4 | **PARTIAL** — scope fixed, evaluation target wrong |
| 2 | Canary | **PARTIAL** — canary gone, replacement has the same flaw at project scope |
| 3 | Denominator boundaries | **PARTIAL** — empty scope, fixed criteria inventory and missing-row blocking all sound; globs still trusted, `surfaces.json` still optional, exemptions still global across all invariants |
| 4 | Mechanism-on-path | **PARTIAL** — comments and same-line routes closed; `if (false) authorize();` and `const note = 'authorize'` still satisfy the marker |
| 5 | Warning suppression | **PARTIAL** — the exact plant blocks; chained `router.route('/x').get(…)` is a candidate, and dynamic detection still needs a receiver proven by a literal route |
| 6 | Surface identity | **PARTIAL** — cross-file fixed; two routers in **one file** on the same path still collapse, and the guarded one erases the leaking one |
| 7 | False positives | **PARTIAL** — comments, `.test.*`, `.on()`, `public.users` all fixed; a route inside a string literal, `cache.get('/literal')`, and `"public"."users"` remain |
| 8 | Decisions gate | **PARTIAL** — three plants fixed; `revisit 9999-99-99` passes because `Date.parse` returns NaN and the guard only acts on a parsed past date, and `TBD` is an acceptable answer |
| 9 | Predicate review | **PARTIAL** — empty watch set fixed; deleting the *newest* watched file lowers `current` and revalidates a stale attestation |
| 10 | Demonstration evidence | **PARTIAL** — surface binding added and coverage required; a hand-written record with copied surface IDs still passes, and `requires_positive_control: false` is still rejected because the denial-only guard runs before the flag |

Plus one new defect from the repair round: the **Flask reader drops methods** —
`methods=['GET','POST']` yields only GET, silently removing a write from INV-3's audit scope.

Found independently by my own probing while the review ran, same shape: a **regex literal**
containing escaped slashes blanked the rest of its line, hiding a guard call after a URL
pattern (fixed, plant added); and an **all-dynamic route file alongside a literal one** is
only a non-blocking candidate.

## What four rounds have established

This is the fourth external round across two plugins, and every one has found the same
shape in my work: **a fix that closes the named case and opens a neighbouring one.**

- Trailhead pass 1 → 3 repair-introduced defects.
- Trailhead pass 2 → the comment-context fix disabled four directive families.
- Security pass 1 → the store enumerator was never consumed.
- Security pass 2 → the store fix reads the wrong file; the canary replacement repeats the
  canary's flaw.

At some point the recurrence stops being a discipline problem and starts being evidence
about the substrate. **Regex pattern-matching over arbitrary source has an unbounded
neighbour space.** Every fix is a patch on an approximation, and Codex's remedies say so
directly and repeatedly: *"AST-aware route extraction," "syntax-aware matching that requires
a call expression," "a SQL identifier parser," "generated evidence with commit hash and CI
provenance."* Those are not patches. They are a different implementation.

**The design is sound and the implementation strategy is not.** Invariants with enumerated
denominators, three non-collapsing verdicts, ratcheted identities, `indeterminate` as a
first-class state — none of that is what keeps failing. What keeps failing is *reading the
code with regular expressions*.

## Recommendation: do not run a third repair round

It would close these eleven and produce more neighbours, and the next review would say the
same thing. The options that actually change the outcome:

1. **Consume the application's own route table** instead of pattern-matching source —
   `fastify.printRoutes()`, `rails routes`, `django-admin show_urls`, an OpenAPI document,
   or the test suite's own registry. The framework already parsed the code correctly; the
   denominator problem largely dissolves. This is the strongest option and it is a 0.2.0
   redesign, not a repair.
2. **AST parsing** for the languages claimed, which means a dependency or a hand-rolled
   parser, against the zero-dependency constraint.
3. **Narrow the claim to what regex can hold** — ship as advisory, not a gate, and say so
   everywhere. Cheapest, and it gives up the thing that made the design interesting.

My recommendation is (1), and until then the plugin should not be registered as shippable.
The register, the decisions gate, the three-part verdict and the ratchet are all worth
keeping — they are downstream of a denominator, and it is the denominator that needs a
different source.

## Raw

`~/Projects/_scratch/kenzie-blind-reviews/security/VERDICT-pass2.md` (15,218 bytes), with
`PASS-2-PROMPT.md` and the staged copy beside it.
