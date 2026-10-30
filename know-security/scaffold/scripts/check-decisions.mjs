#!/usr/bin/env node
/**
 * Security decisions whose moment has arrived.
 *
 * Separate from the invariant gate because the two answer different questions and should
 * be able to block differently. An unmade isolation or deletion decision is **irreversible**
 * — once data is written under the wrong model, changing it is a migration plus every
 * provenance record you already wrote. Uncovered surfaces are costly but recoverable. A
 * gate that blocks a three-route spike on coverage gets deleted; one that asks "what is the
 * isolation unit" before the second tenant-scoped table exists costs one conversation.
 *
 * Same row grammar as trailhead's OPEN-DECISIONS, its own file and its own memory, so the
 * ratchets never fuse.
 *
 *   node security/scripts/check-decisions.mjs
 */

import { realpathSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { filesMatching, readOr, result } from './lib/scan.mjs';

const OPEN = new Set(['UNDECIDED', 'OPEN', 'TBD']);
const KNOWN = new Set([...OPEN, 'DECIDED', 'DEFERRED']);

/**
 * Answers that record the absence of a decision rather than a decision.
 *
 * Anchored whole-string on purpose: "TBD" is a non-answer, but "we chose the workspace as the
 * unit; the TBD on quotas is tracked separately" is a real answer that happens to contain the
 * word. Matching a substring would reject the second and teach people to work around it.
 */
const NON_ANSWER = /^(tbd|t\.b\.d\.?|todo|n\/?a|none|pending|unknown|\?+|-+|we'?ll (figure|decide|work) .*|to be (decided|determined))$/i;

function cells(line) {
  return line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
}

// Split on commas outside brace alternation, so a glob like `src/**/*.{ts,tsx}` survives
// instead of being torn into two patterns that match nothing.
function splitTriggers(text) {
  const out = [];
  let depth = 0;
  let cur = '';
  for (const ch of text) {
    if (ch === '{') depth += 1;
    else if (ch === '}') depth = Math.max(0, depth - 1);
    if (ch === ',' && depth === 0) { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  out.push(cur);
  return out.map((p) => p.trim().replace(/^`|`$/g, '')).filter(Boolean);
}

export async function run(context = {}) {
  const root = context.root ?? process.cwd();
  const path = 'security/DECISIONS.md';
  const text = readOr(join(root, path), null);
  if (text === null) {
    return result('missing_input', `${path} does not exist but a security-decisions stage is configured`, { fail: 1 });
  }

  const rows = text
    .split('\n')
    .filter((l) => l.trim().startsWith('|'))
    .map(cells)
    .filter((r) => r.length >= 4 && /^[A-Za-z]-?\d+$/.test(r[0].replace(/\s/g, '')));

  if (rows.length === 0) {
    return result('missing_input', `${path} declares no decision rows`, { fail: 1, not_run: 1 }, [], []);
  }

  const findings = [];
  const due = [];
  let open = 0;

  for (const [id, decision, statusRaw, trigger, answer = ''] of rows) {
    const status = statusRaw.toUpperCase();
    if (!KNOWN.has(status)) {
      findings.push({ severity: 'major', title: `${id} has status "${statusRaw}" — expected UNDECIDED, DECIDED, or DEFERRED`, evidence: `${path} · ${id}` });
      continue;
    }
    // A deferral without a date never comes back, which makes it an undecided row with
    // better manners.
    // The LATEST date in the answer, not the first. The message below asks the author to
    // "write when it was deferred and when it will be revisited", and an answer that does
    // exactly that — `deferred 2026-07-26, revisit 2099-01-01` — matched the first date and
    // was reported as already expired. A check that punishes its own instruction is a check
    // people route around.
    const allDates = [...answer.matchAll(/\d{4}-\d{2}-\d{2}/g)].map((m) => m[0]).sort();
    const reviewDate = allDates.length ? [allDates[allDates.length - 1]] : null;
    // A date-SHAPED string is not a date. `revisit 9999-99-99` matched the pattern, so the
    // row looked dated; `Date.parse` then returned NaN, and `NaN < Date.now()` is false, so
    // the expiry guard never fired and the deferral never came back. A deferral that cannot
    // expire is an undecided row with better manners, which is exactly what the date
    // requirement exists to prevent — so an unparseable date is treated as no date at all.
    const parsed = reviewDate ? Date.parse(`${reviewDate[0]}T00:00:00Z`) : NaN;
    const dated = Number.isFinite(parsed);
    if (status === 'DEFERRED' && answer.trim() && reviewDate && !dated) {
      findings.push({ severity: 'major', title: `${id} is deferred to "${reviewDate[0]}", which is not a real date — it can never come due`, evidence: `${path} · ${id}` });
      continue;
    }
    if (status === 'DEFERRED' && answer.trim() && dated && parsed < Date.now()) {
      findings.push({ severity: 'major', title: `${id} was deferred to ${reviewDate[0]}, which has passed — decide it or defer it again with a new date`, evidence: `${path} · ${id}` });
      continue;
    }
    if (status === 'DEFERRED' && answer.trim() && !reviewDate) {
      findings.push({ severity: 'major', title: `${id} is DEFERRED with no date — write when it was deferred and when it will be revisited`, evidence: `${path} · ${id}` });
      continue;
    }
    // A decision with no decision in it. `DECIDED` and an empty Answer passed silently,
    // which makes "resolve it" and "type the word DECIDED" the same amount of work.
    if (status === 'DECIDED' && !answer.trim()) {
      findings.push({ severity: 'major', title: `${id} is DECIDED with an empty answer — record what was decided, or set it back to UNDECIDED`, evidence: `${path} · ${id}` });
      continue;
    }
    // …and an answer that only restates the absence of one. `DECIDED` + `TBD` cleared the
    // non-empty check while recording nothing, which is the same bypass as an empty answer
    // with three more keystrokes.
    if (status === 'DECIDED' && NON_ANSWER.test(answer.trim())) {
      findings.push({ severity: 'major', title: `${id} is DECIDED with "${answer.trim()}", which records no decision — write the decision, or set it back to UNDECIDED`, evidence: `${path} · ${id}` });
      continue;
    }
    if (!(OPEN.has(status) || (status === 'DEFERRED' && !answer.trim()))) continue;
    open += 1;

    const patterns = splitTriggers(trigger);
    if (patterns.length === 0) {
      findings.push({ severity: 'major', title: `${id} is open with no trigger — it can never come due, which hides it rather than resolving it`, evidence: `${path} · ${id}` });
      continue;
    }
    for (const p of patterns) {
      if (p.toLowerCase() === 'always') { due.push({ id, decision, matched: 'always' }); break; }
      // `deliverable:N` has no resolver here — this plugin owns no running-state file — so
      // it is a trigger that can never fire. Silently treating it as a glob that matches
      // nothing meant a row carrying one was permanently, invisibly not-due.
      if (p.startsWith('deliverable:')) {
        findings.push({ severity: 'major', title: `${id} uses the trigger \`${p}\`, which nothing here can resolve — use a path glob or \`always\``, evidence: `${path} · ${id}` });
        break;
      }
      const hits = filesMatching(root, [p]);
      if (hits.length > 0) { due.push({ id, decision, matched: hits[0] }); break; }
    }
  }

  for (const d of due) {
    findings.push({ severity: 'critical', title: `${d.id} is due — ${d.decision}`, evidence: `${path} · matched ${d.matched}` });
  }

  const identities = rows.map((r) => r[0]);
  const summary = `${open} open, ${due.length} due`;
  if (findings.length === 0) {
    return result('pass', `${summary} — no trigger has fired`, { pass: rows.length, not_run: open }, [], identities);
  }
  return result(
    'fail',
    due.length ? `${summary} — ${due.map((d) => d.id).join(', ')}` : `${summary} — ${findings[0].title}`,
    { pass: rows.length - findings.length, fail: findings.length, not_run: Math.max(0, open - due.length) },
    findings,
    identities,
  );
}

async function main() {
  const r = await run({ root: process.cwd() });
  // `--json` is documented by the audit skill, which reads this programmatically. It went
  // unimplemented, so that skill's prescribed command emitted human-formatted text and
  // anything parsing it got nothing — a documented command that does not work is the same
  // defect class as an instruction pointing at an unavailable tool.
  if (process.argv.includes('--json')) {
    process.stdout.write(`${JSON.stringify(r, null, 2)}\n`);
    process.exit(r.verdict === 'pass' ? 0 : 1);
  }
  process.stdout.write(`\nSECURITY DECISIONS  ${r.verdict.toUpperCase()}\n\n  ${r.summary}\n\n`);
  for (const f of r.findings) process.stdout.write(`  [${f.severity}] ${f.title}\n      ${f.evidence}\n`);
  process.stdout.write('\n');
  process.exit(r.verdict === 'pass' ? 0 : 1);
}

// Resolve symlinks before comparing. A bare `file://${process.argv[1]}` comparison fails
// whenever the path traverses a symlink — on macOS `/var` → `/private/var`, so running this
// from a temp directory silently skipped main() and exited 0. A gate that no-ops quietly and
// reports success is the worst failure mode this file has.
if (process.argv[1] && pathToFileURL(realpathSync(process.argv[1])).href === import.meta.url) main();
