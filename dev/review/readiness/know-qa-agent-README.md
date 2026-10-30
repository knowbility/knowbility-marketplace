# know-qa-agent

A web QA tool that tests the way an engineer and a designer would, together.

Most automated testing sees only what the markup says. Put an agent in front of a real page and it tends to swing the other way — it looks at the screen and stops correlating the errors underneath. A real reviewer does both at once: they notice a section is too wide *and*, in the same glance, see that the layout shifted because an image 404'd and a request hung for 600ms. The symptom, the cause, and the proof, held together.

know-qa-agent is built around that combined sense. Every pass takes in all four signals — the **rendered screen**, the **DOM and accessibility tree**, the **network**, and the **console** — and produces findings that name symptom, cause, and proof in one place. Not "console error present." Not "looks off." Rather: "the hero overflows on tablet because the avatar image 404'd and collapsed the flex row — screenshot, failed request, and console warning all confirm it."

## Install

```
/plugin marketplace add knowbility/knowbility-marketplace
/plugin install know-qa-agent@knowbility
```

## Prerequisites

Install these before your first run. The one global install needs a terminal, whichever Claude you use.

1. **[Node.js](https://nodejs.org) 18 or newer**, with `npm` on your PATH. Check with `node -v`.
2. **[Google Chrome](https://www.google.com/chrome/)**. The browser is attached to, not downloaded — this plugin drives your real Chrome so a signed-in session is yours. On macOS it is found automatically; on Windows or Linux, set the `CHROME_BIN` environment variable to the Chrome executable's full path if the plugin reports it cannot find it.
3. **The browser driver**, installed globally in a terminal:

   ```bash
   npm install -g @playwright/cli
   ```

   This provides the `playwright-cli` command. `/know-qa:init` checks for it and installs it if it is missing, so you can skip this and let init do it. Note the scope: the package is **`@playwright/cli`**. The unscoped npm package `playwright-cli` is a deprecated stub that ships no command and whose own registry entry tells you to use `@playwright/cli` instead.

Then `/know-qa:init` installs the rest into your project itself. Two different browser-automation pieces are in play and they do not substitute for each other: the global `playwright-cli` for autonomous runs, and the pinned `playwright` Node library that init installs into your project's `.know-qa/tools/` for the paired and authenticated harness ("the harness" throughout this file means those project-local scripts).

## Quick start

**First, have something to test.** Either a page that already loads in Chrome — a live site, a
staging URL — or a local app you have started the way its own instructions say. Confirm the address
opens in Chrome before you start; everything below drives that same browser.

Against a URL, which is the shortest path to a result:

```
/know-qa:init .                                                             # scaffold .know-qa/ in your working folder
/know-qa:run --url https://example.org "check keyboard navigation and form labels"
/know-qa:report --project .                                                 # what happened, and is it a pattern?
```

Against a local app, using a written spec you can re-run:

```
/know-qa:init .                                        # scaffold .know-qa/ in your project
/know-qa:gen checkout "Checkout flow with saved cards" # draft a spec from a description
/know-qa:run --project . --spec checkout               # run it against your running app
/know-qa:report --project .                            # what happened, and is it a pattern?
```

Replace the URL and the description with your own. That's the whole loop for day one. If you'd rather not memorize commands, `/know-qa:start "what you want in plain English"` sets up the right one for you, `/know-qa:guide` tells you what to run next from your project's state, and `/know-qa:help` explains any command. The rest of this README explains each command and the machinery underneath.

## The skills

| Command | What it does |
|---|---|
| `/know-qa:init` | Make any project testable: scaffold `.know-qa/`, deploy the harness, check prerequisites |
| `/know-qa:start` | The front door: say what you want in plain English, get set up with the right command |
| `/know-qa:gen` | Draft a test spec from a description, a doc, a live page, or a paired session |
| `/know-qa:run` | Run specs (or an ad-hoc instruction) and get judged pass/fail with evidence |
| `/know-qa:check` | Fast phase-gate: verify what was just built before calling it done |
| `/know-qa:monitor` | Recurring smoke tests against a live URL with regression detection |
| `/know-qa:report` | Cross-session report: trends, systemic themes, area roll-up, and filing into your tracker |
| `/know-qa:pair` | A human and the agent on the same live browser, judging together |
| `/know-qa:guide` | Reads your `.know-qa/` state and tells you which command to run next |
| `/know-qa:help` | List and explain the skills and all of their options |

### /know-qa:init — make a project testable

```
/know-qa:init ~/Projects/my-app
```

One command, and the project has a consistent testing structure: a `.know-qa/` directory with a starter smoke-test spec, a findings registry (`FINDINGS.md`), a protected-environment allowlist (`environments.json`, default-deny — only localhost starts write-allowed), an empty area registry (`areas.json`, off until you fill it in), and the paired/authenticated harness installed into `.know-qa/tools/`. It also checks the prerequisites (the global `playwright-cli`, Node, Chrome) and installs what it can. A `.gitignore` keeps sessions and scratch output out of your repo.

### /know-qa:start — say what you want, get set up

```
/know-qa:start "test the checkout flow"
/know-qa:start "set up regular checks on the Opportunities area I own"
```

The front door for anyone who knows what they want but not which command does it. You describe the goal in plain English; `/know-qa:start` asks a question or two, then dispatches to the right skill — generating a spec, scaffolding an owned area, kicking off a monitor — and hands you back the command it ran. It's a thin router, not a replacement: it calls the same skills you'd call yourself. (Its sibling `/know-qa:guide` answers "what's next" from your project's state; `/know-qa:help` answers "what does this command do.")

For "set up the area I own," it goes a step further: after writing your `areas.json` entry it **opens a browser and maps your surface** — exploring the page and generating observed specs for the overall surface and each component — so your area stands up with real, runnable coverage instead of an empty entry you have to fill in. You stay in the loop on which components to map, and if the app is behind a login you sign in once via `/know-qa:pair` first.

### /know-qa:gen — author tests without writing them by hand

```
/know-qa:gen login "Email/password auth including forgot-password"   # from a description
/know-qa:gen checkout --from docs/checkout-flow.md                    # from existing docs
/know-qa:gen profile --from http://localhost:3000/profile             # by exploring the live page
/know-qa:gen checkout-flow --from-session checkout-calibration        # from a paired session
```

The agent drafts; you refine. Specs generated by exploring a live page mark observed behavior with `[OBSERVED]` so you can confirm intent before trusting them. The `--from-session` mode is the pair-then-automate path: a flow a human calibrated in `/know-qa:pair` becomes a runnable spec, with judgment calls flagged `[CONFIRM]` for you to settle before it runs unattended.

### /know-qa:run — the core: a spec in, a judged result out

```
/know-qa:run --project . --spec login                  # one spec
/know-qa:run --project .                               # all specs
/know-qa:run --project . --tag smoke                   # only tagged scenarios
/know-qa:run --project . --area checkout               # just one owned area (from areas.json)
/know-qa:run --project . --owner jdoe                  # everything one owner owns
/know-qa:run --project . --spec login --env staging    # an environment profile from the spec
/know-qa:run --url http://localhost:3000 "Test that search handles empty queries gracefully"
```

Spawns the tester agent, which works the spec like a skeptical human: edge cases by default (empty inputs, Unicode, double-clicks, refresh mid-action), baseline accessibility on every page (keyboard reachability, focus, labels, alt text), network and timing watched on every interaction, and screenshots that are actually looked at, not just saved. Results come back grouped by confidence — Definite, Likely, Possible, all shown — plus a separate "surfaced for decision" block for design-intent questions that belong to you, not the agent. Reports persist to `.know-qa/reports/`; new defects are appended to the findings registry.

### /know-qa:check — stop "the code exists" from passing as "it works"

```
/know-qa:check --url http://localhost:3000 --phase 3
```

A fast verification gate for build boundaries: it reads what the phase was supposed to deliver, tests exactly that, and returns a structured pass/fail an orchestrator can act on. Integrates with phase-based build workflows that expect a structured gate result. After three failed gate runs it stops retrying and tells you to reconsider the approach — it is explicitly not a retry loop.

### /know-qa:monitor — catch what breaks after it shipped

```
/know-qa:monitor --project . --url https://staging.example.com --tag smoke --interval 30
```

Recurring smoke runs against a live URL. It keeps a last-known-good baseline per scenario, so the alert signal is *regressions* — things that worked and now don't — rather than noise. It checks the findings registry every run, so a known, already-filed issue is annotated ("matches F-012 / WEB-123") instead of being re-raised every cycle. Alerts persist to disk and surface at your next session start.

One honest caveat on schedules: `/know-qa:monitor` rides Claude Code's native `/loop`, so it recurs for as long as the session stays open and the machine stays awake — that covers a workday or a deliberate overnight (sleep disabled, session left running; pass `--unattended` so no firing stalls on a question). What it doesn't cover is true cross-day, always-on monitoring: that still needs something outside the session running `claude -p "/know-qa:run --project . --tag smoke --unattended"` on a timer (a desktop scheduled task, cron, GitHub Actions). Claude Code's cloud routines are not a fit for browser work that depends on a locally saved signed-in session — a cloud agent has no access to your machine's Chrome or auth state.

### /know-qa:report — what happened, is it a pattern, and where does it land?

```
/know-qa:report --project .                  # latest run + trends
/know-qa:report --project . --since 14d      # widen the trend window
/know-qa:report --project . --owner jdoe     # scope to one owner's areas
/know-qa:report --project . --file           # file findings into your tracker
```

Reads entirely from disk, so it works in a fresh session with no memory of the runs. Layers:

- **Latest run** — findings with their evidence, grouped by confidence.
- **Trends** — recurring failures across runs, regression timeline, improvements.
- **Systemic themes** — findings clustered by shared root cause. The most valuable output of a sweep is usually not any single ticket; it's "six of nine findings trace to the avatar service," which points at one fix instead of six tickets.
- **Area roll-up** (when you use areas) — open findings grouped by area, with owner, count, and when each area was last checked. So each owner sees their slice at a glance.

If you declare a sink in `.know-qa/reporting.json`, the roll-up also posts to it — a Slack channel, say — with a configurable identity and threading. The plugin formats and routes; the actual posting is done by whatever integration you have already connected to Claude (a Slack connector, for instance). Without one, the report still writes its file locally and tells you it could not post. No `reporting.json` means report-file-only, unchanged. The canonical definition is `reference/reporting-sinks.md`.

`--file` files the gated findings (only confirmed defects — never design-judgment calls) into **your** tracker, whichever it is. Filing is a learned, per-project procedure, not a GitHub feature: the agent asks where tickets land, samples a recent ticket to learn the house shape (sprint and board fields, epic links, labels, how summaries are written), files **one**, and asks you to confirm it landed where the team looks before filing the rest. The stable parts of that contract are cached in `.know-qa/`; volatile values like the active sprint are re-derived every session. No tracker connected? It degrades to an explicit "Would have filed" section — never a silent skip.

### /know-qa:pair — judgment work, together on one live browser

```
/know-qa:pair --project . --url https://staging.example.com
```

You watch a real, visible Chrome window and direct it in conversation — "go to settings," "click save," "that spacing looks wrong." The agent executes one step at a time, capturing console, network, and screenshots around each action, and answers with what the four signals say. When you say "that looks wrong," it digs for the corroborating fact underneath and writes a proper finding with your observation on top of the evidence.

This is also how the agent reaches **gated deployments**: a one-time human sign-in (`login.mjs` — including SSO, OAuth, and 2FA no script can do) persists an environment-isolated session the harness reuses. And it's the front half of **pair-then-automate**: calibrate a tricky flow here, then `/know-qa:gen --from-session` turns it into a spec that runs at volume.

A paired session maintains `.know-qa/QA-SESSION-STATE.md` continuously — what's being tested, what's been filed, what's waiting on a decision — so a long session survives a context clear and a fresh session can resume it cleanly.

### /know-qa:guide — which command do I run now?

```
/know-qa:guide --project .
```

Reads the `.know-qa/` state on disk and recommends the next step: no `.know-qa/` means init, specs but no runs means run, a monitor alert gets surfaced first, a live session-state file gets a resume hint, and judgment-shaped work gets routed to `/know-qa:pair`. Useful for people and for orchestrating agents entering a project cold.

### /know-qa:help — what does this command do?

```
/know-qa:help            # list every skill with its purpose and key flags
/know-qa:help run        # full arguments and usage for one skill
```

The reference manual. It discovers the skills by reading the plugin's own files at run time, so it can't fall out of date as the skill set grows. Three sibling entry points, three jobs: `/know-qa:help` (what *is* this), `/know-qa:guide` (what's next, from your state), `/know-qa:start` (set up my goal, from my words).

## Areas and owners — split the app so no one person carries it

A product gets too big for one person to watch end to end. The optional **area registry** (`.know-qa/areas.json`) splits it into areas, each with an **owner**, so each owner runs and watches just their slice. It's the same idea as an "area owners" page, made executable — and it's the one object behind both *which scenarios to run* and *who a finding routes to*.

```jsonc
{
  "owners": {
    "jdoe": { "display": "Jane Doe", "notify": "jane@example.com" }
  },
  "areas": [
    {
      "key": "checkout",                       // stable slug; also the membership tag and the finding's area stamp
      "display": "Checkout & Payments",
      "owner": "jdoe",
      "status": "implemented",                 // or "not-implemented" → smoke-only, never files "missing feature"
      "match": { "tag": "area:checkout",        // primary: scenarios tagged area:checkout belong to this area
                 "specs": ["checkout.md", "cart/*.md"],  // or claim whole spec files by glob
                 "tags": ["payments"] },        // or fold in extra tags
      "cadence": "daily",                       // advisory; feeds the /know-qa:guide staleness nudge
      "invariants": ["Cart total equals the sum of line items"]  // plain-English checks handed to the agent
    }
  ],
  "escalation": [
    { "area": "checkout", "severity": "Critical", "action": "escalate" },
    { "area": "*",        "severity": "Critical", "action": "escalate" }   // "*" = any area
  ]
}
```

The minimal area is just `{ "key", "display", "owner" }` — everything else is optional, and an area with no `match` claims scenarios tagged `area:<key>`. A few behaviors worth knowing:

- **`--area` / `--owner` resolve up front** into the normal spec/tag selection — they are not a separate filter the tester applies. `--owner jdoe` is the union of every area Jane owns. Combine with `--tag` and it ANDs ("the checkout scenarios that are also `smoke`"). Works on `/know-qa:run`, `/know-qa:monitor`, and `/know-qa:report`.
- **Routing falls out of the registry.** A finding in an area is stamped with that area and owner, so `/know-qa:report` rolls findings up per area (owner, open count, last checked) and proposes the owner as the suggested assignee when filing. Suggestions only — it never auto-assigns or pings a person.
- **Escalation is opt-in.** When the `escalation` matrix matches a finding's `(area, severity)`, the report surfaces it in a dedicated Escalations block with the owner's handle. No matrix means no escalation.
- **A morning nudge, if you want it.** Drop your handle in `.know-qa/.me` (per-machine, gitignored) and the session-start hook greets you with a one-line-per-area summary of your open findings. Off unless both `.me` and `areas.json` exist; it never guesses who you are.

Leave `areas.json` empty and none of this is in your way — it's pure opt-in config. Author it by hand, or run `/know-qa:start "set up the area I own"`: it writes the entry, then **opens a browser and maps your surface** — generating observed specs for the overall surface and each component — and starts monitoring, so your area stands up with real coverage in one pass instead of an empty entry.

## Reporting sinks — push roll-ups where the team watches

By default a report writes a file. If you want it pushed somewhere the team already looks — a Slack channel, say — declare a **sink** in `.know-qa/reporting.json` (optional; absent means file-only, exactly as before):

```jsonc
{
  "sinks": [
    {
      "type": "slack",
      "identity": { "name": "Web QA", "emoji": ":mag:" },   // how the post signs itself
      "target": "#qa-web",
      "threaded": true,                                       // follow-ups reply under the first post
      "post_when": "always",                                  // or "findings-only" / "regressions-only"
      "scope": { "owner": "jdoe" },                           // optional: only this owner's findings
      "include": ["summary", "themes", "filed", "trends"]     // trim the post to what matters
    }
  ]
}
```

The plugin formats and routes; **the posting itself is done by an integration you have already connected to Claude** (a Slack connector, for instance). It does not bundle an integration or hold a token — `reporting.json` carries channel names and a posting identity, nothing secret. A noisy channel can ask for `regressions-only`; a per-owner sink with a `scope` posts just that owner's slice. `/know-qa:monitor` can post the same way at the end of a run. If that integration (an MCP server, in Claude's terms) isn't connected, the report still writes its file and tells you it couldn't post — it never fails over a missing sink. Full reference: `reference/reporting-sinks.md`.

## Findings, not noise

Detection is only the first third of the work. What separates a usable QA agent from a false-positive firehose is what happens after, and it's built in:

- **Every finding has a disposition** — `defect`, `likely_defect`, `needs_design_judgment`, `spec_ambiguity`, `environment_noise`, or `known_issue` — and the disposition decides its routing. Only confirmed defects flow toward filing. Aesthetic calls are surfaced for a human; the agent doesn't make the call that's yours to make.
- **Noise discipline.** Framework prefetch cancellations, dev-server cold starts, loading intermediates, and third-party widget noise are recognized as benign classes — and confirmed by re-test (warm vs. cold) before being discarded, with an audit note so you can see what was filtered.
- **Reliability labels.** A finding is reproduced before it's reported and labeled `deterministic`, `intermittent` (with a hypothesis for the variance), or `transient`. "Works warm, fails cold — likely a race in the avatar fetch" is a finding a developer can act on; a flat "broken" is not.
- **A registry with a memory.** `.know-qa/FINDINGS.md` is the durable per-project register, deduped by root cause rather than symptom wording — so the same bug seen on two pages is one entry with a bigger blast radius, not two tickets.
- **Visual findings need corroboration.** A screenshot judgment earns high confidence only when a DOM, network, or console fact backs it; visual-only findings cap at medium and never gate a pass/fail.

The full contract lives in `reference/finding-lifecycle.md` and is forwarded into every test run, so every skill operates on the same structure.

## Safety on real accounts

The moment testing touches a real account on a live deployment, the default posture is **read and observe** — no persistent mutation without explicit consent. That rule is enforced in layers, not just stated: the harness itself refuses destructive-looking clicks (delete, pay, submit, …) on any origin you haven't explicitly write-allowed in `.know-qa/environments.json`, and proceeding requires a per-action `--allow-write` after a human's yes. Evidence from authenticated sessions is redacted before it reaches a report or ticket, and saved sessions live in gitignored files that never leave the project. The layered model — and an honest statement of what each layer does and doesn't guarantee — is in `reference/safety.md`.

## What lands in your project

```
your-project/
└── .know-qa/
    ├── *.md                 # your specs (see examples/SPEC-FORMAT.md for the full format)
    ├── FINDINGS.md          # the findings registry (committable)
    ├── environments.json    # write-allowed origins, default-deny (committable)
    ├── areas.json           # optional area registry: areas, owners, routing (committable)
    ├── reporting.json       # optional reporting-sink config (committable)
    ├── QA-SESSION-STATE.md  # living state during long/paired sessions
    ├── reports/             # judged reports, one per run + HISTORY.md
    ├── runs/                # gitignored evidence: sanitized text + restricted raw captures
    ├── engine/              # deployed deterministic manifest/result contracts (gitignored)
    ├── .me                  # per-machine owner identity for the session roll-up (gitignored)
    └── tools/               # the paired/auth harness incl. the seeding tools (.auth/ and node_modules gitignored);
                             #   harness.json records what /know-qa:init deployed
```

Everything the plugin writes stays under `.know-qa/`. The identical structure and commands work on any project against any server — pointing at a different deployment is a flag, not a rebuild.

## Accessibility, two tiers deep

Baseline accessibility rides along in every test: keyboard reachability, visible focus, alt text, form labels, obvious contrast problems. Tier 2 (opt-in per spec via `## Accessibility Focus`, or `--a11y-depth deep` when generating) goes further:

- **Contrast ratios computed, not estimated.** WCAG AA ratios calculated from the resolved
  foreground and background colors of solid-background text — "1.98:1, needs 4.5:1" — with gradient and image backgrounds bounded where possible and flagged for review rather than guessed.
- **A full axe-core pass.** The complete bundled ruleset — 105 rules in the pinned axe-core 4.12.1 (ARIA validity, labels, landmarks, contrast); violations mapped by impact, and axe's "can't decide" results judged by the agent instead of dropped. Of those 105, **75 carry a WCAG success criterion and 30 are axe's own best-practice rules, which map to no criterion at all** — `heading-order` and `empty-heading` among them.
- **Findings carry their success criteria where the rule has one.** A violation or needs-review result from a WCAG-tagged rule is annotated with the criteria it maps to and the conformance level (`[WCAG AA: 1.4.3, 4.1.2]`), read from the pinned axe-core's own rule metadata rather than a hand-maintained table, so it cannot drift from the rules actually running. A result from one of the 30 best-practice rules is reported with no criterion, which is correct and not a gap — it is a real accessibility problem that no success criterion covers, and presenting it as a WCAG violation would be wrong. A run ends with a roll-up of which criteria were touched. **This is coverage, not conformance:** axe has rules for only a subset of the criteria, so a criterion absent from the output is untested rather than satisfied, and this tooling cannot tell those apart. `reference/wcag-mapping.md` states the four reasons it is not a conformance evaluation and what one additionally requires.
- **ARIA widget keyboard conformance.** Composite widgets (menu buttons, comboboxes, tabs, disclosures) are driven through their ARIA Authoring Practices keyboard contracts — keys pressed, focus and aria state observed — so "this menu is mouse-only" is a reproduced behavioral fact, not a lint warning.
- Plus the structural suite: focus trapping, heading hierarchy, landmarks, touch targets, reduced motion, zoom, and form-error accessibility.

The honest boundary: what a screen reader actually *announces* — announcement order, virtual-cursor behavior, AT quirks — needs real assistive-tech automation and is explicitly not claimed. Structural and behavioral facts are claimed; announcements are not.

## Scope, honestly

Web only — CLI and native-GUI testing are different domains. Screen-reader/AT-behavior testing is out of scope (see above). Paired mode complements autonomous testing; it doesn't replace it.

## Status

Version 0.1.0 is the first release in the Knowbility marketplace. Everything described above is
implemented and present — the ten commands, the tester agent, the browser harness, the findings
workflow, tracker filing, owned areas, reporting, screen recording, and the two-tier accessibility
suite — and the port's code was verified. **What has not been verified is the journey you are
about to take.** The port was verified by manifest validation, module resolution across every harness tool, an engine spec compile, and a dynamic-reference sweep; it has not yet been driven against a live site from a cold install here. `CHANGELOG.md` records what was removed from the plugin this was forked from and why. The grounding spec and build orientation live in the marketplace repo at `dev/know-qa-agent/` and intentionally do not ship with the installed plugin.

Part of the [Knowbility marketplace](https://github.com/knowbility/knowbility-marketplace).
