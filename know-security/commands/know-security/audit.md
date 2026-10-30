---
description: Read-only report of open security findings and what has never been reviewed
allowed-tools: Read, Grep, Glob, Bash, Write
argument-hint: "[path to repo, defaults to cwd] [--no-write]"
---

Report the state of this project's security findings.

Use the `security-audit` skill and follow its steps exactly. It is read-only: it runs the
shipping scripts rather than reimplementing them, and it leads with **coverage** — which
subsystems have never been reviewed, which have drifted since, and which files the locator
could not read — before any finding counts.

It reviews nothing and establishes nothing new about the code. It reports what previous reviews
found and where they never reached. It writes at most one file, `SECURITY-AUDIT-<date>.md` at
the repository root; with `--no-write` the report goes in the conversation instead.

Arguments: $ARGUMENTS
