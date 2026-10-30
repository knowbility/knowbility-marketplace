---
name: know-spec:start
description: >-
  Entry point. Works out which documents already exist in this project and what
  each one needs next, then routes to the right skill. Creates the project
  profile on first run if the user wants one. Use when someone wants to write or
  work on a PRD and does not know which step they are at, when they ask where
  they left off, or when they just say they want to start.
---

# Start: find where you are, then go there

You are the front door. Do the smallest amount of work needed to get the user into the right skill.
## The project profile

Read `.know-product-spec/profile.md`. It is optional and every field has a default.

- **Missing:** use the defaults described in `reference/profile.md`, and mention once that a profile can be created. Never require one before doing useful work.
- **Present:** its values win over the defaults for destinations, output vocabulary, style rules, reviewer routing, standard sub-tasks, labels, and definition of done.
- **Present but unparseable:** name the file and the field you could not read, use defaults for the rest, and say which values you fell back on. Do not guess what a broken field meant.



## Reference material

You need almost none. Read `${CLAUDE_PLUGIN_ROOT}/reference/profile.md` if you are creating a profile. If that read fails, say so plainly and use the defaults below.

## Find the documents

**The filesystem is the source of truth.** Enumerate `.know-product-spec/*/` and read each `state.md`, whose `workflow_stage` field is what you route on. The `readiness_stage` field, when present, is the score from the last decomposition and is reported rather than routed on. There is no index file, deliberately, because an index eventually disagrees with the directories.

| What you find | What you do |
| --- | --- |
| No `.know-product-spec/` at all | Offer to start a new one. Mention a profile is optional |
| Zero slugs | Offer to create one |
| Exactly one slug | Use it, and say which one you picked |
| Several slugs | List them with stage and last touched, and ask |

Never offer a `superseded` slug for resumption. Do not count `history`, which is reserved.

If a slug's `state.md` is missing or unparseable but other artifacts exist, infer `workflow_stage` from which files are present, say what you inferred and from which files, and get confirmation before writing anything.

## Route by stage

| `workflow_stage` | Next step |
| --- | --- |
| nothing yet | `know-spec:discovery` |
| `discovering` | `know-spec:discovery`, resuming at the phase after the last one recorded in `case-notes.md` |
| `case-failed` | Nothing, unless they want to override, which `discovery` handles |
| `case-overridden`, `case-clear` | `know-spec:interview` |
| `interviewing` | `know-spec:interview`, resuming at the last completed section |
| `drafted` | `know-spec:clarify` to revise, or `know-spec:decompose` to re-score |
| `clarifying` | `know-spec:clarify`, resuming |
| `superseded` | Read-only review only. Point at the successor |

If someone arrives with no idea where they are, the honest opening question is what they have: an idea, a stakeholder's prototype, a support pattern, or a document that needs updating.

## When the artifacts predate the current ruleset

A slug whose newest decomposition's findings carry no blocking or deferrable tags was measured under an older ruleset. Say so in one line, treat the recorded `readiness_stage` as historical rather than current, and route to `know-spec:clarify` with the newest run's findings as the agenda: its triage assigns the tags, and the existing cut keeps its authority once the accounting is done. Never route such a slug to an automatic re-decompose; the migration costs one triage inside the resolution session it needed anyway.

## The profile

Optional, always. `.know-product-spec/profile.md`, and every field has a working default, so never make configuration a precondition. Offer it once, on first run, and mention it again only if the user hits something it would fix.

If they want one, walk the fields from `profile.md`: where PRDs live, whether the project has a surface registry, the tracker's words for planned work, house style, who reviews what, where worked examples live, standard sub-tasks, labels, and the team's definition of done.

## Ending

Even a run that only routed ends with three short lines, so the user knows what state the routing was based on:

- **Stands:** the slug picked, its `workflow_stage`, and its last recorded stage claim if one exists.
- **Next:** the one skill this run routed to, with the exact invocation.
- **Fork:** only when one genuinely exists, the two options and what decides between them.

## Rules you keep even if the reference files do not load

- Enumerate directories rather than trusting an index.
- When you ask the user something, the ask is the first sentence and it carries one decision. When you report, the verdict is the first line.
- Never guess which slug the user means when there are several.
- Never write an inferred state without confirmation.
- Never require a profile before doing anything useful.
- Before writing anything, check the destination: it must be a relative path that resolves inside the working directory. Refuse an absolute path, a path that escapes through `..`, a symlink that resolves outside, and any URL. Say which rule refused it and do not fall back to a default location. Never write to the plugin directory.
- Apply the profile's style rules. With no profile, impose none of your own.
