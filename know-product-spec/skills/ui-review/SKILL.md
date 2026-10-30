---
name: know-spec:ui-review
description: >-
  Decide whether a filed story and every surface it needs can go into
  implementation without someone inventing product or design decisions.
  Reconstructs the required journey from the story rather than trusting the
  list of surfaces it was handed, then opens each one in a browser and exercises
  it, because a state can be present in the markup, correctly wired, and still
  never reach a person. Reviews both directions: the state a story names that no
  surface implements, and the treatment a surface grew that no story covers.
  Returns Ready, Conditionally ready, Not ready, or Unable to verify, with every
  finding traced to a contract and preference never counted as a defect. Writes
  nothing to the tracker. Use before grooming a sprint or a roadmap, when a
  design and its stories may have drifted, or to decide whether a story can be
  picked up.
---

# UI review: can this story be built

You are deciding one thing: **could someone implement this story without inventing material product or design decisions?** Everything below serves that question.

The story is the behavioral contract. The design system is the interface contract. A surface that satisfies neither is a defect; a surface that satisfies both and you personally dislike is not.

**You reach that judgment by rendering surfaces and exercising them, never by reading their source.** A state can be present in the markup, correctly toggled, and still never reach a person, because the surface's own styling outranks the mechanism meant to reveal it. Every source-based method reports that as healthy. It is the defect class this skill exists for.

**It writes nothing to the tracker.** `know-spec:groom` owns writing onto filed work, and a finding usually needs presenting as a concrete scenario before it is worth writing down. That split is why this can be run cheaply and often.

## Reference material

Read `${CLAUDE_PLUGIN_ROOT}/reference/surface-review.md`, `${CLAUDE_PLUGIN_ROOT}/reference/browser-protocol.md`, `${CLAUDE_PLUGIN_ROOT}/reference/filed-work.md`, and `${CLAUDE_PLUGIN_ROOT}/reference/legibility.md`.

**If `surface-review.md` cannot be read, stop.** Say which path failed and that you will not return a readiness verdict without the contract behind it. The evidence classes, the severity model, the rule that traces every finding to a contract, and the completion gate all live there, and a verdict improvised from a summary would carry the instrument's authority without being it. If `browser-protocol.md` fails, say so and apply this file's own runtime rules, which are the load-bearing subset. If either other file fails, name it and keep going.

## The project profile

Read `.know-product-spec/profile.md`. It is optional and every field has a default.

- **Missing:** use the defaults described in `reference/profile.md`, and mention once that a profile can be created. Never require one before doing useful work.
- **Present:** its values win over the defaults for destinations, output vocabulary, style rules, reviewer routing, standard sub-tasks, labels, and definition of done.
- **Present but unparseable:** name the file and the field you could not read, use defaults for the rest, and say which values you fell back on. Do not guess what a broken field meant.

Four fields carry this skill. **`worked_example`** names where the surfaces live and is the only place you look for one; when it names a scratch or exploration area, that area is never a design reference. **`design_system`** names the interface contract's sources and their authority order. **`style`** carries the terms banned from user-facing copy, which the content check applies. **`tracker_connection`** names the project key every search is scoped to.

**Two of those are required, so this skill is an exception to the profile being optional**, the same way `file` and `groom` are. Without a `worked_example` there is nothing to review a story against, and guessing a designs directory is worse than asking: say so and stop. Without a `project key` you cannot scope a search, and an unscoped search across a tracker is never the fallback: say so and stop. A missing `design_system` is not a stopping condition; fall back to current analogous surfaces and say in the report that conformance was judged against those rather than against a documented system.

## Preflight

1. **Resolve the input.** A story, a set of stories, or a grouping-level item you resolve to its stories. Scope every tracker search to the profile's `project key` and nothing else.
2. **Establish the product contract.** Read each story, its acceptance criteria, and anything it references. Classify every statement you extract as an explicit requirement, a confirmed implication, your own assumption, or an open decision. **An assumption is never a requirement.** Where sources conflict, record the conflict rather than quietly picking a reading.
3. **Establish the interface contract.** Locate the design system's sources in the authority order the profile names, plus one to three current analogous surfaces.
4. **Get the surfaces served, and confirm it.** Start or detect a server over the `worked_example` directory, load one surface, and confirm it renders before going further. Say which base URL the run used.
5. **Report the scope** before reviewing: the stories, the surfaces they name, the base URL, and any story whose design reference names nothing. That last one is already a finding.

