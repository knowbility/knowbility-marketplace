# W6c / 6e / 6f design — the three remaining recommendation checks

Written 2026-08-24, before implementation, per the plan's design-before-build rule. Grounding:
`~/.claude/plans/shimmying-sauteeing-storm.md` § W6, the corpus reviewer's C4/C5/C6, and the current
state of `research-audit-claims` (closeout + battery) and `research-summarize-section`.

**6d is deliberately not in this document.** See the last section.

## First, a correction to what I told Kelsey earlier

I said 6e was "probably absorbed by W4" and flagged it as worth confirming. **It is not.** W4 asks
whether anyone *looked for evidence against a claim*. C5/6e asks whether **the recommendation names
what would show it wrong, and whether any planned measurement could produce that evidence.** Those
are different questions, and the phrase "would show it wrong" appears nowhere in either skill. W4
built the counter-evidence half and left the self-falsification half untouched.

So this is three items, not two.

## The pattern, now at five instances

Each of these is the Tier-1 layer for a check the corpus reviewer already carries:

| | Tier-1 (this design) | Tier-2 it prevents |
|---|---|---|
| **6c** | one authoritative status picture at closeout | **C4 Status coherence** |
| **6e** | a recommendation names its own refutation at synthesis | **C5 Falsifiability** |
| **6f** | a recommendation's prerequisites are named as unmade | **C6 Prerequisite honesty** |

W6a/b→closeout classes, W3→C2/C14, W4→C5's counter-evidence half, and now these three. **The
constraint that follows is the same one W3 and W4 obeyed and it is not optional: use the C-check's
vocabulary verbatim.** C14 proved why — when the writer's labels and the reviewer's labels are the
same words, Tier 2 reads the record instead of reconstructing it, and a draft using different words
for the same distinction becomes the finding.

## Why all three at once

They share a subject — **the recommendation** — and none of them currently has a home, because the
plugin has no single place where a recommendation is examined as a recommendation. B17 checks the
conclusion against the brief; C2 does the same at Tier 2. Nothing asks the three questions these
checks ask, which are all about whether a recommendation is *actionable and refutable* rather than
whether it is *supported*.

Building them separately would produce three near-identical passes over the same text in three
places. Building them together gives one pass with three questions.

## Mechanism

### M1 — 6e, at synthesis: a recommendation carries its refutation

`research-summarize-section` gains a step, after the counter-evidence gate and before the draft is
written. **Scope: only a draft that makes a recommendation** — a statement that someone should do
something. A descriptive phase output has no recommendation and this is n/a, said once, not
narrated.

For each recommendation, the draft must carry, in the recommendation's own words:

1. **What would show this wrong.** Not "further research may refine this" — a *named observation*
   that, if seen, would mean the recommendation should not be followed.
2. **Whether anything planned could produce that observation.** If the project's own plan, or a
   measurement the recommendation itself proposes, could surface it — say which. **If nothing could,
   say that**, because that is C5's actual FAIL condition and stating it is the honest result.

**The honest exit, same shape as W4's Outcome 3 and for the same reason.** Some recommendations
genuinely cannot be refuted by anything this project could observe — a recommendation to comply with
a regulation is not a falsifiable proposition. Saying so, once, per recommendation, is a real result.
A check with no honest exit becomes a ritual; W4 established that here and it applies unchanged.

**Register constraint, stated in the same breath (the lesson this repo has recorded ten times):**
this reaches the commissioner as part of the recommendation, not as a labelled compliance section.
"We'd drop this if onboarding time doesn't fall below X in the first quarter" is the shape. Never
"Falsifiability: …", never the check's name.

### M2 — 6f, at synthesis: a prerequisite presented as actionable is named

Same step, same scope. For each recommendation, walk what it *depends on*. If it rests on

- a decision nobody has made yet, or
- a dependency that is unbuilt, uncosted, or unscheduled,

then the recommendation says so **at the recommendation**, not in a caveats section further down.
C6's failure condition is a prerequisite "presented as actionable", so the fix is positional as much
as it is factual: a reader who acts on the first sentence must meet the prerequisite in that sentence.

**The corpus's own record is the evidence.** C6 requires "the corpus's own record that the
prerequisite is unmade/unbuilt (file:line)". So the Tier-1 version reads the decision ledger and the
plan, and where the record says a decision is open, the recommendation may not speak as though it is
closed. This is B13's rule pointed at a different target: the record moves forward by appending, and
the reader is always told.

