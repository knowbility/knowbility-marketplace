---
name: know-qa:pair
description: Run a paired QA session — a human watches and directs a live visible browser while the agent captures and correlates console, network, DOM, and screenshots around every action
argument-hint: "--project <path> --url <target-url>"
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# /know-qa:pair

A paired QA session: the human watches a real, visible Chrome window and directs it in conversation — navigate, click, "what just happened there?", "that looks wrong" — while the agent captures the four signals (rendered screen, DOM, network, console) around each action and surfaces them live. Best for visual/UX judgment, ambiguous behavior, gated SSO/OAuth/2FA deployments no script can reach, and figuring out how to test something new.

Same `.know-qa/` structure, same finding contract, same reports as autonomous runs — only the driver changes. A flow calibrated here can be emitted as a spec afterward (`/know-qa:gen --from-session`) and run autonomously at volume.

## Usage

```
/know-qa:pair --project ~/Projects/my-app --url http://localhost:3000
/know-qa:pair --project . --url https://staging.example.com        # gated target: login.mjs first (step 2)
```

## Prerequisites (read before starting)

Read these now — they govern the whole session:

1. `${CLAUDE_PLUGIN_ROOT}/reference/finding-lifecycle.md` — the finding contract. Every observation that becomes a finding is emitted in this shape, dispositioned, and routed by disposition.
2. `${CLAUDE_PLUGIN_ROOT}/reference/safety.md` — the safety layers. In a paired session you are often on a real account on a live deployment; the rule is read-and-observe, writes only after the human's explicit yes.
3. `{project}/.know-qa/environments.json` — the protected-environment allowlist for this project. Note whether the target origin is write-allowed.

## Step 1: Preflight

1. Verify the harness is deployed: `{project}/.know-qa/tools/drive.mjs` exists and `{project}/.know-qa/tools/node_modules/` is installed. If not, route to `/know-qa:init` first.
2. Read `{project}/.know-qa/FINDINGS.md` (active entries) — the dedup registry for anything found this session.
3. All harness commands below run from `{project}/.know-qa/tools/`.

## Step 2: Get the window up

Check whether a CDP-attached Chrome is already alive:

```bash
curl -s http://localhost:9222/json/version > /dev/null && echo "CDP alive" || echo "no browser"
```

**If no browser**, launch it yourself. The human is only needed for one thing — the interactive sign-in — and only when it's actually due:

- **Gated deployment** (SSO/OAuth/2FA) and the target's `.know-qa/tools/.auth/<environment>/` profile is missing or expired — the human runs the one-time sign-in in their own terminal (it's interactive, including 2FA). Use the same optional `--env` value for login and browser launch; without it both commands derive an isolated key from the target origin:
  ```bash
  node login.mjs --url {target-url} [--env {environment-name}]
  ```
  The session persists under gitignored `.auth/<environment>/`. If that environment already holds a live session, skip this — don't hand the human a command they don't need.
- **Then open the visible window yourself** — `open-browser.sh` runs Chrome in the foreground, so detach it the same way as `watch.mjs` (a bare `&` dies with the invoking shell):
  ```bash
  nohup bash open-browser.sh "{target-url}" [--env "{environment-name}"] > /dev/null 2>&1 &
  echo $! > /tmp/qa-browser-{session-name}.pid
  ```

