---
description: Run the independent adversarial corpus review — one or both reviewer tiers cold over the whole decision corpus, receipts written to research/reviews/
argument-hint: "[final|on-demand] [t1|t2|both]"
allowed-tools: Read, Write, Glob, Grep, Bash, Task
---

Run the corpus credibility review over this research project.

Use the `research-review-corpus` skill and follow its steps exactly. It builds the
canonical manifest through the validator, runs the disclosure preflight, invokes the
reviewer tier(s) — Codex CLI (t1) and/or the cold `corpus-reviewer` agent (t2) — with
exactly four inputs, validates each result through the validator's `validate-receipt`
mode, and writes immutable receipts and reports to `research/reviews/` (failures become
`.failed.json` attempt records, never receipts). It reports findings and adjudication
paths; the completion gate's verdict always belongs to the validator, never to a
reviewer's `ready`.
