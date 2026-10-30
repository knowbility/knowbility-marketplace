# know-product-spec

Interviews you and writes a product spec an engineer can build from.

It starts somewhere most tools do not: by testing whether the thing is worth building. If nobody can describe what people do about the problem today, or the shortest path turns out to be a workflow change rather than software, it says so and writes no spec. That is a successful run.

Once the case holds, it asks how the thing behaves, drafts the document, and then does something unusual. It grades its own draft by actually breaking it into workstreams and tasks, and reports every product decision it had to invent along the way. Those inventions are the point. Each one is a decision somebody will make later, quietly, differently from how you would have made it.

It is built for software product teams and is tracker-agnostic: your project's vocabulary, house style, destinations, and reviewers live in an optional profile. The document structure itself is fixed, so if your work is not shaped like a product increment this is the wrong tool.

## Install

```
/plugin marketplace add knowbility/knowbility-marketplace
/plugin install know-product-spec@knowbility
```

## Start here

```
/know-spec:start
```

It works out what already exists in the project and points you at the right step. If you would rather go direct:

| Skill | When |
| --- | --- |
| `/know-spec:discovery` | You have an idea, a stakeholder's prototype, or a problem that keeps recurring |
| `/know-spec:interview` | The case holds and you need to nail down how it behaves |
| `/know-spec:write` | Time to assemble the document |
| `/know-spec:decompose` | You want a spec graded and broken into planned work. Works on any spec, including ones written by hand |
| `/know-spec:clarify` | Research, an answer, or a constraint changed something the document assumed |
| `/know-spec:file` | The stories are read and ready: put them into your project tool through your connected tracker tools, confirm-first, no duplicates on a re-run |
| `/know-spec:ui-review` | Deciding whether a filed story can be picked up, or a design and its tickets may have drifted |
| `/know-spec:groom` | The work is filed and a ticket turned out to be wrong, or a sprint needs refining before planning |
| `/know-spec:help` | What the skills are, and whether the reference files load here |

## After the work is filed

Most spec tools stop at the tracker. This one keeps going, because the interesting failure happens later: somebody picks up a ticket and finds the document was wrong about the world.

`/know-spec:groom` works a list of filed items with you, one at a time. It reads the item, everything it references, and the actual system before it asks you anything, then presents each open question as a concrete scenario: a specific person doing a specific thing, what they see under each candidate answer, and the numbers worked when a count is at stake. It writes the outcome onto the item and sweeps the items downstream of every answer in the same pass.

It handles defects as well as open questions, and the difference matters: an open question needs somebody, while a defect can often be settled by checking whether it still reproduces. Four of the six defect outcomes need no human at all.

**What it cannot answer, it routes.** Most lists contain more decisions that belong to somebody else than decisions the person running the session can make. Those items get the scenario written onto them, naming the owner and the exact call, plus a routing label so the set assembles by query. A run therefore produces two things: the items it settled, and the agenda for the next session with the people who own the rest, ordered by how many other items each decision moves.

`/know-spec:ui-review` answers a narrower question first: **could someone build this story without inventing product or design decisions?** It returns Ready, Conditionally ready, Not ready, or Unable to verify, and it writes nothing to your tracker.

Three things make it worth running rather than eyeballing the ticket.

**It works out which surfaces the story needs, and does not trust the list it was handed.** The surfaces that exist tell you what somebody drew, never what the work requires. The missing surface is the finding, and it is invisible to anything that starts from the file system. It keeps a queue, adds every surface and state it discovers, and finishes only when re-deriving the journey from scratch stops revealing anything new.

**It opens each surface and exercises it, rather than reading it.** A state can be present in the markup, correctly wired, and still never reach a person, because the surface's own styling outranks the mechanism meant to reveal it. Every source-based method reports that as healthy. So: real controls, real keyboard, screenshots that get read rather than filed, more than one width, and no reaching into the page to manufacture a state that the interface will not produce on its own.

**Preference is not a defect.** Every material finding traces to a requirement, a design-system contract, an established pattern, an accessibility requirement, an observed failure, or a contradiction between them. Anything else is an opinion, and opinions go in their own section at the end, unranked, carrying no severity and moving no verdict. That constraint is what makes an automated design review safe to act on.

