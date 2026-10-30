---
description: Set up the security reviewer in this project — two questions, then scaffold
allowed-tools: Read, Write, Edit, Glob, Grep
argument-hint: "[path to repo, defaults to cwd]"
---

Set up security review in this project.

Use the `security-init` skill and follow its steps exactly. It asks at most two questions —
what a subject is here, and where subject data lives — then scaffolds `security/` with the
findings registry, the triggered decisions ledger, config, and the scripts. If trailhead is
installed it wires two gate stages; if not, the gate runs standalone.

It uses no shell, so it will not trigger an approval prompt per command.

It reviews nothing. Setup establishes nothing about the code, and the gate will report exactly
that until a sweep has run.

Arguments: $ARGUMENTS
