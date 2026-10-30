---
description: Fact-check a research draft against source notes and promote to outputs if it passes
argument-hint: "[draft-filepath]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

Audit a research draft and promote it to `research/outputs/` if it passes.

Use the `research-audit-claims` skill and follow its steps exactly. It walks every claim in the target draft, verifies it against the cited source notes, and either flags failures or appends a `pass` row to `research/audits/gate-log.md` and moves the draft into `outputs/`. In Claude Code, the PreToolUse gate hook reads the gate-log row to authorize the write; in Cowork, the gate is enforced as a structural rule (only this skill writes to `outputs/`).
