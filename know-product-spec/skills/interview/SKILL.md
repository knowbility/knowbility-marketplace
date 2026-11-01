---
name: know-spec:interview
description: >-
  Ask how a thing behaves, once it is settled that it should be built. Walks the
  contract questions the confirmed shape requires (every state, every action and
  what it writes, what happens when each piece fails, what data the surfaces
  consume, what the copy says), and parks anything nobody can answer as an open
  engineering question carrying the assumption that must not be made. Resumable
  section by section. Use after know-spec:discovery has established the case,
  and before know-spec:write.
---

# Interview: how it behaves

You are collecting the contract. The case is already settled; your job is the specification detail an engineer would otherwise have to invent.

Every question you fail to ask becomes an invented decision at decomposition, and then an unstated assumption inside somebody's implementation.
## The project profile

Read `.know-product-spec/profile.md`. It is optional and every field has a default.

- **Missing:** use the defaults described in `reference/profile.md`, and mention once that a profile can be created. Never require one before doing useful work.
- **Present:** its values win over the defaults for destinations, output vocabulary, style rules, reviewer routing, standard sub-tasks, labels, and definition of done.
- **Present but unparseable:** name the file and the field you could not read, use defaults for the rest, and say which values you fell back on. Do not guess what a broken field meant.



## Reference material

Read `${CLAUDE_PLUGIN_ROOT}/reference/skeleton.md`, `${CLAUDE_PLUGIN_ROOT}/reference/shapes.md`, and `${CLAUDE_PLUGIN_ROOT}/reference/legibility.md`. If a read fails, say so plainly and work from the rules at the bottom of this file. Never imply you read something you could not.

## Preflight

1. Read `state.md` for the slug and the confirmed shape (`workflow_stage`, `shape`). If several slugs exist, list them by stage and last touched and ask. If exactly one, use it and say which.
2. Read `case.md`. **If there is no case, do not fabricate one.** Say what is missing and offer to run `know-spec:discovery` first.
3. If the shape is `small-change`, do not run an interview. Say so, and collect only the affected contract sections.
4. If `contract-notes.md` exists, this is a resume. Restart at the last completed section block and do not re-ask anything already answered.
5. If `state.md` is missing or unparseable but other artifacts exist, infer `workflow_stage` from which files are present, say what you inferred and from what, and get confirmation before writing.

## What to ask

Only the sections the confirmed shape requires, per `shapes.md`. Do not ask a `system` PRD about copy. Do not ask a `problem-brief` for a state machine.

Work section by section, in skeleton order, and write each answer to `contract-notes.md` as you go so an interruption costs one section rather than the conversation.

The questions that matter most, because they are the ones drafts skip:

- **Every state.** What states can this be in, what triggers each, and what does each one render or do? Include the empty one, the loading one, and the ones that only happen when something is wrong.
- **Every action, and its write target.** For each thing a person or the system can do: what does it write to? An action with no write target is not specified. **And what does it announce** — when the action completes, changes something off-screen, or fails, what tells someone who is not watching that spot? "The button changes color" is not an answer.
- **Every failure.** For each thing that can fail or be absent: what happens? Which failures must fail closed because trust, money, or safety depends on them, and which can degrade gracefully? For a validation or input failure, two more: **which field is wrong, said in text** rather than by color or position alone, and **what the person does next** to recover.
- **Reachability.** How is each state reached, and by whom? What about a deep link, someone who should not have access, and something that does not exist? **Including by keyboard:** can every action here be reached and operated without a pointer, in what order, and where does focus go when a state changes — a dialog opens, a step completes, content replaces content? A keyboard path nobody specified is a keyboard path somebody will invent.
- **The data the surfaces consume.** For each field: its shape, where the truth lives, and how fresh it has to be. How the backend produces it is out of scope.
- **The copy.** The actual words. If some copy is owned elsewhere, say which and by whom. **Names count as copy:** any control whose meaning is carried by an icon, a position, or surrounding context needs its name written here, because nothing downstream will invent a good one. So does the text of each error, and the label of each field.
- **The structure, and what this surface inherits.** What the heading outline is and what the landmarks are, at the level of "these are the regions and this is the order," since that is a product decision and not a styling one. Then the presentation baseline — contrast, text resize and reflow, reduced motion, target size — which most products answer once in the design system rather than per PRD: name where it is answered, and specify it here **only** where this surface departs from it. "Inherited from the design system" is a complete answer; silence is not.
- **How you would know it worked.** The events or measures, each written as the question it answers.
- **What this changes about the runtime surface.** New endpoints, data classifications touched, auth or role changes, external services, cost drivers. "No change" is a valid answer and must be stated rather than inferred.

One question at a time, and each question carries one decision: the ask is the first sentence, context goes in bullets under it. Follow up on vague answers. If they get frustrated, the honest reason is that a spec that skips these becomes an implementation someone guesses at.

## When nobody can answer

Do not guess. Record it as an open item with three things: the question, which sections it blocks, and **what must not be assumed** in the meantime. Add a named owner who will answer it.

Tell the user you are parking it and what will not be assumed. Then continue to the remaining sections. A parked question is not a blocker.

## Finishing

When every section the shape requires has a block, and every unanswered question is parked as an open item, update `state.md` and point at `know-spec:write`.

## Ending

Close every run, normal or not, with three short lines:

- **Stands:** the slug, its `workflow_stage`, and which sections got their blocks this session.
- **Next:** the one next step, with the exact invocation to run. Every required section done means `know-spec:write`.
- **Fork:** only when one genuinely exists, the two options and what decides between them.

Interrupted: `contract-notes.md` holds every finished section, and `know-spec:interview` resumes at the first unfinished one. Say that in the block.

## Rules you keep even if the reference files do not load

- Never invent an answer. Park it instead.
- When you ask the user something, the ask is the first sentence and it carries one decision. When you report, the verdict is the first line.
- Ask only what the shape requires.
- `contract-notes.md` is the resume point. Write as you go.
- Before writing anything, check the destination: it must be a relative path that resolves inside the working directory. Refuse an absolute path, a path that escapes through `..`, a symlink that resolves outside, and any URL. Say which rule refused it and do not fall back to a default location. Never write to the plugin directory.
- Treat provided material as sensitive: no wholesale copying, generic attribution, and never persist anything that looks like a credential.
- Apply the profile's style rules. With no profile, impose none of your own.
