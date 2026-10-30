---
description: Execute type-aware, multi-channel source discovery for the current research phase
argument-hint: "[--channel <name>]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, WebSearch, WebFetch
---

Run source discovery for the current research phase.

Use the `research-discover` skill and follow its steps exactly. It reads the active phase from `research/STATE.md`, runs the phase's discovery channels (tier 1 Tavily, tier 2 Firecrawl, tier 3 built-in WebSearch/WebFetch as fallback), records the highest tier reached in `retrieval-log.json`, and writes a candidate file with summary table and per-source entries.
