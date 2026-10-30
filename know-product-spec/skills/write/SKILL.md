---
name: know-spec:write
description: >-
  Assemble the PRD from the case and the contract answers, to the structure the
  confirmed shape requires, then test it by handing it to know-spec:decompose
  and reporting the result honestly. Keeps every section a reader expects,
  marking the ones that do not apply with a reason rather than dropping them.
  Never overwrites an existing document without showing a diff first. Use after
  know-spec:interview, or when someone asks to draft or assemble the PRD.
---

# Write: assemble the document

You are turning the case and the contract answers into the document an engineer builds from. You do not hand it over until it has been tested.

## Reference material

Read all of `${CLAUDE_PLUGIN_ROOT}/reference/`: `skeleton.md`, `shapes.md`, `authoring-rules.md`, and `profile.md`.

**If `skeleton.md` cannot be read, stop.** Say which path failed and that you will not draft without it. The skeleton is the document's structure, and a PRD assembled from a summary of it would look finished while missing sections nobody would notice were missing. That is worse than no document. If one of the other three fails, say so, name the path, and continue.

**Do not claim graceful degradation here.** The rules at the bottom of this file keep you honest; they are not a substitute for the structure.

## The project profile

Read `.know-product-spec/profile.md`. It is optional and every field has a default.

- **Missing:** use the defaults described in `reference/profile.md`, and mention once that a profile can be created. Never require one before doing useful work.
- **Present:** its values win over the defaults for destinations, output vocabulary, style rules, reviewer routing, standard sub-tasks, labels, and definition of done.
- **Present but unparseable:** name the file and the field you could not read, use defaults for the rest, and say which values you fell back on. Do not guess what a broken field meant.

## Preflight

1. Read `state.md` for the slug and shape. Multiple slugs: list and ask. One: use it and say which.
2. Read `case.md`. **No case means no PRD.** Say what is missing and offer `know-spec:discovery`.
3. Read `contract-notes.md`.
4. If `state.md`'s `workflow_stage` reads `superseded`, refuse to write, name the successor, and offer a read-only review.
5. If `PRD.md` already exists, the mutation contract below applies before anything is written.
6. Read the fixtures under `${CLAUDE_PLUGIN_ROOT}/reference/exemplar/` for the target quality. If they are unreachable, say so and key the acceptance criteria to named states instead.

## The mutation contract, when a PRD already exists

In this order, and the order is not negotiable:

1. Show a diff of what will change.
2. Say this, and wait for a clear yes:

   > A PRD already exists at [path], last changed [date]. I can revise it in place, which shows you the diff first and keeps a copy in `history/`, or start a new one under a different name. Which do you want?

3. Copy the current file to `.know-product-spec/<slug>/history/<utc-timestamp>-PRD.md` and confirm it landed. History always lives there, even when the profile's `prd_home` puts the PRD itself somewhere else in the workspace: only the PRD moves, never its history.
4. Only then write `PRD.md`.

A decline, an ambiguous answer, or a failed history copy all mean no write. Say why.

## Assembling

Follow the skeleton for the confirmed shape. Order and presence matter; numbering does not.

- **Every section the shape requires is present.** A section that does not apply is kept with a one-line "does not apply because ...". Never silently drop one. The case is the one section that can never be omitted.
- **Every open item from the interview goes in §0** with its question, what it blocks, a named owner, and what must not be assumed.
- **If the case was overridden**, carry the unresolved case into the document as a risk row, with the failed layer, the settling evidence, and the override's date and attribution. Do not soften it.
- **Do not invent.** If assembly reveals a gap the interview missed, it becomes a §0 item, not a plausible sentence. This is the rule that matters most.
- **No self-narration.** The document states the contract. Provenance lives only in the header's Last updated line and the resolutions log.
- **Sourced numbers only.** Any figure carries its source or is marked a placeholder.

Then write `state.md` with `workflow_stage: drafted`.

## Testing it, before you hand it over

First run the mechanical sweep on the assembled draft: `node "${CLAUDE_PLUGIN_ROOT}/tools/prd-lint.mjs" <prd path> <design files> --accepted .know-product-spec/<slug>/lint-accepted.txt`, with the design files the document's header names when they resolve locally. Fix what it finds from the contract answers you already hold. If Node is missing or the script cannot be read, say so in one line and continue; never imply the check ran when it did not.

Then invoke `know-spec:decompose` on the document you just wrote. It reports in plain language, what was found, why it matters, what it means, what to do next, with the scores and findings as detail underneath. Relay that report whole; do not re-summarize it into density.

Then say this, with the count and list filled in:

> I decomposed this PRD into [workstreams and tasks] to test it, and I had to make [N] product decisions the document neither states nor flags as open. Whoever builds this will make those same calls, and they will not make them the same way. [List, each naming the section that should own it.] The full decomposition is in `decomposition/`.

**Report the count even when it is bad.** Fix what you can from the contract answers you already have. For anything you cannot fix without asking, offer to return to `know-spec:interview` for the missing sections only. That is a gap in the contract, and it is a different move from `know-spec:clarify` routing back to discovery, which is a failure of the premise. Never collapse the two.

## Ending

Close every run, normal or not, with three short lines:

- **Stands:** the slug, its `workflow_stage`, and the stage the decompose test just measured.
- **Next:** the one next step, with the exact invocation to run.
- **Fork:** only when one genuinely exists, the two options and what decides between them.

Below the gate, Next is `know-spec:clarify` with the test run's findings as the agenda. At Backlog-ready or above, the fork is `know-spec:file` to commit the work or `know-spec:clarify` to tighten further. An abnormal exit (aborted, refused, interrupted) still ends with this block, plus one line naming what survived on disk and that the Next invocation resumes from it.

## Rules you keep even if the reference files do not load

- No case, no PRD.
- When you ask the user something, the ask is the first sentence and it carries one decision. When you report, the verdict is the first line.
- Never invent; gaps become §0 items with what must not be assumed.
- Never silently drop a section, and never silently overwrite a document.
- Before writing anything, check the destination: it must be a relative path that resolves inside the working directory. Refuse an absolute path, a path that escapes through `..`, a symlink that resolves outside, and any URL. Say which rule refused it and do not fall back to a default location. Never write to the plugin directory.
- A `prd_home` URL is a graduation instruction, never a write target. Write the PRD in the workspace and say where it graduates to.
- The diff-and-confirm-and-preserve sequence protects the PRD. `state.md`, `contract-notes.md`, and `decomposition/` are working artifacts and get rewritten as the work proceeds. Say that plainly if a user asks; do not imply everything is versioned.
- Never hand over a draft that has not been decomposed.
- Apply the profile's style rules. With no profile, impose none of your own.
