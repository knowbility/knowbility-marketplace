# Changelog — know-blueprint

All notable changes to the know-blueprint plugin. Per-plugin semver; tags are plugin-scoped
(`know-blueprint--vX.Y.Z`).

## 0.1.0 — 2026-10-30

First release in the Knowbility marketplace. Forked with the original author's clearance from an
MIT-licensed plugin of the same design, then de-branded and renamed: the plugin is
`know-blueprint`, invoked as `/know-blueprint:<command>`, and the source marketplace's name,
author, homepage, and repository are gone from the manifest. The interview engine, the four jobs,
the non-invention discipline, the output templates, and the Automate / Monitor / Human vocabulary
are unchanged. The version resets to 0.1.0 on arrival, which is this marketplace's convention for
a forked plugin; the inherited history below is the source plugin's and its version numbers refer
to that lineage, not this one.

**One behavior change, and it is the reason this plugin belongs in an accessibility
organization's marketplace.** A step whose output is a determination about accessibility — whether
an image is decorative, whether alt text conveys the right thing, whether a reading order is
correct, whether a control's accessible name means anything to the person hearing it, whether a
caption is adequate — is now rated **Human by default**, and a Blueprint that departs from that
default records the departure and the rating the step would otherwise have carried. In design mode
the default is not reachable past at all, since the process has never run. The distinction the rule
turns on: finding a missing `alt` attribute is mechanical and rating it Automate is correct;
deciding whether the alt text is *right* is a judgment about what a person needs, and no automated
pass settles it.

This closes the root `AGENTS.md` accessibility house rule against a direction it did not previously
cover. That rule forbids any plugin implying it produces a conformance evaluation or that automated
passes substitute for testing by a person — written about tools that describe an artifact. A
step rated Automate makes the same claim from the other side: not that an artifact conforms, but
that nobody needs to look at it. The rule is now written in the capture skill's Step 3, the design
skill's Step 5, `reference/design-doctrine.md`, `reference/blueprint-template.md`, and the guide
skill, because the documentation review that preceded this port found that a claim corrected only
on the front page is a claim still standing everywhere else.

Also on arrival: the source marketplace's eval target came across as specifications only. The six
definition files are in `dev/know-blueprint/eval/`; the runner and 565 files of run history did
not, and that directory's README says what was left behind and why the gate names cited in
`AGENTS.md` are not executable here.

## History from before the fork

The entries below are the source plugin's, preserved because they record why particular
disciplines exist — which is the part worth keeping when a well-meaning edit proposes to relax
one. Their version numbers belong to that lineage.

## 0.3.1 — 2026-08-06

Documentation correctness only; no behavior change. A `/upskill` constraint audit of all four
surfaces found no capability constraints to cut — the interview rules, non-invention discipline,
and validation gates all sort as intent — but it did find wording the 0.3.0 design release left
behind.

- **The guide surfaces say four jobs again.** `/know-blueprint:guide`'s body already explained design,
  but its skill description and the command's description still advertised "the three jobs
  (discover, quick capture, deep capture)" and routed on one question. Both now name all four and
  route on the two that actually decide it: can you name the process, and do you already run it.
  The skill description is a triggering surface, so the stale copy was user-visible.
- **`templates/CLAUDE.md` describes `blueprints_dir` accurately** — discover writes the Process
  Inventory there and design writes designed Blueprints there, not just capture.
- **`AGENTS.md` "What it is" covers design**, including the discover → design *or* capture funnel.

## 0.3.0 — 2026-07-23

Adds a fourth job — **design** — for a process that doesn't exist yet. Capture's whole discipline
is "walk me through the last time you ran this," so it can't help with work you've been handed but
no one runs (a new campaign-email triage, a new responsibility). Pointed at that, capture either
stalls or violates its own non-invention rule and fabricates a process. Design is the honest way to
model the *intended* process instead.

