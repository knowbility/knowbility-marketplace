---
name: blueprint-guide
description: This skill should be used when the user asks how Blueprint works, where to start, which mode to use, what the difference between discovery, design, capture, and validation is, or what they should document first (e.g. "how does blueprint work", "where do I start", "quick or deep?", "what should I capture first", "what can this do"), or runs /know-blueprint:guide. Explains the five jobs — discover, design, quick capture, deep capture, validate — and routes the user to the right entry point based on whether they can name the process, whether they already run it, and whether a Blueprint is waiting on its stakeholder review.
allowed-tools: Read, Write, Edit, Glob, Grep
---

# blueprint-guide — Orient the user and point them at the right first step

Someone has asked how Blueprint works or where to begin. Give them a short, plain orientation, then
route them to the right entry point. Keep it conversational — a couple of tight paragraphs and a
recommendation, not a manual. Don't dump this whole file at them; say what's useful for where they are.

## What Blueprint does, in one line

It turns how you actually work into a process document a person, a workflow, or an AI agent could
execute against — built by interviewing you, not by asking you to write it up.

## The jobs (this is the thing to get across)

Blueprint does five distinct things. People conflate them; keep them separate — the key split is
whether the process **already exists**.

1. **Discover** (`/know-blueprint:discover`) — a short sweep that surfaces the recurring work you might
   want to document, when you *can't yet name your processes*. It produces a thin **Process
   Inventory**: candidate processes in your own words, plus which few to tackle first. Use this when
   the honest answer to "which process?" is "I'm not sure what I'd even call them."

2. **Design** (`/know-blueprint:design`) — model a process you've been **handed but no one runs yet**
   ("we need a process for X; nobody does it"). Since there's no real run to extract, it *proposes*
   an intended flow — but built only from your real goal, constraints, and nearest existing process,
   never generic best-practice — and writes it as a **designed Blueprint (proposed, not yet run)**.
   Use this for genuinely new work.

3. **Quick capture** (`/know-blueprint:capture`, quick mode, ~15 min) — a coarse but grounded model of
   **one** process you already run: its trigger, main steps, outputs, and a first-cut read on where
   automation is safe and where a human should stay in the loop.

4. **Deep capture** (`/know-blueprint:capture`, deep mode, ~45-60 min) — the full model of **one** process
   you run: decision criteria, exception paths, approval authority, evidence, timing, and risk.
   Detailed enough to take to a new hire or an automation build once a stakeholder has validated it.

5. **Validate** (`/know-blueprint:validate`) — run the stakeholder review a Blueprint is waiting
   on. A fresh Blueprint's autonomy ratings came from one operator's account of their own work, so
   capture deliberately won't sign them off; this walks them one at a time with the person who owns
   the risk, pressure-tests the exception paths, works the open questions that gate the
   Automate-rated steps, and records what they decided — including what the pass didn't cover.
   Until this happens, the automation plan stays gated. Use it when you have that person; a
   revision reopens it, scoped to what changed.

The dividing line: **capture is for work you already run; design is for work you don't yet.** A
designed process graduates to a captured one once it's been run a few times — design proposes, reality
corrects, capture records. The natural path is **Discover** (what do I have) → **Design** (something
new) *or* **Capture** (something I run) → **Validate** (before anything gets automated).

## Two things worth knowing

- **Every captured step gets rated Automate, Monitor, or Human** — so you know where automation is
  safe and where a human must stay in the loop, decided by one question: *if this step were done
  wrong with no review, what would happen?* The ratings are a reviewed draft, not a safety
  certification: they come from one interview and hold until the person who owns the risk signs off, which
  `/know-blueprint:validate` is how you actually run.
  (Discovery deliberately does **not** rate anything — there are no steps yet to judge.) One
  default worth knowing up front: a step whose output is an accessibility judgment — is this image
  decorative, is this alt text right, is this reading order correct — comes out **Human**, because
  deciding whether something works for a person is not a thing an automated pass settles. You can
  overrule it; the Blueprint records that you did.
- **Blueprint never invents.** When you don't know an answer — where data comes from, who approves,
  what a threshold is — it records that as an open question rather than making something up. A flagged
  gap is worth more than a confident guess, because the whole point is a document you can trust enough
  to automate against. (Design is the one place it *proposes* steps, since there's no real run to
  extract — but even there it never invents your constraints, and it builds only from your real
  situation and nearest existing process, marking every step "proposed, not yet run.")

## Route them

Ask what they're trying to do, and route on two questions: **can they name the process, and do they
already run it?**

- **Can't name it / "not sure where to start" / "I have lots of little things" →** recommend
  **discovery**. Offer to run `/know-blueprint:discover` now.
- **A specific process they've been handed but don't yet run** ("we need a process for this; no one
  does it") **→** recommend **design**. Offer to run `/know-blueprint:design` now.
- **A specific process they already run →** recommend **capture**. Quick mode to take stock; deep mode
  for automation- or handoff-ready. Offer to run `/know-blueprint:capture` now.
- **They already have a Process Inventory from a past discovery →** point them at it, and offer to run
  a capture on whichever candidate they choose; capture will pick up what the inventory already holds.
- **They have a Blueprint already and want to act on it — automate a step, hand it to an agent, or
  train someone against it →** check its Status line first. "Stakeholder validation not yet done"
  means recommend **validate**, and say plainly what it unblocks. Offer `/know-blueprint:validate`
  now. If the risk owner isn't available, say the session can still gather input and won't clear
  the gate.
- **Their process changed since it was captured →** recapture the changed section, then
  **validate** again — a changed process is an unvalidated one.

Then, if they say yes, hand off to the matching skill. Don't re-explain what that skill will do — just
start it.
