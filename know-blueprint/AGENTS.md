# AGENTS.md — know-blueprint

Maintainer/agent guidance for working **on** the Blueprint plugin. Standalone;
self-contained. (Current version lives in `plugin.json` and `CHANGELOG.md`.)

> A plugin's `templates/CLAUDE.md` is a different thing: it's the per-deployment config
> the plugin ships to *users*, not agent guidance. Don't conflate the two.

## What it is

A process extraction interviewer with a discovery front-door. Five jobs, five
skills/commands: **discover** finds recurring work the operator can't yet name and lists it
in a thin Process Inventory; **capture** (quick or deep) turns one named process the operator
*already runs* into a structured Process Blueprint that a human, workflow, or AI agent could
execute against — with explicit per-step autonomy ratings (Automate / Monitor / Human) marking
where automation is safe and where a human must stay in the loop; **design** models a process
the operator *doesn't yet run*, proposing an intended flow grounded only in their real
constraints and nearest analog; **validate** runs the stakeholder review that capture gates the
automation plan on, walking the autonomy ratings with the risk owner and recording what the pass
did not cover; **guide** orients the user to the right entry point. The funnel
is discover → design (net-new) or capture (already run) → validate; guide points people into it. "Correct" capture
output is a Blueprint whose steps carry intent and observable success criteria, whose judgment
calls have explicit criteria, and whose gaps are flagged rather than invented. The target is
not "document the task" but "model the work as a system." Discovery's correct output is a thin
inventory that recognizes work without inventing its boundaries.

## Structure

- `commands/know-blueprint/` — five thin command wrappers: `capture` (`/know-blueprint:capture`),
  `discover` (`/know-blueprint:discover`), `design` (`/know-blueprint:design`),
  `validate` (`/know-blueprint:validate`), `guide` (`/know-blueprint:guide`).
  Each runs its matching skill.
- `skills/blueprint-capture/SKILL.md` — the interview engine (both capture modes); models a process
  the operator *already runs*.
- `skills/blueprint-discover/SKILL.md` — the recall sweep that produces the Process Inventory.
- `skills/blueprint-design/SKILL.md` — models a process that *doesn't exist yet*: a grounded
  proposer that builds an intended flow only from the operator's real constraints + nearest analog,
  written as a designed Blueprint ("proposed, not yet run").
- `skills/blueprint-validate/SKILL.md` — runs the stakeholder review capture gates the automation
  plan on. Walks the autonomy ratings with the risk owner ordered by consequence, records
  confirmations as well as moves, and writes template §16 including what the pass did not cover.
  Refuses operator self-validation and refuses to stand in for the risk owner; a session without
  that authority is input gathering that does not clear the gate.
- `skills/blueprint-guide/SKILL.md` — orientation + routing; explains the five jobs (split on
  whether the process already exists, and whether a Blueprint is waiting on its review), sends the
  user to discover / design / capture / validate. Content lives inline (behavior, not a doctrine
  doc).
- `reference/` — read-only library. Capture: `blueprint-template.md` (shared output structure,
  Design mode + "Designed — not yet run" status), `example-blog-content-blueprint.md`. Discover:
  `discovery-sweep.md`, `process-inventory-template.md`. Design: `design-doctrine.md` (grounded
  proposer, constraint non-invention, proposed/rests-on/breaks-if step convention, lifecycle
  bridge). Plus a `README.md` index.
- `templates/CLAUDE.md` — optional per-deployment config (`blueprints_dir`); the Process
  Inventory saves to `process-inventory.md` in that same directory.

## Key mechanics

- **One skill, two modes.** Quick (~15 min) covers purpose, trigger, coarse step sequence,
  outputs, and first-cut autonomy ratings; uncaptured sections are marked "Not captured —
  quick mode," never silently omitted. Deep (~45-60 min) covers the full eight-area
  interview backbone (the eighth — timing, risk, and upkeep — feeds the autonomy ratings).
- **The interview rules are the product.** Small question batches (2-4, then stop); anchor
  in the operator's most recent real run, not the idealized flow; capture the reason for
  each step, not just the action; separate mechanical from judgment work and must-happen
  from expert shortcut; demand observable success evidence; flag unknowns instead of
  inventing.
- **Autonomy ratings are the automation bridge.** Every step gets Automate / Monitor /
  Human. The placement question — "if this step were done wrong with no review, what would
  happen?" — decides where checkpoints go. Checkpoints are deliberately sparse: review
  everywhere creates reviewer fatigue.
- **Doctrine lives once.** The output structure lives in `reference/blueprint-template.md`
  and the specificity bar in the worked example; the skills point at reference files and
  never copy their content inline. Discovery's doctrine (recall cues, three lenses) lives in
  `reference/discovery-sweep.md`.
