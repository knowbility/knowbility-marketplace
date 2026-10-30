# What this cannot establish

**Absence of findings is not evidence of security.**

That sentence is the whole document, and it is first because it is the claim this tool is most
likely to have made for it. A clean run means a reviewer read some code and did not find
something. It does not mean the code is safe, and it does not mean the reviewer read the part
where the problem is.

Read this before trusting any output. It is the first link in the README on purpose.

---

## What a clean result actually means

Every report states three things, and the third is the one people skip:

1. What was reviewed.
2. What could not be resolved — paths the reviewer could not follow, files the locator could
   not parse, categories no installed tool covered.
3. **What was never looked at.**

A sweep that covered four of eleven subsystems is a useful artifact and a dangerous one, and the
difference is entirely whether the reader knows which four. `staleness.mjs` exists so that
question has a mechanical answer rather than a remembered one.

## This is not a penetration test

Nothing here sends a request to the system under review, holds a credential for it, or
authenticates to anything. It reads source.

That boundary is enforced by absence — there is no HTTP client, no request grammar in any config
file, and no way to express a payload — which is the strongest form available, because you cannot
disable what does not exist. `reference/safety.md` explains why there is no prober and what would
have to be answered before one shipped.

**One exception, and it used to be stated as none.** The `DEP` family runs the project's own
dependency auditor (`npm audit`, `pip-audit`), which contacts a package registry unless forced
offline. An external review caught this document and `safety.md` both claiming "no network in any
code path" while the agent was instructed to run exactly that. The auditor talks to its own
registry, never to the system under review, is never given a credential, and prefers an offline
mode where one exists — and if outbound traffic is forbidden, drop `deps` from the lens list and
the report says `DEP` did not run.

The consequence is a real limit, not a technicality: a class of vulnerability that only appears
at runtime is out of reach. Testing a running system is a different tool and you still need one.

## Known blind spots

**No taint analysis.** The reviewer traces origin to sink by reading, file to file. A
vulnerability whose unsanitized origin is in one file and whose sink is in another, connected
through a path nobody followed, can be missed. This is the largest honest gap in the design, and
it is why `reachability: unresolved` is a first-class state that gets reported rather than
dropped.

**Reachability is established by reading, not by execution.** A guard reached through a helper
the reviewer did not open yields `probable`, never `confirmed`. A guard that is *wrong* reads the
same as a guard that is right unless someone examines the predicate.

**Static reading cannot see runtime configuration.** Code that is safe as written can be deployed
with row-level security disabled, debug mode on, or a permissive origin injected by an
environment variable. None of that is visible here.

**The locator knows the idioms it knows.** Express, Fastify, Koa, Hono, Next (app and pages),
tRPC, GraphQL resolver maps, Flask, FastAPI, cron registrations, queue consumers, CLI commands.
Django, NestJS, Rails, Sinatra, Spring, Laravel, Gin, and Echo are **detected and reported as
unread** — their routes are not in the candidate map and the output says so rather than being
quietly short. If your stack is not in either list, the locator finds less than you think and
the `unread` list is where it admits that.

**Directories are excluded from the walk** — `node_modules`, `dist`, `build`, `vendor`, hidden
directories. A committed build artifact or a vendored dependency containing a real data path is
not seen. Symlinked directories are not followed.

**The built-in secret detector does not read git history.** It covers ten prefixed credential
formats plus credential-shaped assignments, in the working tree. A key removed from HEAD but
present in a reachable commit is invisible to it. Install gitleaks and the run says so; without
one, the run says *that* instead, because a weak clean result and a strong clean result look
identical unless a tool distinguishes them.

**Dependency findings need the ecosystem's own auditor.** No auditor installed means the `DEP`
family did not run. Version numbers are not guessed from.

**Field names are a starting point, never an answer.** The PII lens establishes what data a
column or field actually holds from its origin — a migration, a form schema, a webhook
contract — because a column called `name` is sometimes a hostname and a column called `data` is
sometimes a medical record.

## What the gate does and does not enforce

**It is advisory by default, and that is the honest posture rather than a weakened one.**

The registry is human-editable and every field in it — status, severity, confidence,
completion, acceptance — is written by the party the gate would be checking. Validating a
self-assertion is not binding it, and the supply of neighbouring unvalidated assertions is
effectively unbounded. Two independent reviews reached that conclusion, and the second put it
plainly: the system *"mechanically validates agent- and developer-authored claims without
independently binding them to scope, code state, or valid state transitions."*

This tool was never going to remove a human from security review. It exists to **shrink the
surface that human has to look at**, and to keep already-closed problems closed so they do not
accumulate into a backlog at the end of a project. Reporting does that. Blocking on an
unverifiable claim only teaches people to write the word that makes it stop.

