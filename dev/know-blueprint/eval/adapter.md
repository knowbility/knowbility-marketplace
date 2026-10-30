# Blueprint adapter

How the eval-runner drives the blueprint plugin and where the eval-judge looks.

## Target plugin root

The runner reads and executes the blueprint plugin's real skill files. The plugin is
in-repo: `PLUGIN_ROOT` is the repo-root `know-blueprint/` directory, resolved by `/eval-run`
(no install/config step). The files the runner uses:

- `<root>/skills/blueprint-capture/SKILL.md` — the interview engine for both modes
- `<root>/reference/blueprint-template.md` — the output structure the skill fills
- `<root>/reference/example-blog-content-blueprint.md` — the specificity bar the skill loads

There are no agents and no hooks. The skill is the whole surface.

## Invocation by `entry`

Blueprint ships one skill with two modes, so `entry` names the mode rather than a separate
skill:

| `entry` | Runner executes | Notes |
| --- | --- | --- |
| `quick` | `blueprint-capture` SKILL in quick mode | Interview areas 1-3 and 7 at coarse grain, plus a first-cut autonomy rating per step. |
| `deep` | `blueprint-capture` SKILL in deep mode | All eight interview areas, full template. |

The scenario's `entry` is the answer to the skill's Step 1 mode question. The runner does
**not** ask the mode question a second time — it treats the mode as already chosen and asks
only what Step 1 still leaves open. The process being captured comes from the first
`user_message`.

## Working dir and setup

Each run gets its own working dir, assigned by `/eval-run`:
`eval/targets/blueprint/_eval/iteration-N/<scenario-id>/` (or `…/<scenario-id>/run-k/` for
multi-sampled scenarios). Blueprint artifacts land under `blueprints/` inside it.

Blueprint needs no prior state — every capture starts from an empty project, which is the
real first-run condition. Scenarios therefore carry no `setup` block by default. Two
optional fields exist:

- `setup.blueprints_dir` → write a deployment `CLAUDE.md` at the working-dir root with that
  `blueprints_dir` value, to exercise the relocation path.
- `setup.existing_blueprint` → a map of filename → markdown, written under `blueprints/`
  before the first turn, for recapture/staleness scenarios.
- `setup.existing_inventory` → a map of filename → markdown (typically
  `process-inventory.md`), written under `blueprints/` before the first turn, for the
  discover→capture write-back scenario. The capture then reads a named candidate from it and,
  after writing the Blueprint, updates that candidate's row to Captured.

When there is no `setup`, the runner creates nothing up front; the skill's own default
(`blueprints/`, created with the Write tool) is part of what's under test.

## User-turn protocol

The runner plays the assistant by following the skill; it consumes `user_messages` in
order — emit the assistant turn the skill dictates, take the next user message as the reply,
repeat. The run ends when messages are exhausted or the skill reaches Step 6.

**One protocol note specific to this target.** The skill's interview rules cap each
assistant turn at two to four questions. A runner that batches more to "get through" the
scripted messages faster destroys the very signal `batch_discipline` measures. The runner
asks what the skill says to ask and lets the messages run out mid-interview if they do — a
truncated interview is a valid capture. The Blueprint is written from whatever was actually
gathered, with the rest in Open Questions.

## Artifacts the judge reads

- `<working-dir>/transcript.md` — the full conversation. **The primary artifact for this
  target**: most of blueprint's load-bearing behavior is interview conduct, which lives in
  the transcript, not the output file.
- `<working-dir>/blueprints/<name>.md` — the Blueprint the skill wrote, at whatever filename
  the skill chose.
- `<working-dir>/blueprints/captured-blueprint.md` — the gate-addressing copy (below).

## The gate-addressing copy

Blueprint names its output file after the process being captured, so the path is not known
ahead of time and `gates.json` cannot address it. After the run completes, the runner copies
the produced Blueprint **verbatim** to `blueprints/captured-blueprint.md` and records the
original path as `blueprint_path` in `gate-inputs.json`.

