---
description: Capture a process into a structured Blueprint — interview, extraction, and per-step ratings for where automation is safe and where a human must stay in the loop
allowed-tools: Read, Write, Edit, Glob, Grep
---

Run the `blueprint-capture` skill and follow its steps exactly.

Ask the user which process they want to capture and which mode — quick (~15 min: a coarse
model of one process) or deep (~45-60 min: the full extraction) — then run the interview per
the skill. If the user can't yet name a process, point them at `/know-blueprint:discover` first.
