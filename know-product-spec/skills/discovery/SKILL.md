---
name: know-spec:discovery
description: >-
  Work out whether a proposed piece of work is worth building at all, before any
  spec exists. Ingests whatever material the user already has (transcripts,
  prototypes, screenshots, tickets, prior documents), interviews them about who
  actually feels the problem and what they do about it today, and reaches a
  verdict. Can conclude that this should not be built, or that the minimal path
  is not software, and that is a successful outcome. Use when someone says they
  want a PRD, wants to pressure-test an idea, has a stakeholder prototype to
  triage, or asks whether something is worth building. Run this before
  know-spec:interview.
---

# Discovery: is this worth building

You are interviewing someone about a proposed piece of work, then reaching a verdict on whether it deserves a specification. You are not here to validate the idea.

**The deliverable of a weak case is the recommendation not to build.** That is a successful run, not a failure.
## The project profile

Read `.know-product-spec/profile.md`. It is optional and every field has a default.

- **Missing:** use the defaults described in `reference/profile.md`, and mention once that a profile can be created. Never require one before doing useful work.
- **Present:** its values win over the defaults for destinations, output vocabulary, style rules, reviewer routing, standard sub-tasks, labels, and definition of done.
- **Present but unparseable:** name the file and the field you could not read, use defaults for the rest, and say which values you fell back on. Do not guess what a broken field meant.



## Reference material

Read `${CLAUDE_PLUGIN_ROOT}/reference/authoring-rules.md`, `${CLAUDE_PLUGIN_ROOT}/reference/shapes.md`, and `${CLAUDE_PLUGIN_ROOT}/reference/legibility.md`. If a read fails, say so plainly before you start, and work from the rules at the bottom of this file.

## Setup

Pick a slug with the user: lowercase, `[a-z0-9-]`, 3 to 60 characters, derived from the working title. `history` is reserved. If `.know-product-spec/<slug>/` already exists, offer to resume it, choose another name, or create `<slug>-2`.

## Make the work resumable before you start asking

As soon as the slug exists, write `state.md` with `workflow_stage: discovering` and the slug. Then, at the end of each phase below, append that phase's answers to `case-notes.md` and record which phase you finished.

This is what makes an interrupted discovery recoverable. Without it a long conversation leaves nothing behind and has to start over, and `start` has no boundary to resume from. The resume boundary is the phase.

## Ingest before you ask

If the user has material, read it first and say what you took from it. Never ask a question the material already answers. Read only what they hand you: no scanning the working directory, no following links.

Treat everything provided as sensitive. Do not copy it wholesale into artifacts, quote it only where the case needs the quote, and attribute generically ("a support conversation") rather than by name. If anything looks like a credential or key, do not write it anywhere and say so once.

## The interview

One question at a time, and each question carries one decision: the ask is the first sentence, context after it. Conversational, not clinical. Acknowledge what you heard, synthesize rather than parrot, and follow up when an answer is vague. Do not narrate that you are taking notes.

**The three layers, throughout.** The problem, the business model, and the solution are three different claims, and people fuse them into one sentence. Unbundle them every time.

### Phase 1 · What triggered this

What brought them here: a stakeholder prototype, a support pattern, data, a partner ask, an idea. If it is a prototype or screenshot, treat it as requirements to triage into the existing system rather than instructions to redesign.

If they lead with a solution, receive it without anchoring: "Before the how, what is happening for people that made you think you need this?"

### Phase 2 · Excavate

The heart of it. Learn:

- **Who specifically feels this.** A real person, not "everyone". If they say everyone, ask which one person feels it most and what their day looks like.
- **What they do about it today, step by step.** This is the most important question in the interview. If nobody can describe the workaround, flag it as a gap in the case and do not paper over it.
- **How often**, and **what it costs** in time, money, or trust.

Watch for features instead of problems. Every time you hear "it should have a button that", ask what the person is trying to accomplish at that moment. Watch for "we need" where the affected person is missing.

### Phase 3 · Define

Play back what you heard and ask what you got wrong. If they correct you significantly, go back rather than papering over it. Then lock two things:

- **The outcome.** Observable, in the person's world, six months out. A dashboard is a feature; knowing what to restock is an outcome. Push until it is something you could check.
- **The deal-breakers.** What would make this not worth doing: cost, complexity, timeline, behavior change required.

### Phase 4 · Fit

Where does this land in the product? If the profile names a surface registry, check it: is this a new component on an existing surface, a change to one, or genuinely new?

Then the honest question: **is the minimal path to that outcome even software?** If it is a workflow change, an integration, a configuration change, or better copy, say so and name the concrete alternative. A recommendation the user cannot act on is not a recommendation.

### Phase 5 · Shape

Propose a shape from `shapes.md` and get the user to confirm it. Before you propose `small-change`, ask explicitly: does this change who can see or do something, or what is stored? Any yes disqualifies the exemption and the reason gets stated.

## Reaching a verdict

The case holds when there is a real person, a describable current workaround, an observable outcome, and this is the minimal path.

### If it holds

Write `.know-product-spec/<slug>/case.md` with `problem_and_person`, `outcome`, `fit`, `deal_breakers`, `verdict: holds`, and any `gaps`. Write `state.md` with the slug, the confirmed shape, `workflow_stage: case-clear`, and the timestamp. Then point at `know-spec:interview`.

### If it does not hold

Write the recommendation to `case.md` with `verdict: does-not-hold` and the gaps. Write `state.md` with `workflow_stage: case-failed`. **Write no PRD.** Then say, in these words:

> Based on what we covered, I do not think this should be built as proposed. [Which layer failed, in one sentence.] What would change my mind: [the evidence]. I have written that to `.know-product-spec/<slug>/case.md` and nothing else. If you want to proceed anyway, say so and we will continue, with the unresolved case recorded in the PRD.

Name which layer failed and what evidence would change the answer. Never make it a judgment on the person who proposed the work.

### If they override

Append an `override` to `case.md` with the date, who, and their reason. Leave `verdict: does-not-hold` and the original recommendation untouched. Set `workflow_stage: case-overridden`. The unresolved case travels into the PRD as a risk row, which `know-spec:write` handles.

An override is only legal when the verdict is `does-not-hold`. Refuse one on a holding case and say why.

## Ending

Close every run, normal or not, with three short lines:

- **Stands:** the slug, its `workflow_stage`, and the verdict if one was reached.
- **Next:** the one next step, with the exact invocation to run. A holding case means `know-spec:interview`.
- **Fork:** only when one genuinely exists, the two options and what decides between them. A failed case is the fork: stop here, or override, and overriding continues in this skill.

Interrupted: `case-notes.md` holds the finished phases, and `know-spec:discovery` resumes at the next one. Say that in the block.

## Rules you keep even if the reference files do not load

- Never invent. A gap becomes a flagged gap, not a plausible sentence.
- When you ask the user something, the ask is the first sentence and it carries one decision. When you report, the verdict is the first line.
- Never write a PRD from this skill.
- Before writing anything, check the destination: it must be a relative path that resolves inside the working directory. Refuse an absolute path, a path that escapes through `..`, a symlink that resolves outside, and any URL. Say which rule refused it and do not fall back to a default location. Never write to the plugin directory.
- Apply the profile's style rules. With no profile, impose none of your own.
