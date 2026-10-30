# W4 design — disconfirmation as a standing habit (Seam 4)

The plugin asks "what would show this is wrong?" in two places and acts on the answer in
neither. Written 2026-08-24, before implementation, per the plan's "design before build" rule.
Grounding: `~/.claude/plans/shimmying-sauteeing-storm.md` § W4, and the current state of
`summarize-section` pre-check 5, `start-phase` step 5a, and `assumptions.md`.

## First, a correction to the plan entry

The plan says `assumptions.md`'s "what would challenge this?" **isn't wired into a live loop.**
That is not quite right, and the difference changes the build.

It *is* read. `research-start-phase` step 5a reads `assumptions.md`, finds Open assumptions
whose "What would validate" or "What would challenge" criteria the new phase's questions could
resolve, and surfaces them — with a failure-mode row and a guardrail forbidding a silent skip.
So the loop opens.

**What is missing is the close.** Nothing ever records that a challenge criterion *was tested*
and what happened. start-phase asks "could this phase resolve it"; no step afterwards says "it
did, and here is the outcome." An assumption can stay `Open` from the phase that logged it
through to the project's final deliverable, with its falsification criterion written down,
noticed at every phase start, and never once run.

That is a different defect from "nothing reads it", and it has the same shape as the accepted-gap
problem W2 closed: **a state with no route out.** W2's fix was to give the state a real route and
a real terminus. W4's is the same move applied to an assumption's challenge criterion.

## The second half: the gate covers 2 of 11 types

`summarize-section` pre-check 5 — the counter-evidence gate — is scoped
**"PRD Validation and Exploratory Thesis only."** It works by looking for a source note tagged
`CHALLENGED` or `CONTRADICTED`, and those two tags exist only in those two type templates'
finding-tag sets. So the gate is coupled to a *tag*, and the tag is coupled to a *type*.

Nine of eleven research types therefore have no disconfirmation requirement of any kind. A
Competitive Analysis, a Market/Industry study, a Person Research project can each reach a
promoted deliverable without anything ever having asked whether the central claim could be wrong.

**That coupling is the defect, and v1.9.0 already named the principle it violates.** That release
demoted research type to "internal routing metadata, not a classification task imposed on the
user." A discipline gated on a tag set is gated on routing metadata. Disconfirmation is not a
property of a research type — every type has load-bearing claims that could be false.

## The finding that shapes the build — for the third time, the check exists one tier up

The corpus reviewer already carries this as **C5 Falsifiability**: *"Does the recommendation name
what evidence would show it WRONG, and can some planned measurement produce that evidence? FAIL
if no planned measurement could refute the core recommendation."*

That is W4's question, at the corpus, at the end, once. So W4 is the Tier-1 prevention layer for
C5 — the same relationship W3 has to C2/C14, and W6a/b to the closeout classes. **Third instance
of this pattern**, which is now worth stating as a program-level fact rather than a per-workstream
surprise: *the corpus reviewer was written by looking at a real failed project, so it enumerates
the failure classes accurately. The in-line layer keeps discovering that its work is prevention
for a check that already exists.*

The same constraint follows as in W3: **use C5's framing, not a parallel one.** C5 asks two
things — is the refuting evidence *named*, and could some *planned measurement* produce it. Both
halves matter, and a Tier-1 layer that only asks the first leaves C5 unable to confirm the second.

## Mechanism

### M1 — the counter-evidence gate keys on the claim, not the type

Replace the type scope with a claim scope. Any draft carrying a **load-bearing claim** — the same
bar B16 uses, a statement a reader would act on — must show one of three things for it, and the
third is the existing exit:

