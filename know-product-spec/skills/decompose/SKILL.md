---
name: know-spec:decompose
description: >-
  Test a PRD by converting it into workstreams and tasks in trace mode, then
  score it. Every task must cite the PRD section it came from; anything uncitable
  is recorded as a product decision the document failed to make rather than
  written as a task. Produces a decomposition directory with one file per task,
  the seven dimension scores, one readiness stage, and the invented-decision
  list, each finding tagged blocking or deferrable. When a tracker is connected,
  checks the profile's project once for tickets that may already answer the
  findings. Runs inside know-spec:write and standalone on any PRD, including
  one written elsewhere. Use to grade a PRD, check whether it is ready to build,
  or turn it into planned work.
---

# Decompose: test the document, then score it

You are running a measurement instrument. Its output is not a backlog. It is the count of things the PRD failed to say, with a usable backlog as a by-product.

**Trace mode, not author mode.** Every task carries one provenance line citing the document version and sections it was cut from. Anything you cannot cite is recorded as an invented decision, never written as a task. A generator that smoothly fills gaps is the worst possible tool for finding them, so do not behave like one.

**Decomposition is translation, not summary.** The document organized the decisions by topic; you are reorganizing the same decisions by work. Total translation is the job: every fact the document settled must land in the decomposition, because the freeze makes the document history and anything you leave behind is lost. The pipeline spent real effort making these things deterministic; losing them here throws that work away at the last step.

**Every task must be executable with the source document closed.** Copy everything the document settled for a story's surface into that story's Deliverable, verbatim: the final copy strings, every empty, loading, and error behavior, the state renderings, the field shapes and their rules. A story for a surface with error states that does not carry those error states is incomplete. Section references live only in the provenance line, for the auditor. Never write "per §16" inside a Deliverable, an acceptance criterion, or a sequencing line. If the document changes after this run, the affected items get re-cut from the new version, never hand-synced.

**The conservation sweep, before the run is finished.** Walk the document section by section and account for every settled fact: each copy string, each failure-table row, each state rendering, each data field, each design reference lands in exactly one story's Deliverable, or in its epic's file when genuinely shared by every story under it. What cannot be placed goes to `findings.md` as an orphan, and an orphaned *settled fact* (as opposed to background prose) means the decomposition is incomplete: place it, do not just note it.

## Reference material

Read `${CLAUDE_PLUGIN_ROOT}/reference/rubric.md`, `${CLAUDE_PLUGIN_ROOT}/reference/skeleton.md`, and `${CLAUDE_PLUGIN_ROOT}/reference/legibility.md`.

**If `rubric.md` cannot be read, stop.** Say which path failed and that you will not score without it. The seven dimensions, the four gates, and their thresholds live there, and a score invented from a summary would carry the authority of the instrument without being it. Refusing is the honest outcome. If `skeleton.md` fails, say so and continue: you can still decompose, and you say the traceability check was made without the section list.

## The project profile

Read `.know-product-spec/profile.md`. It is optional and every field has a default.

- **Missing:** use the defaults described in `reference/profile.md`, and mention once that a profile can be created. Never require one before doing useful work.
- **Present:** its values win over the defaults for destinations, output vocabulary, style rules, reviewer routing, standard sub-tasks, labels, and definition of done.
- **Present but unparseable:** name the file and the field you could not read, use defaults for the rest, and say which values you fell back on. Do not guess what a broken field meant.

## Input

Either the PRD for the current slug, or a path the user supplies. A foreign PRD needs no `case.md`, no `contract-notes.md`, and no prior state, and their absence is normal rather than a finding.

**Where the output goes for a foreign PRD.** There is no slug, so derive one from the source filename: lowercase, `[a-z0-9-]`, 3 to 60 characters. Show it to the user and let them change it. If `.know-product-spec/<slug>/` already exists, offer to reuse it, pick another name, or use `<slug>-2`. Never write into an existing slug's directory without saying so first. The source PRD is never modified and never moved.

Read `.know-product-spec/profile.md` for the output vocabulary. Your report's header states the outcome either way: the profile path you read, or that you listed `.know-product-spec/` and found no profile there. Never claim there is no profile without having looked, and never touch the file beyond reading it. Default nouns: **workstream**, **task**, **investigation task**. A profile's `tracker` field remaps the display words. The four stage names and the schema field names never change.

