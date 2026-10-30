#!/usr/bin/env node
/**
 * The gate. **It enforces only what a script can decide.**
 *
 * ## What this deliberately does not do
 *
 * The previous version of this file tried to gate on *analysis*: it enumerated surfaces,
 * matched guard patterns against handler paths, and reported "N of M invariants hold over M
 * surfaces." Two external reviews concluded it was not trustworthy, and the root cause was
 * never a bug — it was the claim. A script cannot establish that code is authorized, and one
 * that says it can is worse than nothing, because it converts an open question into a false
 * answer.
 *
 * So this file makes no claim about the code at all. It reads the findings registry, the
 * deterministic scanners, and git, and it blocks on facts that are exactly decidable:
 *
 *   1. An unresolved finding at or above the configured severity.
 *   2. An accepted risk whose expiry passed, or whose file changed since it was accepted.
 *   3. A credential candidate in staged content, in a path with no benign label.
 *   4. A registry that has been edited to make a red finding disappear.
 *   5. A registry with no findings AND no review history — which is not a clean repository,
 *      it is an unexamined one.
 *
 * Whether a vulnerability exists is the reviewer's job, and the reviewer is an agent. That
 * division is stated in the README rather than papered over: **the analysis needs an agent;
 * this only holds the line on what the analysis already found.**
 *
 * Runs two ways, one implementation:
 *
 *   node security/scripts/check.mjs            standalone; exit 1 on fail
 *   node security/scripts/check.mjs --json     read-only, writes nothing
 *
 * and as a trailhead check module via `run(context)`.
 *
 * Zero dependencies. Never touches a network.
 */

import { realpathSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { readOr, readJsonOr, result } from './lib/scan.mjs';
import { staleness } from './staleness.mjs';
import { scanSecrets } from './secrets.mjs';
import { run as runDecisions } from './check-decisions.mjs';

const MAX_BUFFER = 8 * 1024 * 1024;
const SEVERITY = ['Low', 'Medium', 'High', 'Critical'];
const RESOLVED = new Set(['resolved']);
/** Statuses that park a finding with a human rather than leaving it unhandled. */
const PARKED = new Set(['surfaced-for-decision', 'decision-due', 'accepted']);

function sevRank(s) {
  const i = SEVERITY.findIndex((x) => x.toLowerCase() === String(s ?? '').trim().toLowerCase());
  return i === -1 ? -1 : i;
}

/**
 * Parse `security/FINDINGS.md`.
 *
 * The registry is human-readable on purpose — the human and the agent read the same file —
 * so the parser is tolerant of prose but strict about the fields it gates on. A field it
 * cannot parse becomes a `config_error`, never a silent skip: an unparseable severity that
 * defaulted to "Low" would be a one-typo bypass.
 */
export function parseFindings(text) {
  const findings = [];
  const malformed = [];
  if (!text) return { findings, malformed };

  // Everything below an `## Archive` heading is resolved history.
  const archiveAt = text.search(/^##\s+Archive\s*$/im);
  const active = archiveAt === -1 ? text : text.slice(0, archiveAt);
  const archived = archiveAt === -1 ? '' : text.slice(archiveAt);

  const parseBlocks = (body, isArchive) => {
    const blocks = body.split(/^##\s+/m).slice(1);
    for (const block of blocks) {
      const [headline, ...rest] = block.split('\n');
      const id = headline.match(/^(S-\d{8}-\d{2})\b/)?.[1];

      // FIX 4 — a finding-like heading the id regex does not recognize was invisible.
      //
      // `S-20260726-1` produced no entry AND no malformed error, so a Critical could be
      // hidden by dropping one digit. `S-20260726-100` was worse: the un-anchored match took
      // the first two digits and silently became `S-20260726-10`, which could collide with a
      // real row. Both contradicted this parser's promise that an unreadable field is a
      // config error rather than a silent skip. The `\b` anchors the sequence; anything
      // heading-shaped that still fails to parse is now reported.
      if (!id) {
        if (/^\s*S-/i.test(headline) || /^\s*[-*]\s*status\s*:/im.test(rest.join('\n'))) {
          malformed.push({
            id: headline.trim().slice(0, 60) || '(blank heading)',
            why: 'looks like a finding but its id is not `S-YYYYMMDD-NN` — it would be skipped entirely, so a real finding could hide behind a typo',
          });
        }
        continue;
      }

      const f = { id, title: headline.replace(/^S-\d{8}-\d{2}\s*[—-]\s*/, '').trim(), archived: isArchive };
      for (const line of rest) {
        const m = line.match(/^\s*[-*]\s*(.+)$/);
        if (!m) continue;
        // A line may carry several fields separated by `·`.
        for (const part of m[1].split('·')) {
          const kv = part.match(/^\s*([a-z_]+)\s*:\s*(.*)$/i);
          if (!kv) continue;
          f[kv[1].toLowerCase()] = kv[2].trim();
        }
      }

      if (!f.status) { malformed.push({ id, why: 'no `status` field' }); continue; }
      if (!f.severity) { malformed.push({ id, why: 'no `severity` field' }); continue; }
      if (sevRank(f.severity) === -1) { malformed.push({ id, why: `severity "${f.severity}" is not one of ${SEVERITY.join(', ')}` }); continue; }

      // Make the confidence weld MECHANICAL rather than aspirational.
      //
      // The finding contract says High confidence requires the path read end to end AND a
      // named concrete input, and that no finding claims exploitability without one. Until
      // this check existed, none of that was enforced anywhere: an entry carrying only
      // `status` and `severity` parsed as well-formed, so an agent could assert
      // `confidence: High` with no attack path, no input, and no location, and the gate
      // accepted it. A requirement that lives only in prose is the exact failure this
      // codebase has shipped before — the reviewer is the one being checked here, and an
      // unenforced ceiling is not a ceiling.
      //
      // Active rows only: an archived/resolved entry is history and may predate the rule.
      const active = !isArchive && !RESOLVED.has(String(f.status).toLowerCase());
      if (active && !f.location) {
        malformed.push({ id, why: 'no `location` field — a finding nobody can open is not a finding' });
        continue;
      }
      if (active && /^high$/i.test(String(f.confidence ?? '').trim())) {
        const missing = ['attack_path', 'concrete_input'].filter((k) => !String(f[k] ?? '').trim());
        if (missing.length) {
          malformed.push({
            id,
            why: `claims confidence: High without ${missing.join(' and ')} — High requires the path read end to end and a named input. Lower the confidence or supply the evidence.`,
          });
          continue;
        }
      }
      findings.push(f);
    }
  };

  parseBlocks(active, false);
  parseBlocks(archived, true);
  return { findings, malformed };
}

/** `owner=alex date=2026-01-15 expires=2026-04-15 commit=a1b2c3d` */
function parseAcceptance(value) {
  if (!value) return null;
  const out = {};
  for (const m of value.matchAll(/(\w+)\s*=\s*([^\s]+)/g)) out[m[1]] = m[2];
  return out;
}

function git(root, args) {
  const r = spawnSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: MAX_BUFFER });
  if (r.error || r.status !== 0) return null;
  return (r.stdout ?? '').trim();
}

/** The file a finding points at, from its `location` field. */
function locationFile(f) {
  const raw = String(f.location ?? '').trim();
  const m = raw.match(/^([^\s:]+)/);
  return m ? m[1] : null;
}

/**
 * Findings whose harm cannot be taken back, and which therefore block in any mode.
 *
 * Everything else this gate knows is recoverable: an unresolved finding is still there
 * tomorrow, a stale review can be run late, a due decision can be made next week. **A
 * credential that reaches a remote is rotated, not undone.** That is the whole test, and it
 * is the same reversibility rule the sibling trailhead plugin gates on.
 */
const IRREVERSIBLE = /credential of a known format staged/;

export async function check(root, config = {}, { today = new Date().toISOString().slice(0, 10) } = {}) {
  // ADVISORY BY DEFAULT.
  //
  // Two independent reviews concluded this should not be a build-blocking control, and the
  // reason is structural rather than a bug list: the registry is human-editable and every
  // field in it is written by the party the gate is meant to check, so validating a
  // self-assertion is not binding it. A gate cannot be an integrity boundary over its own
  // subject's claims.
  //
  // That is also not what this is for. It was never going to remove a human from security
  // review. It is here to **shrink the surface a human has to look at**, and to make sure
  // problems already closed stay closed rather than accumulating into a backlog at the end
  // of a project. Reporting does that. Blocking on an unverifiable claim only teaches people
  // to write the word that makes it stop.
  //
  // `mode: "blocking"` opts in where a team has decided the registry is trustworthy in their
  // process — a protected branch, required reviewers on `security/`. That is a decision about
  // their controls, not about this script, and `honest-limits.md` says so.
  const gate = {
    mode: 'advisory',
    block_at_severity: 'High',
    block_on_never_reviewed: false,
    stale_at_commits: 20,
    ...(config.gate ?? {}),
  };
  let threshold = sevRank(gate.block_at_severity);
  const configErrors = [];
  if (threshold === -1) {
    // A typo used to leave `threshold` at -1, so every severity compared `>= -1` and even a
    // Low finding blocked — fail-closed, but silently and for a reason nobody could read
    // from the output. Fail closed AND say why.
    configErrors.push({
      severity: 'critical',
      title: `gate.block_at_severity is "${gate.block_at_severity}", which is not a severity`,
      detail: `Expected one of ${SEVERITY.join(', ')}. Blocking on every finding until this is corrected.`,
    });
    threshold = 0;
  }
  const registryText = readOr(join(root, 'security', 'FINDINGS.md'), null);
  const findings = [];
  const identities = [];

  // Decisions that have come due — evaluated FIRST, before any early return.
  //
  // Two things put it here. `honest-limits.md` has always listed "a decision that has come
  // due" among what this gate blocks on while nothing here ever called the decisions module,
  // so standalone a triggered isolation decision had no effect on the gate that documented
  // it. And when the call was first added *after* the empty-registry early return, it was
  // invisible on exactly the project that needs it most: a brand-new repository has an empty
  // registry, which is precisely when an isolation or deletion decision is cheapest to make
  // and most expensive to defer. Three due decisions were hidden this way.
  // The irreversible check runs FIRST, before any early return.
  //
  // It was placed after the empty-registry return, so on a brand-new project — no registry
  // yet, someone commits a key on day one — the one finding that blocks in every mode never
  // ran. That is the same early-return seam the decisions call hit, in the same file, found
  // the same way: by running the thing end to end instead of trusting the unit tests.
  const secrets = scanSecrets(root, { staged: true });
  const GENERIC_RULE = /generic|entropy|high[-_]?entropy|unknown/i;
  const BLOCKABLE_SIGNAL = (c) =>
    c.signal === 'prefixed-format'
    || (String(c.signal).startsWith('external:') && !GENERIC_RULE.test(String(c.pattern)));
  const stagedReal = secrets.candidates.filter(BLOCKABLE_SIGNAL);
  const stagedForReview = secrets.candidates.filter((c) => !BLOCKABLE_SIGNAL(c));
  const credentialFindings = stagedReal.map((c) => ({
    severity: 'critical',
    title: `credential of a known format staged in ${c.file}:${c.line}`,
    detail: `${c.pattern} ${c.redacted}. A prefixed credential does not occur by accident. If it is real, ROTATE it — removing the line does not revoke it. Being under a test path does not change that.`,
  }));
  findings.push(...credentialFindings);

  // An irreversible finding outranks every other verdict, including `missing_input`.
  //
  // Running the scan early was not enough on its own: the early returns build their own
  // findings array and return `missing_input`, which exits 0 in advisory mode — so a staged
  // key on a fresh repository was detected, dropped from the result, and exited clean. The
  // carve-out has to survive the return path, not just reach it.
  const irreversibleEarly = credentialFindings.length > 0;

  const decisions = await runDecisions({ root });
  // FIX 3 — propagate EVERY non-pass verdict, not only `fail`.
  //
  // Importing findings only when the verdict was exactly `fail` made the seam fail open:
  // delete `DECISIONS.md` or empty its table and the checker returns `missing_input`, which
  // was discarded — so removing the ledger removed the check on it. That is a one-command
  // bypass of the mechanism this plugin considers most valuable.
  const decisionFindings = decisions.verdict === 'pass'
    ? []
    : [
      ...(decisions.findings ?? []).map((d) => ({
        severity: d.severity === 'critical' ? 'critical' : 'major',
        title: d.title,
        detail: d.evidence ?? 'security/DECISIONS.md',
      })),
      ...(decisions.verdict === 'missing_input'
        ? [{
          severity: 'major',
          title: 'the security decisions ledger is missing or empty',
          detail: `${decisions.summary} Deleting the ledger must not delete the check on it — restore security/DECISIONS.md, or run /know-security:init.`,
        }]
        : []),
    ];
  findings.push(...decisionFindings);

  if (registryText === null) {
    return result(irreversibleEarly ? 'fail' : 'missing_input', 'security/FINDINGS.md does not exist — nothing has been reviewed and there is no registry to hold the line on', { fail: 1 }, [
      ...credentialFindings,
      { severity: 'critical', title: 'no findings registry', detail: 'Run /know-security:init, then /know-security:sweep. An absent registry is not a clean repository.' },
      ...decisionFindings,
    ]);
  }

  findings.push(...configErrors);
  const { findings: rows, malformed } = parseFindings(registryText);
  for (const m of malformed) {
    findings.push({ severity: 'critical', title: `${m.id} cannot be parsed`, detail: `${m.why}. A field the gate cannot read is a bypass, so this blocks rather than defaulting.` });
  }
  for (const r of rows) identities.push(r.id);

  // Duplicate ids. Ids are date plus a "next" sequence chosen by whoever is appending, so two
  // reviewers running concurrently both pick the same one — and nothing rejected it, so one
  // finding could silently stand in for two. Detecting the collision is what a single-writer
  // file format can honestly offer; see `honest-limits.md` on why this is not a lock.
  const seenIds = new Set();
  for (const r of rows) {
    if (seenIds.has(r.id)) {
      findings.push({
        severity: 'critical',
        title: `${r.id} appears more than once`,
        detail: 'Two entries share an id, which means one of them was written over the other or two runs picked the same sequence number. Renumber the later one — ids are never reused.',
      });
    }
    seenIds.add(r.id);
  }

  const stale = staleness(root, config);
  const neverReviewed = stale.available ? stale.units.filter((u) => u.state === 'never_reviewed') : [];
  const unresolvedRecency = stale.available ? stale.units.filter((u) => u.state === 'review_commit_unreachable') : [];
  const staleUnits = stale.available
    ? stale.units.filter((u) => u.commits_since !== null && u.commits_since >= gate.stale_at_commits)
    : [];

  // G3 — the empty-set pass. A registry with nothing in it and a repository nobody has
  // reviewed is `missing_input`, never a pass. This is where "absence of findings is not
  // evidence of security" stops being a slogan and becomes an exit code.
  //
  // `partial` and `review_commit_unreachable` do NOT count as reviews. A truncated run that
  // returned "none found" over half a subsystem was previously enough to clear this test and
  // carry an empty registry to PASS — the single shortest path from an agent running out of
  // context to a green build.
  const REVIEWED = new Set(['current', 'drifted', 'stale', 'unknown']);
  const anyReview = stale.available && stale.units.some((u) => REVIEWED.has(u.state));
  const PARTIAL_STATES = new Set(['partial', 'complete_unsupported']);
  const partialUnits = stale.available ? stale.units.filter((u) => PARTIAL_STATES.has(u.state)) : [];
  for (const u of partialUnits) {
    // Reported at the SAME strength as never-reviewed, under the same config switch.
    //
    // These blocked unconditionally at first while `never_reviewed` was waved through by
    // default — so a unit nobody had opened passed, and a unit someone had partly reviewed
    // failed. That punishes attempting a review and rewards not trying, which is the exact
    // incentive a security tool cannot afford to create. Both states mean the same thing:
    // this code has not been reviewed. They belong on the same switch.
    findings.push({
      severity: gate.block_on_never_reviewed ? 'major' : 'info',
      title: `${u.unit} was reviewed without a completion marker`,
      detail: 'The record does not say the assignment finished, so a truncated run cannot be told from a thorough one. Treated as unreviewed. Run it again, or set gate.block_on_never_reviewed to make this and never-reviewed units block.',
    });
  }
  if (rows.length === 0 && !anyReview) {
    return result(
      irreversibleEarly ? 'fail' : 'missing_input',
      stale.available
        ? `registry is empty and none of ${stale.counts.units} unit(s) has been reviewed — unexamined, not clean`
        : 'registry is empty and review recency is unavailable (not a git repository) — nothing establishes that anything was reviewed',
      { fail: 1 },
      [...credentialFindings, { severity: 'critical', title: 'nothing has been reviewed', detail: 'An empty registry over an unreviewed repository is the absence of evidence, not evidence of security. Run /know-security:sweep.' }, ...decisionFindings],
      identities,
    );
  }

  // 1 — unresolved findings at or above the threshold.
  let blocking = 0;
  let parked = 0;
  for (const f of rows) {
    const status = String(f.status).toLowerCase();

    // An archived finding that is not `resolved` is laundering, and it is the *accidental*
    // kind as well as the deliberate kind: `## Archive` sits at the bottom of the file, so
    // the natural act of appending a new finding drops it into the archive, where it would
    // be silently ignored. This was found by the gate's own test producing a false green on
    // a High-severity finding. Never skip an archived row without checking its status.
    if (f.archived) {
      if (!RESOLVED.has(status)) {
        findings.push({
          severity: 'critical',
          title: `${f.id} is in the Archive section with status "${f.status}"`,
          detail: 'Only `resolved` findings belong in Archive. Move it above the `## Archive` heading — an unresolved finding below it is invisible to this gate, whether that was the intent or an append that landed in the wrong place.',
        });
        blocking += 1;
      }
      continue;
    }
    // FIX 1 — one-word laundering.
    //
    // `resolved` skipped a row with no evidence at all, and `decision-due` /
    // `surfaced-for-decision` parked any severity with no decision row and no linkage. The
    // entire gate was one word wide: change a Critical's status and it vanished, with the
    // finding identity intact so no deletion check fired either.
    //
    // A script cannot verify a fix works. It CAN require that a state transition cite
    // something checkable — which turns a one-word escape into a claim that names a commit
    // or a row someone can open, and shows up in a diff as such.
    if (RESOLVED.has(status)) {
      const fixedAt = String(f.resolved_in ?? f.resolution ?? '').trim();
      if (!fixedAt) {
        findings.push({
          severity: 'major',
          title: `${f.id} is resolved with no evidence`,
          detail: 'A resolution names what fixed it: `- resolved_in: <commit sha>` or a ticket. Nothing here can verify the fix works; requiring a citation is what stops "resolved" from being a one-word delete.',
        });
        blocking += 1;
        continue;
      }
      // If it looks like a sha, it must be a real one in this history.
      if (/^[0-9a-f]{7,40}$/i.test(fixedAt) && git(root, ['cat-file', '-e', `${fixedAt}^{commit}`]) === null) {
        findings.push({
          severity: 'major',
          title: `${f.id} is resolved in ${fixedAt}, which is not a commit in this history`,
          detail: 'Rebased, squashed, or invented. Cite a reachable commit.',
        });
        blocking += 1;
      }
      continue;
    }

    if (status === 'accepted') {
      const acc = parseAcceptance(f.accepted ?? f.acceptance);
      // ALL FOUR, which is what the review skill has always told people. Requiring only
      // owner/date/expires meant an acceptance written without `commit` was never bound to
      // any code, so it stayed suppressed until its expiry however the file changed —
      // and the code-change check below ran only `if (acc.commit && file)`, so omitting
      // either field silently disabled the binding the contract promises.
      const missingAcc = ['owner', 'date', 'expires', 'commit'].filter((k) => !acc?.[k]);
      if (missingAcc.length) {
        findings.push({
          severity: 'critical',
          title: `${f.id} is accepted without ${missingAcc.join(', ')}`,
          detail: 'An acceptance needs all four or it is an unaudited suppression: `- accepted: owner=<who> date=<YYYY-MM-DD> expires=<YYYY-MM-DD> commit=<sha>`. The commit is what binds the judgment to the code it was made about.',
        });
        blocking += 1;
        continue;
      }
      if (!locationFile(f)) {
        findings.push({
          severity: 'critical',
          title: `${f.id} is accepted but has no resolvable file in \`location\``,
          detail: 'Acceptance reopens when the code changes, which requires knowing which file to watch. Without one the acceptance cannot be bound and does not hold.',
        });
        blocking += 1;
        continue;
      }
      // FIX 2 — a date-SHAPED string is not a date. `expires=9999-99-99` compared lexically
      // as unexpired forever. `check-decisions.mjs` already parses its dates; this is the
      // same defect surviving in the sibling file, which is why "fix the family, not the
      // instance" is the first editing caution in AGENTS.md.
      const expiresAt = Date.parse(`${acc.expires}T00:00:00Z`);
      if (!Number.isFinite(expiresAt)) {
        findings.push({
          severity: 'major',
          title: `${f.id} is accepted until "${acc.expires}", which is not a real date`,
          detail: 'An acceptance that cannot expire is a permanent suppression wearing an expiry.',
        });
        blocking += 1;
        continue;
      }
      if (acc.expires < today) {
        findings.push({ severity: 'major', title: `${f.id} acceptance expired ${acc.expires}`, detail: 'Re-accept it with a new expiry or resolve it. An expired acceptance reopens the finding.' });
        blocking += 1;
        continue;
      }
      // The acceptance was a judgment about specific code. Different code is a different
      // judgment, so a change to the file reopens it.
      const file = locationFile(f);
      {
        const reachable = git(root, ['cat-file', '-e', `${acc.commit}^{commit}`]) !== null;
        const since = reachable ? git(root, ['rev-list', '--count', `${acc.commit}..HEAD`, '--', file]) : null;
        if (!reachable) {
          findings.push({ severity: 'major', title: `${f.id} was accepted at ${acc.commit}, which is not in this history`, detail: 'Rebased, squashed, or a shallow clone. The acceptance cannot be bound to code, so it does not hold.' });
          blocking += 1;
          continue;
        }
        if (Number(since) > 0) {
          findings.push({ severity: 'major', title: `${f.id} accepted risk reopened — ${file} changed ${since} commit(s) since acceptance`, detail: 'Acceptance was a judgment about the code as it was. Re-read it and re-accept, or resolve it.' });
          blocking += 1;
          continue;
        }
      }
      parked += 1;
      continue;
    }

    // Parking with a human is legitimate; parking with nobody is the same one-word escape.
    // `decision-due` must name a row that exists in DECISIONS.md, so the parked finding is
    // attached to a question someone will actually be asked.
    if (status === 'decision-due') {
      const row = String(f.decision ?? f.decision_row ?? '').trim();
      const known = new Set(decisions.identities ?? []);
      if (!row) {
        findings.push({ severity: 'major', title: `${f.id} is decision-due but names no decision`, detail: 'Add `- decision: <row id>` pointing at the security/DECISIONS.md row this is waiting on.' });
        blocking += 1;
        continue;
      }
      if (known.size && !known.has(row)) {
        findings.push({ severity: 'major', title: `${f.id} is waiting on decision ${row}, which is not in security/DECISIONS.md`, detail: `Known rows: ${[...known].join(', ') || 'none'}. A finding parked against a row nobody will see is parked nowhere.` });
        blocking += 1;
        continue;
      }
      parked += 1;
      continue;
    }
    if (PARKED.has(status)) { parked += 1; continue; }

    if (sevRank(f.severity) >= threshold) {
      findings.push({
        severity: sevRank(f.severity) === SEVERITY.length - 1 ? 'critical' : 'major',
        title: `${f.id} — ${f.title}`,
        detail: `${f.severity}, status ${f.status}${f.location ? ` · ${f.location}` : ''}`,
      });
      blocking += 1;
    }
  }

  // 3 — credential candidates in staged content.
  //
  // The gate blocks on the SIGNAL, never on the PATH. Path-based suppression leaked the
  // operating-model boundary in both directions at once: it discarded a real key under
  // `tests/` unread, and it blocked `const password = "sample"` in ordinary source without
  // anything having traced a sink. A gate that judges is the thing this design says a gate
  // must not be.
  //
  // What a script can genuinely decide is format. A prefixed credential — `AKIA…`,
  // `sk_live_…`, `ghp_…`, a PEM header — does not occur by accident, so it is blockable
  // wherever it appears; a real key committed into a fixture directory is still a real key
  // and still has to be rotated. A credential-SHAPED ASSIGNMENT is not decidable by format
  // at all: `password = "hunter2"` is a fixture, a sample, or a live credential, and only
  // reading the origin and the sink separates them. That one goes to the reviewer as a
  // candidate and never blocks a commit.
  // Reported, never blocking. A script cannot tell a fixture password from a live one, and
  // pretending otherwise is what made this gate judge. Surfacing it keeps the reviewer's
  // work list honest without turning an undecidable call into an exit code.
  if (stagedForReview.length) {
    findings.push({
      severity: 'info',
      title: `${stagedForReview.length} credential-shaped assignment(s) staged — for review, not blocking`,
      detail: `${stagedForReview.slice(0, 5).map((c) => `${c.file}:${c.line}`).join(', ')}${stagedForReview.length > 5 ? ', …' : ''}. Whether these are credentials depends on where the value comes from, which only reading establishes.`,
    });
  }

  // 5 — recency. Reported always; blocks only when configured to.
  if (unresolvedRecency.length) {
    for (const u of unresolvedRecency) {
      findings.push({ severity: 'major', title: `${u.unit} review cannot be located in this history`, detail: `${u.note} Treat as unreviewed.` });
    }
  }
  if (gate.block_on_never_reviewed && neverReviewed.length) {
    findings.push({
      severity: 'major',
      title: `${neverReviewed.length} unit(s) never reviewed`,
      detail: neverReviewed.map((u) => u.unit).join(', '),
    });
  }

  const hardFails = findings.filter((f) => f.severity === 'critical' || f.severity === 'major').length;
  const irreversible = findings.filter((f) => IRREVERSIBLE.test(f.title)).length;

  // Verdict. `advisory` is a first-class result, not a softened failure: it means findings
  // exist and are reported, and this script is not the thing that decides whether they stop a
  // build. An irreversible finding blocks in either mode — you cannot un-leak a key by
  // configuring a gate.
  const verdict = irreversible > 0 ? 'fail'
    : hardFails === 0 ? 'pass'
      : gate.mode === 'blocking' ? 'fail' : 'advisory';

  const summaryBits = [];
  if (blocking) summaryBits.push(`${blocking} unresolved at or above ${gate.block_at_severity}`);
  if (stagedReal.length) summaryBits.push(`${stagedReal.length} staged credential candidate(s)`);
  if (parked) summaryBits.push(`${parked} parked with a human`);
  if (neverReviewed.length) summaryBits.push(`${neverReviewed.length} unit(s) never reviewed`);
  if (staleUnits.length) summaryBits.push(`${staleUnits.length} stale`);
  if (secrets.scanner === 'built-in') summaryBits.push('secret scan: built-in table, no history');

  return result(
    verdict,
    summaryBits.length ? summaryBits.join(' · ') : `${rows.length} finding(s), none blocking`,
    { pass: rows.length - blocking - parked, fail: blocking + stagedReal.length, not_run: parked + neverReviewed.length },
    findings,
    identities,
  );
}

/** trailhead check-module contract. */
export async function run(context = {}) {
  const root = context.root ?? process.cwd();
  const config = context.config ?? readJsonOr(join(root, 'security', 'config.json'), {});
  return check(root, config);
}

async function main() {
  const root = process.cwd();
  const config = readJsonOr(join(root, 'security', 'config.json'), {});
  const out = await check(root, config);

  if (process.argv.includes('--json')) {
    process.stdout.write(`${JSON.stringify(out, null, 2)}\n`);
    return;
  }

  const lines = [`security: ${out.verdict.toUpperCase()} — ${out.summary}`];
  if (out.verdict === 'advisory') {
    lines.push('  advisory mode: reported, not blocking. Set gate.mode to "blocking" to enforce.');
  }
  for (const f of out.findings) {
    lines.push(`  [${f.severity}] ${f.title}`);
    if (f.detail) lines.push(`      ${f.detail}`);
  }
  lines.push('');
  lines.push('This gate holds the line on findings that already exist. It does not establish');
  lines.push('that the code is safe — no script can. Run /know-security:review or /know-security:sweep.');
  process.stdout.write(`${lines.join('\n')}\n`);
  // Exit code follows the mode, not the loudness.
  //
  // `fail` always exits 1 — in advisory mode that verdict only occurs for something
  // irreversible, which is the carve-out. `missing_input` stays loud on purpose (an unexamined
  // repository is not a clean one, and the banner says so) but it is a reporting fact, not a
  // reason for an advisory run to break a build. Under `mode: "blocking"` it exits 1 like
  // anything else.
  //
  // The verdict string is unchanged either way, so trailhead's runner — which reads the verdict
  // and applies its own posture matrix — sees exactly what it always did.
  const blocks = out.verdict === 'fail'
    || (out.verdict === 'missing_input' && (config.gate?.mode ?? 'advisory') === 'blocking');
  if (blocks) process.exitCode = 1;
}

if (process.argv[1] && pathToFileURL(realpathSync(process.argv[1])).href === import.meta.url) await main();
