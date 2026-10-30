---
description: Synthesize processed source notes into a draft research output section
argument-hint: "[section-name-or-phase-number]"
allowed-tools: Read, Write, Edit, Glob, Grep, Task
---

Draft a research output section from processed source notes.

Use the `research-summarize-section` skill and follow its steps exactly. It pulls claims and evidence from processed sources relevant to the requested section, drafts the synthesis under `research/drafts/`, and prepares it for the `/know-research:audit-claims` gate before promotion to `research/outputs/`.
