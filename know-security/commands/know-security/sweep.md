---
description: Sweep the whole codebase for security and PII defects, subsystem by subsystem
allowed-tools: Read, Grep, Glob, Bash, Write, Edit, Agent
argument-hint: "[--lens pii,authz,...] [--path <glob>]"
---

Sweep this entire codebase for security and privacy defects.

Use the `security-sweep` skill and follow its steps exactly. It chunks the codebase by
subsystem — one reviewer invocation per subsystem and lens — because an agent that runs out of
room mid-subsystem returns a partial result that looks exactly like a thorough one. Work is
ordered by where a problem is most likely to have gone unnoticed: files the locator could not
parse first, then subsystems nobody has reviewed, most-active first.

`--lens pii` runs the data-flow walk — what personal data is collected, where it lands, whether
it can be deleted, and whether it can leave. It chunks like every other lens, carrying forward
the inventory rather than the source, because the lens most likely to span a whole codebase is
the one where running out of room does the most damage.

The report leads with coverage, not findings: which subsystems were reviewed, which were not,
which lenses ran. Absence of findings is not evidence of security, and the report says which
parts it did not examine.

It reads code. It never sends a request to your application, holds a credential for it, or runs
it. The only network access is the `deps` lens invoking your own package auditor against its own
registry — droppable by removing `deps` from the lens list.

Arguments: $ARGUMENTS
