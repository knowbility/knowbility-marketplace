# Paired QA with Playwright (the harness)

## What this is

A set of scripts that drive a real, logged-in browser while you watch it. You navigate and click; each step records what is happening underneath the page: console output, failed network requests, load timings, and screenshots. The output is concrete evidence you can hand to engineers instead of a description.

`/know-qa:init` deploys these scripts into your project at `.know-qa/tools/` and installs their one dependency. They are the paired/authenticated side of know-qa-agent; the autonomous `/know-qa:run` path drives the browser separately via `playwright-cli`.

## Why we work this way

Testing a web app well takes two kinds of attention at once.

A person watching the screen catches what only a person catches: the layout is too wide, the spacing is off, the copy is wrong, this transition feels slow.

A script watching the browser catches what a person cannot see: the console error that fired, the request that failed or took 600 ms, the exact computed styles.

Each view alone is half the story. "This page is too wide" is a symptom with no cause. A console error is a cause with no idea what the user saw. Together they are a diagnosis: you see the visual problem and, in the same moment, the console and network data that explain it.

Pairing a person with Playwright puts both in one place. You drive a real browser and watch it at the same time, so what you see and what the scripts record come from the same window and line up exactly. One person ends up working with every skill set at once: a designer's eye, a front-end debugger's console, and a performance analyst's timings.

## What you can do

- **Paired live session.** Open a visible browser, drive it, watch it. Every action captures console, network, and a screenshot.
- **Authenticated testing.** Sign in once by hand — including SSO, OAuth, or 2FA no script can do — and every later run reuses that session.
- **Navigation timing.** Measure how long it takes to move between screens.
- **Cold-load timing.** Measure a fresh full load: TTFB, DOMContentLoaded, load, and the slowest requests.
- **Headless capture.** Run any of the above with no window, for quick repeatable checks.
- **Structure, copy, and consistency passes.** A read-only audit (labels, dead links, alt text, heading outline, plus leaked debug/error text and placeholder copy) and a computed-style design fingerprint for cross-page consistency diffs.

## Safety rule for live authenticated sessions

Once a session is established against a real account, the default posture is **read and observe**. The agent does not make persistent mutations to a real account or production data without explicit consent: a write (flipping a setting, editing a profile, deleting data, submitting a real transaction) happens only after confirming with the human, or against a disposable/test account. See the qa-tester agent definition for the full rule, and the plugin's `reference/safety.md` for the layered enforcement model.

Two mechanical pieces back the rule:

- **The protected-environment allowlist** — `.know-qa/environments.json` (scaffolded by `/know-qa:init`) lists origins where writes are allowed, default-deny. Local dev servers start allowed; live/staging origins are added by a human, deliberately.
- **The `drive.mjs` tripwire** — before a `--click`/`--text` action, the driver reads the target's visible text and accessible name; if it matches the destructive lexicon (delete, pay, submit, confirm, …) and the page origin isn't write-allowed, it refuses and exits instead of clicking. `--allow-write` proceeds — pass it only after a human confirmed that specific action, so consent is visible in the command itself. The tripwire catches obviously destructive controls, not every mutation; the confirmation step remains the backstop.

## Prerequisites

- **Node 18+** (`node -v` prints a version).
- **Google Chrome** installed. The harness drives your real Chrome so sign-ins work (no browser download; set `CHROME_BIN` if Chrome is somewhere unusual).

## Setup (once per machine)

`/know-qa:init` does this for you. By hand, from `.know-qa/tools/`:

```bash
bash setup.sh
```

That installs what the scripts need. Then, for a gated deployment, sign in once to the site you are testing:

```bash
node login.mjs --url "<the URL of the page you want to test>" [--env "<environment name>"]
```

A Chrome window opens. Sign in fully, including any SSO or two-factor step, until you can see your target page. The script detects that, saves your session to `.auth/`, and closes. Your session is personal to you and is never committed (`.know-qa/tools/.auth/` is gitignored).

## Run a paired session

Open the visible browser in one terminal tab and leave it running:

