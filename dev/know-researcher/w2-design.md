# W2 design — saturation → the stop decision (Seam 1)

The most-felt gap: on a live run the agent stalls. `cross-ref` computes saturation,
`check-gaps` owns the stop, and the two never meet — so a phase whose evidence has stopped
improving keeps getting sent back to collect more of it.

Written 2026-08-09, before implementation, per the plan's "design before build" rule.
Grounding: `~/.claude/plans/shimmying-sauteeing-storm.md` § W2, and the Codex correction
recorded there.

## The seam, precisely

Two skills compute two different things and only one of them can act.

**`cross-ref` step 7 — saturation.** Per phase question, over independent origin clusters:
confirmatory ÷ total findings. Saturated at ≥80%, under-covered at <40%, plus a ≥75%
aggregate phase advisory. Written to `cross-reference.md` § Saturation Summary, regenerated
every run, deliberately non-sticky. Guardrail 8: *"Saturation signals are informational, not
blocking."*

**`check-gaps` steps 6–8 — adequacy, and the stop.** Per phase question, over independent
**Direct** source count: Complete / Partial / Not Started / Evidence Against / Addressed but
unbalanced. Step 8 reconciles the cycle to the verdict, and that reconciliation *is* the stop
decision — it owns the `Collect` box and nothing else marks it done.

**`check-gaps` never reads the saturation summary.** Not "reads it and down-weights it" —
never opens the file.

### What that produces

The two questions are genuinely different:

- **Adequacy:** is there enough here to write from? (a fact about the corpus)
- **Saturation:** is collecting more going to change that? (a fact about the yield curve)

So a question can be **saturated and inadequate at the same time** — one independent Direct
source, and three runs of discovery that returned nothing new. Today:

1. `check-gaps` sees Partial/Lopsided → "gaps remain" → uncheck `Collect`, `Cycle step` back
   to `Collect (1 of 5)`, `Next Action` = `/know-research:discover`.
2. Discovery returns echoes of what's already there.
3. `cross-ref` says "saturated — additional sources unlikely to shift this question."
4. `check-gaps` says "gaps remain." Go to 1.

Nothing errors. Every skill does its job correctly. **The loop is the bug**, and it is
invisible to every gate we have, because at each individual step the state is well-formed.

The escape exists — step 7b accepted gaps, and the coverage guide's "not found via the mapped
discovery channels after actual searching" — but nothing *routes* to it. Acceptance is only
reachable if the commissioner spontaneously volunteers it. The agent can never propose the
one move that ends the loop.

## The design: a precedence contract, not a merge

**Do not merge saturation and adequacy** (the Codex correction). Merging fails in both
directions, and one of them is catastrophic:

- *Saturation promotes to adequate* → a lopsided single-origin question gets written up
  because nobody new showed up. That is the engine-corpus failure exactly: a project that
  closed with its own completion criteria unmet, gates green.
- *Inadequacy suppresses saturation* → the current stall.

Precedence, stated as two rules that never overlap:

> **Adequacy governs the stop.** Saturation never promotes a question to adequate, never
> checks the `Collect` box, never advances `Cycle step`.
>
> **Saturation governs the route** — but only inside the "gaps remain" branch, where it
> decides whether "go collect more" is honest advice or a treadmill.

### The 2×2, and the one cell that is new

| | **Adequate** | **Inadequate** |
|---|---|---|
| **Not saturated** | → synthesis (saturation is moot; you have enough) | → collect more. The normal loop, and it is working. |
| **Saturated** | → synthesis | **→ the decision point.** Collecting has stopped paying and the evidence still isn't enough. |

The bottom-right cell is the whole workstream. It is not a route the agent may take. It is a
decision only the commissioner can make, and the skill's job is to *reach* it, name it, and
stop — instead of quietly re-entering the loop.

### What the skill offers in that cell (enumerated, not summarized)

Three legitimate outcomes. The turn presents all three; the multi-part-route lesson from
iteration-23 applies — a route that isn't enumerated collapses into "this is stuck."

1. **Accept the gap.** Proceed to synthesis carrying the limitation into the draft's
   Methodology & Limitations. This is the existing 7b route with a `acceptance` ledger entry —
   now reachable by computation rather than only by volunteer.
2. **Change the question.** A question that available evidence cannot answer may be the wrong
   question. Re-scope it in `research-plan.md`.
3. **Change the channels.** Saturation is computed over the channels we *mapped*. An unmapped
   one — paywalled, offline, an expert conversation, a primary-data request — may still yield.

Option 3 is also the standing honesty limit: **saturation is a claim about where we looked,
never about what exists.** Whenever saturation is used to justify stopping, that sentence is
part of the offer. Without it, "saturated" quietly becomes "exhausted," which is the
nonexistence overclaim (F5) wearing a statistic.

### Evidence Against outranks the whole 2×2

A question with active counter-evidence and no supporting sources is inadequate and *not
collection-remediable*, whatever its saturation reads. Its remedy is a synthesis obligation:
the draft must address the contradiction. It never routes to accept-or-collect. Pinned by the
`adv-evidence-against-routing` golden, which landed first precisely so this routing work
could not be built over the top of it.

## Mechanism

### M1 — a saturation record `check-gaps` can actually read

`cross-ref` writes its per-question saturation verdict to a small machine-readable record
alongside the prose summary. `check-gaps` reads it. (See Fork 1 for file-vs-prose.)