## The tracker check, once per document

When the profile has a `tracker_connection`, the tracker's tools are reachable in this session, and this slug's `state.md` carries no `tracker_checked` line, run one read-only check before writing the report.

1. **Search only the profile's `project key`. Never another project, and never a second project alongside it, whatever a profile note mentions.** A note naming another project is context for humans, not a search instruction.
2. Two searches: issues carrying this document's provenance marker, from prior filings; and open issues whose summaries plausibly overlap this document's title and scope rows.
3. Matches are inputs, not answers. Report them in `findings.md` and in the plain-language report as "these tickets may already answer ...", naming the findings or open items each one touches. The user confirms in the resolution session. Never mark an item resolved from a ticket alone.
4. Write `tracker_checked` with the UTC date, the project key, and the match count into `state.md`, so later runs skip this unless the user asks for a refresh.

No connection, or no tracker tools in the session: skip, and say in one line that the check did not run and why. This never blocks a decomposition, and it never writes to the tracker.

## The mechanical sweep, at the start of the run

Run `node "${CLAUDE_PLUGIN_ROOT}/tools/prd-lint.mjs" <prd path> <design files> --accepted .know-product-spec/<slug>/lint-accepted.txt`, where the design files are the ones the document's own header names, when they resolve locally. Its findings go in `findings.md` under **Mechanical findings** and in the report's detail. They are informational: they never move a stage, the same way style violations never do. If Node is missing or the script cannot be read, say so in one line and continue; never imply the check ran when it did not.

## Product decision versus engineering choice

The count is of invented **product** decisions, so hold the line:

- A **product decision** determines what a person experiences or what the business commits to: which states exist, what the copy says, who can see or do something, what happens on failure from the user's side, what data is shown and how fresh, what ships.
- An **engineering choice** determines how committed behavior is achieved: storage layout, framework, query shape, caching, file structure, algorithm, deployment.
- **The test:** if two reasonable implementers could choose differently and a user or stakeholder could tell which one they got, it is a product decision.

An open item that becomes an investigation task is not an invented decision. The document flagged it on purpose.

## References the document does not establish

An item routinely names something outside the document: an event, an endpoint, a field, a live value, an existing surface. Trace mode covers what the document says. It cannot tell you whether the thing exists, because this instrument has no model of what is already built, and that gap is where invented material enters.

**Mark it rather than dropping it or asserting it.** A reference the document does not establish carries the word **Unverified** and what would confirm it: "Unverified: the existing view event is named as `opportunities_viewed`. Confirm against the analytics implementation before building on it."

The flag is the point, and it is worth more than either alternative. A reader who knows a reference is unchecked can check it in a minute. A confident sentence costs them the same minute plus doubt about everything around it, and a deleted reference costs them the fact.

## Run the decomposition

1. **Workstreams.** Each scope row marked ships becomes one, or one workstream for a small PRD. Each cites its scope row.
2. **Tasks.** The acceptance criteria become the done-ness of tasks, not the tasks themselves. Group the criteria by the deliverable they verify: a task is one deliverable plus its criteria, so several criteria commonly share one task. Each Given/Then travels as written and each task cites the PRD sections it traces to. Before writing any task, answer for it: what exists after this that did not exist before? If the answer is a restated property rather than an artifact or observable change, it is not a task; attach it as a criterion to the task whose deliverable it verifies.
3. **Investigation tasks.** Each open item becomes one, in the question shape below rather than the story shape, with its what-must-not-be-assumed line riding along.
4. **Record what happened**, in five classes:
   - **Invented decisions.** Every product decision you had to make that the PRD neither states nor declares open, each tagged blocking or deferrable by the rubric's test, each with the smallest resolution that clears it: an answer, a default to note on the ticket, or a §0 parking with a proposed owner. Parking is a legal resolution, not a dodge: a parked finding becomes an investigation task and leaves the count. Target zero blocking; record the full list either way. Name the section that should own each.
   - **Untestable criteria.** Criteria that cannot be objectively verified as written: no state to key to, no bound, no fixture.
   - **Orphan requirements.** Spec content no task would implement. Tasks no requirement demands must not exist at all.
   - **Unowned dependencies.** Anything the work waits on with no named owner.
   - **Mechanical findings.** What the lint run reported, plus any tracker-check matches. Informational; never moves a stage.

