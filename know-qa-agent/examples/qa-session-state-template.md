<!-- TEMPLATE — the resumable session state, ported from the structure that carried a real
  multi-hour live QA session across context clears. Keep one of these at .know-qa/QA-SESSION-STATE.md
  during any long QA session, and update it as you go: it is a first-class output, not a scratch
  note. Read it top to bottom to resume after a context clear. -->

# Live QA Session — State & Resume

**Last updated:** {date}
**Owner:** {who is driving / pairing}
**Purpose:** Resume point for the live QA testing of {project}. Read this top to bottom to pick up where we left off after a context clear.

---

## What we are doing

{One paragraph: what is being tested, against which deployment, where confirmed findings go.} Modes in play:
- **Paired** ({human} drives the visible browser, the harness captures console/network/screenshots/computed styles).
- **Autonomous** (the harness or `/know-qa:run` drives pages and verifies functionality).

## Live environment

- **Base URL:** `{url}` ({auth gate, if any — e.g. SSO, per-person login}).
- **Routes seen:** {list the routes visited so far, with a word on what each is}.
- **Routes not yet visited:** {list}.

## The harness — `.know-qa/tools/`

Full guide: the plugin's `docs/HARNESS-GUIDE.md`.

- **One-time setup:** `bash setup.sh`, then `node login.mjs --url "<target>"` (if gated).
- **Open the live window:** `bash open-browser.sh "<url>"` (visible logged-in Chrome, CDP on 9222). Leave it running.
- **Output:** `.know-qa/runs/<name>/` (gitignored). Keepers copied into `.know-qa/assets/` (tracked; create it on first use).

## Resume steps (new session)

1. `cd .know-qa/tools`
2. Check the window is alive: `curl -s http://localhost:9222/json | grep '"url"' | grep -v devtools`. If dead, `bash open-browser.sh "<url>"`. If a run redirects to a login page / 401, the session expired: `node login.mjs --url "<url>"`.
3. Restart the passive monitor if needed: `node watch.mjs --name <page>` (run in background).
4. **Re-read any volatile tracker values before filing** (active sprint, current milestone — whatever rolls). Do not trust cached ids below.

## Filing contract

{The per-project tracker contract, learned per the filing procedure: tracker + destination, the
routing fields for that destination (sprint/board/column/milestone — or a deliberate "none, this
project files to the backlog"), grouping (epic/parent/label), house summary style. Cache the stable
parts here; mark the volatile parts to re-derive each session. See the plugin's
`examples/jira-ticket-guide-example.md` for a worked instance — copy its method, not its values.}

## Findings filed this session ({count}) — DO NOT re-file

{Grouped by surface. One line each: ticket id, type, severity, one-line summary. This is the
session's dedup register — check it before filing anything.}

## Surfaced for a human decision (not filed)

{Design-intent and aesthetic calls that belong to the human: "is this dashed border intentional?"
List each with the evidence pointer. These are deliberately NOT tickets until a person decides.}

## Systemic patterns (flag to team as likely single shared-component fixes)

{Clusters of findings that trace to one shared root cause, with the member ticket ids. The most
valuable output of a sweep is usually here, not in any single ticket.}

## NEXT TASKS (in order)

### A. {next task} — {status}
### B. {next task} — {status}

## Other context

{Anything else a fresh session needs: pending follow-ups, git state of the harness, open questions
waiting on a person.}