1. a credible source that disputes it (whatever tag the project's set happens to use, or none);
2. a documented adverse search that came back empty (pre-check 5's existing exit, unchanged);
3. an explicit statement that the claim is not disconfirmable by available evidence, and why.

The third is new and it is the honest option the current gate lacks. Some claims genuinely cannot
be refuted by the mapped channels; saying so is a real result, and it is what stops the gate
becoming a ritual people route around.

The two typed gates are **absorbed, not kept alongside** — leaving them would mean two gates
asking one question with different scopes, and the narrower one would be the one people learn.

### M2 — an assumption's challenge criterion gets an outcome

`assumptions.md` entries already carry "What would challenge this." Add a recorded disposition,
written by whichever step tests it:

- **`tested — held`** — the challenge was run and the assumption survived. Name what was run.
- **`tested — broke`** — the assumption failed. This is the valuable one; it must propagate to
  anything resting on the assumption, which is a `correction` in the decision ledger.
- **`untestable via mapped channels`** — with what would have been needed.
- **`open`** — still the default, and now meaningfully different from the three above.

`start-phase` step 5a already finds the relevant ones; it now also reports how many have sat
`open` across how many phases, because an assumption open for four phases is a different fact
from one logged last week.

### M3 — a closeout check, not a new battery item

At final close, the criteria preflight (W6a) already walks the project's own completion criteria.
It gains one question: **does any load-bearing conclusion rest on an assumption still `open`?**
If so, name them. Not a block — the commissioner may legitimately ship on an untested assumption
— but an undisclosed one is the failure C5 catches at Tier 2 and this prevents at Tier 1.

## Author forks

**Fork 1 — what triggers the requirement.**
(a) Every load-bearing claim (B16's bar).
(b) The phase's central claim only.
(c) Only claims that carry a `single source suggests` flag.
*Recommendation: (b) for this release.* (a) is the principled answer and it is also a per-claim
obligation on every draft in every type — a large behavioral change to ship untested. The phase's
central claim is where the engine-corpus failure actually lived, it is one claim per phase, and
it makes the gate's cost legible. Widening to (a) is a later, smaller step once (b) has run.

**Fork 2 — do the two typed gates survive?**
(a) Absorb them: one gate, claim-scoped, all types.
(b) Keep them as a stricter overlay for the two types that have disconfirming tags.
*Recommendation: (a).* Two gates asking one question with different scopes is how a project ends
up satisfying the narrow one and believing it is done.

**Fork 3 — does an `open` assumption under a load-bearing conclusion block promotion?**
(a) Block, like an unresolved core contradiction.
(b) Disclose in Methodology & Limitations and at closeout; never block.
*Recommendation: (b).* An untested assumption is a legitimate thing to ship on — researchers do
it constantly and knowingly. What is not legitimate is shipping on one silently. Blocking here
would also make M2's honest `untestable` disposition feel like a punishment, which is how a
disposition stops being used honestly.

**Fork 4 — where the disconfirmation record lives.**
(a) `assumptions.md`, extending what is there.
(b) A new `disconfirmation.md`.
*Recommendation: (a).* `assumptions.md` already holds the criterion; splitting the criterion from
its outcome across two files is the exact shape that made the saturation record unreadable to
`check-gaps` before W2 wired it. One file, one record.

## Author forks — DECIDED 2026-08-24

Recorded as decisions of record. The fork text above is left intact; where a decision departs from
the recommendation written with it, the reason is stated.

### Fork 1 — what triggers the requirement → **(a) every load-bearing claim**, with a phase-level record

**This reverses the original recommendation of (b), the phase's central claim only.** Two reasons the
first pass under-weighted:

1. **(b) introduces a selection judgment nothing else in the plugin makes.** There is no existing
   definition of "the phase's central claim", so the gate would have to invent one — and a run that
   picks a convenient central claim satisfies the gate cheaply. (a) reuses **B16's load-bearing bar**,
   which is already written, already applied per claim at audit, and already verified in production.
   Adding a check is cheaper than adding a concept.
2. **The narrow-scope trap is the same one Fork 2 rejects.** Fork 2's reasoning is that a narrow gate
   beside a wide question is how a project satisfies the narrow one and believes it is done. Choosing
   a deliberately narrow trigger invites that from the other direction — "the central claim cleared
   disconfirmation" reads as "the phase cleared disconfirmation."

**The cost objection was the real content of (b), and it is answered by the record's shape rather
than by the trigger's scope.** A per-claim obligation reads as expensive because it sounds like one
adverse search per claim. It is not: M1's outcome 2 is a *documented adverse search*, and one search
against the phase's subject can legitimately discharge several claims at once. So the requirement is
per load-bearing claim; the **record** is a phase-level pass that lists each load-bearing claim and
its disposition, with a shared search record where one genuinely covers several.

That keeps the honest third exit doing its job — a claim not disconfirmable through the mapped
channels is stated as such, per claim, and not hidden inside a phase-level summary.

### Fork 2 — do the two typed gates survive? → **(a) absorb them**

Unchanged, and this session strengthened it. v1.9.0 already demoted research type to internal routing
metadata; a discipline gated on a tag set is gated on routing metadata. Two gates asking one question
with different scopes is how a project satisfies the narrow one and stops.

### Fork 3 — does an `open` assumption block promotion? → **(b) disclose, never block**

Unchanged, and it is now the doctrine rather than a preference. v1.14.0 shipped and verified the
**stop, not block** pattern for the stale-saturation decision: present what is known, give the
routes, recommend, and stop — the phase proceeds the moment the commissioner says so. W4's closeout
question (M3) should be written in that same shape and wording, so the plugin has one way of handing
a decision back rather than three.

Blocking would also make M2's honest `untestable via mapped channels` disposition feel like a
punishment, which is how a disposition stops being used honestly.

### Fork 4 — where the disconfirmation record lives → **(a) `assumptions.md`**

Unchanged, and this session produced direct evidence for it. Both v1.14.0 defects were the same
failure — a fact that reached the conversation and not the durable record. Splitting a criterion from
its outcome across two files is that failure with extra steps: the next reader opens one file and
sees a challenge criterion with no result, or a result with no criterion. One file, one record.

## Touches

- `know-researcher/skills/research-summarize-section/SKILL.md` — pre-check 5 rescoped (M1), the
  assumption disposition (M2).
- `know-researcher/skills/research-start-phase/SKILL.md` — step 5a reports open-assumption age (M2).
- `know-researcher/skills/research-audit-claims/SKILL.md` — the closeout question (M3).
- `know-researcher/reference/templates/types/*.md` — the two disconfirming tags stay as tags; they stop
  being the gate's trigger.
- `know-researcher/reference/corpus-review-brief.md` — C5 gains a line noting a Tier-1 record may now
  exist, to be checked rather than trusted (the C14 pattern). No protocol version change.
- `dev/know-researcher/MAINTAINERS.md` — Seam 4 (Layer 8) + the disconfirmation row in Layer 4, same
  change (plan rule 1).

## Verification

- A golden per type outside the original two — the gate must fire on a Competitive Analysis draft,
  which today it never would.
- The honest third exit: a claim genuinely not disconfirmable via mapped channels, stated as such,
  must pass. A gate with no honest exit gets routed around.
- A negative control: a draft whose central claim already carries a disputing source passes
  untouched.
- `tested — broke` propagating to a `correction` ledger entry.
- `adv-counter-evidence-valve` must stay green: its documented-search exit is unchanged, and
  rescoping the trigger must not disturb the exit.