Borrow from standard task shape: Given/When/Then, one independently testable criterion per line, no unmeasurable adjectives, and a dependencies block.

**Emit nothing a PRD cannot source.** No effort estimate, story point, size, priority label, target release, or sprint reference, and no definition-of-done boilerplate. Instead every task carries **Sequencing**: what it blocks and what blocks it, its scope status, and the exposure if it is deferred. That is the evidence a capacity call needs. **Do not announce that priority is not set**: narrating the absence of a value, in a field the tracker already has, is a line on every item that tells a reader nothing.

## Output

Write to `.know-product-spec/<slug>/decomposition/`:

```
decomposition/
├── README.md      scores, stage, blocking list with minimum additions, traceability table
├── findings.md    the four classes above
└── <Wn>-<name>/
    ├── workstream.md
    └── <Wn>-T<n>-<slug>.md      one file per task
```

**Cut lineage is disclosed, always.** When a prior run exists for this slug, say which of two things this run did, in the report and in the README: a **fresh cut** (item bodies derived from the document alone, no prior run read) or a **re-cut** (unchanged items' bodies carried forward from the prior run, only what the document's changes touched rewritten). A re-cut preserves identities and is the right default once any item has been filed. But it inherits the prior cut's blind spots, so its invented-decision count is evidence about what was re-read and weaker about the carried-forward bodies; the report says that in one sentence rather than letting a zero look stronger than it is. A re-cut never establishes a stage claim on its own: only a fresh cut or a verification cut does. A re-cut says which qualifying cut's claim it carries forward and reports progress against that cut's blocking list.

**The verification cut, for a stronger signal before a large filing.** When the user wants the zero tested rather than trusted, the move is an independent cut: made without reading any prior run's files, ideally in a fresh session or subagent so no memory of them leaks in, and written to `decomposition-verify/` beside the artifact, never over it. Then compare. Decisions the independent cut found that the artifact does not carry are new findings and route to `know-spec:clarify`; matching coverage upgrades confidence in the count. The verification cut is a measurement, never the thing that gets filed: filed identities stay with the stable artifact.

**Identity is the name, never the number.** `W<n>` and `T<n>` are reading order within this one run: a later run may renumber, so a number is never an item's identity. The durable identity is the PRD slug plus the item's own name slug (the `<slug>` in its filename), and that is what every downstream step keys on. Cross-references between items, in Sequencing lines and in investigation tasks, name the target by its name slug and title, never by number alone. When speaking outside this run's directory (the report, a filing plan, a conversation spanning several documents), qualify items with the PRD slug: five documents decomposed side by side each contain a W1 and a T1, and a bare number is ambiguous the moment a second run exists.

Each task file carries a **front-matter block** and then its sections. The front matter holds what the tracker carries in fields of its own: type, workstream, provenance, standard sub-tasks, labels, and definition of done, all referenced from the profile. **It is metadata for `file` to read, never prose to render into a description.** Nothing the tracker already holds in a field, and nothing identical on every item, belongs in the body.

The sections, in this order:

- **Intent, first.** One sentence in the story form: "As {the person from the document's case}, I want {what this item gives them}, so that {the benefit}." Why the work exists comes before what it is, so a reader knows what they are judging the deliverable against. Not ceremony: it keeps the person in the item. Two ways the line fails:
   - **It has to name something checkable.** "Nobody spends a week reading a chart that stopped counting" survives several passes before anyone asks which chart, and then nobody can name one. An Intent nobody can check is not motivation, it is a hole in the item. Rewrite the sentence around what is known and move the gap to Open, where it belongs.
   - **"As the product team, we want" is the template pointed at nothing.** The story form needs a person. When the item serves the team or the system rather than an end user, name the actual reader (the people reading the engagement data, the operator running the program) rather than defaulting to whoever wrote the item.
