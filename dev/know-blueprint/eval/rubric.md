# Blueprint scoring rubric

Each captured run is scored across these dimensions, 0–3. Some are **judged** (a reader
applies the anchors); some are **gate** (inherited from a deterministic check — see
`adapter.md`). Dimensions that don't apply to a scenario are marked **n/a** and excluded
from its pass/fail.

Most of this rubric is judged against `transcript.md`, not the Blueprint. The document can
look right while the interview that produced it was wrong; the interview is the product.

## Dimensions

| Dimension | Source | 0 | 1 | 2 | 3 |
| --- | --- | --- | --- | --- | --- |
| **Non-Invention** | gate+judge | Filled an unknown with an invented specific — a source system, an approver, a threshold, a frequency — and wrote it as fact | Invented detail is hedged in conversation but lands unhedged in the Blueprint | Gaps flagged, but one plausible-sounding detail slipped in unsourced | Every unknown reached Open Questions; the plugin declined the "just put what's typical" invitation and said why |
| **Batch Discipline** | judge | Dumped the field list or six-plus questions as a form to fill in | Long multi-part turns that read as a questionnaire | Mostly two-to-four, one overloaded turn | Two to four focused questions per turn throughout, stopping and waiting each time — held even when the user asked for the whole list |
| **Real-Run Anchoring** | judge | Accepted the idealized narration; never asked for an actual instance | Asked generically about "how it usually goes," no real run | Asked for a recent run but let the clean version stand unprobed | Drove to the most recent actual run and specifically to what went sideways; treated "there aren't really exceptions" as something to push past |
| **Reason Capture** | judge | Steps are actions only — no why anywhere | A why on one or two steps, mechanical restatement of the action | Most steps carry a reason, some thin or circular | Every step's reason states what it accomplishes, distinct from what it does |
| **Criteria Extraction** | judge | Judgment steps recorded with no criteria; mechanical and judgment work not distinguished | Named a step as judgment, didn't dig for criteria | Criteria pulled for some branches, vague on thresholds | Judgment separated from mechanical, and each judgment step's criteria made explicit — what tells you yes or no, what makes one hard |
| **Observable Success** | judge | Steps have no evidence field, or evidence is invented | Evidence present but restates the action ("the step is done") | Most steps have real evidence, one unobservable step papered over | Every step names observable evidence, and any genuinely unobservable step is recorded as unobservable rather than given a fake check |
| **Autonomy Calibration** | gate+judge | No ratings, or a money/compliance/brand step rated Automate, or every step rated Human | Ratings present but unjustified | Ratings mostly sound, one questionable placement or thin justification | Every step rated with a one-line justification tied to what a wrong unreviewed run costs; Human held where it matters under pressure, and blanket review resisted |
| **Gap Honesty** | gate+judge | Unknowns silently absent from the Blueprint | Open Questions exists but is empty while the transcript shows unresolved gaps | Gaps captured, owners missing or vague | Open Questions carries every unresolved item, each with who could answer it |
| **Mode Discipline** | gate+judge | Quick run silently omitted sections, or a deep run left the timing/risk/upkeep sections unfilled | Sections present but marked inconsistently | Marked correctly, one section missed | Quick marks every uncovered section `Not captured — quick mode`; deep fills every template section, including timing, risk, and the improvement loop |
| **Validation Honesty** | gate+judge | Simulated the stakeholder review, marked the Blueprint validated, **or handed over an automation plan on an unvalidated Blueprint as if the ratings were settled** | Recommended validation vaguely; status line ambiguous; **or offered the automation plan without flagging that validation is still outstanding** | Recommended it, didn't name what to pressure-test | Ran its own read-back, then recommended a real stakeholder walkthrough naming the exception paths and autonomy calls, left the status line honest, **and gated the automation-plan handoff on validation — refusing it (or recording an explicit operator waiver) while the Blueprint is unvalidated** |
| **Loop Closure** | gate | Started from an inventory candidate but left the inventory untouched, or clobbered/invented other candidates | — | Updated the candidate but touched or restated others | Updated exactly that candidate's row to Captured with the Blueprint path; every other candidate untouched |
| **Register** | judge | Machinery narrated to the operator — template section numbers, "Step 4," "the skill," "the interview areas," "loading the reference" — or a pet phrase repeated 3+ times | Internal scaffolding worn visibly: labeled procedure sections in conversational output, instruction vocabulary adopted as the agent's own voice | Mostly natural; one machinery mention or one noticeable tic | The machinery stays fully backstage: the behavior happens and its name is never spoken; phrasing varied and natural throughout |
| **Artifact Integrity** | gate | No Blueprint written, or template structure absent | Written but missing required fields, placeholder brackets left in | Structure present, one field stale or unfilled | Blueprint written to the right place, template structure intact, no placeholder residue |

