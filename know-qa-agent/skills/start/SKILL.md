---
name: know-qa:start
description: Front door for QA — take a plain-English intent, ask 1-3 clarifying questions, then dispatch to the right QA skill and scaffold the artifact. For "set up my area" it also maps the surface in a real browser to stand the area up with observed specs. A thin orchestrator wizard; it does not re-implement gen/init/run.
argument-hint: "<plain-English intent>"
allowed-tools: Read, Write, Bash, Grep, Glob, Agent
---

# /know-qa:start

The front door. Say what you want in plain English — "test the checkout flow", "set up regular checks on the Opportunities area I own", "what's broken on staging?" — and this skill figures out which QA command does it, asks at most a few clarifying questions, and gets you there.

It is a **thin orchestrator**. It does three things only: (1) classify your intent, (2) ask ≤3 clarifying questions, (3) **dispatch to the owning skill** and/or author the one small config file the intent implies. It never re-implements another skill — it invokes it, the same way `/know-qa:monitor` invokes `/know-qa:run`. Anything bigger than a small config file (a spec, the `.know-qa/` scaffold, a browser run) is a handoff, not work `/know-qa:start` does itself.

`Write` is present only for the small config artifacts it authors conversationally (`areas.json`, optionally `reporting.json`).

## How it composes with `/know-qa:guide` (no duplication)

- **Intent picks the skill.** `/know-qa:start` classifies what you *want* and routes to the owning command.
- **State picks whether a prerequisite is needed first.** Before dispatching, do the same cheap `.know-qa/` check `/know-qa:guide` does (or literally invoke `/know-qa:guide --project <path>`), and use the result only to decide whether to prepend a step — e.g. skip `/know-qa:init` if `.know-qa/` already exists, or run `/know-qa:gen` first if no spec covers the target.

Do not re-encode guide's priority ladder here. Consult it.

## Arguments

| Argument | Required | Default | Description |
|----------|----------|---------|-------------|
| `<plain-English intent>` | No | — | What you want to do, in your own words. If omitted, ask one open question to capture it. |

## Intent → skill routing

| Plain-English intent (examples) | Clarify (≤3) | Dispatch / scaffold |
|---|---|---|
| "set up QA here", "nothing's set up yet" | project path? | `/know-qa:init <path>`, then offer `/know-qa:gen` |
| "test the checkout flow", "test the profile page" (reusable) | URL? from a doc/live page? spec name? | `/know-qa:gen <name> …` → then `/know-qa:run --project <path> --spec <name>` |
| "what's broken on staging?", "test this right now" (one-off) | which URL? what to check? | `/know-qa:run --url <url> "<task>"` (ad-hoc, no spec) |
| "set up regular checks on the Opportunities area I own" | which URL/path is that area? owner = you or someone else? cadence/tag? (a component list, if they have one) | author/merge a `.know-qa/areas.json` entry; **map the surface in a browser** to generate observed specs (overall + per-component); `/know-qa:monitor --project <path> --area <key>`; optionally author a `reporting.json` sink for that owner |
| "keep an eye on production / staging" | URL? tag? interval? | `/know-qa:monitor --project <path> --url <url> …` |
| "I need to look at this myself", "the layout looks off", "it's behind SSO" | URL? | `/know-qa:pair --project <path> --url <url>` (never unattended) |
| "what happened / show me trends / file the bugs" | window? `--file`? | `/know-qa:report --project <path> [--since …] [--file]` |
| "verify the phase I just built" | URL? phase #? | `/know-qa:check --url <url> [--phase N]` |
| "what does X do / what are its flags" | — | hand to `/know-qa:help [X]` |
| "I don't know what I need" | — | hand to `/know-qa:guide --project <path>` (state decides) |

## Execution Flow