Re-check CDP, then confirm you both see the same page (describe what's on screen from a first observe pass).

## Step 3: Session state

`{project}/.know-qa/QA-SESSION-STATE.md` is a first-class output of a paired session — it is what lets the session resume cleanly after a context clear.

- If it exists: read it top to bottom and resume — environment, filed-this-session list, surfaced-for-decision items, next tasks.
- If not: create it from `${CLAUDE_PLUGIN_ROOT}/examples/qa-session-state-template.md`, filling in what's known (purpose, target, auth gate, owner).

Update it as the session progresses (step 6) — it is a living document, not a wrap-up artifact.

## Step 4: Start the passive monitor

In the background, so console/network/WebSocket events stream while the human interacts freely (typing, scrolling, exploring by hand). A bare `&` dies with the invoking shell — detach it properly and keep the pid:

```bash
nohup node watch.mjs --name {session-name}-watch > /dev/null 2>&1 &
echo $! > /tmp/qa-watch-{session-name}.pid
```

Events log to `.know-qa/runs/{session-name}-watch/events.log`. The monitor is read-only and safe to leave running for the whole session. Name it `{session-name}-watch` (not the bare session name) so its output dir never collides with the step captures' `{session-name}-step*` dirs.

To stop it later (wrap-up): `kill $(cat /tmp/qa-watch-{session-name}.pid)` — and check for a surviving child with `pgrep -f "watch.mjs --name {session-name}-watch"`, killing that too if present (the launcher and the node child can be separate processes).

## Step 5: The loop

The human directs; you execute, capture, and correlate. Each direction takes one of three shapes:

**"Go to X" / "click Y" — you drive one step.** Name steps `{session-name}-step{N}` (sequential) so the captures group and `/know-qa:gen --from-session` can reconstruct the flow:

```bash
node drive.mjs --url {url} --name {session-name}-step1                # navigate + capture
node drive.mjs --text "{visible text}" --name {session-name}-step2   # click + capture
node drive.mjs --click "{css}" --name {session-name}-step3           # click by selector
node drive.mjs --name {session-name}-step4                           # observe only (no action)
```

Each step captures console + network + screenshots around that one action into `.know-qa/runs/{step-name}/`. After each step: read the screenshot, scan the text-sanitized `report.md`, and tell the human what the four signals say — briefly when all is well, fully when something moved. Files named `*.raw.*` and all screenshots are restricted evidence; do not promote them to a durable report, sink, registry, or ticket until a human has reviewed/cropped them.

**The human drove by hand** ("I just clicked through to settings — anything?"): read the watch log for that window of time, then run an observe pass (`drive.mjs --name {step}` with no action) for the current state, and correlate.

**"That looks wrong" — the human's judgment becomes a finding:** capture the state if not already captured, dig for the corroborating fact (failed request? collapsed element? console error? — `inspect-chat.mjs`/`inspect-labels.mjs`/`audit.mjs`/`fingerprint.mjs` help here), and emit a canonical finding that places the human's observation on top of the evidence underneath it. Apply the contract: noise-filter, reliability label (reproduce when practical), disposition. Dedup against the registry — "that's F-012, already filed" is a useful answer. Design-intent questions go the other way too: when *you* notice an aesthetic oddity, surface it as `needs_design_judgment` and ask — the human is sitting right there; this mode exists to use their judgment.

**Writes during the session:** if a directed action is mutation-shaped, `drive.mjs`'s tripwire may refuse it (destructive lexicon + origin not write-allowed). That refusal is a stop-and-confirm moment: state what the click would do, and only on the human's explicit yes re-run with `--allow-write`. The human directing the session **is** the consent channel — but consent is per action, not blanket. Never pass `--allow-write` preemptively.

## Step 6: Keep the session resumable

After each finding, route change, or decision, update `QA-SESSION-STATE.md`: routes visited / not yet visited, findings so far (with dispositions and registry ids), surfaced-for-decision items and any answers the human gave, next tasks in order. Cheap to maintain continuously; expensive to reconstruct after a context clear.

## Step 7: Wrap up

When the human ends the session (or it winds down):

1. **Summarize**: what was covered, findings by confidence, surfaced-for-decision items with the human's calls where made, anything left open.
2. **Persist**: append findings dispositioned `defect` / confirmed `likely_defect` to `.know-qa/FINDINGS.md` (contract entry shape, `status: open`); write the session report to `.know-qa/reports/{timestamp}-pair-{session-name}.md`; final `QA-SESSION-STATE.md` update.
3. **Offer the handoffs:**
   - `/know-qa:report --file` — file this session's gated findings into the tracker via the learned procedure.
   - `/know-qa:gen {spec-name} --from-session {session-name}` — emit any flow the human calibrated as a spec, to run autonomously at volume from here on.
4. Leave the browser window open (the harness never closes it) and tell the human it's theirs — if they want it closed, `kill $(cat /tmp/qa-browser-{session-name}.pid)`. Stop `watch.mjs` via the pid file from Step 4 (and `pgrep -f watch.mjs` for any surviving child).

## What this mode is not

- Not for volume — that's `/know-qa:run`. If the human finds themselves directing the same flow a third time, that's the signal to emit a spec and automate it.
- Not a license to mutate — the safety boundary applies *more* here, not less, because paired sessions are how the agent ends up on real accounts behind SSO.