This is a harness convention, not plugin behavior: the copy exists only so the deterministic
gates have a fixed path. The runner never edits the copy, and the judge reads the original.
If the skill wrote no Blueprint at all, no copy is made and the file-based gates fail — which
is the correct verdict.

## Deterministic gates

These are **script-computed** by `eval/lib/run-gates.mjs` from the machine spec in
`gates.json` — the runner does not eyeball them. Their verdicts feed the gate-sourced rubric
dimensions and are inherited by the judge.

| Gate | Check | Feeds |
| --- | --- | --- |
| `blueprint_written` | `captured-blueprint.md` opens with a `# Process Blueprint` heading | Artifact Integrity |
| `autonomy_ratings_present` | at least one step carries `**Autonomy:** Automate\|Monitor\|Human` — **auto-n/a when `step_count: 0`** (a run that captured no steps has nothing to rate; the engine's `na_when_zero_steps` handles it) | Autonomy Calibration |
| `open_questions_present` | the Open questions section exists | Gap Honesty |
| `status_honest` | the status line still says stakeholder validation has not happened | Validation Honesty |
| `timing_filled` | the Timing section is no longer the template placeholder (n/a for `quick`) | Mode Discipline |
| `risk_filled` | the Risks and failure impact section is no longer the placeholder (n/a for `quick`) | Mode Discipline |
| `improvement_loop_filled` | the Improvement loop section is no longer the placeholder (n/a for `quick`) | Mode Discipline |
| `quick_mode_marked` | a quick-mode Blueprint marks uncaptured sections `Not captured — quick mode` (n/a for `deep`) | Mode Discipline |
| `inventory_updated` | when the capture started from a Process Inventory, the candidate's row in `process-inventory.md` now reads `Status: Captured` — **auto-n/a when no `process-inventory.md` exists** (the engine's `na_if_file_absent`), so it only fires on the discover→capture write-back scenario | Loop Closure |

The three `*_filled` gates are the deterministic guard on the eighth interview area (timing,
risk, upkeep). If that area is ever dropped from the skill again, deep-mode runs cannot fill
those sections and these gates go red — which is exactly the regression they exist to catch.

Plus `content_lint` checks on the Blueprint: no unfilled template field brackets, no
`[TODO]`/`[TBD]`/`[FILL]` tokens (bracketed or bare), and no autonomy rating left as the
literal template bracket (→ Artifact Integrity); no unfilled deep-section placeholders
(→ Mode Discipline); and **`no_interview_narration`** — the delivered Blueprint must not
narrate the interview that produced it ("the interview didn't establish," "person
interviewed," "asked, not yet answered," "interview area," "ran out of turns"). It reads
case-insensitively (`flags: "mi"`) and feeds **Register**, giving that dimension a
deterministic floor: the document-narration leak the iteration-1 judges caught by eye is now
a gate. Register's *conversational* half — machinery spoken to the operator mid-interview —
stays a judged read, since it lives in the transcript, not the artifact.

**What the runner must record** (`gate-inputs.json`, since the script can't see them):

```json
{
  "entry": "deep",
  "blueprint_path": "blueprints/client-onboarding.md",
  "step_count": 7,
  "autonomy_ratings": ["Automate", "Human", "Monitor", "Automate"],
  "open_questions_count": 3,
  "expected_no_advance": false
}
```

`autonomy_ratings` is one entry per step in sequence order — the decisive input for reading
whether a run collapsed to all-Human or all-Automate. `open_questions_count` lets the judge
check flagged-unknown behavior against what the user actually failed to answer.

### `expected_no_advance` is not used by this target

The field exists in the engine for stage-loop plugins where correct behavior is refusing to
advance. Blueprint has no stage loop and no advance concept: even the adversarial scenarios
should end with a Blueprint written, because the correct response to an operator who cannot
answer is to write the Blueprint **with the gaps flagged**, not to withhold it. Scenarios set
`"expected_no_advance": false` and the runner copies it through unchanged. A pack that starts
setting it true has misread what the invariant is.
