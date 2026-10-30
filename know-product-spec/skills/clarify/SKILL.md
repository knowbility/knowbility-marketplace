---
name: know-spec:clarify
description: >-
  Fold new information into an existing PRD when research, an engineering answer,
  user testing, or a changed constraint alters something the document assumed.
  Works out whether the change touches the premise, the scope, or a contract
  detail, asks what is ambiguous, shows a diff before writing, sweeps every
  section that referenced the changed thing, logs the decision, and re-scores on
  request. Says so plainly and routes back when the new information breaks the
  case instead of editing scope around it. Also runs the resolution session
  after a decompose, triaging the run's findings into decisions only the user
  can make, resolutions with a recommendable default, and questions that park as
  owned open items, then applying everything in one batched pass, including for
  a PRD written outside this plugin. Use when a PRD needs updating after
  something changed, or when a decomposition's findings need resolving.
---

# Clarify: fold in what changed

A PRD is revisited far more often than it is written. Your job is to make revisiting cheap without letting the document drift into contradiction, and without turning a working session into an interrogation. The stage is a measure. Filed work is the goal.

## Reference material

Read `${CLAUDE_PLUGIN_ROOT}/reference/`: `skeleton.md`, `authoring-rules.md`, `legibility.md`, and `profile.md`.

**If `skeleton.md` cannot be read, stop.** Say which path failed and that you will not revise a document without the structure it is supposed to have. Revising sections without knowing which sections exist is how a sweep misses one. If another read fails, say so, name the path, and continue.

## The project profile

Read `.know-product-spec/profile.md`. It is optional and every field has a default.

- **Missing:** use the defaults described in `reference/profile.md`, and mention once that a profile can be created. Never require one before doing useful work.
- **Present:** its values win over the defaults for destinations, output vocabulary, style rules, reviewer routing, standard sub-tasks, labels, and definition of done.
- **Present but unparseable:** name the file and the field you could not read, use defaults for the rest, and say which values you fell back on. Do not guess what a broken field meant.

## Preflight

1. Read `state.md` and `PRD.md`. **When the slug has no plugin-authored `PRD.md` but its decomposition names a source document elsewhere in the workspace** (a PRD written outside this plugin and decomposed here), clarify runs against that file with the full discipline below; history copies still land in the slug's `history/`. Say one thing plainly at the start in that case: if the file is an export whose canonical copy lives elsewhere, this plugin cannot write there. Iterating locally is fine, and cheaper: clarify and re-grade against the local file as many rounds as it takes. Carrying the changes back to the canonical copy is the one step between grading ready and filing, done once, so the work that gets filed matches the document of record. **No PRD and no such source means there is nothing to clarify.** Say so and route to the right earlier step.
2. If `state.md`'s `workflow_stage` reads `superseded`, refuse to write, name the successor, offer a read-only review.
3. Read the existing `decomposition/` if there is one, so you know what was already found.
4. If you have folded in identical information before, detect it by the digest recorded in the resolutions entry. Say it already applied and when, and do not write again.

## Where the questions come from

Two ways in. Either the user arrives holding new information (research, an engineering answer, user testing, a changed constraint), or they arrive after a decompose whose findings need resolving. The first case classifies the change and applies it with the discipline below. The second case is the resolution session. When the decomposition's tracker check matched existing tickets, re-print those matches at the top of the session, because a ticket that already answers a finding is the cheapest resolution in the room.

## The resolution session

The newest run's findings are the agenda. The session's job is to clear the whole agenda in one write, not to hold a meeting per item. Most findings do not need an answer from the user at all. They need a recorded default or a named owner, and the rubric says so: a finding parked in §0 with an owner is not an invented decision, it is an open item the document declares on purpose.

Findings from a run made under an older ruleset arrive without blocking or deferrable tags. Assign the tag during triage; it falls out of the same sort.

**1. Triage.** Sort every invented decision and unowned open item into three buckets:

- **User-owned.** No defensible default exists; this is genuinely the owner's call. Which persona ships first is user-owned. Whether an error message says "try again later" usually is not.
- **Recommendable.** A defensible default exists. State it, with one line of why.
- **Parkable.** The honest resolution today is an owner and an investigation, not an answer. These become §0 items with a named owner and a what-must-not-be-assumed line. Parking is a resolution, never a skip.

A finding that contradicts the case's outcome leaves the buckets entirely. It is a premise problem: name it at the top of the agenda, route it to `know-spec:discovery`, and apply nothing that depends on it. Never batch a broken premise in with copy fixes.

**2. The agenda, whole and up front.** One message before any question: each bucket's items, the recommendation for each, and the one-line rationale. The user can move items between buckets, pull a recommended default out for a real question, or drop items. A mis-triaged item costs one line to move here and a rewrite later, so this is where corrections are cheap.

**3. Ask only what only the user can answer.** The user-owned decisions go out as batched questions, up to four per call, with the recommended option marked when one exists. Parkable items need one thing each, an owner's name; ask for those together, with the document's author offered as the default. Recommendable defaults are taken as recommended unless the user pulled one out at step 2. An item the user skips stays open, and the session says so at the end.

**4. One write.** Apply every accepted resolution together, with the full discipline of Apply it below: one combined diff, one clear yes, one history copy, then the write, the sweep across everything the batch touched, one dated resolutions entry listing every decision made this session, and the contract-notes appends for every superseded answer. The mutation contract is per write, and a session makes one write.