## Reconstruct the journey, and do not trust the list

**Derive the surfaces the story requires from the story, not from what exists.** The list you were handed is evidence about what somebody drew, never about what the work needs. A surface nobody drew is the finding this step exists to produce, and it is invisible to any method that starts from the file system.

Map entry through completion, cancellation, failure, and recovery. Consider entry and landing surfaces, workflow steps and detail surfaces, modals and drawers and confirmations, the state set from the review contract, permission-restricted and read-only behavior, destructive actions and their reversal, responsive behavior, resume and refresh and return, and downstream destinations.

States are obligations of their parent surface. Promote one to its own surface only when it owns a real task or interaction contract of its own.

## The run directory

Write to `.know-product-spec/ui-review/<run-id>/` in the working directory. **The run id is the date plus a slug for the scope**, so two reviews of the same scope on one day do not overwrite each other. Record the scope's definition in `run.md` and match on that when looking for an existing run.

```
<run-id>/
├── run.md            the scope, the stories, the base URL, when it started
├── requirements.md   stable ids, exact source, type, owner, affected surfaces, status
├── surfaces.md       trigger, intended person and outcome, requirement ids, required
│                     states, expected pattern, source path and live route, status,
│                     and whether the story required it or the file system offered it
├── issues.md         severity, class, evidence level, surface, contract reference,
│                     exact evidence, impact, proposed correction, the observable check
│                     that proves it fixed, owner
├── decisions.md      the precise question, the conflicting evidence, affected
│                     requirements and surfaces, two or three options, likely owner,
│                     whether it blocks
├── derivations/      one file per journey reconstruction, written before comparing
└── report.md         the readiness report
```

**Write each of these to disk as you go, not at the end.** They are the review's state, and an interruption that loses the queue, the evidence mapping, or which surfaces were already exercised means the next invocation restarts while calling itself a resume. Screenshots kept as evidence live here too, named so a finding can point at one.

**On resume, read the run directory before doing anything.** Report what was already reviewed and what is still queued. Never reclassify a surface a previous session settled without saying you are doing it and why.

## The review queue

For each surface in the queue: map the requirements it owns, assess it against both halves of the review contract, **open it and exercise it per the browser protocol**, record the evidence, assign a status, and **add every newly discovered surface, state, transition, and dependency to the queue.**

Continue until the queue is empty. A queue that keeps growing is the review working, not failing.

Re-review anything that changed during the run.

## The cross-surface pass

Then exercise the whole thing as one journey. Every requirement lands somewhere. Every surface has an entry and an outcome. Back, cancel, close, retry, and recovery behave consistently. Terminology holds. Drafts, selections, and context survive where required. Permissions stay consistent. Success and error use the established patterns. Required functionality survives the responsive transitions. Nothing points at an unspecified destination or depends on an unowned component, asset, or content decision.

Requeue whatever the integration pass breaks.

## The stability pass

When the queue is empty, **re-read the stories and reconstruct the journey again, writing the new derivation to `derivations/` before you look at the first one.** Then compare the two files. Writing it down first is what makes this a second derivation rather than a recollection of the first: an agent that re-reads while holding its own inventory in mind finds nothing new every time, and the original omission survives both passes and becomes evidence of completeness.

If that reveals another required surface, state, transition, or dependency, the review is not finished. Requeue and repeat. The inventory holding still across two independent derivations is the only real evidence that it is complete.

## The adversarial gate

A confident readiness verdict is worth challenging. When the profile names an independent reviewer command, use it.

**Trigger it when the verdict is Ready or Conditionally ready and any of these hold:** the story spans several surfaces or steps; the workflow involves permissions, destructive actions, money, or sensitive information; a P0 or P1 was found and then resolved; confidence is below high; requirements conflict or stay materially ambiguous; a surface introduces an undocumented deviation; or material runtime behavior could not be verified.

Skip it for a single low-risk surface with explicit requirements, established patterns, complete runtime evidence, and high confidence. Skip it when a human-owned blocker already makes the story not ready and a second opinion cannot change the next action. **Record the trigger or the skip reason either way.**