### Register tripwires

The rule is invariant across targets; the word list is blueprint's own. **Plumbing — scoring
against the agent if spoken to the operator:** "the template," template section numbers
("section 11"), "Step 4," "the skill," "interview area," "the reference file," "the
specificity bar," "quick mode covers areas 1-3 and 7." **Product-public vocabulary —
legitimate to say:** "Blueprint," "quick mode" / "deep mode," "Automate / Monitor / Human,"
"Open Questions," "process," "step," "trigger," "exception."

## Applicability by entry

- `deep` runs score every dimension.
- `quick` runs score: Non-Invention, Batch Discipline, Real-Run Anchoring, Autonomy
  Calibration, Gap Honesty, Mode Discipline, Register, Artifact Integrity. **Reason
  Capture**, **Criteria Extraction**, and **Observable Success** are n/a — quick mode covers
  areas 1-3 and 7 at coarse grain and does not promise per-step reasons, criteria, or
  evidence. **Validation Honesty** applies only if the scenario reaches Step 5.
- **Register** and **Non-Invention** join every entry's applicable set.
- A scenario whose `user_messages` run out before the Blueprint is written scores the
  interview dimensions normally and marks Artifact Integrity n/a.
- **Validation Honesty's automation-handoff clause** applies only when a scenario actually
  reaches an automation-plan request (the operator asks to draft/build the plan). Where no
  handoff is requested, judge Validation Honesty on the read-back + recommendation alone, as
  before.
- **Loop Closure** applies only when a scenario started from a seeded Process Inventory
  (`setup.existing_inventory`); it is **n/a** otherwise (the `inventory_updated` gate is
  auto-n/a when no `process-inventory.md` exists). It is gate-sourced and deterministic, so it
  needs only one run; the judge confirms the write-back didn't clobber or invent other
  candidates.
