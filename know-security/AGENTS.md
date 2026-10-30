# AGENTS.md — security

Maintainer/agent guidance for working **on** the security plugin. Standalone; no `@imports`,
because Codex and Gemini do not follow them.

An adversarial security and privacy reviewer. It reads code looking for the way in and reports
findings. It is not a compliance tool, and it is not a gate on analysis.

Read `reference/finding-contract.md` before changing anything. It is the spine: every skill
injects it verbatim into the reviewer's assignment, and it declares its own primacy over
anything a skill says.

## The five laws

1. **Nothing here decides what a script cannot decide.** The scripts locate candidates and
   measure facts. The agent judges. `check.mjs` enforces only the findings registry, the
   deterministic scanners, and git — never whether code is authorized. The sibling QA plugin
   states the same rule as *"install posture, don't script judgment."*
2. **Absence of findings is never evidence of security.** Every report says what was reviewed,
   what could not be resolved, and what was never looked at. A clean result over an unreviewed
   subsystem is reported as *not reviewed*.
3. **A false finding costs more than a missed one.** A miss leaves the reader where they were.
   Three false findings and the tool is switched off, which is a total bypass nobody chose. The
   confidence weld, the benign classes, and the read-before-classify confirm all exist for this,
   and none of them may be weakened for tidier output.
4. **Findings never carry the thing they are about.** No credential value, no personal record,
   no working exploit. That is what makes `FINDINGS.md` safe to commit. See `reference/safety.md`.
5. **No output says "compliant," "secure," or "SOC 2 ready,"** and no output puts a percentage
   next to a control identifier.

## What this replaced, and why it matters when you edit

0.1.0 was first built as a **SOC 2 invariant-coverage register**: four falsifiable invariants
verified over a mechanically enumerated denominator of every surface and store, reporting "N of
M surfaces are guarded." It was reviewed twice by Codex and judged not trustworthy both times.

The root cause was never a bug in the patterns. **It was the claim.** A coverage register has to
be complete or it lies, and regex over arbitrary source produces a plausible sample. Every gap
became a false statement about coverage, and every fix closed the named case while opening a
neighbouring one.

The same patterns are still here, in `locate.mjs`, doing the same matching. What changed is that
they now produce a **map of candidates plus an explicit `unread` list**, so incompleteness is
the output rather than a hole in an assertion.

**The editing rule that follows from it:** if you are adding a mechanism whose correctness
depends on having found *everything*, stop. That is the shape that failed twice.

## Structure

```
reference/finding-contract.md   THE SPINE — injected verbatim by every skill
reference/adversarial-list.md   the acceptance test, TWO-SIDED
reference/honest-limits.md      what this cannot establish; the README links it first
reference/safety.md             the no-network boundary and the credential rules
agents/security-reviewer.md     ~15% posture, ~85% named check families
skills/security-{review,sweep,init,audit}/
scaffold/                       everything written into the target project
  scripts/locate.mjs            candidates, sinks, and the `unread` work list
  scripts/secrets.mjs           credential candidates; prefers gitleaks
  scripts/staleness.mjs         review recency from git — the anti-skip mechanism
  scripts/check.mjs             the gate; registry and scanners only
  scripts/check-decisions.mjs   triggered architecture decisions
dev/know-security/tests/finder.test.mjs   66 cases, BOTH directions
```

## Editing cautions

Most of these were live defects in this plugin. Several were written against the register
design; the **lesson** survives the rewrite even where the mechanism does not.

- **Require a literal path argument in route patterns.** Without it, `cache.get(target)` and
  `labels.get(id)` register as routes — twelve files in the first real codebase, none of them
  routers.
- **Match where the interesting thing is, not where the syntax is.** The inverse of the rule
  above, applied per sink. `reply.redirect('/path')` appears 216 times in one real codebase and
  every instance is safe; requiring a **non**-literal target took it to 5, all genuine. Same for
  SQL: 177 `.prepare()` calls, all parameterized, narrowed to 9 interpolated. A category where
  everything matches is a category nobody reads.
