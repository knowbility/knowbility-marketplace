# W3 design — conclusion exceeds evidence / drifts from the brief (Seam 2)

Synthesis answers "so what does this mean?" and nothing checks whether the evidence licenses the
meaning. Seam 2 is **observed**, not inferred: a finished pricing project produced four separate
instances, and its own gates passed throughout.

Written 2026-08-09, before implementation, per the plan's "design before build" rule.
Grounding: `~/.claude/plans/shimmying-sauteeing-storm.md` § W3, and the engine-corpus review.

## The four observed failures

From a completed project whose STATE said every phase was done:

| What happened | The shape |
|---|---|
| A range became a point ($29) | Unlicensed precision |
| $19 "ruled out" with no affirmative evidence | Absence read as refutation |
| The recommendation departed from leadership's stated frame (defensible range, $20 acceptable) | Drift from the brief |
| A cap asserted as immovable, though the research found it isn't a lever | Constraint asserted, not established |

Every one is a **"so what"** that outran what the corpus bought. None is a citation error, so
nothing in the per-claim battery sees them: B1 traces claims to notes and all four *trace*.

## The finding that shapes this build: the checks already exist, one tier up

W7's corpus-review brief already carries both halves the plan describes as work to invent:

- **C2 Conclusion-vs-brief** — "A range must stay a range unless a recorded decision rule
  converts it; 'ruled out' requires affirmative evidence; departures from commissioner directives
  must be disclosed. FAIL on unlicensed strengthening."
- **C14 Recommendation provenance** — "For each load-bearing 'so what': is it identifiable as
  evidence-supported implication vs analyst inference vs commissioner priority? FAIL where
  analyst inference is dressed as evidence-supported."

Between them they name all four observed failures, and they have been exercised against the
`corpus-a` fixture through eleven eval iterations.

**So W3 is not "design the checks." It is the prevention layer for checks that already exist as
end-of-project review** — the same relationship W6a/b has to W7. That lowers the risk
considerably and imposes one hard constraint:

> **W3 must adopt C2 and C14's vocabulary exactly, not a parallel taxonomy.** C14's failure
> condition is "analyst inference *dressed as* evidence-supported" — which only means anything
> if the writer's label and the reviewer's label are the same three words. Two taxonomies for one
> distinction would make the reviewer's check unrunnable against labelled output, which is worse
> than the unlabelled state it replaces.

The three labels, fixed: **evidence-supported implication**, **analyst inference**,
**commissioner priority**.

## What is genuinely missing

Not the definitions. The **in-line control**: nothing asks the writer to label a "so what" at the
moment of writing it, and nothing at audit checks a label against its evidence. Today the corpus
reviewer has to *infer* each label in order to judge it — it reconstructs the writer's reasoning
from the output, at the end, once. Labelling at write time turns C14 from a discovery into a
confirmation.

The one adjacent thing that exists: `writing-standards.md` says "No orphan claims. If you can't
cite it, flag it as inference or cut it." That is a two-way split (cited / inference) keyed on
whether a citation exists. It does not reach the four observed failures, because all four *are*
cited — the citation just doesn't support the strength.

## Mechanism

### M1 — label each load-bearing "so what" at synthesis

`summarize-section` step 8 currently requires "Every finding answers 'so what does this mean?'"
and nothing more. Each such answer carries one of the three labels, and the label is the writer's
claim about where the statement comes from:

- **evidence-supported implication** — the corpus establishes it. A reader can follow the cited
  notes to the conclusion without adding anything.
- **analyst inference** — reasoning beyond what any source states. Legitimate and often the most
  valuable thing in the report; it just may not present as established.
- **commissioner priority** — it follows from a stated preference, constraint, or directive, not
  from the evidence. Cite the directive.

Not every sentence. **Load-bearing** means: a reader acting on this report would act on this
statement. That is deliberately the same bar C14 applies, so the two agree about what is in
scope.

### M2 — B16, provenance conformance (an audit rule per label)

Per label, at audit:

- **evidence-supported implication** — walk the cited notes. If the chain needs a step no source
  supplies, the label is wrong; the finding is *Implication unsupported* (high). This is the
  check that catches "$19 ruled out" — absence of evidence for $19 cited as evidence against it.
- **analyst inference** — no evidence chain required, but the draft must not also present it with
  established-fact grammar ("the data shows", "this establishes"). Inference wearing evidence's
  clothes is C14's exact failure condition, at Tier 1.
- **commissioner priority** — must cite a real directive: a `directive` entry in
  `decision-ledger.md`, or a recorded resolution. A priority attributed to the commissioner that
  they never stated is the worst of the three, because it launders an analyst choice through
  their authority. *Priority unattributed* (high).

An unlabelled load-bearing "so what" is a finding in itself — not a formatting nit. The label is
what makes the other three checks possible.

### M3 — B17, conclusion-vs-brief