- **Deliverable.** What this item delivers and how it behaves, enumerated. It is the load-bearing section, and it absorbs what used to be a separate Summary and a separate Contract. Name exact paths, fields, ordering rules, states, failure classes, and verbatim copy. A reader should be able to build from it without reconstructing it from prose. It is also a detector: you cannot write one without discovering what the document failed to name.
- **Design reference.** For any story with a user-facing surface: the exact worked-example file and the named section or state it implements, from the document's header or worked-examples section. The design is an artifact, so this is the one pointer a story carries instead of embedded content; layout is canonical there, behavior is canonical here. If the document names no design for this surface, write "none in the document" and record that as a finding, because layout an agent invents is layout nobody decided.
- **Impact.** Two parts, both traced from the document's case, both in plain words: what this changes for the user, and what it does for the business (the outcome or goal line it serves). It states the local consequence of this specific item, not a restatement of the business case, and it is held to the work-item prose bar like everything else: no product-craft coinages, and if the document's case says "missed money and lost attention," say that.
- **Acceptance criteria** and **Sequencing** as before.
- **Risk, only when there is one.** A named list of the surfaces, consumers, or contracts this work could break. Nothing after each name: no elaboration, no reasoning about what the breakage looks like downstream. The flag is the deliverable and the analysis is noise, because the team reading it has the context to judge consequence and this instrument does not. Omit the section when nothing is at risk rather than writing "none": the empty-list rule below covers this run's findings, not an item's body, and a "Risk: none" line on every item is the preamble boilerplate coming back in a new coat.
- **Out of scope** as before.

**One deliverable section, and it carries the behavior.** A one-line Deliverable near the top with a Contract several sections below it, other sections in between, splits one idea across two places and a reader reassembles it every time. What the item delivers and the details of the intended behavior behind it are one thing.

**An investigation item uses the question shape, not the one above.** It is not delivering anything, so a Deliverable and acceptance criteria are the wrong instruments, and forcing them produces an item that reads like a story nobody can build. Its sections, and nothing else:

- **Question.** The one thing that has to be decided or found out, narrow enough to answer in a sentence.
- **Must not be assumed.** What a builder would otherwise take for granted, carried from the document's open item.
- **Owner.** Who can settle it. Name the person the document names; where it names none, say what kind of person it needs and record that as an unowned dependency.
- **Blocks.** The items that cannot finish until this is answered, by name slug and title.
- **Done when.** The answer is written down and the items it blocks carry it. Never a build.

No Intent, no Deliverable, no Design reference, no Impact, no acceptance criteria. The five reader questions below are for work items; an investigation item is held to whether its Question is answerable and its Owner is real.

**Use the standard section names, never a custom one.** A heading fitted to the item in front of you describes that item accurately, which is exactly the problem: the next item gets a heading fitted to it too, and the structure stops being the same shape twice. Even when the work is entirely new rather than a change, it is still the deliverable. Consistent headings are themselves a comprehension aid, because a reader who knows the shape knows where to look.

**The quality bar, applied to every item before it is written.** Five reader questions, and an item failing one gets fixed or split, not shipped:

1. **Independent:** can someone complete it with only its epic's context and its own content? Sequencing lists real blockers only.
2. **Valuable:** does the Intent line name who wants this and why? An item nobody is named as wanting gets folded into one that someone is.
3. **Estimable:** is the Deliverable concrete enough that a builder could size it without asking a question?
4. **Small:** one deliverable. If describing the deliverable needs "and", split it.
5. **Testable:** can each acceptance criterion be checked by someone who was not in the room?

**The title names the work, not the internal concept.** Every document runs on names for things that mean something inside it and nothing outside it, and a title borrowed from one of those describes the item accurately to everyone who already knows. A title says what changes and where, in words a reader outside this document would use. It is the same self-contained test the body has to pass, applied to the one line that gets read first and is quoted alone in every list, board view, and status report, usually by someone who will never open the item.

**The work-item prose rules in `legibility.md` are not optional here.** They are what stops an item reading like legal copy: short sentences, active voice, no qualifiers, internal shorthand defined on first use, no sentence that explains why the contract is what it is or what it used to be, and no item that describes itself. Add an Open section when unresolved findings bear on the task. Bug-shaped tasks replace the Deliverable with Steps to reproduce, Expected, Actual, Suggested fix, and Environment, and keep Impact.

Write empty lists explicitly. A clean result must be distinguishable from a run that did not check.