1. **Capture intent** — the quoted free-text argument. If absent, ask one open question ("What do you want QA to do?") and wait.
2. **Classify** against the routing table; pick the owning skill. If two rows are plausible, ask one disambiguating question — don't guess.
3. **State check** — invoke `/know-qa:guide --project <path>` (or run the same `.know-qa/` existence/spec/report checks) to decide which prerequisite steps to prepend.
4. **Clarify** — ask at most 1-3 questions. Never more. Prefer sensible defaults (e.g. tag `smoke`, monitor's default interval) over an extra question.
5. **Scaffold the minimal config** — only for the "set up my area" intent (and an optional reporting sink). Confirm before writing. See the area-authoring flow below.
6. **Dispatch** — invoke the resolved slash command(s) in order, exactly as `/know-qa:monitor` invokes `/know-qa:run`. Show the user the command(s) you're running.
7. **Hand off cleanly** — state what was created and what to run next. Do not loop back into `/know-qa:start`.

## Standing up an area (the "set up my area" intent)

This is the one intent where `/know-qa:start` does more than dispatch: it writes the area config **and maps the surface in a real browser** so the owner ends up with runnable, observed specs — not an empty registry entry they have to populate by hand. Run it in three phases.

### Phase A — Structural config (`.know-qa/areas.json`)

Conform to the area-registry schema (see `${CLAUDE_PLUGIN_ROOT}/examples/SPEC-FORMAT.md` for the `area:<key>` convention and `/know-qa:init`'s scaffolded `areas.json` for the shape) — never invent a different schema.

1. Ask which URL/path constitutes the area (e.g. `/opportunities`, `/opportunities/*`) — this becomes `entry_url`.
2. Confirm the owner — default to the current user, let them override. Add them to `owners` with a display name and notify handle if not already present.
3. Ask cadence/tag (default tag `smoke`; default interval from monitor). **Also ask whether they have a component list** for the area (many teams keep one on a wiki page or in a service catalog) — if so, take it; if not, the browser map in Phase B discovers the components.
4. Read any existing `.know-qa/areas.json`; **merge** one area entry `{ key, display, owner, match, cadence, entry_url }` into `areas` (don't clobber existing areas). Confirm the diff, then write.

### Phase B — Map the surface in a browser

A description can't produce meaningful component specs — "Opportunity Card" only means something once the agent has *seen* it. So stand the area up by exploring it live. Each step here dispatches `/know-qa:gen --from <url>` (which drives the browser and emits observed specs); `/know-qa:start` does not re-implement exploration.

5. **Preflight the session.** Confirm the agent can reach the surface. If the app is gated and no saved auth session exists, tell the user to run `/know-qa:pair --url <entry_url>` once to sign in (the harness saves the session), then resume — don't fail silently or guess credentials.
6. **Map the overall surface.** Dispatch `/know-qa:gen <key>/overall --from <entry_url> "Map the <Area> surface — overall layout, load behavior, navigation, surface-level functionality. Tag scenarios area:<key>."` This generates the surface-health spec and, in exploring, surfaces the components present on the page.
7. **Present the component inventory** discovered in step 6 (reconciled with any list from step 3) and **offer per-component specs**. For each component the user wants now, dispatch `/know-qa:gen <key>/<component> --from <url> "<focused instruction>. Tag area:<key>."`. Confirm before each — browser runs are heavier — and tell them the rest can be generated later with the same command. Keep the human in the loop on which components to map; don't silently spec all of them.
8. Ensure the generated specs carry the `area:<key>` tag and a `smoke` tag on the key health scenarios (so `/know-qa:monitor` has something to watch). Remind the user to review the `[OBSERVED]`/`[CONFIRM]` markers `/know-qa:gen` leaves — observed behavior is assumed-correct until they confirm it.

### Phase C — Monitor and route

9. Dispatch `/know-qa:monitor --project <path> --area <key>` to start watching on the chosen cadence.
10. Offer (don't force) a per-owner reporting sink. If yes, author a `.know-qa/reporting.json` entry scoped to that owner (see `${CLAUDE_PLUGIN_ROOT}/reference/reporting-sinks.md`). This is where the area registry, routing, and sinks compose.

## Guardrails

- Confirm before writing any file. Never overwrite an existing `areas.json`/`reporting.json` — merge.
- Never re-enter `/know-qa:start` from within itself.
- `/know-qa:start` still doesn't drive the browser *itself* — the browser mapping in Phase B is dispatched to `/know-qa:gen`, which owns exploration. Same thin-orchestrator rule, one more dispatch.