Read the plan's **Core Question** (`research-plan.md`, and the `Research Subject` line above it)
plus every `directive` entry in `decision-ledger.md`. Then ask the two questions C2 asks:

1. **Does the recommendation answer the question that was actually asked?** Not a neighbouring
   question that the evidence happened to answer more cleanly. Drift is reported as drift —
   naming the commissioned question and the question actually answered — never silently.
2. **Is it stated at the strength the evidence licenses?** A range stays a range unless a
   recorded decision rule converts it (the W6a criteria machinery already handles recording such
   a rule). "Ruled out" requires affirmative evidence. A constraint asserted as immovable must
   cite what establishes that.

B17 runs at phase close and again at final close, because drift accumulates: each phase can be
individually defensible while the arc moves.

### M4 — the brief needs one canonical location

C2 compares against "the commissioned question and any commissioner reframes recorded in the
corpus." Today the question lives in `research-plan.md` § The Core Question and reframes live in
`decision-ledger.md` as `directive` entries. That is workable and needs no new file — but it must
be *stated*, or B17 will read whichever it finds first. Name both, in that precedence: the plan
is the original commission; a directive supersedes it for whatever it touches.

## Author forks — all four resolved 2026-08-09 (Kelsey took the recommendation on each)

**Fork 1 — where the label lives in the deliverable.**
(a) Inline, in the sentence: "*(analyst inference)*" after the statement.
(b) A per-finding metadata line, the way finding tags already work.
(c) A dedicated `## Provenance` block near Methodology & Limitations.
*Recommendation: (a).* The reader who needs the label most is the one reading the sentence and
deciding whether to act on it — the same argument that made B10's claim-site disclosure carry its
content rather than point at M&L. (c) is the version that gets skimmed past; (b) separates the
label from the claim by exactly the distance that makes it easy to ignore.

**Fork 2 — how much gets labelled.**
(a) Every "so what" in the draft.
(b) Load-bearing ones only — a reader acting on the report would act on this.
*Recommendation: (b),* matching C14's scope so writer and reviewer agree. The risk is that
"load-bearing" is a judgment call and a writer can shrink it to avoid labelling — so B16 checks
the *set*: a recommendation-shaped statement that carries no label is itself the finding.

**Fork 3 — does an unlabelled or mislabelled "so what" block promotion?**
(a) Block, like an unresolved core contradiction.
(b) Fail the audit (which already blocks promotion) but treat a missing label as moderate rather
than high.
*Recommendation: (b).* The audit failing is already the block; severity is the question. A wrong
label is high — it misrepresents where a claim comes from. A *missing* label on a first pass is
moderate, because the writer may simply not have reached the new convention on an older project,
and a moderate finding still fails the draft and still gets fixed.

**Fork 4 — B17's scope on non-final phases.**
(a) Every phase close.
(b) Final close only.
*Recommendation: (a).* Drift accumulates; catching it at the end means rewriting several phases.
But the check is cheaper mid-project — a phase answers a phase question, and the comparison is to
that question plus the arc so far.

## Touches

- `know-researcher/skills/research-summarize-section/SKILL.md` — M1, the labelling requirement.
- `know-researcher/skills/research-audit-claims/SKILL.md` — B16, B17.
- `know-researcher/reference/writing-standards.md` — the two-way cited/inference split becomes the
  three-way one, so one document does not contradict the other.
- `know-researcher/reference/corpus-review-brief.md` — C2 and C14 gain a line noting that labels may
  now be present, and that a present label is checked rather than trusted. **No protocol version
  change and no validator change**, so the contract hash is untouched.
- `dev/know-researcher/MAINTAINERS.md` — Seam 2 (Layer 8) + the significance row in Layer 4, same
  change (plan rule 1).

## Verification

- A golden per observed failure: range→point, "ruled out" without affirmative evidence, drift
  from the commissioned question, constraint asserted as immovable.
- A **mislabelling** golden: an analyst inference labelled evidence-supported — C14's exact
  failure condition, now at Tier 1.
- A **negative control**: a correctly labelled draft must pass with no findings. A provenance
  check that fires on honest labelling would teach writers to skip labels.
- `adv-review-corpus-a` must stay green: C2/C14 still fire on an *unlabelled* corpus, since
  every project predating this ships that way.

## Not in W3, and why — two items mis-filed against it

Both of these were queued against W3 as "two documents disagreeing." They are real, and neither
belongs here:

- `research-cross-ref`'s Output template prescribes dashboard vocabulary ("Saturation advisory",
  "0% confirmatory") that `posture-register.md` bans in the turn.
- `research-process-source` line 31 mandates a "counters updated" line that the rubric's
  Register 0-anchor calls machinery narration.

They are **register conflicts**, not significance licensing, and they touch `cross-ref` and
`process-source` — neither of which W3 touches. Bundling them in would widen this change's blast
radius across two more skills for no shared reasoning. They are a standalone cleanup; keep them
that way.
