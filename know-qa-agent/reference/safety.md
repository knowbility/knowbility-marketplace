# Safety Boundary for Live and Authenticated Sessions

The QA expression of irreversibility detection: some actions are expensive or impossible to undo, and the agent must recognize them and stop rather than perform them on a person's behalf. The moment any mode runs against a real account on a live deployment, this is a live risk — so the boundary is enforced in layers, and this document is honest about what each layer actually guarantees.

**The rule (unchanged from the agent's hard rule):** no persistent mutations to a real account or production data without explicit consent. Default posture is read-and-observe. A write happens only after human confirmation or against a disposable/test account.

## The three layers

### Layer 1 — the mechanical tripwire in `drive.mjs` (enforceable, narrow)

Before executing `--click` or `--text`, the driver resolves the target element, reads its visible text and accessible name, and matches it against a destructive lexicon (delete, remove, deactivate, cancel plan, pay, purchase, transfer, submit, save, confirm, unsubscribe, and kin). If the target matches **and** the current page origin is not write-allowed (Layer 2), the driver refuses: it prints the classification and exits without clicking. Passing `--allow-write` proceeds — which the agent does **only after a human has confirmed that specific action**, making consent an observable artifact in the command line rather than a silent judgment.

Honest scope: the tripwire catches obviously destructive controls. It cannot know that an innocuous-looking button mutates state. It is a backstop against the worst mistakes, not an understanding of the app.

### Layer 2 — the protected-environment allowlist (enforceable as default-deny)

`.know-qa/environments.json` in the target project, scaffolded by `/know-qa:init`:

```json
{
  "_note": "Origins the QA harness may perform write actions against. Default-deny: any origin not listed, or listed with write_allowed: false, is read-only. Add live/staging origins explicitly — a human decision, not the agent's.",
  "environments": [
    { "origin": "http://localhost", "write_allowed": true },
    { "origin": "http://127.0.0.1", "write_allowed": true }
  ]
}
```

- **Default-deny.** A missing file, an unlisted origin, or `write_allowed: false` all mean read-only. Local dev servers scaffold as write-allowed (they're disposable); everything else must be added by a human.
- Origins match by scheme and exact hostname. An entry that specifies a port is restricted to that port; an entry without a port intentionally covers any port on that hostname (useful for disposable localhost servers). The file holds no secrets and is committable.
- `drive.mjs` reads it mechanically (Layer 1 consults it). The agent checks it **in every mode** — paired, autonomous, authenticated — before any action it classifies as a write, regardless of whether the action goes through `drive.mjs`.

### Layer 3 — behavioral classification and redaction (judgment, stated as such)

**Pre-action classification.** Before acting, classify the action: does it mutate? Pattern classes that always count as writes: form submits on a real account, delete/deactivate/archive controls, payments and transfers, profile and privacy-setting changes, anything that creates a real record (messages, posts, orders, invitations). Beyond the patterns, judge from context — and **unsure means mutate**: treat an unclassifiable action as a write and confirm. The confirmation step is the backstop for everything the classifier and the tripwire miss.

When Layer 1 blocks an action the agent intended, that is a **stop-and-confirm moment, not a flag-and-retry moment**: bring the blocked action to the human with what it was about to do, and only proceed with `--allow-write` after their yes.

**Evidence handling.** Screenshots and network captures from an authenticated session can contain personal data. Harness run directories are therefore restricted raw evidence, not a shareable report surface. `drive.mjs` writes raw files as `*.raw.*`, emits text-sanitized `report.md` and `summary.json`, and marks screenshots restricted. Before any evidence reaches a durable report, a sink, a ticket, or a registry entry:

- Mask emails, full names, phone numbers, addresses, and account identifiers that aren't needed to demonstrate the finding. Screenshots require explicit human review and cropping/redaction before promotion; the plugin does not claim that arbitrary pixels can be sanitized mechanically.
- Never include cookies, `storageState` contents, Authorization headers, tokens, or session identifiers in any output — evidence excerpts of network traffic carry URL + status + timing, not raw headers or bodies with credentials.
- Payloads quoted in findings get the same scrub: keep the field that proves the defect, drop the rest. Deterministic text sanitization reduces common exposure but does not replace review of application-specific confidential data.

**Auth-state hygiene** (also absolute): each persisted session lives in a gitignored `.know-qa/tools/.auth/<environment>/` directory in the target project, never written elsewhere and never committed. No real credentials in specs.

## What this is not

Hook-based enforcement (intercepting every Bash call that mentions the harness) is deliberately not part of this design: it is brittle, fires noisily across unrelated projects, and gives false assurance. The hard floor is Layer 1 + Layer 2; Layer 3 is posture — and the design says so plainly rather than claiming more enforcement than exists.