- **Know the project's actual idiom before trusting a category's silence.** `sql-raw` reported
  zero for a SQLite-backed app with 174 prepared statements, because `.prepare` was not in the
  name list. `html-sink` reported zero for an app with 50 server-rendered HTML template
  literals, because the patterns were React-oriented. **Zero in a category is a claim — check it
  against the codebase before believing it.**
- **Use a lookbehind to separate a method call from a bare call.** `\bexec\s*\(` matches
  `/^([A-Z_]+):/.exec(msg)` — three false positives out of four on first contact.
- **Replay migrations in order; do not filter them in two passes.** The rebuild idiom
  `CREATE x_new; DROP x; RENAME x_new TO x` defeats a filter — it sees `x` dropped and `x_new`
  renamed away and drops both. Two real tables vanished this way.
- **Match on comment-stripped source, sliced by character offset**, and keep `stripComments`
  **regex-aware**. A comment reading `// authorize` satisfied an authorization mechanism, a
  commented-out route became a phantom surface, and a regex literal `/https?:\/\//` blanked the
  rest of its line and hid a guard after it.
- **A fixture written in the implementation's own idiom cannot detect the implementation's blind
  spot.** 0.1.0 shipped a hard-coded Fastify "canary" whose presence in a green run was supposed
  to prove the scanner was blind. Against a Flask project it found only the canary, warned about
  nothing, and went green — it manufactured the assurance it existed to provide. **Keep at least
  one non-JavaScript stack in the fixture suite for the same reason.**
- **Never gate a blind-spot signal on a project-wide total.** The canary's replacement checked
  `httpBy.size === 0` across the whole project, so one Express health route silenced a wholly
  unread Fastify app — the canary's flaw one level up. `detectFrameworks()` now scopes per
  framework: did any file importing *this* framework produce a surface?
- **Parse manifests; do not regex their raw text.** `requirements.txt: Django==5.2.1` never
  matched an anchored dependency pattern tested against the whole file.
- **Emit every method a decorator declares.** Flask's `methods=['GET','POST']` yielded only GET,
  silently dropping a write path.
- **Write control characters as escapes.** A literal NUL inside a string literal is invisible in
  review. The trailhead hook shipped `grep -q '\x00'`, which in bash is `grep -q ''` — it matched
  every file as binary and scanned none of them.
- **Resolve symlinks in the CLI entry-point guard.** A bare `file://${process.argv[1]}`
  comparison fails through a symlink — on macOS `/var` → `/private/var` — so the script silently
  did nothing and exited 0. For a gate that is the worst available failure mode.
- **Never skip an archived finding without checking its status.** `## Archive` sits at the bottom
  of `FINDINGS.md`, so the natural act of appending drops a new finding into it, where a naive
  parser treats it as history. This suite produced a false green on a High-severity finding
  exactly that way. The gate now blocks on any archived row that is not `resolved`.
- **Assert the cause, not just the verdict.** A case that only checks `verdict === 'fail'` can
  pass because of stale recency while the thing it tests is broken. Three cases here failed for
  the wrong reason until the fixture was bound to the real git history.
- **No silent caps.** A truncated sink category is reported with its real total. A silent cap
  reads as "that is all of them," which is the same lie this plugin was rewritten to stop
  telling.
- **Fix the family, not the instance.** Every row of a pattern table gets its own case, in
  **both** directions.
- **Do not add a third interview question.** Security questions are the ones users least want at
  setup time.

## Composition

`security` and `trailhead` compose **through files in the deployment directory**. Neither
imports the other, and neither may. If trailhead is present, `check.mjs` is re-exported as a
check module and trailhead owns the posture matrix; if not, it runs standalone with its own exit
code. It never degrades to nothing — "uninstall the other plugin" must never become a documented
way to report secure.

The same rule is why `secrets.mjs` carries its own copy of the credential pattern table rather
than importing trailhead's. That copy can drift; the mitigation is that this one produces
candidates while trailhead's decides, so a drift surfaces as a difference in a work list rather
than as one tool blocking what the other permits.