`gate.mode: "blocking"` opts in where a team's process makes the registry trustworthy — a
protected branch, required reviewers on `security/`. That is a decision about their controls.

**One thing blocks in either mode:** a staged credential of a known format. Everything else here
is recoverable — an unresolved finding is still there tomorrow, a late review can be run late, a
due decision can be made next week. A key that reaches a remote is rotated, not undone.

What it reports, all of them facts a script can decide exactly: an unresolved finding at or
above a severity; an expired, undated, or code-invalidated acceptance; a **known-format**
credential in staged content (credential-shaped *assignments* are informational, because
`password = "hunter2"` is a fixture or a live secret and only reading tells you which); a
decision that has come due or a missing decisions ledger; a finding hidden below the archive
heading, resolved without citing what fixed it, or parked against a decision row that does not
exist; a duplicate or malformed finding id; a review record with no completion marker.

**It never asserts that a review happened, that coverage is complete, or that code is safe.** It
holds the line on findings that already exist.

Two limits on that list, both found by external review after this document already claimed
otherwise. **Standalone, the gate cannot detect a deleted finding.** It returns every finding
id so a runner can ratchet the identity set, and trailhead does; on its own it holds no state
and writes nothing, so a row removed from the registry is simply gone. The duplicate-id check
catches a collision, not a deletion. And **the review record is a claim by the reviewing
agent** — the completion marker is what makes a truncated run visible, but nothing verifies
that the files it lists were read as thoroughly as it says. The analysis is an agent's, and that division is
stated rather than blurred — an earlier version of this file tried to gate on analysis itself and
was judged untrustworthy twice for exactly that reason.

## What in-repo mechanisms cannot do at all

Nothing in a repository stops a determined actor in that repository, and the bar is **much lower
than "a coordinated commit."** An earlier version of this document claimed defeating everything
required editing the registry, the config, and the state together. It did not: a single status
word was enough, with the finding identity left intact so no deletion check fired. That specific
hole is closed — `resolved` must cite what fixed it, `decision-due` must name a real row — but
the general point stands and the earlier phrasing was flattering.

**Protected-branch CI helps only if changes to the gate, the registry, the config, and the state
each require independent review.** An ordinary pull request on a protected branch can change all
four. Without trailhead installed, deleting `security/` entirely is caught by nothing.

### Specifically not verified

- **Completion is one unverified scalar** covering many (subsystem × lens) assignments. The
  marker detects a *missing* `yes`; nothing detects a wrong one, an incomplete aggregation, or a
  scope smaller than assigned. Same-day records tie-break to the first, so a complete morning run
  can mask a partial afternoon one.
- **Review records bind to `HEAD`, not to the working tree.** A review of uncommitted code is
  recorded against the last commit, and later staged or unstaged edits do not make it drift.
- **Resolution, parking, and decision linkage are human claims** that now cite something
  checkable — a commit, a row — but citing is not proving.
- **Acceptance binds only the first path in `location`**, and only `commit..HEAD`. A change in
  the index or the working tree does not reopen it.
- **Secret behavior depends on which scanner is installed**, and the reported `mode: staged` is
  not uniform: the built-in path reads the git index, gitleaks is asked for staged mode, and
  trufflehog scans the filesystem regardless.
- **An external scanner exiting 1 with an empty result** is accepted as a clean scan.
- **The dependency auditor may consult private registry configuration and credentials** it
  inherits from the environment. An earlier version of this document claimed it is "never given a
  credential" — that was too strong. It is never given one *by this plugin*.

## Deliberately out of scope

**Compliance mapping.** This plugin produces findings. It does not maintain a control matrix, and
no output will say "compliant," "SOC 2 ready," or put a percentage next to a control identifier.
The most dangerous failure available to a tool like this is an auditor accepting its output as
evidence of a program — the artifact looks better than the truth, and everyone in the room agrees.
A findings list is evidence that someone looked.

**Engineering practice.** CI configuration, branch protection, container scanning, incident
response, backups. Real, and someone else's job.

**Input validation and processing correctness.** That is QA's, and duplicating a tool that works
is how you end up with two half-trusted tools.

**Active probing.** See `reference/safety.md`.

## The failure mode this document exists to prevent

Someone runs a sweep, gets four findings, fixes them, runs it again, gets none, and concludes the
application is secure.

Every mechanism described above is a reason that conclusion does not follow. The report is written
to make it hard to reach — coverage first, unresolved paths named, unreviewed subsystems listed —
but a document cannot stop a reader who wants a green light. If you are the reader: the second run
found nothing *in the parts it read, under the lenses it ran, at the depth reading allows.*