Hand over a cold packet: the stories and criteria, the resolved routes, the design-system references, the ledgers, the screenshots and raw runtime evidence, and the environmental limits. **Withhold your verdict, your findings, your proposed fixes, and any summary that leads.** Ask it to disprove readiness and to find the cheapest way someone could implement this incorrectly while still appearing to satisfy the written criteria. Tell it not to propose a visual direction and not to edit anything.

Validate everything that comes back against the contracts and the evidence, and classify each as accepted, partially accepted, rejected with the contradicting evidence recorded, decision required, or unverifiable. **Never accept a finding just because an independent reviewer produced it.** Accepted findings update the ledgers and requeue surfaces.

Two rounds at most: the cold pass, and one focused pass after material P0 or P1 corrections. If evidence-backed disagreement survives that, keep both positions, name the disputed contract and its human owner, and return Conditionally ready or Not ready. Do not stage a debate.

If no reviewer command is configured or the call fails, say `Independent adversarial review: unavailable` and why. **Never imply a second review happened when it did not.**

## The report

Lead with the verdict, its confidence, and the one next step. Then the evidence behind it.

**Scale the report to the verdict.** A story that is not ready because a surface does not exist needs the verdict, that finding, and its owner, not a full inventory of what was fine. Reserve the complete write-up for a story being called ready, where the claim has to carry its evidence.

At full depth: the intended journey; the surface inventory with status and runtime evidence per row; requirements coverage with counts by status; what is working, named specifically and tied to evidence; contract conflicts; the three to five most consequential issues, each with severity, class, evidence level, contract reference, exact evidence, impact, correction, observable check, and owner; design-system deviations classified; the runtime evidence per the browser protocol's record; the adversarial gate's status; copy-ready proposed story changes, never applied; and human decisions, each with the question, the options, and the owner.

**Opinions go last, in their own section, unranked.** They are not defects, they carry no severity, and they never move the verdict. Say plainly that they are taste and that ignoring them costs nothing.

Write the report to `report.md` in the run directory. Say where it landed.

**A finding with no evidence is not a finding.** Quote what the story says and what you observed, and point at the screenshot or route behind it.

## Ending

Close every run, normal or not, with three short lines:

- **Stands:** the verdict and its confidence, the surfaces reviewed and how many were discovered rather than supplied, the states exercised, and the issue counts by severity.
- **Next:** the one next step, with the exact invocation to run.
- **Fork:** only when one genuinely exists, the two options and what decides between them.

Findings needing a decision or a story edit means Next is `know-spec:groom` with this report as the input. A verdict of Ready means Next is the work itself. Unable to verify means Next is whatever unblocks the evidence, named exactly. An abnormal exit still ends with this block, plus one line naming where the partial report landed and that the Next invocation resumes from it.

## Rules you keep even if the reference files do not load

- Evidence comes from a rendered, exercised surface. Never from reading its source, and never from a diff of markup against story text.
- Never execute script in the page to bypass the interface, never call internal functions to manufacture a state, and never treat presence in the DOM as proof of behavior.
- A screenshot must be read. Capturing one is not inspecting it.
- Derive the required surfaces from the story. The list you were handed is never assumed complete.
- The inventory must hold still across two derivations, each written down before being compared. A re-read held against memory is not a second derivation.
- Write the run state to disk as you go. Resumability that depends on what you still remember is not resumability.
- Review both directions. A one-directional pass will confidently correct a design toward an abandoned contract.
- Every material finding traces to a requirement, a design-system contract, an established pattern, an accessibility requirement, an observed failure, or a contradiction among them. Everything else is an opinion, and opinions never become defects.
- Never phrase an inference as an observed failure. Evidence level and severity are independent.
- Never declare Ready with an unresolved P0 or P1, or with material runtime behavior unverified.
- Never invent requirements, personas, permissions, or new design-system primitives.
- Write nothing to the tracker. Not an edit, not a comment, not a label.
- Never modify the surfaces. This skill reads designs; it does not edit them.
- Stop and hand over when the only thing left needs authority you do not have.
- Every tracker search is scoped to the profile's `project key` and nothing else. A profile note naming another project is never a search instruction.
- When you ask the user something, the ask is the first sentence and it carries one decision. When you report, the verdict is the first line.
- Before writing anything, check the destination: it must be a relative path that resolves inside the working directory. Refuse an absolute path, a path that escapes upward, a symlink that resolves outside, and any URL. Say which rule refused it and do not fall back to a default location. Never write to the plugin directory.
- Apply the profile's style rules. With no profile, impose none of your own.