```bash
bash open-browser.sh "<URL>" [--env "<same environment name>"]
```

In a second tab, drive that same window:

```bash
# Look at the current page: console + network + screenshot.
node drive.mjs --name first-look

# Click a link.
node drive.mjs --click 'a[href*="settings"]' --name go-settings

# Click by visible text.
node drive.mjs --text "Save changes" --name save
```

Everything a script does happens in the window you are watching.

## Run headless (no window)

Point a capture straight at a page using your saved session:

```bash
node capture.mjs --url "<URL>" --profile ".auth/<environment>/profile" --name check
```

## Measure load time

```bash
# Navigation between screens (a click). --from resets first so numbers compare cleanly.
node nav-timing.mjs --from "<URL A>" --href "settings" --expect "**/settings**" --name a-to-settings

# Cold full load of a page.
node load-timing.mjs --url "<URL>" --name cold-page

# Catch the loading animation between screens (holds the request open long enough to capture it).
node capture-loading.mjs --from "<URL A>" --href "settings" --name settings-loading
```

A page that is already prefetched navigates almost instantly. The same page on a cold load runs its real data fetch and takes longer. When load time is the question, measure both and report the gap.

## Record video (MP4 clips)

`record.mjs` captures moving footage of the browser you're already driving — an MP4 (H.264, 1920×1080, 30fps), one file per clip. It attaches to the same open, signed-in window everything else does (via CDP screencast), so there's no separate browser and no new sign-in. Needs `ffmpeg` on PATH (`setup.sh` reports whether it's present); audio is not captured.

```bash
# One-shot clip: record the page for N seconds.
node record.mjs --name hero --seconds 8

# Around scripted actions (a shot list): start, drive the shot, stop.
node record.mjs start --name hero          # returns immediately, keeps recording
node drive.mjs --text "Submit"             # perform the shot while it records
node record.mjs stop  --name hero          # finalizes → prints the MP4 path

# Self-test the pipeline (own headless Chrome, no open browser needed).
node record.mjs selftest
```

The output is `.know-qa/runs/<name>/clip.mp4`, plus `sample_*.png` frames and a `record.json` with the ffprobe readout. Screencast is frame-on-change, so capture is variable-rate; `record.mjs` converts the real per-frame timestamps to a constant 30fps so playback is smooth at true speed. The recorded tab must stay foreground — a backgrounded tab throttles frame delivery (the script errors clearly rather than emitting an empty clip). Retina displays are capped to native 1080p in-capture, never upscaled.

## The scripts

| Script | What it does | Run it |
|---|---|---|
| `setup.sh` | One-time install. | `bash setup.sh` |
| `login.mjs` | Sign in once; saves your session. | `node login.mjs --url "..."` |
| `open-browser.sh` | Opens the visible logged-in browser with a debugging port. Leave running. | `bash open-browser.sh "..."` |
| `drive.mjs` | Attaches to the open window: navigate / click / observe + capture. | `node drive.mjs --text "..."` |
| `watch.mjs` | Passive background monitor; streams console/network/WebSocket events to a log without touching the page (safe while a human types). | `node watch.mjs --name session` |
| `record.mjs` | Records MP4 video (H.264 1080p/30fps) of the attached window via CDP screencast. One-shot (`--seconds`) or `start`/`stop` around scripted actions; `selftest` checks the pipeline. Needs ffmpeg. | `node record.mjs --name hero --seconds 8` |
| `audit.mjs` | Read-only structure + copy audit: unlabeled fields, dead links, missing alt, nameless buttons, duplicate IDs, heading outline, plus leaked debug/error text and placeholder/dummy copy (defects), and non-descriptive labels + casing drift (review-only). | `node audit.mjs --name page` |
| `contrast.mjs` | Exact WCAG AA contrast math on solid-background text (alpha blended up the ancestor chain); gradient/image backgrounds reported needs-review, never guessed. Standalone (`--url`) or attach (`--cdp`). | `node contrast.mjs --url "..."` |
| `axe.mjs` | Full axe-core ruleset (~90 deterministic WCAG rules: ARIA validity, labels, contrast, landmarks). Violations by impact + "incomplete" surfaced for review. Standalone or attach. | `node axe.mjs --url "..."` |
| `fingerprint.mjs` | Computed-style design fingerprint (sidebar, headings, cards, buttons, body type) for cross-page consistency diffs. | `node fingerprint.mjs --name page` |
| `nav-timing.mjs` | Times a click between screens. | `node nav-timing.mjs --href "..."` |
| `load-timing.mjs` | Times a cold full load. | `node load-timing.mjs --url "..."` |
| `capture-loading.mjs` | Captures and identifies the loading state mid-navigation. | `node capture-loading.mjs --from "..." --href "..."` |
| `capture.mjs` | Headless capture of a page. | `node capture.mjs --url "..." --profile ".auth/<environment>/profile"` |
| `inspect-chat.mjs` | Computed styles of elements found by text snippet. | `node inspect-chat.mjs --texts "a\|\|b"` |
| `inspect-labels.mjs` | Avatar/label and tinted-bubble detection (selectors are flags; defaults document the original worked example). | `node inspect-labels.mjs` |

Common flags: `--name` sets the output folder, `--wait` adds settle time in ms, `--cdp` overrides the debugging endpoint (default `http://localhost:9222`).

## Where output goes

Each run writes to `.know-qa/runs/<name>/`:

- `report.md` — text-sanitized readable summary (errors, failures, timings)
- `summary.json` — text-sanitized structured data
- `report.raw.md` / `summary.raw.json` — restricted raw text evidence
- screenshots (`viewport.png`, `fullpage.png`, or numbered loading frames) — restricted raw evidence; review and crop/redact before sharing
- `clip.mp4` + `sample_*.png` + `record.json` — from `record.mjs` (video capture)

`.know-qa/runs/` is scratch and is not committed. When something is worth keeping, copy it into `.know-qa/assets/`.

## File what you find

Filing into a tracker is a learned, per-project procedure: ask where the team wants findings to land (an active board, a milestone, or the backlog on purpose), sample a recent ticket from that destination to learn the house shape, replicate it, and confirm the first one. `examples/jira-ticket-guide-example.md` in this plugin is a worked instance of that procedure against real Jira projects — copy the method, not its field values; the two projects it covers route in opposite directions. Put the measured numbers and the screenshot in the description so the fix is unambiguous.

## Keeping your session

- `.know-qa/tools/.auth/` holds your live session. It is personal and is never committed.
- When a run suddenly lands on a login page or returns 401, your session expired. Sign in again with `node login.mjs --url "..."`.

## Troubleshooting

| Symptom | Fix |
|---|---|
| A run lands on a login page or returns 401 | Session expired. Re-run `login.mjs`. |
| `connect ECONNREFUSED ... 9222` | `open-browser.sh` is not running, or it is on another port. Start it, or pass `--cdp`. |
| "Browser is already running" / profile locked | You cannot run `login.mjs` and `open-browser.sh` at the same time; both use one profile. Close one. |
| Chrome not found | Set `CHROME_BIN` to your Chrome binary (see comments in `open-browser.sh`). |
| "This browser may not be secure" during sign-in | We launch your real Chrome to avoid this. If it still appears, just finish signing in. |
| `route.continue: Route is already handled` (from `capture-loading.mjs`) | Harmless race; re-run. |
| Page looks stale after a change | Reload, or add `?v=2` to the URL to bust cache. |

## How it works

- `login.mjs` opens an environment-isolated persistent Chrome profile (`.auth/<environment>/profile`) and waits for you to sign in. The environment key is derived from the exact target origin unless you pass `--env`; your cookies live only in that profile.
- `open-browser.sh` relaunches that profile with a remote-debugging port, so the window opens already signed in.
- The scripts attach to that window over the debugging port. You and the script share one browser, which is what makes it paired. Scripts disconnect when done and leave the window open.
- Headless runs reuse the same profile without a window.
