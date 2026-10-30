# W5 design — quantitative reasoning at the note, not the draft

Written 2026-08-24 after Kelsey settled the fork. Grounding:
`~/.claude/plans/shimmying-sauteeing-storm.md` § W5, `reference/source-assessment-guide.md` §2 and
§4, the figure record W1 added to `research-process-source`, and the integrity agent's current scope.

## The fork is settled: (b), and the family question with it

**Decision of record (Kelsey, 2026-08-24): strengthen the note schema and the integrity agent. No
data-analyst specialist.** And the standing family question the plan parked here — *do significance
and disconfirmation become independent agents, or stay inline?* — is answered **inline, unless a
seam proves otherwise.**

Two proofs now stand behind that:

- **W4 shipped disconfirmation inline** and it holds at 3/3 across three scenarios, including a run
  refusing a false challenger with the material in hand. Disconfirmation is at least as
  judgment-heavy as sample assessment, and it did not need a role.
- **Codex's recorded advice**: new agents are premature — wire integrity where `init` already
  promises it runs, first.

The argument for a specialist is not dead; it is **deferred with a condition**. If the note fields
exist and inline assessment still misses things that matter, that is evidence, and evidence is what
should buy a new role. Adding one first would have meant never learning whether it was needed.

## The actual defect is positional, not analytical

`source-assessment-guide.md` already carries the criteria — §2 Methodology Quality (sample selection,
size, collection method, limitations; the red flags for undisclosed sample and proprietary method)
and §4 Sample Size and Representativeness, which explicitly says to **flag extrapolation** when a
source applies a finding beyond its sample.

Those criteria are read **at assessment time and then dropped**. They shape a credibility tier and
nothing else survives into the note. Meanwhile the integrity agent runs on the **draft**, the plan,
and the digest — never on notes. So by the time anything examines a number's basis, the number is
prose in a draft and its sample is three steps upstream.

**Nothing is failing because no reader is capable enough. It is failing because the check runs after
the material it would check has already been discarded.** That is why a new agent does not fix it: a
specialist reading the same draft has the same problem.

## Mechanism

### M1 — the figure record gains two fields

W1 already put a per-figure block in every note — `figure` / `measures` / `not` / `locator` /
`verbatim` — and it is the right structure. **Extend it; do not build a parallel quantitative
block.** Two fields that can disagree about the same figure is the trap that produced the retired
`claim_graph_source_count` gate and the near-miss on `assumptions.md`'s `Status`.

```markdown
- **figure:** 60–70%
  **measures:** share of surveyed mid-market SaaS teams reporting any reduction in time-to-value
  **not:** the size of the reduction
  **basis:** n=212 self-selected survey respondents, vendor-run, fielded 2026-03
  **carries-to:** the surveyed population only — the source does not generalise it
  **locator:** §3, "Adoption Outcomes" table, row 2
  **verbatim:** "60–70% of mid-market SaaS teams report that onboarding automation reduced time-to-value"
```

- **`basis`** — what the number was computed from: sample size, how selected, who ran it, when
  fielded. **When the source does not say, the field records that**, in the guide's own words:
  "undisclosed sample size", "proprietary methodology, no detail". An absent basis is a finding, and
  writing "unknown" is how it survives to be one.
- **`carries-to`** — the population the figure supports a claim about, **which is not always the
  population it was measured on.** §4's extrapolation flag becomes this field. Where the source
  itself generalises, `carries-to` records the source's leap *and that the source made it*; where it
  does not, `carries-to` is the sample and any later draft that widens it has drifted.

**`basis` and `carries-to` are per figure, not per source.** A single source routinely carries a
well-founded headline number and a throwaway aside computed from nothing.

### M2 — integrity runs on notes, which is what init already promises

The integrity agent gains a note-level pass, invoked from `research-process-source` after the note is
written. It checks what a script cannot: whether `measures` and `carries-to` are consistent, whether
a `basis` of "unknown" is paired with a figure the note treats as solid, and whether the note's own
prose widens a figure past its `carries-to`.

**This is the promise `init` already makes.** The scaffolding tells a new project the integrity agent
verifies its material; today that is true of the plan and the draft and false of every note in
between. Closing that is the whole of Codex's advice.

### M3 — the draft inherits the constraint it already half-has

W1 made a draft carry what its note's `measures` says. The same rule now covers `carries-to`: **a
draft may not state a figure about a wider population than its note's `carries-to` records.** This is
one sentence in `research-summarize-section`, not a new check — and it closes the drift class this
session observed three times, where a run kept one half of a compound finding faithfully and shaved
the other.

## Author forks

**Fork 1 — is `basis` required for every figure, or only for figures a draft cites?**
(a) Every figure recorded.
(b) Only figures that reach a draft.
*Recommendation: (a).* The note is written before anyone knows which figures a draft will use, so (b)
is unimplementable at the time the field would be filled. This is the same reasoning that made the
figure record itself per-figure rather than per-citation.

**Fork 2 — what happens when `basis` is unknown and the figure is load-bearing?**
(a) Block the draft, like an unresolved core contradiction.
(b) The draft must carry the unknown basis at the claim site.
*Recommendation: (b).* Sources with undisclosed methodology are ordinary and often the only thing
available; the failure is using one silently. Same stop-not-block reasoning as v1.14.0 and W4, and
the same fail direction: an under-claim is recoverable, a silent over-claim is not.

**Fork 3 — does the note-level integrity pass run on every source, or only quantitative ones?**
(a) Every note.
(b) Only notes carrying figures.
*Recommendation: (b).* A note with no numbers has nothing for this pass to check, and running it
anyway trains everyone to ignore a step that usually says nothing. Cheap trigger: the note has at
least one figure record.

**Fork 4 — does `carries-to` also bind the spoken turn?**
(a) Draft only.
(b) Draft and the user-facing turn, as W1's v1.12.1 did for `measures`.
*Recommendation: (b), and this is not really a fork.* v1.12.1 exists because a run wrote the figure
correctly and then described it to the commissioner in the stronger form. Shipping (a) would rebuild
that exact defect one field over, and this repo has recorded ten times that a rule stated for one
surface does not bind the next.

## Verification

- A note whose source discloses no sample size must record `basis: unknown` — **not omit the field.**
- A draft widening a figure past its `carries-to` must fail, and the finding must name both.
- **The honest case must pass**: a source that itself generalises, recorded as generalising, used at
  that width.
- The spoken turn carries the same constraint (Fork 4), tested the way v1.12.1 tested `measures`.
- A note with no figures must not invoke the integrity pass at all — **and must not say so.**
- Regression: W1's goldens stay green. `basis`/`carries-to` sit in the same block as `measures` and
  must not disturb it.

## Touches
`research-process-source` (two fields, and the note-level integrity invocation) ·
`agents/research-integrity.md` (the note-level pass) · `research-summarize-section` (M3, one
sentence) · `reference/source-assessment-guide.md` (§2 and §4 now feed fields rather than only a
tier) · `dev/know-researcher/MAINTAINERS.md` (Seam 5 in Layer 8, the quantitative-basis row in Layer 4,
and the `notes/` row in Layer 3).