**5. A partial no.** Nothing is written on a partial rejection. Drop the rejected items back to open, or revise them as directed, and show one revised combined diff for a fresh yes. If the reason behind the rejection breaks an item's premise, that item leaves the session for `discovery` like any other premise break.

**6. Close without re-grading.** Report what was answered, defaulted, parked, and skipped, and where the write landed. Do not re-run `know-spec:decompose` automatically. The stage claim survives by accounting: the newest qualifying cut's blocking list, minus what this session resolved or parked. Offer a re-score and say when it earns its cost: on request, or before filing, where only a fresh or independent cut establishes the stage claim. If this session rewrote whole sections rather than settling listed findings, say plainly that the accounting no longer covers the new text and a fresh cut is the honest basis.

## Classify the change first

Before touching anything, work out which layer the new information hits.

**Does it contradict the case's outcome?** Then the premise is at risk. Say so plainly and route to `know-spec:discovery`, carrying what broke and why. **Do not edit scope to accommodate it.** Absorbing a broken premise is the most expensive silent failure available here: the document keeps scoring well while describing work whose reason has evaporated.

Routing back to `discovery` is a failure of the premise. `write` routing back to `interview` is a gap in the contract. These are different verbs and must never collapse.

**Does it change scope, or a contract detail?** Then continue below.

**Is it ambiguous, or does it conflict with something the document states as decided?** Ask. Flag the contradiction rather than smoothing it. A mockup and a PRD that disagree get flagged, never silently reconciled.

## Apply it

1. **Show a diff** of what will change, and get a clear yes. In a resolution session this is the one combined diff for the whole batch.
2. **Copy `PRD.md` to `history/<utc-timestamp>-PRD.md`** and confirm it landed, before writing. Once per session's write, not once per item.
3. **Revise the affected sections.** State the new contract as though it had always been so. No account of the change in the body.
4. **Sweep every reference, and account for every hit.** List the terms the change touched: names, copy strings, class names, field names, section references. Search the document for each term and classify every hit: **updated**, **fixed here**, or **unaffected because**, with the reason. A hit with no classification means the sweep is not finished. Copy blocks, experience walkthroughs, prior-art tables, and worked-example descriptions are where stale statements survive. Show the accounting to the user with the diff.
5. **Run the mechanical sweep.** `node "${CLAUDE_PLUGIN_ROOT}/tools/prd-lint.mjs" <prd path> <design files> --accepted .know-product-spec/<slug>/lint-accepted.txt`, where the design files are the ones the document's own header names, when they resolve locally. Every new finding gets one of two treatments before this session closes: fix it in the document, or, with the user's explicit yes, add a line to `lint-accepted.txt` with the reason in a comment. Never close over an unexplained new finding. If Node is missing or the script cannot be read, say so plainly and rely on the accounting sweep above. Never imply the check ran when it did not.
6. **Log it.** A dated entry in the resolutions log if anything was decided, and a named pass on the header's Last updated line either way.
7. **Preserve the old answer upstream.** Append a dated superseded-answer entry to `contract-notes.md`. The PRD is authoritative once it exists, and the upstream notes are historical, so the old answer is kept rather than overwritten. Without this, a later re-derive silently reverses your work.
8. **Resolve or add open items.** An answered §0 item gets its answer written into the owning section and checked off with a date. A new unknown becomes a new §0 item with an owner and what must not be assumed.
9. **Re-score on request, not by reflex.** Do not invoke `know-spec:decompose` after every session. Offer it, and name the moment it matters: before filing, when the stage claim needs a qualifying cut behind it.

## Ending

Close every run, normal or not, with three short lines:

- **Stands:** the slug, its `workflow_stage`, the stage claim as accounted (the newest qualifying cut minus this session's resolutions), and what changed this session, including items skipped or parked.
- **Next:** the one next step, with the exact invocation to run.
- **Fork:** only when one genuinely exists, the two options and what decides between them.

Route on the accounted stage. Blocking findings remaining means another resolution session (`know-spec:clarify`); none remaining means the fork is `know-spec:decompose` for a qualifying cut or `know-spec:file` when one already backs the claim. When the premise broke, Next is `know-spec:discovery`, carrying what broke. An abnormal exit (aborted, refused, interrupted) still ends with this block, plus one line naming what survived on disk and that the Next invocation resumes from it.

## Rules you keep even if the reference files do not load

- Never absorb a broken premise into scope.
- Never narrate the change inside the document body. Provenance lives in the header and the resolutions log.
- Never overwrite the PRD without a diff, a yes, and a history copy first, in that order. One combined diff, one yes, one history copy per session's write, never one per finding. `state.md` and `decomposition/` are working artifacts and are simply rewritten; `contract-notes.md` is appended to, never replaced, so a superseded answer survives.
- Sweep every reference to the changed thing, not only the section that caused the change, and account for every hit found.
- Parking is a resolution. A finding that becomes a §0 item with a named owner is closed for this session's purposes; never force an answer where an owned open question is the honest state.
- When you ask the user something, the ask is the first sentence and it carries one decision. When you report, the verdict is the first line.
- Never invent. A new unknown becomes an open item.
- Before writing anything, check the destination: it must be a relative path that resolves inside the working directory. Refuse an absolute path, a path that escapes through `..`, a symlink that resolves outside, and any URL. Say which rule refused it and do not fall back to a default location. Never write to the plugin directory.
- Apply the profile's style rules. With no profile, impose none of your own.
