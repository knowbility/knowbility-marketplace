# W6d — instrument validity at Tier 1

**Status:** designed 2026-08-24. Last workstream. Built in v1.18.0.

## The constraint that shaped this

C7 (`corpus-review-brief.md`) reads:

> **C7 Instrument validity** (only if the corpus proposes studies/instruments; else n/a).
> Check **ONLY these named patterns**: decision rules comparing quantities the instrument never
> measures; rubrics that structurally predetermine the result; unsupported precision (constants
> applied beyond their supported range); missing measurement crosswalk when overlapping counts
> coexist. Methodological concerns beyond these patterns: report as `needs-domain-expert` in the
> finding's `observed` text, **do not settle**.

That scoping is a concession, not a style choice. C7's author had a whole corpus in view, one pass,
at the end of a project, and still concluded that unbounded study-design critique does not work.
They bounded it to four patterns and routed everything else to a human.

A Tier-1 version has **less** context (one section, mid-project) and **more** chances to fire (every
synthesis). So the Tier-1 question is not "how do we port C7" but **which of the four patterns still
work when you can see less.**

## Pattern-by-pattern decision

| C7 pattern | Tier-1 fit | Decision |
|---|---|---|
| 1. Decision rules comparing quantities the instrument never measures | **Strong.** The rule is in the draft; what each figure measures is in the note's `measures` field. Comparison is local. | **Build** |
| 2. Rubrics that structurally predetermine the result | **Poor.** Needs the whole instrument and a judgment about structure. This is precisely the unbounded critique that failed at Tier 2. | **Leave at C7** |
| 3. Unsupported precision (constants beyond supported range) | **Mostly covered.** W5's `carries-to` plus integrity check 10 already flag a figure discussed past its population. The residue — a constant *used in a computation* outside its validity — is a special case of pattern 1. | **Fold into 1** |
| 4. Missing measurement crosswalk when overlapping counts coexist | **Workable.** Concrete trigger: two figures in one draft whose populations overlap. W5's `measures` / `not` / `basis` supply exactly the raw material. | **Build** |

**Two patterns, not four.** The lesson of C7's own scoping is that a bounded check that fires
correctly beats a broad one that cries wolf.

## What W5 did NOT already cover

Checked before designing, because an absorption claim was made wrongly once this session.

Integrity check 10 ends: *"This check reads what the note claims about its own numbers. It does not
judge whether the study was any good — that is a human's call, and the fields exist so a human can
make it later."* W5 deliberately built the **record** and declined the **judgment**. W6d is the
first thing to read those fields for anything beyond internal consistency.

7a (recommendation serviceability) covers *what would refute this* and *what it depends on*. It does
not ask whether the rule is **computable** from the evidence. Distinct.

**Not evidence for this design:** the shared-figure independence gap (five judges, three
iterations). That is Independence Discipline — whether two sources are genuinely independent when
they share a figure. Different check, different owner, closer to cross-ref. It stays where it is.

## The two checks

### 6d-i — a decision rule must be computable from what the evidence measures

**Trigger:** the draft states a rule that turns a quantity into an action or a verdict. A threshold
("adopt if X exceeds 40%"), a cutoff, a score, a comparison that decides something. Descriptive
prose is not a decision rule and this is n/a and silent.

**Check:** every quantity the rule references traces to a figure record whose `measures` actually
covers it. The failure is a rule that thresholds or compares something no figure in the corpus
measures — the number is real, and it is not the number the rule needs.

**The shape to expect:** a rule that reads as rigorous because it contains an operator. "Adopt when
time-to-value drops below 30 days" is a decision rule; if every figure measures *the share of teams
reporting any reduction*, no figure measures *the size of the reduction*, and the rule cannot be
evaluated. W5's `not:` field exists to make this visible and this is the check that reads it.

### 6d-ii — two figures whose populations overlap need their relationship stated

**Trigger:** the draft uses two or more figures whose `measures` fields describe overlapping
populations.

**Check:** the draft states how they relate — subset, superset, different slice, unknown. The
failure is two counts sitting side by side implying arithmetic nobody has established.

**Honest exit, required:** if the relationship cannot be determined from the sources, the draft says
that. "Unknown" is a legitimate value; silence is not. Same principle as W5's `basis`: a recorded
unknown survives into the draft, a blank field loses it.

## The escape hatch is mandatory

Anything beyond these two patterns is reported as **`needs-domain-expert`**, C7's exact term, and
**not settled**. This is not optional politeness. It is what stops a Tier-1 check with less context
from doing the thing Tier 2 already proved does not work.

Vocabulary is shared with C7 verbatim so the end-of-project reviewer reads the record rather than
reconstructing it. Same constraint that governed W3→C2/C14, W4→C5, W6c/e/f→C4/C5/C6.

## Where it lives

- **`research-summarize-section` step 7b**, after 7a. Synthesis is where drafts state rules.
- **`research-audit-claims` B19**, presence-and-non-vacuity only, never quality. Mirrors B18's
  relationship to 7a.
- **Register:** stated as part of the finding, never as a labelled compliance section. No `##
  Instrument validity` heading, never the check's name. Constraint stated explicitly because a
  requirement added without one defaults to narrating its own mechanism.
- **Map sync:** `dev/know-researcher/MAINTAINERS.md` — the instrument-validity entry in Layer 8, the
  judgment row in Layer 4, and step 7b + B19 in the Layer 2 ownership rows, in the same change
  (plan rule 1). This line was missing when W6d shipped, and the map went a full release without
  it — which is what the rule exists to prevent.

## Fork left open deliberately

Whether 6d-ii should also fire at **cross-ref** (where overlapping figures across sources first
become visible) rather than only at synthesis. Not decided here; synthesis is the smaller,
verifiable step and cross-ref already owns independence. Revisit if evals show the draft is too late.