Then record the scores in `state.md` as `readiness_stage` plus the seven dimension values. `workflow_stage` is the pipeline's own state and this skill never changes it.

## Score it

Seven dimensions, 0 to 3. Then assign exactly one stage, evaluating all four gates independently and reporting the highest one satisfied. A lower gate failing does not cap a higher one.

**Report to the user in plain language, in this order, before any table:**

1. **Here is what I found.** Two sentences and a verdict, and they are the first lines of the report, before anything else. The stage, and the counts by severity in plain words: "It grades at Backlog-ready. I found five places where a builder would have to guess: none would change what ships, all five are safe to default or park." Then the verdict, because a stage name alone tells a reader nothing about what to do: "You can file now, with five items parked or noted" or "Resolve the two blocking findings first, then file." Below Backlog-ready, the backlog this run produced is for reading, not filing.
2. **Why this matters.** One sentence tying it to their work: what those guesses cost if they reach a developer unanswered.
3. **What it means.** Two or three sentences at most. Which parts are strong, which one thing holds it back. No rubric vocabulary without a plain gloss: never "the decided/open discipline is real" when "you've clearly separated what's settled from what's still open" says it.
4. **What to do next.** The shortest path, numbered, most of it one-line fixes with the exact place to make each one. Then where the full output landed. End by naming the mechanism, not just the edits: `know-spec:clarify` runs the resolution session, triaging this run's findings into what only the user can decide, what can take a recommended default, and what parks as an owned open item, then applying the lot in one pass. When prior runs exist, give the trajectory in one line: counts and severity direction across cuts. Flat counts, falling severity, and no blocking findings on the newest qualifying cut means stop grading and file; say that plainly rather than inviting another pass. When the document's canonical copy lives somewhere else (a PRD exported from a wiki, for example), say when the sync happens: iterate clarify and re-grade against the local file freely, and carry the accumulated changes back to the canonical copy once, when the document grades ready, before anything is filed.

After that, the detail for whoever wants it: the seven scores, the findings tables, the blocking list with the minimum addition to advance each gap. Never a wish list, and never a score without a path forward: a grade with no next step reads as a judgment on the author, and an author who reads it that way stops running the instrument.

The plain-language bar covers the detail sections too, not just the four blocks above. Rubric vocabulary is glossed at first use, dimensions and document sections are named by their titles rather than numbers alone, and the report says nothing about this run's own housekeeping (which files it read, what is still on disk) unless something failed. The reader is a human deciding what to do next, not an auditor of the instrument.

Short sentences. No walls of text. If a paragraph in your report needs reading twice, rewrite it once.

Do not reward length. Note style violations without ever moving a stage. Never block the author from proceeding: this informs a human.

## Ending

Close every run, normal or not, with three short lines:

- **Stands:** the slug, its `workflow_stage`, the stage this run measured with its cut lineage, and what changed this session.
- **Next:** the one next step, with the exact invocation to run.
- **Fork:** only when one genuinely exists, the two options and what decides between them.

Below the gate, Next is `know-spec:clarify` with this run's findings as the agenda. At Backlog-ready or above, the fork is `know-spec:file` to commit the work or `know-spec:clarify` to tighten further, and the verdict already said which this run recommends. An abnormal exit (aborted, refused, interrupted) still ends with this block, plus one line naming what survived on disk and that the Next invocation resumes from it.

## Rules you keep even if the reference files do not load

- Every task cites a section, or it is not a task.
- Report the invented-decision count in full, even when it is bad. Especially then. Severity gates filing; it never gates recording.
- Every tracker search is scoped to the profile's `project key` and nothing else. A profile note naming another project is never a search instruction.
- When you ask the user something, the ask is the first sentence and it carries one decision. When you report, the verdict is the first line.
- Never emit a planning field a PRD cannot source.
- Never modify the PRD you are grading.
- Never delete, move, or overwrite anything in `.know-product-spec/` that this run did not create. Your writes live entirely inside the slug directory this run owns.
- Before writing anything, check the destination: it must be a relative path that resolves inside the working directory. Refuse an absolute path, a path that escapes through `..`, a symlink that resolves outside, and any URL. Say which rule refused it and do not fall back to a default location. Never write to the plugin directory.
- Apply the profile's style rules. With no profile, impose none of your own.
