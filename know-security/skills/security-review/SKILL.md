---
name: security-review
description: This skill should be used when the user wants recently-changed code checked for security or privacy problems (e.g. "review this branch for security issues", "anything scary in what I just built", "check the auth changes", "did I leak any PII here"). Resolves the diff into a review scope, spawns the security-reviewer agent on whole files plus their call paths, and records findings in security/FINDINGS.md.
allowed-tools: Read, Grep, Glob, Bash, Write, Edit, Agent
model: sonnet
---

# security-review — what changed, read adversarially

Reviews the code that changed. The unit of scope is a diff; the unit of *reading* is never a
diff, and that distinction is the whole skill.

## The rule that shapes everything below

> **A diff selects what to look at. The reading is always whole files plus their call paths.**

A missing authorization check does not appear in a diff. A diff that adds a route shows the
route; the defect is the guard that isn't there, which is invisible in the hunk and only
visible when you read the whole path from entry point to sink. The same is true of a missing
tenant scope, an unrotated session, and a personal-data field that no deletion path reaches.

So: resolve the diff to a **set of files and subsystems**, then hand the agent the files, not
the patch.

## Step 1 — resolve the scope, before any agent is spawned

Selection is never a filter the agent applies. Resolve it here.

**Uncommitted code is in scope.** This is the whole point of a tool that runs alongside
development: the most likely place for an unreviewed vulnerability is the endpoint someone
wrote twenty minutes ago and has not committed. Committed-only scope means the command someone
runs to check "what I just built" resolves to nothing and silently reviews nothing.

Find the base — resolve the remote's actual default branch rather than assuming `main`:

```bash
git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null || echo origin/main
git merge-base HEAD <that> 2>/dev/null || git rev-parse HEAD~1 2>/dev/null || git rev-list --max-parents=0 HEAD
```

Use `--since <ref>` when given. Then take the **union of four sets**, not just the first:

```bash
git diff --name-status <base>..HEAD --diff-filter=ACMRD   # committed since the base
git diff --cached --name-status --diff-filter=ACMRD       # staged
git diff --name-status --diff-filter=ACMRD                # unstaged, tracked
git ls-files --others --exclude-standard                  # untracked, not ignored
```

**`D` is in the filter, and that is not cosmetic.** Deleting a security mechanism is how you
create a vulnerability while producing no review input at all: remove the only authorization
middleware, the policy module, or the deletion worker, and every consumer still looks correct
in isolation. An earlier version filtered `ACMR`, so the single most direct way to introduce a
hole was invisible to scope resolution.

For each deleted path, give the reviewer the **deleted content and its callers**:

```bash
git show <base>:<deleted-path>              # what it used to do
git grep -n "<basename>" -- <source globs>  # who still expects it
```

A deletion with no remaining callers is usually cleanup. A deletion whose callers survive is the
finding, and the caller files enter scope even if they did not change.

De-duplicate. If the last three commands are non-empty, say so in the report — a review of
uncommitted work describes a moving target, and the reader should know what state it was read in.

Drop lockfiles and pure-asset paths. **Do not drop test files** — a credential committed to a
fixture is still committed, and a test that asserts the wrong security property is a finding.
Label them instead; the finding contract's benign classes handle the rest.

Group the surviving files into subsystems (their directory, one level below the source root).
If nothing survives, say so plainly and stop — do not spawn an agent to review nothing.

## Step 2 — pick the lenses

Map the changed paths to lenses. A lens is a reading mode, and each becomes its own agent
invocation so no single assignment is too broad to finish:

| If the diff touches | Add lens |
|---|---|
| a route, handler, controller, resolver, or middleware | `authz`, `injection` |
| auth, session, token, identity, credential, or password | `authn`, `secrets` |
| a migration, schema, or model | `pii`, `authz` |
| a logger, error handler, analytics, or an outbound/LLM call | `pii`, `secrets` |
| a template, view, or anything rendering HTML | `xss` |
| config, CI, infrastructure, or a dependency manifest | `config`, `deps` |
| anything at all | `secrets` |

Always include `pii` when a migration, a logger, or an outbound call is in scope. When in
doubt, add the lens — an extra invocation is cheap and a missed lens is a missed finding.

## Step 3 — gather the deterministic evidence

Run these once and pass the output into each assignment. They produce candidates and
measurements, never findings:

```bash
node security/scripts/locate.mjs --json
node security/scripts/secrets.mjs --json
node security/scripts/staleness.mjs --json
```

If the project has an ecosystem auditor and `deps` is a lens, run it too (`npm audit --json`,
`pip-audit`, `bundle audit`). **If it is absent, record that** and say so in the report — an
uninstalled auditor means the `DEP-01` category was not covered, and silence there reads
exactly like a clean result.

## Step 4 — build the assignment

One `Agent` invocation per (subsystem × lens), with `subagent_type: security-reviewer`. Each
assignment contains, in this order:

1. **`## Scope`** — the file list for this subsystem, the base ref, and the lens. State
   explicitly: *read these files in full, and follow their call paths outside this list.*