It also reviews **both** directions. The usual one, looking for what the design has not caught up to, is the less useful half: designs are frequently ahead of the tickets, because designing is how a team works out what it thinks. A review that treats the ticket as authoritative will confidently correct a design toward a contract the team already abandoned.

When a verdict is consequential and the profile names an independent reviewer, it hands that reviewer a cold packet with its own verdict and findings withheld, and asks it to disprove readiness. Findings that come back are validated rather than accepted, and disagreement is reported rather than smoothed.

## What you get

A spec that follows one structure, with four readiness stages so you know where it stands, and a decomposition directory where each task is a file that reads like a ticket: the exact paths and fields it touches, its acceptance criteria as Given/Then, what blocks it, and what breaks if it is deferred.

It will not invent an answer to a question you could not answer. Those become open items that name what must not be assumed in the meantime, which is the difference between a document that reads finished and one that is.

## How the guarantees work

Everything above is instructions this plugin gives to Claude, not code that intercepts writes. The diff before an overwrite, the containment checks, the refusal to invent an answer: those are rules a capable model follows, written to be unambiguous. They are not a sandbox. If you want enforcement rather than instruction, keep the spec directory under version control and read the diffs, which is worth doing regardless.

## What it deliberately does not do

- **No effort estimates, story points, or priority labels.** A spec cannot source them. Each task instead carries what blocks it, whether it ships in v1, and the exposure if it slips, which is what a capacity call actually needs.
- **Grading never files.** `decompose` writes the local decomposition and stops, so you can re-grade freely. Creating tickets is its own deliberate step, `file`, which confirms the first ticket before batching the rest.
- **No mockups, no code.** It names the worked example; it does not build it.
- **Nothing is written outside your working directory except by the two skills whose job is exactly that**, `file` and `groom`, both of which write only to the tracker you configured, both behind a plan you approve first. Everything else stays local.
- **An existing spec is never overwritten quietly**: you get a diff, you have to say yes, and the previous version is kept under `history/`. The other files (the state file, the interview notes, the decomposition) are working artifacts and get rewritten as the work proceeds, without asking each time. Hand-edit one and expect the next run to replace it. The interview notes are the exception: a clarification appends the superseded answer rather than replacing it.

## Files it writes

Everything lands in `.know-product-spec/` in your project. If the profile's `prd_home` points somewhere else in the workspace, only the spec itself moves there; the state, notes, decomposition, and history stay below.

```
.know-product-spec/
├── profile.md              optional project config, every field has a default
├── groom/<run-date>/       one grooming run: the list and its outcomes, the queued
│                           downstream edits grouped by target, what was routed and
│                           to whom, and the design consequences in two batches
├── ui-review/              one gap log per review run
└── <slug>/
    ├── state.md            where this one stands
    ├── case.md             the case, or the recommendation not to build
    ├── contract-notes.md   interview answers, section by section, resumable
    ├── decomposition/      the graded breakdown, one file per task
    ├── PRD.md              the document
    └── history/            a copy of the document before each change
```

The grooming run directory is what makes a long list resumable. A sprint of twenty will not finish in one sitting, and a run that can route an item instead of forcing an answer stops cleanly at any point.

## The optional profile

Skip it and the writing pipeline works end to end: discovery, interview, draft, grading. Create it when you want the output in your project's words: where specs live, your tracker's vocabulary, your house style, who reviews what, your definition of done, your standard sub-tasks and labels. `/know-spec:start` will offer to walk you through it once.

**Two skills need it before they will do anything.** `file` and `groom` write to your tracker, and guessing which project to write into is not a graceful default, so both stop and ask for the `tracker_connection` block instead. `ui-review` needs to be told where your designs live.

Two things the profile cannot change: the four readiness stage names, so that scores mean the same thing across projects, and the field names inside the decomposition, so the output stays machine-readable when the display words change.

## Learning the shape

`reference/exemplar/` has a complete worked spec for a fictional product, plus an annotated companion explaining what earns each score and the three most common ways real drafts fall short. There are also two fixtures that fall short on purpose, which is how the grader itself is tested.

Part of the [Knowbility marketplace](https://github.com/knowbility/knowbility-marketplace).