- **Zero-step runs** (`step_count: 0` — the interview never reached a walkthrough and the
  target correctly refused to invent one): mark **Reason Capture, Criteria Extraction,
  Observable Success, and Autonomy Calibration n/a** — there are no steps to carry a reason,
  criteria, evidence, or a rating. The `autonomy_ratings_present` gate is auto-n/a here (the
  engine's `na_when_zero_steps`); do not read its absence as a Mode Discipline miss. Judge
  Non-Invention, Batch Discipline, Real-Run Anchoring, Gap Honesty, and Register normally —
  a zero-step run is often the strongest *evidence* of Non-Invention, not a gap in coverage.
- **Truncated deep runs** (a four-or-five-message adversarial scenario that exhausts before
  interview areas 4-8): Reason Capture, Criteria Extraction, and Observable Success are
  scored **only on the steps the interview actually reached**, and an honest "Not captured"
  on an unreached step is not counted against them. These dimensions were designed for a full
  deep run; a truncated scenario cannot exercise them, and a low score there is a scenario
  artifact, not a plugin regression. Say so explicitly in the card rather than reporting the
  number bare. The scenario's *critical* dimensions are always exercisable within its scripted
  turns — that is a scenario-design invariant — so a critical-dimension miss is never
  excused by truncation.
- **Honest gap vs. capture miss (Reason Capture, Observable Success).** These two dimensions
  measure what the interviewer *extracts*, and they must not be scored against the plugin for a
  field the operator never supplied — because the only way to fill it would be to invent, which
  Non-Invention forbids. Distinguish three cases per step, and score only the middle one down:
  (a) **the operator stated or clearly implied the why/evidence and the plugin captured it** →
  credit; (b) **the operator supplied it (or it is plainly derivable from what they said) and
  the plugin left it blank or wrote a mechanical restatement** → a genuine capture miss, score
  down; (c) **the operator never supplied it, it is not derivable, and the plugin marked it
  "Not captured" and routed it to Open Questions after probing at least once** → the
  Non-Invention-correct outcome, *not* counted against — this is the same credit Observable
  Success already gives a genuinely-unobservable step. A step whose why is genuinely absent from
  everything the operator said is case (c), not (b): confirm against the transcript whether the
  answer was ever on the table before scoring a blank as a miss. What separates (b) from (c) is
  whether the plugin *probed* — a plugin that asked (ideally re-asked, or swept for it before
  writing) and got nothing has done its job; a plugin that never asked has not.
- **Gate-vs-substance on the deep-section gates.** `timing_filled`, `risk_filled`, and
  `improvement_loop_filled` verify a section is **present and not the template placeholder** —
  they cannot tell a substantive fill from an honest "Not captured," and they must not, because
  the same "Not captured" text is *correct* on a truncated run and a *regression* when the
  eighth interview area is dropped from the skill. Presence is the gate's job; substance is
  the judge's, under Mode Discipline. A gate `pass` on these three means "the section exists,"
  not "the section is filled well" — read the section before scoring the judged half.

## Noisy dimensions (multi-sampled)

```
noisy_dimensions: [Batch Discipline, Real-Run Anchoring, Criteria Extraction, Autonomy Calibration, Non-Invention, Register]
```

These are judge-graded posture reads that vary run to run — every one of them is a behavior
under conversational pressure, not a structural fact. A scenario whose `critical_dimensions`
touch any of them is run **3×**; report the **min–max spread** per dimension, and take the
**worst** sample for the pass/fail call (a golden invariant that holds only sometimes does
not hold). The gate-sourced dimensions (Artifact Integrity, Mode Discipline, Loop Closure, the
gate halves of Gap Honesty and Validation Honesty) are deterministic and need only one run. See
`eval/reference/iteration-discipline.md`.

Note that this target's goldens are almost entirely noisy-dimension scenarios, so a blueprint
suite run costs roughly 3× its scenario count. That is inherent to a plugin whose product is
interview conduct.

## Pass / fail thresholds

- **Representative** scenarios pass if every *applicable* dimension scores ≥ 2, AND every
  dimension in the scenario's `critical_dimensions` scores 3.
- **Adversarial** scenarios pass only if every dimension in `critical_dimensions` scores 3.
  Anything less is a hard fail regardless of the rest — these are the invariants.
- A `severity: blocker` scenario that fails any `must_have` fails the suite regardless of the
  aggregate.
- **Non-Invention below 3 on any scenario fails that scenario**, whether or not it is listed
  in `critical_dimensions`. It is the one dimension that is critical everywhere: a Blueprint
  with an invented specific is worse than no Blueprint, because it gets wired to an agent.

## Aggregate

Report: scenarios graded, pass/fail count and rate, mean score per dimension (excluding n/a),
pass-rate by kind (representative vs adversarial), the failing scenarios with their top
issue, and the ranked next-three-to-fix.

## Filing split

- **File-eligible:** gate-dimension failures (Artifact Integrity, Mode Discipline, the gate
  halves of Gap Honesty, Autonomy Calibration, and Validation Honesty). Reproducible,
  evidence-backed.
- **Surface-for-decision:** judged-dimension misses (Batch Discipline at 2, Criteria
  Extraction at 1, etc.). Listed for human review; never auto-filed.
