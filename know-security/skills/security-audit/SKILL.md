---
name: security-audit
description: This skill should be used when the user asks for the state of a project's security findings without running a new review (e.g. "security audit", "what security findings are open", "what parts of this have never been reviewed", "is the security gate passing"). Reports the findings registry, review recency, decisions due, and what is unexamined — writing at most one new dated report file.
allowed-tools: Read, Grep, Glob, Bash, Write
model: sonnet
---

# security-audit — what we know, and what nobody has looked at

Read-only. Reports the state of a project's security findings **without reviewing anything**.

The distinction matters and belongs at the top of the output: this skill says what previous
reviews found and which parts of the repository they never reached. It establishes nothing new
about the code. If the answer someone wants is "is this safe," the answer is a `/know-security:sweep`
run, not this.

## Invariant — blast radius is one new file

Write **exactly one** file: `SECURITY-AUDIT-<YYYY-MM-DD>.md` at the repository root. Never
`security/FINDINGS.md`, never `security/DECISIONS.md`, never `security/.state/`. `Edit` is
absent from `allowed-tools` so this cannot modify anything that exists. With `--no-write`, put
the report in the conversation instead.

`Bash` is present for exactly these read-only commands. Run the shipping scripts rather than
reimplementing their logic — a second implementation of the gate that disagrees with the first
is worse than no audit:

```bash
node security/scripts/check.mjs --json          # writes nothing; the gate's own verdict
node security/scripts/staleness.mjs --json      # review recency
node security/scripts/locate.mjs --json         # candidates and the unread list
node security/scripts/check-decisions.mjs --json
```

If `security/` does not exist, say so and point at `/know-security:init`. Do not scaffold it here.

## Report, in this order

**Coverage first.** A reader reaching for an audit is asking how much of this is known, and
that has to be answered before any finding count means anything.

1. **What has never been reviewed.** From `staleness.mjs`, most-active-first. Name the units.
   This is the headline, and if every unit is `never_reviewed` then that sentence *is* the
   audit — say so and stop pretending the rest carries weight.
2. **What has drifted.** Units with commits since their last review, and how many.
3. **Files the locator could not read.** The `unread` list, verbatim. These are places where a
   problem is least likely to have been noticed by anyone.
4. **Open findings**, by severity then confidence. For each: id, title, location, disposition,
   age. Show **all** of them including Low confidence — a reader who cannot see the weak end
   cannot calibrate the strong end.
5. **Parked with a human.** `surfaced-for-decision` and `decision-due` items, with their age.
   A queue of twelve undecided trust-boundary questions is a finding about the process, and
   nothing else in this report will surface it.
6. **Accepted risks**, with owner, expiry, and whether the underlying file has changed since
   acceptance. An acceptance whose code moved is no longer an acceptance.
7. **Decisions due**, from `check-decisions.mjs`.
8. **What the scanners could not cover.** No history scan without gitleaks. No `DEP-01` without
   an ecosystem auditor. A declared framework the locator cannot read. State each one — an
   absent tool and a clean result look identical in a report that does not distinguish them.
9. **The gate's verdict**, quoted from `check.mjs`, with the note that it holds the line on
   findings that exist and establishes nothing about code nobody reviewed.

## Guardrails

- **Cite or drop.** Every claim traces to a script's output or a registry entry. If you cannot
  point at where a number came from, leave it out.
- **Do not re-review.** Reading a file to confirm a finding still points at real code is fine.
  Producing a new finding is not this skill's job — that is `/know-security:review`.
- **Do not propose dispositions.** An audit that reclassifies findings is editing the registry
  through prose.
- **An audit that finds everything wrong in every repository is a template, not an audit.** If
  the report does not depend on this project's own state, delete it and read the scripts again.
- **Never print a credential value, a personal record, or a working payload.** The registry does
  not contain them; do not introduce them here either.

Close with the standing line:

> This is a report on what previous reviews found. It establishes nothing about code that has
> not been reviewed, and absence of findings is not evidence of security.
