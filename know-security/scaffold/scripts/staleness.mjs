#!/usr/bin/env node
/**
 * Review recency, from git. **The anti-skip mechanism.**
 *
 * ## What this replaces, and why
 *
 * The previous design's anti-skip mechanism was a denominator: every surface and store was
 * enumerated on every run, the set could only grow, and a surface no invariant claimed went
 * red. The premise was right — *nobody deletes a security gate, they add a route it doesn't
 * cover* — but the implementation had to be complete or it lied, and regex over arbitrary
 * source is never complete. Two reviews found the same defect repeatedly.
 *
 * This is the honest version of the same idea, and it needs no denominator at all:
 *
 *   **You changed code nobody looked at.**
 *
 * That is decidable from git with certainty. It does not require knowing what a file
 * contains, what framework it uses, or whether a guard is present. It requires only two
 * facts, both of which are exact: when a path was last reviewed, and what has happened to it
 * since. A file nobody has ever reviewed is the strongest signal available here, and it costs
 * nothing to compute.
 *
 * The corollary that matters more than the headline: **a clean run over a subsystem nobody
 * reviewed is not a clean subsystem.** Without this file the reviewer's output would be
 * indistinguishable from a thorough one, which is the "absence of findings is not evidence of
 * security" failure made concrete.
 *
 * ## State
 *
 * `security/.state/reviews.json` — written by /know-security:review and /know-security:sweep, one
 * record per reviewed path:
 *
 *   { "path": "src/http", "commit": "a1b2c3d", "date": "2026-01-15", "lens": ["injection"] }
 *
 * Nothing here writes it. This file only reads and reports.
 *
 *   node security/scripts/staleness.mjs           human-readable
 *   node security/scripts/staleness.mjs --json    for an agent or the gate
 *
 * Zero dependencies. Never touches a network.
 */

import { realpathSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { readJsonOr, IGNORED_DIRS } from './lib/scan.mjs';

const SCHEMA = 'knowbility.security.staleness/1';
const MAX_BUFFER = 8 * 1024 * 1024;

/** Commits-since thresholds. Reported, never enforced here — the gate decides. */
const STALE_AT = 20;

function git(root, args) {
  const r = spawnSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: MAX_BUFFER });
  if (r.error || r.status !== 0) return null;
  return (r.stdout ?? '').trim();
}

/**
 * The units we report on: top-level source directories, one level down.
 *
 * Per-file would be unreadable on any real repository and per-repository would be useless.
 * A subsystem is the granularity at which someone actually says "I reviewed the auth code."
 */
function subsystems(root, config) {
  const roots = config.review_units ?? ['src', 'app', 'lib', 'server', 'api', 'packages', 'apps'];
  const out = [];
  for (const r of roots) {
    let entries;
    try { entries = readdirSync(join(root, r), { withFileTypes: true }); } catch { continue; }
    const children = entries.filter((e) => e.isDirectory() && !IGNORED_DIRS.has(e.name) && !e.name.startsWith('.'));
    if (children.length === 0) {
      out.push(r);
    } else {
      for (const c of children) out.push(`${r}/${c.name}`);
      // Files sitting directly in the root count as their own unit; otherwise a top-level
      // entry point is invisible to every threshold below.
      if (entries.some((e) => e.isFile())) out.push(`${r}/*`);
    }
  }
  return out.sort();
}