2. **`## Finding Contract`** — the **entire verbatim contents** of
   `${CLAUDE_PLUGIN_ROOT}/reference/finding-contract.md`. Paste it, do not reference it. This
   is what stops five skills from drifting on the finding shape, and the document declares
   its own primacy over anything a skill says.
3. **`## Findings Registry`** — the active entries from `security/FINDINGS.md` (everything
   above `## Archive`). The agent deduplicates against these by root cause. Omit the section
   entirely when the registry is empty rather than pasting an empty heading.
4. **`## Located candidates`** — the slice of the locator output whose files are in this
   subsystem, plus **the whole `unread` list regardless of subsystem**. An unread file is
   where an unnoticed problem is most likely to be, and scoping it away defeats its purpose.
5. **`## Deterministic scanners`** — the secrets candidates and any auditor output, with the
   note about what was and was not available.
6. **`## Project context`** — `security/config.json` if it exists: the subject unit, declared
   stores, sensitive categories. If `subject` is null, tell the agent to ask rather than
   assume.

## Step 5 — record the results

For each finding the agent returns:

- **`vulnerability` and confirmed `likely_vulnerability`** → append to `security/FINDINGS.md`
  with the next `S-YYYYMMDD-NN` id and `status: open`.

  **Insert above the `## Archive` heading, never at the end of the file.** Appending puts the
  entry below `## Archive`, where the gate treats it as history and ignores it. The gate now
  catches this and blocks — it was found by a test producing a false green on a High-severity
  finding — but the correct insert point is here.

- **`known_issue`** → do not add an entry. Update the existing one's `last_seen`, and attach
  the new blast radius or location there.
- **`design_decision_due`** → add or update a row in `security/DECISIONS.md` with the question
  and the trigger, and record the finding at `status: decision-due` naming that row.
- **`needs_threat_judgment`** → record at `status: surfaced-for-decision`. Never file it as a
  vulnerability and never resolve it yourself.
- **`accepted_risk`** → only when the user says so in this session, and only with
  `owner=`, `date=`, `expires=`, and `commit=`. All four, or the gate rejects it.
- **`not_reachable`, `test_fixture`, `environment` discards** → **never** enter the registry,
  and **always** appear in the report as counted one-liners.

Then record the review so recency is real:

```
security/.state/reviews.json
  { "reviews": [ {
      "path": "src/auth",
      "commit": "<HEAD short sha>",
      "date": "<YYYY-MM-DD>",
      "lens": ["authn","secrets"],
      "complete": true,
      "files_reviewed": ["src/auth/login.ts", "src/auth/session.ts"],
      "unresolved": 1
  } ] }
```

### `complete` is the difference between a green run meaning something and meaning nothing

**"The agent returned a result" is not a completion condition.** An agent that exhausts its
context half-way through a subsystem still returns something — findings, or "none found" — and
that output is indistinguishable from a thorough one. Recorded as reviewed, the unit reports
`current`, and an empty registry then reaches `PASS`. That is the shortest path in this whole
design from a truncated run to a green build.

So the agent must **explicitly report completion**, and the assignment asks for it:

> End your report with a `## Completion` block: `complete: yes|no`, the files you actually read
> in full, and the count of paths you could not resolve. Answer `no` if you stopped early for
> any reason — running short of room, an unreadable file, an assignment larger than you could
> finish. **`no` is a normal answer and costs nothing; a wrong `yes` is the one outcome this
> whole design exists to prevent.**

Then:

- `complete: yes` → write the record with `"complete": true` and the file list.
- `complete: no`, or no `## Completion` block at all, or no result → write the record with
  `"complete": false` and whatever was covered. **Never omit the record** — a missing record and
  a partial one are different facts, and the partial one tells the next run where to resume.
- `staleness.mjs` reports any record without `complete: true` as `partial`, `check.mjs` refuses
  to count it as a review, and the gate will not go green on it.

One record per subsystem. A subsystem whose agent crashed gets `"complete": false` with an empty
file list, never silence.

## Step 6 — report

Route by disposition, in the finding contract's blocks: **Findings**, **Surfaced for
decision**, **Decisions due**, **Could not resolve**, **Discarded**. Then:

- Which subsystems were reviewed, under which lenses.
- Which were **not** — including any in the diff whose agent failed.
- What the scanners could not cover: no history scan, no dependency auditor, an unread
  framework.

Close with the standing line, and mean it:

> Absence of findings is not evidence of security. This reviewed *N* subsystem(s) under *M*
> lens(es) and read *K* file(s). Everything else in this repository is unexamined by this run.

## Guardrails

- **Cite or drop.** Every finding names a file and a line someone can open. A finding you
  cannot locate is not ready.
- **Never edit the code under review.** Report the remediation; a security fix belongs in a
  change a human reviews.
- **Never print a credential value, a personal record, or a working payload.** See
  `reference/safety.md`; these are absolute.
- **A review that finds the same six things in every repository is a template, not a review.**
  If the output does not depend on this codebase, discard it and read again.
- **Never write outside `security/`** and the one report file.
