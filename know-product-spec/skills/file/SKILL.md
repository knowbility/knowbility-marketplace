---
name: know-spec:file
description: >-
  Transfer a finished decomposition into the team's project tool, creating one
  epic per workstream and one issue per story and spike, with everything each
  item needs carried in the issue itself. Confirms the first ticket before
  batching the rest, never duplicates on a re-run, and writes the created
  ticket links back into the local story files, which remain the record of what
  was filed. Use after know-spec:decompose, when the stories have been read
  and the team is ready to put the work into its tracker.
---

# File: put the work into the project tool

You are transferring a decomposition into the team's tracker. This is one of two skills here that write outside the workspace, and the only one that creates, so it is deliberate, confirmed, and repeatable without duplication. (`groom` is the other; it edits and closes work that already exists, under its own mutation contract.)

Filing is a separate step from decomposing on purpose: decompose is re-run freely while the stories get read and the document gets fixed; filing is the commitment, made once the human has read what they are committing to.

## The project profile

Read `.know-product-spec/profile.md`. It is optional and every field has a default.

- **Missing:** use the defaults described in `reference/profile.md`, and mention once that a profile can be created. Never require one before doing useful work.
- **Present:** its values win over the defaults for destinations, output vocabulary, style rules, reviewer routing, standard sub-tasks, labels, and definition of done.
- **Present but unparseable:** name the file and the field you could not read, use defaults for the rest, and say which values you fell back on. Do not guess what a broken field meant.

For this skill specifically, the profile's `tracker_connection` block names the destination: the project key, the issue type for each output noun (container, unit of work, open question), the field that links an issue to its container, and any required fields. It may also carry three placement keys that control how created issues land: `initial status` (the status issues are created in), `sprint` (the tracker's commitment or iteration field), and `agent label` (a routing label that assigns work to an automated worker). **With no `tracker_connection`, stop before creating anything**: explain what the block needs and offer to add it to the profile with the user. Filing into a guessed project is not a graceful default.

The block may also name an optional **grouping level**: the tracker's level above the container (a project, feature, initiative, or roadmap level, whatever the tracker calls it), in the team's own words. With the key absent, filing behaves exactly as described below and containers land with no parent. With it present, one grouping issue is created per decomposition (one document becomes one group), every container this run creates is parented to it, and the grouping issue's own parent is a human decision made at filing time: it names a durable product area, so it is asked for in the plan. When that parent already exists, use it. When it does not, the plan names the one that would be created and the same yes that approves the plan creates it. A product area is never created silently or without appearing in the plan first, because it outlives the run that made it. Stopping the run instead would be the wrong trade: a product area created in error takes seconds to remove, and a team standing up its first areas would hit a halt on every filing.

**Honor the placement keys on every create.** Issues are created in the profile's `initial status`. The commitment or iteration field is never set, and no routing label is ever applied, regardless of what the tracker would do on its own. When the profile is silent on any of the three, take the conservative default, not the tracker's convenience default: the project's own default status, no iteration, no routing label; and say once in the plan which defaults you fell back on. The reason is permanent, so do not restore commitment or routing in a future edit: filing is a bulk act, and committing work to an iteration or routing it to an automated worker are per-item human decisions made after the work has been read.

## Reference material

Read `${CLAUDE_PLUGIN_ROOT}/reference/profile.md` for the `tracker_connection` shape, `${CLAUDE_PLUGIN_ROOT}/reference/tracker-syntax.md` for what survives a write into a tracker field, and `${CLAUDE_PLUGIN_ROOT}/reference/legibility.md` for the prose bar the descriptions have to meet. If a read fails, say so plainly and continue; the rules at the bottom of this file carry the parts that cannot be lost.

## Preflight