- **Discovery is recognition, not understanding.** The sweep produces a *thin* inventory of
  candidates — a lead per row, not a mini-Blueprint. It leads with artifacts and tool-traces
  (the least-idealized cues), anchors recall in real recent windows, and stops when nothing
  new surfaces. The `discover → capture` handoff seeds a capture from the inventory candidate
  but treats those fields as the operator's words, not established facts — non-invention
  carries across the seam.
- **State.** Blueprints and the Process Inventory are plain Markdown written to `blueprints/`
  in the deployment (or `blueprints_dir` from the deployment `CLAUDE.md`); the inventory is a
  single living `process-inventory.md`, updated on re-sweep, never overwritten. No
  ledger/candidates participation — this is a standalone system, not a triage-stream. The
  Process Inventory is Blueprint's own file and nothing else reads it.

## Surface differences (Claude Code vs Claude Desktop)

None. All five skills use Read/Write/Edit/Glob/Grep only — no hooks, no shell, no subagents, no
network, no installed dependency — so behavior is identical on both surfaces. This plugin is the
only one in the marketplace for which "works the same in both places" is unqualifiedly true; say so
where it helps a reader choose, and don't let it get rewritten into a claim about the others.

## Maintaining this plugin

- **Release:** follow **Release & versioning** in the root `AGENTS.md`. Bump `version` in
  `plugin.json`, update the `v<X.Y.Z> — ` prefix in both descriptions (`plugin.json` + the
  catalog entry in `.claude-plugin/marketplace.json`), the root `README.md` tool table and
  per-tool section, and the root `AGENTS.md` plugin list; add a `CHANGELOG.md` entry; then
  `node dev/scripts/check-version-prefix.mjs` and `claude plugin validate ./know-blueprint` +
  `claude plugin validate .`; commit, tag **`know-blueprint-v<X.Y.Z>`**, push.
- **Authoring check (optional):** run plugin-dev's `skill-reviewer` over changed skills and
  `plugin-validator` over the plugin to catch frontmatter/description regressions.