export function staleness(root, config = {}) {
  const inRepo = git(root, ['rev-parse', '--is-inside-work-tree']) === 'true';
  if (!inRepo) {
    return {
      schema: SCHEMA,
      generated_at: new Date().toISOString(),
      available: false,
      reason: 'not a git repository — review recency cannot be established, so nothing here can report that a path was or was not looked at',
      units: [],
    };
  }

  const head = git(root, ['rev-parse', '--short', 'HEAD']);
  const reviews = readJsonOr(join(root, 'security', '.state', 'reviews.json'), { reviews: [] });
  const byPath = new Map();
  for (const r of reviews.reviews ?? []) {
    // Keep the most recent record per path.
    const prior = byPath.get(r.path);
    if (!prior || (r.date ?? '') > (prior.date ?? '')) byPath.set(r.path, r);
  }

  const units = [];
  for (const unit of subsystems(root, config)) {
    // `:(glob)` makes `*` stop at a path separator, so the "files sitting directly in this
    // root" unit counts only those files. Stripping the `/*` and passing the bare directory
    // counted the ENTIRE subtree instead: with one commit to `src/top.ts` and three to
    // `src/auth/`, the `src/*` unit reported three, so a root-level entry point's recency
    // tracked activity in unrelated subdirectories and overlapped its own siblings.
    const pathspec = unit.endsWith('/*') ? `:(glob)${unit}` : unit;
    const record = byPath.get(unit) ?? byPath.get(pathspec) ?? null;

    // Total commits touching this unit, for context on how active it is.
    const total = git(root, ['rev-list', '--count', 'HEAD', '--', pathspec]);

    if (!record) {
      units.push({
        unit,
        state: 'never_reviewed',
        commits_since: total === null ? null : Number(total),
        last_reviewed: null,
        last_commit_date: git(root, ['log', '-1', '--format=%cs', '--', pathspec]),
      });
      continue;
    }

    // Commits to this unit since the reviewed commit. A missing or rewritten commit (rebase,
    // squash, shallow clone) is NOT silently treated as zero — that would read as "reviewed
    // and unchanged," which is the exact false-clean this file exists to prevent.
    const reachable = git(root, ['cat-file', '-e', `${record.commit}^{commit}`]) !== null;
    if (!reachable) {
      units.push({
        unit,
        state: 'review_commit_unreachable',
        commits_since: null,
        last_reviewed: record.date ?? null,
        reviewed_commit: record.commit,
        note: 'the reviewed commit is not in this history (rebased, squashed, or a shallow clone) — treat this unit as unreviewed rather than unchanged',
      });
      continue;
    }

    const since = git(root, ['rev-list', '--count', `${record.commit}..HEAD`, '--', pathspec]);
    const n = since === null ? null : Number(since);

    // A record without an explicit completion marker is a PARTIAL review, not a current one.
    //
    // This is the difference between a green run meaning something and meaning nothing. An
    // agent that exhausts its context half-way through a subsystem still returns a result —
    // findings, or "none found" — and "it returned a result" was the only completion
    // condition. So a half-read subsystem was recorded, reported `current`, and could carry
    // the gate to PASS. The reviewer names the failure; nothing prevented it.
    //
    // `complete: true` is written only when the agent reports it finished the assignment.
    // Absent or false, the unit is `partial`: reported, never counted as reviewed, and never
    // silently upgraded by the passage of commits.
    if (record.complete !== true) {
      units.push({
        unit,
        state: 'partial',
        commits_since: n,
        last_reviewed: record.date ?? null,
        reviewed_commit: record.commit,
        lens: record.lens ?? null,
        files_reviewed: record.files_reviewed?.length ?? null,
        note: 'the review record carries no completion marker — treat this unit as unreviewed rather than reviewed',
      });
      continue;
    }

    // Cross-check the completion claim against something outside the agent's own report.
    //
    // `complete: true` is self-reported, which moves an unverifiable claim one level down
    // rather than removing it. This does not fix that, but it catches the degenerate case
    // for free: a record claiming a unit is completely reviewed while naming NO files it
    // read is self-contradictory, and no honest completion looks like that.
    //
    // The limit is stated rather than papered over: a low-but-nonzero count cannot be judged
    // here, because a lens-scoped review legitimately reads only the files its lens applies
    // to. Ratio is reported as data; only zero is treated as a contradiction.
    const tracked = git(root, ['ls-files', '--', pathspec]);
    const filesInUnit = tracked ? tracked.split('\n').filter(Boolean).length : null;
    const claimed = record.files_reviewed?.length ?? null;

    if (claimed === 0 || (claimed === null && filesInUnit)) {
      units.push({
        unit,
        state: 'complete_unsupported',
        commits_since: n,
        last_reviewed: record.date ?? null,
        reviewed_commit: record.commit,
        lens: record.lens ?? null,
        files_reviewed: claimed,
        files_in_unit: filesInUnit,
        note: 'the record claims the review completed but names no files it read — a completion that lists nothing read is self-contradictory',
      });
      continue;
    }

    units.push({
      unit,
      state: n === null ? 'unknown' : n === 0 ? 'current' : n >= STALE_AT ? 'stale' : 'drifted',
      commits_since: n,
      last_reviewed: record.date ?? null,
      reviewed_commit: record.commit,
      lens: record.lens ?? null,
      files_reviewed: claimed,
      files_in_unit: filesInUnit,
      unresolved: record.unresolved ?? null,
    });
  }

  const tally = (s) => units.filter((u) => u.state === s).length;
  return {
    schema: SCHEMA,
    generated_at: new Date().toISOString(),
    available: true,
    head,
    stale_at: STALE_AT,
    _note:
      'Review recency only. This says whether anyone has looked at a path and what has ' +
      'changed since — never whether the code is safe. A unit marked `current` means it was ' +
      'reviewed at this commit, not that the review found everything.',
    counts: {
      units: units.length,
      never_reviewed: tally('never_reviewed'),
      partial: tally('partial') + tally('complete_unsupported'),
      stale: tally('stale'),
      drifted: tally('drifted'),
      current: tally('current'),
      unresolved: tally('review_commit_unreachable') + tally('unknown'),
    },
    units,
  };
}