1. Find the decomposition: the slug's `decomposition/` directory, newest run if several exist. If the user names one, use that. No decomposition means nothing to file; route to `know-spec:decompose`.
2. Confirm tracker tools are reachable in this session (search the available tools for the tracker named in the profile). If none are connected, stop and say which connection is missing. Never fake a filing.
3. Read `filing-log.md` in the decomposition directory if it exists: this is a resume, and everything already logged is skipped, never re-created.
4. Search the project for issues carrying this decomposition's provenance marker (below). The search is scoped to the profile's `project key` and nothing else. Anything found is reported as already filed and skipped. A re-run must never duplicate.

## The plan, before any write

Show the user what will be created, in plain language: how many containers, how many work items, how many open-question items, which project, and the run they came from (its date, readiness stage, and cut lineage from the decomposition's README; a re-cut says whose stage claim it carries, since a re-cut reports progress but never establishes a stage on its own, and before a large batch an independent verification cut is the stronger signal). When that stage is below Backlog-ready, say what that means before asking for anything: the newest qualifying cut found blocking findings, decisions a builder's guess would ship as user-visible behavior, and filing now bakes those guesses into tickets; resolving them with `know-spec:clarify` and re-establishing the stage is the safer path. The human can still choose to proceed, and the plan never hides the state. Deferrable findings are different and normal: at Backlog-ready the plan states how many ride along as parked investigation items or as notes carried on tickets, and they are not an argument against filing. State where the issues will land: the status they are created in, and explicitly that nothing is placed into a sprint or iteration and nothing gets a routing label. If the profile was silent on any placement key, name the default being used. Filing a decomposition the user has not read is the failure this pause exists to prevent.

When the profile names a grouping level, the plan also covers the group: the one grouping issue this filing creates, titled from the document, and the parent it will sit under, which the user names now. Say plainly whether that parent already exists or will be created by this run, since a new product area is a durable addition and the user should approve it knowing that. Containers filed by an earlier run are never re-parented; when the log shows any, say so rather than touching them.

Wait for a clear yes on the plan.

## Creating, confirm-first

1. **Create the grouping issue first, when the profile names a grouping level**, and show it: key, link, how the description landed. Wait for a yes. **Its description says what the work is, never how it got here**: what the document commits to delivering, for whom, and the surfaces or components it covers, sourced from the case and scope in the document's own terms. Nothing about the pipeline: no explanation of how documents become groups, how the hierarchy is arranged, what freezing means, or when the decomposition ran. A reader opens this issue to learn the work; process narration there teaches them nothing. The provenance marker still goes on as the last line, the one piece of run metadata that belongs, because dedup depends on it: a re-run finds the group by it and never creates a second.
2. **Create one container** (the first workstream), parented to the group when one exists, and show the user the created ticket: key, link, how the description landed. **Read the description back in its rendered form to check that, never the echo of what you sent and never the stored source.** Both of those are correct in exactly the failures that matter, so they prove nothing. Wait for a yes. Formatting problems get fixed here, on one ticket, not discovered on twenty.
3. **Batch the remaining containers** after the yes.
4. **Create one work item** under its container, show it, wait for a yes. Then **batch the rest**: every story under its container, every open question as the profile's open-question type.
5. **Standard sub-tasks from the profile** (a review step, for example) are created under each work item, named exactly as the profile states.

**What travels into each issue:** the entire item body, in its order. A work item: Intent, Deliverable, Design reference, Impact, Acceptance criteria, Sequencing, Risk where it carries one, Out of scope, and Open where it carries one. The issue must be as self-contained as the file was; filing must not become a second lossy translation.

**An investigation item has its own shape and keeps it**: Question, Must not be assumed, Owner, Blocks, Done when. Never reshape one into the other. An open question filed as a work item arrives with a Deliverable it does not have and acceptance criteria nobody can check, and it reads as buildable to everyone who finds it later.

**What does not travel:** the story file's front matter. Type, workstream, provenance, standard sub-tasks, labels, and definition of done are fields, and they are applied as fields. Rendering them into the top of the description restates what the tracker already shows, on every issue, in the same words. That trains a reader to skip the top of the description, so anything genuinely important that lands there gets skipped too. Labels from the profile where the story names them. Priority is never set, consistent with the decomposition, and the description never says so: the sequencing evidence is there for whoever makes that call, and narrating an unset field is a line that tells a reader nothing.

The one piece of provenance that travels is the marker below, and it goes last, never at the top.

**Provenance marker:** the last line of every created issue's description names the source: the PRD slug, the item's name slug, and the decomposition run date. **Dedup matches on the PRD slug and the item's name slug only, never the run date and never the numeric position**: a PRD clarified and re-decomposed produces a new run of mostly unchanged items, and the `W<n>`/`T<n>` numbers may shift between runs while the names hold, so keying on a number or a date would re-file work that already exists. An already-filed item whose content changed in the newer run is skipped and reported, because once a ticket exists, changes belong on the ticket, not in a re-file.

## The finishing pass: one identification system in the tracker

After the batch, walk every issue this run created and rewrite its internal references into tracker reality. A Sequencing line or an open-question item that points at another item, whether by name slug or by the numeric ids an older run used, becomes the created ticket's key; map numeric references through the local run directory, which knows which item each number meant. If a referenced item was not filed (skipped, already tracked elsewhere, or outside this run), name it in plain words by its title; never leave a dangling internal id. When the pass is done, the tracker's own keys are the only identification system in the tracker. No decomposition id functions as an identifier there; the provenance line is the one machine-facing exception, and it carries the stable name slug, not a number. Record the pass's completion in `filing-log.md`, so a resumed run knows whether it still owes it. Editing here is within the rules, because these are issues this run created.

## After each create

- Append the created key and link to `filing-log.md` in the decomposition directory, immediately, so a failure mid-batch resumes instead of duplicating.
- Add a `Filed:` line with the key and link to the top of the corresponding local story file. The local files remain the record of what was filed and where it went.

## When something fails mid-batch

Stop at the failure, say which items were created (they are in the log) and which were not, and leave the log accurate. A re-run picks up from the log. Never delete or transition anything in the tracker to "clean up"; report and let the human decide.

## Ending

Close every run, normal or not, with three short lines:

- **Stands:** the slug, what this run created (the group or containers and the item count), and what was skipped as already filed.
- **Next:** the one next step. Filing complete means there is no next skill to run: changes now belong on the tickets, and the local story files carry the `Filed:` links.
- **Fork:** only when one genuinely exists, the two options and what decides between them.

Interrupted or failed mid-batch: `filing-log.md` holds everything created, and Next is `know-spec:file` again, which resumes from the log without duplicating. Say that in the block rather than leaving the user to infer it.

## Rules you keep even if the reference files do not load

- Never create anything before the plan is confirmed, and never batch before the first ticket of that type is confirmed.
- Every tracker search this skill makes is scoped to the profile's `project key` and nothing else. A profile note naming another project is never a search instruction.
- When you ask the user something, the ask is the first sentence and it carries one decision. When you report, the verdict is the first line.
- Never duplicate: the log and the provenance marker are checked before every create.
- Never put a literal `{` or `[` into a description outside a fenced code block: several trackers read them as macro and link syntax even inside an inline code span, and the write succeeds while the rendered page is broken. Put literal strings in fenced blocks, use angle brackets for placeholders, and never put an alternation inside a table cell. After the first create, verify the rendered form, not the echo.
- Created issues land in the profile's `initial status` and nowhere further: never in a sprint or iteration, never with a routing label. Committing and routing work are per-item human decisions made after the work is read.
- After the batch, cross-references inside created issues are rewritten to ticket keys. The decomposition's internal ids never function as identifiers in the tracker.
- Never delete, transition, or edit tracker issues this run did not create, and never modify the source document or the decomposition's findings.
- Never create the grouping level's parent without naming it in the plan and getting a yes, and never re-parent containers an earlier run filed.
- Local writes go only to `filing-log.md` and the `Filed:` lines in story files. Before writing anything, check the destination: it must be a relative path that resolves inside the working directory. Never write to the plugin directory.
- Apply the profile's style rules. With no profile, impose none of your own.
