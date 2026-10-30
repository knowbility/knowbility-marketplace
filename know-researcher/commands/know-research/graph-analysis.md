---
description: Analyze the claim graph for load-bearing claims, fragile foundations, and cheapest confidence upgrades
allowed-tools: Read, Glob, Grep
---

Analyze the claim graph for structural weak points.

Use the `research-graph-analysis` skill and follow its steps exactly. It reads the claim graph (`research/reference/claim-graph.json`, written by `/know-research:audit-claims`), surfaces load-bearing claims (shared sources and figures with high degree), fragile foundations (low-confidence claims carrying weight), and ranks the cheapest evidence upgrades to lift overall project confidence. Read-only — it writes nothing.