function main() {
  const root = process.cwd();
  const config = readJsonOr(join(root, 'security', 'config.json'), {});
  const out = staleness(root, config);

  if (process.argv.includes('--json')) {
    process.stdout.write(`${JSON.stringify(out, null, 2)}\n`);
    return;
  }

  if (!out.available) {
    process.stdout.write(`review recency unavailable — ${out.reason}\n`);
    return;
  }

  const c = out.counts;
  const lines = [
    `${c.units} unit(s) · never reviewed ${c.never_reviewed} · partial ${c.partial} · stale ${c.stale} · drifted ${c.drifted} · current ${c.current}` +
      (c.unresolved ? ` · unresolved ${c.unresolved}` : ''),
  ];

  const order = { never_reviewed: 0, partial: 1, complete_unsupported: 1, review_commit_unreachable: 2, stale: 3, drifted: 4, unknown: 5, current: 6 };
  const sorted = [...out.units].sort((a, b) => (order[a.state] - order[b.state]) || (b.commits_since ?? 0) - (a.commits_since ?? 0));
  lines.push('');
  for (const u of sorted) {
    if (u.state === 'never_reviewed') {
      lines.push(`  NEVER REVIEWED  ${u.unit}  (${u.commits_since ?? '?'} commits, last ${u.last_commit_date ?? 'unknown'})`);
    } else if (u.state === 'partial') {
      lines.push(`  PARTIAL         ${u.unit}  reviewed ${u.last_reviewed}, no completion marker — treat as unreviewed`);
    } else if (u.state === 'review_commit_unreachable') {
      lines.push(`  UNRESOLVED      ${u.unit}  reviewed ${u.last_reviewed} at ${u.reviewed_commit}, not in this history`);
    } else if (u.state === 'current') {
      lines.push(`  current         ${u.unit}  reviewed ${u.last_reviewed}`);
    } else {
      lines.push(`  ${u.state === 'stale' ? 'STALE' : 'drifted'}${u.state === 'stale' ? '           ' : '         '}${u.unit}  ${u.commits_since} commit(s) since ${u.last_reviewed}`);
    }
  }
  lines.push('', 'Recency only. `current` means someone looked at this commit, not that the code is safe.');
  process.stdout.write(`${lines.join('\n')}\n`);
}

if (process.argv[1] && pathToFileURL(realpathSync(process.argv[1])).href === import.meta.url) main();