**Staleness is a first-class state, not a missing value.** STATE carries `Last cross-reference`
and `Sources since last cross-reference`. If sources have been processed since the record was
written, saturation is **stale** and must be treated as *unavailable* — never as data. Absent
(cross-ref never ran) is the same: the route defaults to collect, which is today's behavior,
and the turn says the saturation read wasn't available rather than implying one was consulted.

Normal cycle order makes this rare — Connect precedes Assess — which is exactly why it will
be untested unless a scenario seeds it.

### M2 — `check-gaps` step 8 gets the states it currently cannot express

Step 8 reconciles two branches. The stall needs four:

| Verdict | `Cycle step` | Boxes | `Next Action` |
|---|---|---|---|
| Coverage adequate | `Synthesize (4 of 5)` | Collect, Connect, Assess checked | `/know-research:summarize-section` |
| Gaps remain, collection viable | `Collect (1 of 5)` | Collect, **Connect**, Assess unchecked | `/know-research:discover` |
| Gaps remain, commissioner accepted | `Synthesize (4 of 5)` | Collect, Connect, Assess checked | `/know-research:summarize-section` |
| **Gaps remain, collection exhausted, undecided** | `Assess (3 of 5)` | Assess unchecked | the decision, named |

The fourth row is the state that has nowhere to live today, which is why the loop closes
instead of stopping.

**The rollback also unchecks `Connect`** — a change from the current text, and a real defect
fix. `Connect` means "cross-ref run, `cross-reference.md` current." Sending the phase back to
gather more sources makes it not current. The present instruction unchecks `Collect` and
`Assess` and forgets `Connect`, which is one of the three drift patterns the new
`state_cycle_coherent` gate found across iterations 20–22 (13 of 41 captures).

### M3 — the contract binds both surfaces, symmetrically

The iteration-22/23 lesson, applied at authoring time rather than after two failed rounds:
**emphasis functions as exclusion.** A contract covering the turn and the artifact must state
both, symmetrically, or the un-emphasized one is neglected. So the routing verdict is written
into `gaps.md` **and** carried in the user-facing turn, each stated in full, neither described
as "not just" the other.

And the stall condition is phrased **positively** — "this question is saturated and its
independent Direct coverage is below the bar" — never as a conditional over a possibly-empty
set. The iteration-21 preflight cleared a criterion as vacuously true and fell through to a
branch that legitimately writes completion; the same shape is available here.

## Author forks — all three resolved 2026-08-09 (Kelsey took the recommendation on each)

**Fork 1 — where the saturation verdict lives.**
(a) `check-gaps` parses the Saturation Summary out of `cross-reference.md`. No new file.
(b) `cross-ref` also writes `research/reference/saturation.json`; `check-gaps` reads that.
*Recommendation: (b).* `cross-reference.md` is regenerated wholesale every run as a human
working view, and prose parsing across a regeneration boundary is exactly the kind of coupling
that breaks silently. The corpus already carries machine-readable side records
(`canonical-figures.json`, `claim-graph.json`) and this is the same shape. Cost: one more file
in the corpus the W7 review will see.

**Fork 2 — posture in the decision cell: ask, or recommend then stop.**
(a) Present the three options neutrally and stop.
(b) Name the option the evidence favors, give the reason, then stop.
*Recommendation: (b).* The posture doctrine leads with the read and grades it; a neutral menu
on a question the agent has just analysed reads as abdication. The decision stays the
commissioner's either way.

**Fork 3 — does an undecided stall block synthesis?**
`summarize-section`'s pre-checks currently block on unresolved **core contradictions** only.
(a) Add the undecided stall as a fourth pre-check block.
(b) Leave it advisory; the commissioner can draft anyway.
*Recommendation: (a).* It is the same shape as an unresolved contradiction — a decision the
corpus needs and does not have — and blocking is the mechanism that stops a not-ready phase
from closing, which is the whole W6/W7 thesis. (b) makes the new state cosmetic.

**Not a fork, recorded as a decision:** the stall is computed **per question**; the phase
advances only when every question is resolved (adequate, accepted, or Evidence-Against
acknowledged). Coverage is per-question, not per-phase — the coverage guide is explicit.

**Not a fork, recorded as a decision:** the undecided stall is **not** durable state. It
recomputes every run, exactly like the saturation advisories it depends on (non-sticky, fire
every run). Only the *resolution* — an acceptance — is ledgered. A commissioner who ignores
the question has not made a decision, and nothing should record one.

## Touches

- `know-researcher/skills/research-cross-ref/SKILL.md` — step 7 also emits the machine-readable
  verdict (Fork 1). Guardrail 8 stands: saturation still does not block; it now routes.
- `know-researcher/skills/research-check-gaps/SKILL.md` — read the saturation record; the 2×2
  precedence; step 8's four states; the `Connect` rollback fix; the three enumerated options.
- `know-researcher/skills/research-summarize-section/SKILL.md` — pre-check (Fork 3).
- `know-researcher/reference/coverage-assessment-guide.md` — "When to Accept Gaps" gains the
  computed route in.
- `know-researcher/reference/templates/decision-ledger.md` — confirm the `acceptance` class
  grammar covers a saturation-sourced acceptance.
- `dev/know-researcher/MAINTAINERS.md` — Layer 2 ownership rows + Layer 4 judgment map, in the same
  change (plan rule 1). Seam 1 in Layer 8.

## Verification

- New goldens: the stall cell reached and named; the saturation-stale path; acceptance
  routing through to synthesis with the limitation in M&L; and a negative — saturated **and**
  adequate must not be reported as a stall.
- `adv-evidence-against-routing` must stay green: the new routing must not swallow it.
- `state_cycle_coherent` must go green on the check-gaps rollback path, which it currently
  fails.
