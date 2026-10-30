---
name: security-sweep
description: This skill should be used when the user wants a whole codebase examined for security or privacy problems rather than just recent changes (e.g. "sweep this for vulnerabilities", "full security review", "what personal data does this collect and where does it go", "audit the whole app before we ship"). Chunks the codebase by subsystem, runs the security-reviewer agent per subsystem and lens, and records findings in security/FINDINGS.md.
allowed-tools: Read, Grep, Glob, Bash, Write, Edit, Agent
model: sonnet
---

# security-sweep — the whole codebase, one subsystem at a time

The milestone pass. Finds what predates the tool, and what only appears when you can see a
whole data flow rather than one change to it.

Shares the finding contract, the recording rules, and the guardrails with
`security-review` — read that skill's Steps 5 and 6, which apply here unchanged. What differs
is scope resolution and chunking.

## Step 1 — chunk, because a codebase does not fit in one context

```bash
node security/scripts/locate.mjs --json
node security/scripts/staleness.mjs --json
```

`staleness.mjs` already reports the review units — one level below each source root. Those are
the chunks. **One agent invocation per (subsystem × lens).**

This is the single most important mechanic in this skill, and the reason is a failure mode
rather than a preference: an agent that runs out of room mid-subsystem returns a partial
result that is indistinguishable from a thorough one. Chunking keeps each assignment inside
what one context can actually finish.

**A chunk that returns nothing is `not reviewed`, never `clean`.** Report it by name, and write
its recency record with `"complete": false` — not no record at all. A missing record and a
partial one are different facts, and only the partial one tells the next run where to resume.
`staleness.mjs` reports it as `partial` and `check.mjs` refuses to count it as a review.

## Step 2 — order the work by where a problem is most likely to be unnoticed

Not alphabetically. In this order:

1. **The `unread` list from the locator.** Files that look like they serve traffic or hold
   data and could not be parsed. Nobody — no previous run of this tool, quite possibly no
   human — has looked at these with a security question in mind.
2. **Subsystems marked `never_reviewed`**, most-committed first. `staleness.mjs` already sorts
   this way.
3. **Subsystems marked `stale`**, by commits since last review.
4. Everything else.

Say the order in the report. A sweep that ran out of budget after the first three subsystems is
useful if the reader knows which three, and misleading if they don't.

## Step 3 — lenses

Default to the full set: `authz`, `authn`, `injection`, `pii`, `secrets`, `xss`, `ssrf`,
`crypto`, `config`, `deps`, `log`.

`--lens <list>` narrows it. When narrowed, **the report names the lenses that did not run**,
because a sweep is the artifact someone will later treat as comprehensive.

Skip a lens for a subsystem only when it cannot apply — no `xss` where nothing renders, no
`deps` outside a manifest. Skipping is a judgment; record it.

### `--lens pii` is a different reading mode

Not a check list. A data-flow walk, and it crosses subsystem boundaries by nature.

**But it still chunks, and this is the correction to an earlier instruction that said to run it
repository-wide in one pass.** That instruction contradicted the rationale two sections above and
reintroduced exactly the truncation risk chunking exists to prevent — on the lens most likely to
span a large codebase. Instead: run the collection pass per subsystem, carry forward only the
*inventory* it produces (which fields, which stores, which sinks), then run propagation,
retention, and egress against that inventory. The inventory is small; the source is not.

Each pass answers: collection → propagation → retention →
egress. Establish what personal data this product handles *from its origin* — a migration, a
form schema, a webhook contract — never from field names. A column called `name` is sometimes
a hostname.

The four questions and the eight `PII-*` checks are in the reviewer agent. What this skill
adds is the instruction to answer them **as one connected story**, because the finding that
matters is usually a path — this field enters here, lands in that log, and no deletion path
reaches it — and a per-subsystem read cannot see it.

## Step 4 — synthesize themes before reporting

The most valuable output of a sweep is rarely a single finding. It is that seven of nine trace
to one missing boundary, which points at one fix instead of seven tickets.

A theme needs **at least two member findings and a plausible shared mechanism**. Do not force
singletons into themes, and do not let a theme replace its member entries — dedup by root
cause already folds genuine duplicates together, and a theme is a layer above that, not a
substitute for it.

The strongest theme available in a codebase you did not write is **inconsistency**: eleven read
paths go through the scoping helper and one does not. Write the root cause as *the convention
is a convention rather than an enforced boundary*, which is a better finding than any single
instance and gives the reader one fix.

## Step 5 — record and report

As `security-review` Steps 5 and 6, with three additions:

- Write one recency record per subsystem attempted, with the sweep's lens list and an honest
  `complete` flag — `true` only when the agent's `## Completion` block said so.
- The report leads with **coverage**: subsystems reviewed, subsystems not, lenses run, lenses
  skipped. Findings come second. A reader reaching for a sweep is asking "how much of this do
  we now know about," and that question has to be answered before the findings mean anything.
- Close with the standing line:

> Absence of findings is not evidence of security. This swept *N* of *M* subsystems under
> *L* lens(es). The subsystems and lenses named above as not covered are unexamined.

## Guardrails

Everything in `security-review`'s Guardrails applies. Two that bite harder at sweep scale:

- **A sweep that reports the same findings in every codebase is a template.** The check
  families are prompts for reading, not a checklist to emit. If a finding does not cite this
  repository's own code, drop it.
- **Volume is not value.** Forty Low-confidence findings bury four real ones. Apply the
  contract's tie-break — when torn, take the disposition that does not file — and let the
  discard counts show the reader what the filter caught.
