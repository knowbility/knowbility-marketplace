# security — Codex pass-1 (blind), 2026-07-26

Reviewer: Codex CLI 0.144.6, `model_reasoning_effort=high`, cold read of a clean-room copy
with `AGENTS.md`, `CHANGELOG.md`, `reference/adversarial-list.md`, and
`reference/honest-limits.md` stripped. The last two were removed deliberately: handing a
pass-1 reviewer my own threat model anchors it to my list, and the value is the routes I
did not think of.

**Verdict, and it is correct:**

> "Not trustworthy as a security gate. The core claim is false. Most seriously, stores are
> counted but never checked, and several one-line changes or ordinary framework idioms
> shrink the denominator without a structural failure."

13 findings, 5 critical. This is a materially worse result than trailhead's pass 1, and
**two of the findings invalidate things I described to Kelsey as strengths.**

## The two that matter

### INV-4 never evaluates a store — the check I called strongest is inert

`check.mjs` scopes every invariant with `inScope(inv, fresh.surfaces, exempt)`. Stores are
never passed in. INV-4 declares `applies_to.kinds: ["store"]`; the enumerator emits
`kind: 'table'`. Its scope is empty on every run, always.

I told Kelsey deletion reachability was "the strongest mechanical check in the plugin —
stores are fully enumerable." The enumeration is real and correct; **nothing consumes it.**
34 stores were found in genesis-wiki and zero were ever checked against a deletion path.

An empty-scope fix landed shortly before the verdict, so this now reports `indeterminate`
rather than a false green — but that converts a lie into an honest silence, it does not
make the check work.

### The canary is theater, and the documentation makes it worse

The canary is hard-coded `fastify.get('/__security_canary__', …)` that the enumerator is
*forced* to scan outside the configured globs. It establishes that the enumerator can parse
the exact syntax it ships itself — which is guaranteed, since I wrote both.

Reproduced: a Flask project with one real route and the canary present enumerates **only
the canary**, with zero `unrecognized` and zero `unmapped_candidates`. The real endpoint is
invisible and nothing says so.

The canary README claims it is "the only mechanism that catches a blind enumerator in your
stack rather than in our fixtures." It does the opposite — it manufactures the assurance it
was supposed to provide. And the README documents an exemption path that removes it from
every invariant while its raw presence keeps the zero-surface check from firing.

**A canary written in the language the scanner already handles is not a canary.**

## Triage

| # | Finding | Verdict |
|---|---|---|
| 1 | INV-4 never evaluates a store | **CONFIRMED** (reproduced) — the deletion invariant is entirely inert |
| 2 | The canary tests the scanner's own regex, not the stack | **CONFIRMED** (reproduced with Flask) |
| 3 | Denominator boundaries mutable and unvalidated — `criteria: {}` reports "0 uncovered" | **CONFIRMED** (reproduced). A direct Law 3 violation by my own code |
| 4 | "Mechanism on path" is a token in a line slice — a comment `// authorize` passes; two routes on one line share a marker | **CONFIRMED**. Documented as an approximation, but "a comment counts" is worse than approximate |
| 5 | `if (count > 0) continue;` — one recognized route suppresses every blind-spot warning for that file | **CONFIRMED**. Mixed-idiom files are exactly where misses happen |
| 6 | Surface identity `http:METHOD /path` collapses distinct endpoints behind different mount prefixes | **CONFIRMED** |
| 7 | False positives — `CREATE TABLE public.users` → `table:public`; comments count as routes; `.on('event',…)` counts as a job | **CONFIRMED** |
| 8 | Decisions gate: `DECIDED` with an empty answer passes; `deliverable:N` can never fire | **CONFIRMED** — I dropped the deliverable resolution when adapting from trailhead |
| 9 | Predicate review with an empty watch set gives `current = 0`, so any positive timestamp passes; deleting watched files keeps it valid | **CONFIRMED** |
| 10 | Demonstration evidence unauthenticated; `requires_positive_control` ignored | **PARTIALLY FIXED before the verdict** — evidence must now name scoped surfaces. Provenance and the ignored flag remain |
| 11 | `--quiet` writes two files while the audit skill calls it "read-only"; quiet mode returns no per-invariant rows | **CONFIRMED** on both counts |
| 11b | `honest-limits.md` does not exist | **REFUTED — staging artifact.** I stripped it from the review copy |
| 12 | The reviewer agent is told to run the gate but has no `Bash` | **CONFIRMED** |
| 13 | CC7.2 mapped `covered` by an emission invariant, when the criterion is about monitoring and analysis | **CONFIRMED**. The source document itself says "monitoring infrastructure is ENG; emitting the events is PRODUCT" — mapping emission to the whole criterion is the laundering the register exists to avoid |

