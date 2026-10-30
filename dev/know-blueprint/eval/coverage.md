# Blueprint coverage checklist

The scenario classes a blueprint dev set should cover, mapped to the ids in
`scenarios.jsonl`. Gaps are named so they don't stay silent. Add scenarios with
`eval/reference/generate-scenarios.md` and update this file.

## Representative — one realistic, in-bounds run per entry

| Class (entry) | Covered by | Status |
| --- | --- | --- |
| `quick` | `rep-quick-invoice` | ✓ |
| `deep` | `rep-deep-onboarding` | ✓ |
| `deep` from an inventory candidate (write-back) | `rep-inventory-writeback` | ✓ |

Blueprint has only two entries, so representative coverage is complete — unlike strategist,
there is no per-stage matrix to fill. `rep-deep-onboarding` deliberately carries an SLA, a
churn-risk story, two explicit decision thresholds, and a stale ops doc so that the timing,
risk, and improvement-loop sections all have real material to be filled from.

## Adversarial — the invariants (goldens; must never regress)

| Class | Covered by | Status |
| --- | --- | --- |
| Refuses to invent an unknown under deadline pressure | `adv-invent-under-pressure` | ✓ |
| Holds the interview when asked to hand over a form | `adv-form-dump-request` | ✓ |
| Pushes past idealized narration to the real run | `adv-idealized-narration` | ✓ |
| Holds a checkpoint when the operator wants everything automated | `adv-automate-everything` | ✓ |
| Resists blanket human review (reviewer fatigue) | `adv-human-everywhere` | ✓ |
| Marks quick-mode gaps rather than silently omitting | `adv-quick-mode-omission` | ✓ |
| Declines to simulate stakeholder validation | `adv-simulate-validation` | ✓ |
| Records unobservable success instead of inventing evidence | `adv-unobservable-success` | ✓ |
| Gates the automation-plan handoff on validation | `adv-automation-before-validation` | ✓ |

The two the plugin's own `AGENTS.md` names as product-breaking — don't invent, don't collapse
into a form — are covered by `adv-invent-under-pressure` and `adv-form-dump-request`
respectively, and both are `severity: blocker`. Invention pressure also recurs as a secondary
critical dimension in three other goldens, because it is the failure mode most likely to
appear somewhere other than where it was scripted.

The two autonomy goldens are deliberately a matched pair pushing in opposite directions.
Testing only `adv-automate-everything` would reward a plugin that defensively rates
everything Human, which is its own documented failure.

## Notable uncovered classes (candidates)

- **Recapture / staleness.** The skill's Step 6 tells users to recapture a changed section
  rather than let the Blueprint drift. `setup.existing_blueprint` exists in the adapter for
  this, but no scenario uses it yet. This is the first gap to close.
- **`blueprints_dir` relocation.** `setup.blueprints_dir` exists in the adapter and is
  unexercised; the deployment-config path is currently untested.
- **Multi-variant process.** Interview area 2 asks about variants that follow a different
  path, and the worked example shows three. No scenario forces the plugin to decide whether a
  variant deserves its own Blueprint or is exception-managed.
- **Transcript as input.** The interview rules accept a recording or transcript of the
  operator describing the work in place of live recall. Untested.
- **Handoff to automation planning.** Covered by `adv-automation-before-validation` (0.2.1):
  the plugin must gate the automation-plan offer on validation and record an explicit waiver
  if the operator insists.
- **Discover→capture write-back.** Covered by `rep-inventory-writeback` (0.2.1): capturing a
  candidate from a seeded `setup.existing_inventory` must flip that candidate's row to Captured
  and leave the others untouched (the `inventory_updated` gate / Loop Closure dimension).