### M3 — 6c, at closeout: one authoritative status picture

`research-audit-claims`' closeout preflight — which already walks completion criteria and, since W4,
open assumptions — gains a third question: **do the project's own documents agree about what is
blocked?**

Collect every blocker, dependency, and status claim across `research/outputs/`, `STATE.md`, and the
decision ledger. Compare. **A contradiction is the finding**, reported as the pair — this file says
X is blocked, that one says it shipped — with both locations named, because a status claim is only
wrong relative to another status claim.

**Not a block. Same stop-not-block shape as v1.14.0's stale-reading decision and W4's open-assumption
question**, which are now the established idiom: present what is known, name the contradiction, and
let the commissioner say which is current. The plugin cannot know which document is right, and
guessing would write a fact nobody recorded.

**Placement matters.** This belongs at closeout, not at every phase: status claims accumulate, and a
contradiction between phase 2 and phase 5 is not visible until phase 5 exists.

## Author forks

**Fork 1 — is 6e scoped to recommendations, or to load-bearing conclusions?**
(a) Recommendations only — statements that someone should do something.
(b) Every load-bearing conclusion, matching W4's trigger.
*Recommendation: (a).* C5's own words are "the recommendation", and the check asks whether something
would make you *not do the thing* — which needs a thing to do. Extending it to descriptive
conclusions makes it a second, blurrier disconfirmation check sitting beside W4's, and the two would
be confusable in exactly the way Fork 2 of W4 rejected.

**Fork 2 — does 6c compare against promoted outputs only, or drafts too?**
(a) Promoted outputs + STATE + ledger.
(b) Everything including drafts in flight.
*Recommendation: (a).* A draft is allowed to disagree with the record — that is what drafting is. The
contradiction only matters once both statements are things the project stands behind.

**Fork 3 — do 6e and 6f produce audit findings, or synthesis-time requirements only?**
(a) Synthesis-time only: the draft must carry them; the audit does not separately check.
(b) Both: synthesis writes them, and a new battery item verifies they are present and non-vacuous.
*Recommendation: (b), with the battery item checking presence and vacuity, not quality.* W4's own
verification showed why: the gate's honest exit was taken correctly by some runs and dodged by
others, and what caught the dodge was a second reader. "Further research may refine this" is a
mechanically detectable non-answer.

**Fork 4 — one new battery item or two?**
(a) One item covering both 6e and 6f, since both are about the recommendation.
(b) B18 falsifiability, B19 prerequisites.
*Recommendation: (a).* The battery is already at seventeen items and the audit reports every one.
Two items that always fire together on the same sentence add a row to every report and split one
finding across two lines.

## Verification

- A recommendation with no refutation clause must fail, and the finding must name the recommendation.
- **The honest exit must pass**: a recommendation nothing observable could refute, stated as such.
- **A vacuous refutation must fail** — "further research may refine this" is the trap, and it is the
  one most likely to appear, because it is what a fluent writer produces when asked this question.
- A descriptive phase output with no recommendation: the check is n/a and **silent** — no empty
  section, no "not applicable" line.
- 6c: two documents disagreeing about a blocker must surface as a pair, with both named; a project
  whose documents agree must produce nothing.
- **Regression:** W4's counter-evidence gate must stay green. 6e sits next to it in the same skill
  and asks an adjacent question; the two must not merge into one paragraph that satisfies neither.

## Touches
`research-summarize-section` (6e + 6f at synthesis) · `research-audit-claims` (the closeout status
question, and one battery item for 6e/6f) · `corpus-review-brief.md` (C4/C5/C6 each gain the
check-it-don't-trust-it line, the C14 pattern) · `dev/know-researcher/MAINTAINERS.md` (the
recommendation-serviceability entry in Layer 8).

## Why 6d is not here

6d is instrument validity — confounds, circular rubrics, measurement mismatches, false precision. It
is not the same kind of work as the other three, and the corpus reviewer says so itself: **C7 is
scoped to "ONLY these named patterns"**, which is the reviewer's author conceding that unbounded
study-design critique did not work even at Tier 2, with a whole corpus in view.

A Tier-1 version has less context and more chances to fire, so it needs its own design pass and its
own decision about which named patterns are worth checking at synthesis time. Bundling it here would
import that unresolved question into three checks that do not have it.