Two findings were already closed by fixes that landed between staging and the verdict: the
empty-scope pass (an invariant scoped to nothing reported "1/1 invariants hold") and
unbound demonstration evidence. Both were found by my own probing while the review ran, and
both have plants.

## The pattern, again

Third review across two plugins, and the same shape: **every mechanism was verified against
the case I imagined and not against its neighbours.** The plants prove the checker catches
Fastify routes because the plants are Fastify routes. The canary proves the enumerator
reads its own syntax. The store enumerator was tested for correct output and never for
whether anything consumed it.

The specific lesson worth carrying into the repair round: **a fixture written in the same
idiom as the implementation cannot detect the implementation's blind spot.** The plant
suite needs at least one non-JavaScript stack, and the canary needs to be generated in the
project's own language or dropped as false assurance.

## Repair round — finding → fix location

All 13 addressed. Locations only, for a pass-2 re-attack.

| # | Fix |
|---|---|
| 1 | `check.mjs` — `everything = [...surfaces, ...stores]` into `inScope`; stores emit `kind: 'store'` |
| 2 | **Canary deleted.** `enumerate.mjs` — `FRAMEWORKS` table + `detectFrameworks()`; an unreadable framework blocks |
| 3 | `check.mjs` — hard-coded `PRODUCT_CRITERIA`; a missing row is a finding; `partial` is a state |
| 4 | `check.mjs` — `markerOnPath` slices by char offset; `lib/scan.mjs` — `stripComments()` preserving offsets |
| 5 | `enumerate.mjs` — `dynamicRoutesOn()`, run on every file, scoped to receivers proven to be routers |
| 6 | `enumerate.mjs` — surface id includes the file |
| 7 | comment stripping; schema-qualified table capture; `.on()` dropped from `JOB_PATTERNS` |
| 8 | `check-decisions.mjs` — empty-answer `DECIDED` fails, expired deferral reopens, `deliverable:N` rejected |
| 9 | `check.mjs` — empty or non-matching watch set is `unattested` |
| 10 | `check.mjs` — evidence must name scoped surfaces; `requires_positive_control` honored |
| 11 | `check.mjs` — `--json` writes nothing and returns `rows`/`criteria`/`denominator`; audit skill uses it |
| 12 | `security-reviewer.md` — `Bash` added for the read-only commands; credential rule reworded to be followable |
| 13 | `register.json.tmpl` — CC7.2, CC6.3, C1.1, C1.2, P4.3 moved to `partial` with reasons |

**Two defects the repair round introduced, both caught by re-running against a real
codebase rather than the fixtures:**

1. The entry-point guard `import.meta.url === \`file://${process.argv[1]}\`` fails on any
   symlinked path — on macOS `/var` → `/private/var` — so the CLI **silently did nothing and
   exited 0**. For a gate that is the worst available failure mode. Now compares through
   `realpathSync`.
2. The F5 dynamic-route detector flagged every `Map.get(key)` and `cache.get(id)` in the
   codebase — twelve files, none of them routers. That is the same false positive the
   literal-path requirement exists to prevent, reintroduced one layer up while fixing
   something else. Scoping it to receivers already proven to be routers in that same file
   took it back to zero.

The second one is *fix the family, not the instance* failing twice in the same session, on
the same pattern. It is now the first editing caution in the plugin's `AGENTS.md`.

**Plants: 17 → 29**, including a Flask fixture and a Django one, because the reason the
canary failed is that everything testing it was written in the idiom it could already read.

## Raw

`~/Projects/_scratch/kenzie-blind-reviews/security/VERDICT-raw.md` (26,480 bytes), with
`PROMPT.md` and the staged copy beside it.
