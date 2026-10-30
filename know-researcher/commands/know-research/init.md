---
description: Scaffold a structured research project with state management, evidence standards, and agent-driven workflows
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, WebSearch, WebFetch
---

Initialize a structured research project for the current directory.

Use the `research-init` skill and follow its steps exactly. It starts from the user's research challenge, infers an internal research profile, and scaffolds the directory tree (`research/`, `source-material/`), writing `CLAUDE.md`, `STATE.md`, the source registry, gap tracker, cross-reference file, the output gate policy, the review-protocol kit (validator, marker, completion criteria, reviews/ scaffold), and a project-grounded proposed research plan. It also writes `.claude/settings.json` with the tools the plugin uses pre-allowed.

The skill's Step 0 is a fresh-project guard with one sanctioned exception: if `research/STATE.md` already exists, it refuses to run and tells the user how to start over — **unless** the user explicitly asked for the review-protocol upgrade (`/know-research:init upgrade`, "adopt the review protocol"), in which case Step 0b installs the credibility-gate kit onto the existing project and touches nothing else. Do not bypass the guard for anything other than that explicit upgrade path.
