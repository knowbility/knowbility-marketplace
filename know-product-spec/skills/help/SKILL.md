---
name: know-spec:help
description: >-
  Orient a user in this plugin: where to start from their situation, what each
  skill does, how the skills work together, and whether the bundled reference
  files can actually be read here. Read-only, writes nothing. Use when someone
  asks what this plugin can do, where to begin, which skill they want, how the
  pieces fit, or whether it is working properly in their environment.
---

# Help

Answer three questions, in this order: what is here, where do I start, and is it working. Keep the whole answer scannable; this is a map, not a lecture.

## What is here

The list below is maintained by hand and the plugin's verification suite fails if it stops matching the installed skills, which is what keeps it honest. List them in this order, one line each.

| Skill | What it does |
| --- | --- |
| `start` | Finds which documents exist and routes you to the right step |
| `discovery` | Works out whether this is worth building. Can conclude that it is not |
| `interview` | Asks how it behaves: states, actions, failures, data, copy |
| `write` | Assembles the PRD and hands it to `decompose` before giving it to you |
| `decompose` | Converts a PRD into workstreams and tasks in trace mode, then scores it. Runs standalone on any PRD |
| `clarify` | Folds new information into an existing PRD when something changed |
| `file` | Puts a finished decomposition into the team's project tool, confirm-first, without duplicating |
| `ui-review` | Opens every surface a story needs, exercises it, and says whether the story can be built |
| `groom` | Works a list of filed items with you: resolves, sharpens, or routes each one, and sweeps what each answer moves |
| `help` | This |

## Where to start

Match the user's situation to the first line that fits, and name the one skill it points at:

- **Just an idea, nothing written:** `discovery`. It asks whether the thing is worth building before anyone invests in how, and "do not build" is a successful answer.
- **The idea already survived that question:** `interview`, then `write`.
- **A PRD already exists**, written with this plugin or anywhere else: `decompose`. It grades the document and turns it into planned work at the same time. If something has changed since the PRD was written, `clarify` first.
- **A decomposition exists and has been read:** `file`, when the team is ready to put the work in its tracker.
- **The work is already filed and a ticket turned out to be wrong, or a sprint needs refining:** `groom`. It works the list with you rather than sending you back to the document.
- **Deciding whether a filed story can be picked up:** `ui-review`. It works out which surfaces the story actually needs rather than trusting the list it was handed, opens each one and exercises it, and returns Ready, Conditionally ready, Not ready, or Unable to verify. Run it before grooming; its report is what `groom` then works from.
- **Not sure which of these applies:** `start`. It looks at what exists on disk and routes, so nobody has to memorize this list.

## How the skills work together

The pipeline runs why, then how, then proof: `discovery` establishes the why, `interview` captures the how, `write` assembles the document and has `decompose` grade it before handing it over, and `decompose` reports every decision it had to invent so the gaps get closed in the document rather than guessed at later. `clarify` is the revision loop whenever new information arrives; `file` is the hand-off to the tracker.

**After filing, the work continues on the items rather than in the document.** `ui-review` checks a surface against the items that claim it and writes a gap log. `groom` works a list of items with you, one at a time, and leaves each one resolved, sharper, or routed to whoever owns the call. The two pair up: review produces the findings, grooming decides them and writes them back.

Three rules keep the pipeline honest, and all three are worth saying to the user in plain language:

- **The document freezes when it is decomposed and filed.** New information goes into the PRD with `clarify` before `decompose`. Once tickets exist, changes go on the tickets; if the document itself must change, it gets re-decomposed fresh rather than hand-syncing old output.
- **`decompose` is free; `file` is the commitment.** Re-grade as often as the document changes, at no cost beyond the run. Filing happens once, after the stories have been read, and a re-run never duplicates what was already filed.
- **After the freeze, `clarify` is the wrong direction.** A filed ticket that turns out to be wrong about the world is what `groom` is for. Going back to the document fixes the source of a ticket nobody will re-read, and leaves the ticket a builder opens still wrong.

One line on configuration: every skill reads `.know-product-spec/profile.md` when it exists, for the team's vocabulary, style rules, and tracker connection. Without one, everything runs on generic defaults; only `file` needs the profile's tracker block before it will create anything.

## Check the reference files

Try to read `${CLAUDE_PLUGIN_ROOT}/reference/skeleton.md` and report what happened, even when it works, because this is how anyone finds out whether the plugin is fully functional in their environment.

- **If the read succeeds:** say the reference files load, which is the normal case. Nothing else to report.
- **If it fails:** say so plainly and name the path you tried, then explain the consequence honestly. `discovery`, `interview`, and `start` still work, because their rules travel in their own bodies. `write` and `clarify` refuse without `skeleton.md`, and `decompose` refuses without `rubric.md`, because a document drafted, revised, or scored from a summary would look authoritative without being it. So the plugin is partly functional, not fully.

Also probe the mechanical sweep: `node "${CLAUDE_PLUGIN_ROOT}/tools/prd-lint.mjs"` with no arguments prints its usage line when Node and the script are both present. If that fails, say the lint layer is unavailable and the skills fall back to their own sweep accounting; nothing refuses over it.

Do not dress this up. It is a file read that either worked or did not.

## Rules

- Write nothing. Not a file, not a directory.
- End by naming the one skill that fits the user's situation, with the exact invocation, so nobody leaves this map without a next step.
- Do not explain PRD craft here. That is what the reference files are for.
- Do not claim the plugin fully works when a reference read fails. Three skills refuse in that state.
- Apply the profile's style rules. With no profile, impose none of your own.
