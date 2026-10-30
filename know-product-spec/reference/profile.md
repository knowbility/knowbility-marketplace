# The project profile

PRD craft is product-agnostic. Everything about *your* project that the craft has to bend around lives in one file, so the plugin itself carries no assumptions about your product, your tracker, or your house style.

**The profile is optional.** Every field has a working default, and the plugin runs with no profile at all. If you must configure something before the tool does anything useful, that is a defect.

## Where it lives

`.know-product-spec/profile.md` in your working directory. Human-editable markdown. Edit it by hand whenever you like.

## Fields

| Field | What it holds | Default |
| --- | --- | --- |
| `prd_home` | Where the finished PRD lives, as a workspace-relative path. May also be a URL, in which case it is a **graduation instruction only** and is never written to | `.know-product-spec/<slug>/PRD.md`, with no graduation step |

**When `prd_home` names a custom path**, only the PRD itself moves there. Everything else stays under `.know-product-spec/<slug>/`: the state file, the interview notes, the decomposition directory, and the history copies. So a custom destination changes one file's location and nothing else, and the history of that file still lives beside the rest of the working artifacts.
| `surface_registry` | The name and location of your project's structural registry, the document that lists what surfaces and components exist. The PRD's Scope line names an entry in it | `none`, and the PRD names its surface plainly instead |
| `tracker` | The output words for planned work: the container, the unit of work, and the open-question unit | `workstream`, `task`, `investigation task` |
| `style` | Banned punctuation, the word your product uses for its end user, and any insider terms that must stay out of user-facing copy | No banned punctuation, "the user", no forbidden terms. The default imposes no house style on you |
| `reviewer_routing` | Who approves a PRD for which area of the product | `none` |
| `worked_example` | Where mockups, fixtures, prototypes, or reference implementations live | `none` |
| `design_system` | The interface contract's sources and their authority order: tokens, components, a storybook or component documentation, pattern documentation. `ui-review` judges conformance against these, and an older surface is never authoritative merely because it exists | `none`, and `ui-review` falls back to current analogous surfaces, saying so |
| `viewports` | The widths a review inspects, ideally the project's own breakpoints | desktop near 1440x900 and mobile near 390x844 |
| `adversarial_reviewer` | The command that runs an independent, read-only challenge of a readiness verdict, and any constraints on it. Used by `ui-review`'s adversarial gate | `none`, and the gate reports the review as unavailable rather than skipping it silently |
| `standard_subtasks` | Children every filed task carries, for example a QA review | none |
| `labels` | Your label vocabulary and when each one applies | none |
| `definition_of_done` | Your team standard, stated once here and referenced by every task rather than restated on each one | none |
| `tracker_connection` | Where `file` puts the work and how created issues land: the project key, the issue type for each output noun, the field linking an item to its container, any required fields, three placement keys: `initial status` (the status new issues are created in), `sprint` (the tracker's commitment or iteration field), and `agent label` (a routing label that assigns work to an automated worker); a `routing label` used by `groom` to mark an item whose decision is waiting on a named person, which is its own key and is never inferred from the general `labels` vocabulary; and optionally a `grouping` level, the tracker's level above the container (project, feature, initiative, roadmap), one grouping issue created per filed document with every container beneath it, its own parent named by a human at filing time, used when it already exists and otherwise created as part of the approved plan, never silently | Without the block, `file` and `groom` stop and ask rather than guessing a project. The placement keys default conservatively: `initial status` to the project's own default status, `sprint` to none (issues are never placed in an iteration), `agent label` to none (work is never routed to an automated worker). With no `routing label`, `groom` proposes one and asks before applying it |

## What the profile does not control

**The four readiness stage names.** Drafted, Case-clear, Backlog-ready, Build-ready. They name the instrument rather than the work, so remapping them would make two projects' scores incomparable.

**The schema field names** in the decomposition artifact. `tracker` changes the words a human reads; the fields stay fixed so the artifact remains machine-readable, and the display words are recorded alongside them.

**The skeleton and the rubric.** If your project needs a different structure or a different bar, that is a fork rather than a configuration.

## Example, filled in

```
prd_home: docs/prds/<slug>.md
  graduates to: the team wiki, PRD folder. Paste it there once reviewed.
surface_registry: docs/architecture/surfaces.md
tracker: epic / story / spike
style:
  banned punctuation: em dash
  word for the end user: customer
  forbidden in user-facing copy: "segment", "funnel"
reviewer_routing:
  checkout and payments: Ana
  everything else: whoever owns the area
worked_example: designs/ (HTML mockups, one folder per surface)
design_system:
  tokens: design/tokens.css
  components: design/components/ (canonical reference snapshots)
  storybook: design/storybook.html
  authority order: tokens, then components, then the storybook, then a current analogous page. A legacy page is not authoritative.
viewports: 1440x900 desktop, 768x1024 tablet, 390x844 mobile
adversarial_reviewer: the team's configured second-model review command, read-only, no edits and no commits
standard_subtasks: QA review
tracker_connection:
  project key: OPS
  types: epic for the container, story for work, spike for open questions
  container link: the tracker's epic-link field
  initial status: To Do
  sprint: none. Filed work lands in the backlog, never in an iteration.
  agent label: none. Filing never routes work to an automated worker.
  routing label: needs-decision. Applied by grooming when an item is waiting on a named person.
  grouping: roadmap. One roadmap per filed document; the initiative it sits under is named at filing time, and created then if it does not exist yet.
labels: accessibility, platform-wide, security. Use platform-wide when a shared component is involved.
definition_of_done: AC met, reviewed and merged, tests passing, QA review sub-task closed.
```

## Two rules the plugin keeps regardless

**Nothing is written outside your working directory.** A `prd_home` that is absolute, escapes the workspace, or resolves outside it through a symlink is refused with the reason stated. A `prd_home` that is a URL is treated as a graduation instruction, never a write target.

**An existing PRD is never overwritten quietly.** Before the plugin rewrites a PRD that already exists it shows a diff, asks for a clear yes, and keeps a recoverable copy under `history/`.

**The other files are working artifacts and are rewritten freely.** The state file, the interview notes, and the decomposition directory get replaced as the work proceeds, without a prompt each time, because that is what makes an interview resumable and a re-score cheap. If you hand-edit one of those, expect the next run to overwrite it. The interview notes are the exception worth knowing about: `clarify` appends superseded answers there rather than replacing them, so the record of what an answer used to be survives.

---

*Authored for this plugin. The fields generalize the product-specific concepts in an internal structure guide and quality rubric (retrieved 2026-07-26). The last three fields were added after calibrating against real tickets, which showed that definition of done, standard sub-tasks, and label vocabulary are team standards rather than anything a PRD sources.*