- **Editing cautions specific to this plugin:**
  - **The autonomy vocabulary is locked:** Automate / Monitor / Human, with the
    "done wrong with no review" placement question. Don't rename the ratings or add levels
    without a decision — downstream Blueprints and training material reference them.
  - **Never let the skill fill gaps.** The flag-unknowns-don't-invent rule is what makes a
    Blueprint trustworthy as an automation spec. Any edit that softens it into "make a
    reasonable assumption" breaks the product. Note there are two kinds of invention and the
    rule guards both: the obvious kind (filling an announced blank) and the quiet kind
    (sharpening a vague answer into a precise one inside a step already accepted — "the entry
    in NetSuite" written as "GL entry," a neighbor step's system borrowed onto one described
    without one). Eval iteration-1 scored Non-Invention 2 on *both representative* scenarios
    for the quiet kind while it held 3 under adversarial pressure — the quiet kind is the
    real exposure because it surfaces in ordinary use, not just when a user pushes.
  - **Keep the interview conversational.** Small batches, anchored in a real run. Don't
    collapse the interview into a form the user fills in — that regenerates exactly the
    idealized-process documentation the plugin exists to avoid.
  - **The machinery stays backstage, in both channels.** Eval iteration-1 scored Register
    1.9/3 — the worst dimension in the suite — on leaks like "per the skill's rule,"
    "the full field set," "out of turns for this round," and, worse, "the timing/risk/upkeep
    interview area" written into a delivered Blueprint. Two rules guard this now (the
    interview rule, and the Step 4 clause forbidding the document from narrating the
    interview). When adding operator-facing copy anywhere in the skill, phrase it as what the
    operator gets, never as which part of the structure it covers — the old Step 1 wording
    ("the full field set") is what taught the model to say it aloud.
  - **Template changes are additive.** Existing Blueprints in user deployments must remain
    valid; don't remove or rename template sections. Same rule for
    `process-inventory-template.md`.
  - **Discovery-specific locks:**
    - **Discovery never invents a boundary.** The single discipline that makes the sweep
      trustworthy: recognize a candidate, never manufacture its scope. "Monthly numbers work —
      not yet established," never "Monthly Financial Reporting." This is the capture
      non-invention rule one layer earlier, and it's where the temptation is highest (no steps
      yet to discipline the guess). Any edit that lets discover tidy a vague mention into a
      confident process name breaks it.
    - **No autonomy ratings at discovery.** Discover must never assign Automate / Monitor /
      Human. Those need steps, evidence, and failure impact that don't exist yet; a rating here
      is the "annoying, therefore safe to automate" fallacy the plugin exists to prevent. The
      `no_autonomy_ratings` gate asserts this deterministically — if you find yourself wanting to
      loosen it, you're breaking the product.
    - **Keep the inventory thin, preserve duplicates.** Candidates are leads, not mini-Blueprints;
      possible duplicates/groupings are flagged, never silently merged (whether it's one process
      or several is capture's question). Don't let the sweep chase completeness — stop-when-dry is
      a feature, not a shortcut.
    - **Three lenses, no magic score.** Prioritization stays automation-opportunity /
      operational-exposure / knowledge-loss, recommending three starting points. Don't collapse
      it to a single number — that re-narrows Blueprint to an automate-chores tool.
  - **0.2.1 locks (the promise-vs-artifact discipline):**
    - **The automation-plan handoff is gated on validation (Step 6).** A fresh Blueprint is an
      unvalidated draft; don't offer to draft the automation plan while its status line still says
      validation is outstanding or open questions gate the Automate-rated steps. Name the blockers,
      offer to route them, and only proceed on an *explicit operator waiver that gets recorded in
      the Blueprint* (§14 note + a Change-log row) — the same refuse-or-record posture as declining
      to simulate the stakeholder. Softening this back into an unconditional "want the automation
      plan?" is the exact overreach 0.2.1 fixed. The `adv-automation-before-validation` golden
      guards it.
    - **The inventory write-back is candidate-scoped and non-destructive.** When a capture started
      from a Process Inventory candidate, update *only that candidate's* Status row to Captured;
      never touch other candidates, never rewrite the file, never invent a row. The
      `inventory_updated` gate + Loop Closure dimension guard it.
    - **Positioning stays honest.** The ratings are a *reviewed draft, not a safety certification*.
      Don't reintroduce "what's safe to automate / safe to hand to an agent" as an unqualified
      promise in adopter copy — say "where automation is safe and where a human must stay in the
      loop." (Keep user-facing copy matching the artifact; the README is the
      surface where this slips first.)
  - **0.3.0 locks (the design skill):**
    - **Design is a *grounded proposer*, not a generator.** It proposes a flow — but every step must
      be built from the operator's real goal/constraints and their nearest existing process, **never
      generic best-practice**. This is the single discipline that keeps design from becoming the
      confident-fabrication tool the plugin exists to avoid; it's the design-mode analog of capture's
      "anchor in a real run." Any edit that lets it fill steps from general knowledge breaks it. The
      `adv-generic-fill` golden guards it.
    - **Constraint non-invention still binds.** Proposing *steps* is legitimate in design; inventing
      *facts about the operator's situation* (the real deadline, the tools that exist, the approval
      authority, the volume) is not — ask or flag, never assume. `adv-invent-constraint` guards it.
    - **Everything designed is labelled proposed, never observed.** Mode `Design`, Status `Designed —
      not yet run`, every step marked Proposed with Rests-on / Breaks-if. A designed Blueprint that
      reads like a captured one has failed. `designed_status` / `steps_proposed` gates guard it.
    - **Design ≠ capture; route accordingly.** Design is only for work with no lived run. If the
      operator already runs it, route to capture (`adv-already-runs-it`). Capture's Step 1 routes the
      inverse (net-new → design). Don't blur the line — it's the whole reason both exist.
    - **Ratings conservative until run.** No Automate on a step that's never executed unless it's
      unambiguously mechanical/low-risk and the tool exists; the automation handoff is gated twice
      (validated *and* run). `adv-automate-the-unproven` guards it.
  - **0.1.0 locks (this marketplace's arrival rules):**
    - **Accessibility judgment is rated Human by default, in capture and in design.** A step whose
      output is a determination about accessibility — decorative or not, is this alt text right, is
      this reading order correct, does this accessible name mean anything to the person hearing it,
      is this caption adequate — comes out Human, and a departure from that default gets recorded
      along with the rating it would otherwise have carried. In design it is not reachable past at
      all, because the process has not run. This exists because the root `AGENTS.md` accessibility
      house rule can be broken from an unexpected direction: not by claiming an artifact conforms,
      but by rating a step Automate and thereby claiming nobody needs to look. The rule is written
      in five places on purpose — the capture skill's Step 3, the design skill's Step 5,
      `reference/design-doctrine.md`, `reference/blueprint-template.md` (the step-block comment and
      the §14 roll-up), and the guide skill — because the last documentation review in this
      repository found that a claim fixed only on the front page is a claim still standing
      everywhere else. If you soften it, soften it in all five or in none.
    - **Finding versus judging is the line.** Locating a missing `alt` attribute is mechanical and
      an Automate rating on it is correct. Deciding whether the alt text is *right* is not. Keep
      that distinction intact when editing; collapsing it in either direction breaks something —
      rate the mechanical half Human and the plugin becomes useless for the work Knowbility
      actually does, rate the judgment half Automate and it becomes dishonest.

## Where the eval gates live

This guidance cites gate and golden names throughout — `no_autonomy_ratings`, `designed_status`,
`steps_proposed`, `inventory_updated`, `adv-generic-fill`, `adv-invent-constraint`,
`adv-already-runs-it`, `adv-automate-the-unproven`, `adv-automation-before-validation`. Their
definitions are in `dev/know-blueprint/eval/`, which came across with the plugin. **The runner did
not.** So those names are specifications you can read, not a suite you can execute here; the
README in that directory says so plainly and explains what was deliberately left behind. Treat the
citations as "here is what this rule means precisely," not as "CI will catch you."
