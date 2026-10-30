---
description: Read the code that changed, adversarially, and report security and PII findings
allowed-tools: Read, Grep, Glob, Bash, Write, Edit, Agent
argument-hint: "[--since <ref>] [--lens authz,pii,...] [path]"
---

Review what changed in this project for security and privacy defects.

Use the `security-review` skill and follow its steps exactly. It resolves the diff into a
scope **before** spawning anything, then hands the reviewer whole files and their call paths
rather than the patch — because a missing authorization check never appears in a diff, and the
absence is the defect.

Findings go to `security/FINDINGS.md`, deduplicated by root cause. Items that are really an
unmade architecture decision go to `security/DECISIONS.md` instead of being filed as bugs.
Trust-boundary questions are surfaced for you, never decided.

It reads code. It never sends a request to your application, holds a credential for it, or runs
it. The only network access is the `deps` lens invoking your own package auditor against its own
registry — droppable by removing `deps` from the lens list.

Arguments: $ARGUMENTS
