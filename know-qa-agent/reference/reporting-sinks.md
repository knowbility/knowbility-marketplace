# Reporting Sinks (pluggable roll-up delivery)

A **sink** is a place a QA roll-up gets delivered — a Slack channel, a future webhook, anything. This document is the single definition of how sinks work, consumed by `/know-qa:report` and `/know-qa:monitor`. The plugin ships only the **formatting and routing**; the actual delivery uses whatever MCP the user already has wired (e.g. a Slack MCP). The plugin does not bundle or require any particular integration.

Sink payloads never consume restricted `.know-qa/runs/*.raw.*` files or screenshots.
They may include sanitized textual evidence from a run. A screenshot enters a
sink only after a human has reviewed and cropped/redacted that exact artifact.

Like the filing procedure, sinks degrade by absence: with no `.know-qa/reporting.json`, nothing posts and both skills behave exactly as before. Configuration is the user's; the procedure is the deliverable.

## `.know-qa/reporting.json` (optional user config)

Committable — it holds channel names and posting identities, never secrets (no tokens; the credential lives in the wired MCP).

```json
{
  "_note": "Optional. Declares where QA roll-ups post. Delivery uses your wired MCP (e.g. a Slack MCP); this plugin ships only the formatting + routing. Absent file = no posting, report/monitor behave exactly as before. Committable — channel names and identities only, no secrets.",
  "sinks": [
    {
      "type": "slack",
      "identity": { "name": "Web QA", "emoji": ":mag:" },
      "target": "#qa-web",
      "threaded": true,
      "post_when": "always",
      "scope": { "areas": ["opportunities"], "owner": "qa-lead@example.com" },
      "include": ["summary", "themes", "filed", "trends"]
    }
  ]
}
```

| Field | Meaning |
|---|---|
| `type` | Selects which MCP *family* delivers (`slack`, …). It drives delivery only; the payload itself is type-agnostic. |
| `identity` | `{ name, emoji }` posting persona. Passed as the MCP's native sender override when the integration supports it (e.g. Slack `username`/`icon_emoji`); otherwise rendered into the message header (`*Web QA* :mag: — QA roll-up …`). A missing override capability never fails the post. |
| `target` | Opaque destination string the sink type understands (a Slack channel or id; another type's address). |
| `threaded` | When true, the first post per area/session is a parent and later posts reply under it. The returned thread reference is stored in `.know-qa/.reporting-state.json`, keyed by area/session, as an opaque `thread_ref` (never a Slack-specific shape). |
| `post_when` | `always` \| `findings-only` \| `regressions-only`. Lets a noisy channel receive only signal. |
| `scope` | Optional `{ areas, owner }` slice (uses `.know-qa/areas.json` stamping). A per-owner sink posts only that owner's findings. Without the area registry, `scope` is ignored and the whole roll-up posts. |
| `include` | Which roll-up sections to send (`summary`, `themes`, `filed`, `trends`, `escalations`) — keeps a chat post shorter than the full report file. |

A minimal sink is `{ "type": "slack", "target": "#qa-web" }`.

## The normalized roll-up payload (what keeps sinks agnostic)

The skill builds **one** internal structure from the report it already compiled — `{ result, counts, high/medium/low findings, systemic themes, filed list, escalations, trend deltas }` — optionally sliced by `scope` and trimmed to `include`. The sink layer maps that single payload onto whichever send tool the wired MCP exposes. **The plugin formats; the MCP delivers.** Adding a new sink `type` is "add a mapping," never a re-architecture, and no sink ever sees a tracker- or Slack-specific shape it didn't ask for.

## Delivery procedure (used by both skills)

1. **Detect.** Read `.know-qa/reporting.json`. Absent or empty `sinks` → do nothing. This is the entire degrade path.
2. **Build** the normalized payload from the report just compiled; apply each sink's `scope` and `include`.
3. **Gate** per sink on `post_when` against the run result; skip silently when it doesn't fire.
4. **Resolve the MCP** for the sink's `type`. If the matching MCP isn't wired in this session, emit one plain line — "reporting sink '#qa-web' configured but no Slack MCP is wired; wrote the report file only" — and continue. Never fail the report over a missing sink (same posture as the filing degrade path).
5. **Apply identity** (native override or header fallback) and **threading** (look up or create the `thread_ref` in `.know-qa/.reporting-state.json`), then send via the wired MCP's message tool.
6. **Record** the returned `thread_ref` for threaded sinks; report posted/skipped per sink in the terminal output.

## Tool access note

Delivering to a sink means calling the user's wired MCP send tool. Because the sink `type` is user-dependent, the skills can't enumerate a specific MCP tool name in their `allowed-tools`. `/know-qa:report` and `/know-qa:monitor` therefore do **not** restrict `allowed-tools`, so they inherit whatever integrations the session has wired. This is a deliberate, scoped widening of exactly two skills; every other skill keeps its tight tool list. No sink config (the default) means no MCP call is ever made.

## What stays a human decision

A sink delivers a *roll-up of findings already produced* — it never makes a QA verdict, never auto-notifies a specific person as an obligation, and never files a ticket (that's the filing procedure). Escalation flags and owner handles are surfaced for a human to act on. Sinks broadcast; they don't decide.
