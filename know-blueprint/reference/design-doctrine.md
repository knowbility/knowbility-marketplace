# Design doctrine — modelling a process that doesn't exist yet

Read-only doctrine the `blueprint-design` skill loads at runtime. It holds the one discipline that
keeps design trustworthy, and the conventions a designed Blueprint follows. The skill points here; it
never copies this content into the conversation.

## What design is for

Capture models a process the operator **already runs** — it anchors in the last real time they did it,
and never invents. Design is the mirror: the operator has been **handed something new that no one runs
yet** ("process all incoming emails for these campaigns"), so there is no real run to extract and
nothing yet to be faithful to. Design's job is to help them model the *intended* process — a
**proposal**, honestly labelled, that the first real executions will test and correct.

A designed Blueprint is a hypothesis. Its whole value depends on never letting that hypothesis read as
observed fact.

## The one discipline: grounded proposer

Design *does* propose a candidate flow — a refusal to help is not the product. But **every proposal
must be built from two real things, and nothing else:**

1. **The operator's stated goal and constraints** — the real outcome the work must produce, the real
   trigger, the real inputs, the actual tools and access they have, the real deadline/volume/policy,
   who actually has approval authority, and what "done" must mean.
2. **The nearest analogous process the operator actually runs** — "what's the closest thing you
   already do?" A designed flow borrows its shape from real experience the operator can vouch for.

**Never from generic best-practice.** "Here's how people usually triage email" is exactly the
confident fabrication the whole plugin exists to prevent, one step more dangerous here because there's
no reality to contradict it. If you don't have a real anchor or a stated constraint for a step, you do
**not** fill it from your own priors — you ask, or you write the step as a proposal *with an open
question*. This is the design-mode version of capture's "anchor in a real run": generative on
structure, but every step traces to something real.

## Constraint non-invention (this still binds, hard)

Proposing *steps* is legitimate in design. Inventing *facts about the operator's situation* is not.
The goal, the real deadline, the tools that actually exist, the real approval authority, the real
volume — these are facts, and the non-invention rule applies to them exactly as it does in capture:
**ask or flag, never assume.** A designed flow built on a fabricated constraint ("assume a 24-hour
SLA", "assume you have API access to the inbox") is worse than an honest gap, because the whole design
downstream rests on it. When a constraint isn't known, it goes to Open Questions and the steps that
depend on it are marked as resting on an unconfirmed assumption.

## Labelling: everything is proposed, nothing is observed

A designed Blueprint carries **Mode: Design** and **Status: Designed — not yet run; validate against
the first real executions**. Every step is written as a proposal, not a fact. Beyond the standard
step fields (action, tool/system, data, reason, evidence, autonomy), each proposed step carries:

- **Proposed** — the step is a proposal, marked so plainly no reader mistakes it for observed practice.
- **Rests on** — the real fact or analog it's built from (a stated constraint, or "mirrors how you
  already do X"). A step whose "Rests on" would have to be "general knowledge" is not grounded — turn
  it into an open question instead.
- **Breaks if** — the assumption that, if wrong, invalidates the step. This is what the first real run
  is testing.

The evidence-of-success field is itself proposed ("this is how we'd expect to tell it worked"), not
observed. Say so.

## Conservative ratings

You cannot honestly rate a step for automation that has never run. Default every step to **Human** or
**Monitor**. Reach for **Automate** only when a step is unambiguously mechanical, low-risk, reversible,
**and** the operator has confirmed the tool/access it needs actually exists. The placement question
becomes: *"if this step ran wrong on the very first execution, before anyone has checked the process,
what would happen?"* And the automation-plan handoff is gated **twice** — a designed process is not
ready to automate until it has been validated **and** actually run. Never hand over an automation plan
for a process that has never executed.

**Accessibility judgment stays Human in a design, full stop.** A step whose output is a
determination about accessibility — decorative or not, is this alt text right, is this reading
order correct, does this accessible name mean anything to the person hearing it, is this caption
adequate — is rated Human, and in design that rating is not reachable past. The reasoning compounds
the two rules above: the step is a judgment about human need, *and* the process has never run, so
an Automate rating would be certifying that nobody needs to look at something nobody has yet done.
Record an operator's request to automate it; leave the rating where it is until the process has run
and the person who owns the risk has moved it themselves.

## The lifecycle bridge: design → run → capture

A design is finished when it is testable, not when it is certain. Close by making the first real runs
the plan:

- Name what the first executions will reveal — which "Breaks if" assumptions get tested first, and
  what to watch.
- Set the graduation path: run it a few times, then `/know-blueprint:capture` the process **from reality**.
  The captured model becomes **Version 2 — Observed**, logged in the Blueprint's Change log, replacing
  the proposals with what actually happened. Design proposes; reality corrects; capture records.

This is the honest arc. Design never pretends to be capture; it sets up the capture that will replace
it.
