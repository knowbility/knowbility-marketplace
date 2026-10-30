---
description: Process a URL, PDF, or document into a structured research note
argument-hint: "[url-or-file-path]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, WebSearch, WebFetch
---

Process a single source into a structured research note.

Use the `research-process-source` skill and follow its steps exactly. It ingests the source (URL, PDF, or local document), extracts claims with evidence quality tagging, registers it in the source registry, and writes a per-source note under `research/notes/`.