- **New: `/know-blueprint:design`** — models a net-new process as a **proposal, not observed fact**. It's
  a *grounded proposer*: it does propose a candidate flow, but every step must be built from the
  operator's real goal and constraints and their **nearest existing process** ("what's the closest
  thing you already do?") — **never generic best-practice**. This is the design-mode version of
  "anchor in a real run." Constraint non-invention still binds hard: the real deadline, the tools
  that actually exist, the real approval authority are asked or flagged, never assumed. Every step is
  labelled **Proposed** with a "Rests on" (the real fact/analog behind it) and a "Breaks if" (what
  the first run tests). Ratings default conservative (Human/Monitor — you can't certify automation on
  a process that's never run), and the automation-plan handoff is gated twice (validated *and* run).
- **The design→run→capture lifecycle.** A designed Blueprint carries `Mode: Design` and `Status:
  Designed — not yet run`. Once the process has actually run a few times, `/know-blueprint:capture` it
  from reality — the captured model becomes Version 2 (Observed) in the Change log, replacing the
  proposals with what happened. Design proposes; reality corrects; capture records.
- **Capture routes net-new work to design.** If you point capture at a process you've never run, it
  now sends you to `/know-blueprint:design` instead of trying to extract a run that doesn't exist.
- Runtime-QA: a dedicated `blueprint-design` eval target guards the design invariants — never
  fabricate a generic flow, never invent a real constraint, route to capture when the process already
  exists, hold conservative ratings on the unproven, and keep every step honestly proposed.

## 0.2.1 — 2026-07-23

Closes the promise-vs-artifact gap a review surfaced: a Blueprint is a scrupulously-honest but
*unvalidated draft*, yet the plugin marketed itself as telling you "what's safe to automate" and
offered an automation plan the moment capture ended. Both are now honest.

- **The automation-plan handoff is gated on validation.** After a deep capture, the plugin no
  longer offers to draft the automation plan while the Blueprint is still unvalidated. It names
  what stands between here and safe automation — the stakeholder walkthrough hasn't happened, and
  which open questions gate the Automate-rated steps — and offers to resolve or route them. If the
  operator insists, it drafts the plan but records the ahead-of-validation waiver in the Blueprint,
  leaving the status line and ratings honest.
- **Discover → capture closes the loop.** Capturing a candidate from your Process Inventory now
  updates that candidate's row to *Captured* with the Blueprint path, so a re-read shows at a glance
  which work is modelled and which is still just recognized. Other candidates are left untouched.
- **Blueprints carry lifecycle state.** The template gains Version, Last-validated (date + owner),
  Next-review, and a Change log — the drift-guard an artifact meant to govern automation needs.
- **Honest positioning.** The outward promise is reframed from "what's safe to automate" to "where
  automation is safe and where a human must stay in the loop"; the ratings are described as a
  reviewed draft, not a safety certification. Three stale "quick mode builds an inventory" surfaces
  from the pre-discovery model (the capture command, the skill description, the root README) are
  corrected.
- Runtime-QA: two new capture eval scenarios — `adv-automation-before-validation` (gates the
  handoff, records the waiver) and `rep-inventory-writeback` (updates the candidate, leaves the rest
  untouched, via a new `inventory_updated` gate). Both certified 3/3; no existing golden regressed.

## 0.2.0 — 2026-07-23

Adds a discovery front-door and makes the three jobs explicit. Blueprint was always excellent
once you could name a process; its first question was effectively "which process?", which
assumes you already see your work in process-shaped units. You often don't.

- **New: `/know-blueprint:discover`** — a short, time-boxed recall sweep that surfaces the recurring
  work you've stopped noticing you do, into a thin **Process Inventory** of candidates (each in
  your own words), then recommends a small first portfolio to capture. It leads with what you
  actually produced and touched recently rather than the org-chart version, stops when nothing
  new surfaces, and — crucially — **never sharpens a vague mention into a confident process
  name** ("monthly numbers work," not "Monthly Financial Reporting") and **never rates anything
  for automation** (no steps exist yet to judge). Ranks the inventory through three lenses —
  automation opportunity, operational exposure, knowledge-loss risk — so capture isn't only for
  automating chores.
- **New: `/know-blueprint:guide`** — explains the three jobs (discover, quick capture, deep capture)
  and routes you to the right first step. Triggers on "how does this work" / "where do I start."
- **Capture picks up from discovery.** Starting a capture on a candidate from your Process
  Inventory seeds it with what's already known and jumps to the real-run anchor, instead of
  re-asking. Inventory fields are treated as your words, not established facts — non-invention
  carries across the seam.
- **Positioning fix.** Quick mode is no longer described as "building an inventory of your
  processes" — discovery owns that job now. Quick and deep each model one process; discovery
  produces the inventory.
- Runtime-QA: a dedicated `blueprint-discover` eval target guards the discovery invariants
  (never invent a boundary, never rate at discovery, keep the inventory thin, flag duplicates
  without merging).

## 0.1.1 — 2026-07-23

Closes the one known limitation from 0.1.0. Full runtime-QA certification now green across
the whole set: all 8 adversarial goldens **and** both representative scenarios pass 3/3
(eval iterations 4 and 6).

- **Completeness sweep before writing.** Deep captures now do a final pass over every step
  still missing a "why" or evidence-of-success and ask for the gaps in one batch before the
  Blueprint is written, instead of leaving a field blank on the strength of a single earlier
  question the operator talked past. Whatever the operator still doesn't supply is marked
  "Not captured" and routed to Open Questions — never invented.
- **Non-Invention now guards the edge of a stated threshold**, not just invented values:
  "above $5k" is kept verbatim and the exact-boundary case ("what happens at exactly $5k?")
  goes to Open Questions rather than being silently hardened to "$5k and above."

## 0.1.0 — 2026-07-22

Initial release.

- Guided process-capture interview in two modes: quick (~15 min inventory pass) and deep
  (~45-60 min full extraction).
- Structured Process Blueprint template with per-step autonomy ratings (Automate, Monitor,
  Human) and an explicit Open Questions section for flagged unknowns.
- Worked example (blog content workflow) shipped in `reference/` as the specificity bar.
- Light validation pass after drafting; real stakeholder validation recommended, not simulated.

Runtime-QA certified against the `eval/` harness (30-run 3× golden set, iteration-4):
all 8 adversarial goldens pass 3/3 — including the two invariants the design turns on,
never-invent (refuses to fabricate or to quietly sharpen a vague answer, down to the edge
of a stated threshold) and never-collapse-into-a-form. Machinery stays out of the delivered
Blueprint.

(The per-step "why"/evidence gap noted here at 0.1.0 is resolved in 0.1.1 by the
completeness sweep.)
