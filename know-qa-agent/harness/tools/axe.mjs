#!/usr/bin/env node
// Deterministic WCAG rule pass via axe-core (pinned in package.json). Injects
// axe into the page and runs the default ruleset plus the opt-ins below. axe 4.12.1
// ships 105 rules and runs 89 of them by default (ARIA validity, labels, contrast,
// landmarks, and kin). Violations are deterministic findings; axe's "incomplete"
// results are surfaced as needs-review, never silently dropped.
//
// It also reports COVERAGE: which Level A/AA success criteria the rules that ran
// could have detected at all, and which no rule reaches. A criterion with no rule
// is untested, and a report that cannot say so invites "no violations" to be read
// as "no problems". See reference/wcag-mapping.md.
//
// Usage:
//   node axe.mjs --url <url> [--name <prefix>] [--headed]       # standalone launch
//   node axe.mjs --cdp http://localhost:9222 [--name <prefix>]  # attach to open Chrome
//   Optional: --storage <state.json> | --profile <dir>   (auth, standalone mode)

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const require = createRequire(import.meta.url);
function loadPlaywright() {
  const candidates = [process.env.PW_PATH, 'playwright'].filter(Boolean);
  for (const c of candidates) { try { return require(c); } catch { /* next */ } }
  throw new Error('playwright not resolvable. Set PW_PATH or `npm i -D playwright`.');
}
function arg(flag, def) { const i = process.argv.indexOf(flag); return i !== -1 ? process.argv[i + 1] : def; }
function has(flag) { return process.argv.includes(flag); }

const url = arg('--url', null);
const cdp = arg('--cdp', null);
const name = arg('--name', 'axe');
const storage = arg('--storage', null);
const profile = arg('--profile', null);
const headed = has('--headed');
if (!url && !cdp) { console.error('Need --url <url> (standalone) or --cdp <endpoint> (attach).'); process.exit(1); }

const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

// Rules axe does not run by default that we turn on, with the reason.
//
// Sixteen of the 105 are off: nine disabled outright (five deprecated, three
// AAA-only, and target-size) and seven marked experimental. target-size is the only
// one of the sixteen that is both at Level A/AA and not deprecated or experimental,
// and 2.5.8 is reachable by no other rule — so enabling it moves A/AA coverage from
// 19 criteria to 20, which is the whole of the available free win.
//
// The seven experimental rules stay off deliberately. Enabling them would reach two
// more criteria (1.3.4 Orientation, 2.5.3 Label in Name), and they are experimental
// because their false-positive rate is not production-grade. A findings tool that
// cries wolf gets switched off, which costs more coverage than it buys. They are
// reported in the coverage section instead, named against the criteria they would
// reach, so the choice is visible rather than invisible.
//
// One list, used twice on purpose: it is passed to axe.run AND unioned into the
// rule inventory the coverage section is computed from, so the two can never
// disagree about what actually ran. getRules() reports configured defaults, not
// per-run options, which is exactly the drift this avoids.
//
// Note on metadata: use getRules(), never axe._audit.rules. The latter reports the
// seven experimental rules as enabled:true when axe.run does not evaluate them —
// verified by running axe against a DOM and taking the union of violations, passes,
// incomplete and inapplicable, which is 89 rule ids, not 96.
const RULE_OPT_INS = {
  'target-size': 'WCAG 2.2 AA, SC 2.5.8 Target Size (Minimum) — not deprecated, not experimental',
};

// The one hand-maintained table in the harness; everything else is read from axe's
// own metadata at runtime. See the file's own _comment for why levels cannot be
// derived from rule tags.
const here = dirname(fileURLToPath(import.meta.url));

// The one hand-maintained table in the harness; everything else is read from axe's
// own metadata at runtime. See the file's own _comment for why levels cannot be
// derived from rule tags.
const criteriaTable = JSON.parse(readFileSync(resolve(here, 'wcag-aa-criteria.json'), 'utf8'));
const outDir = resolve(here, '..', 'runs', `axe-${name}`);
mkdirSync(outDir, { recursive: true });

const { chromium } = loadPlaywright();
let browser, context, page;
if (cdp) {
  browser = await chromium.connectOverCDP(cdp);
  context = browser.contexts()[0];
  if (!context) { console.error('No browser context found at', cdp); process.exit(1); }
  page = context.pages().find((p) => !p.isClosed()) ?? (await context.newPage());
  if (url) await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
} else if (profile) {
  context = await chromium.launchPersistentContext(profile, { channel: 'chrome', headless: !headed });
  page = context.pages()[0] ?? (await context.newPage());
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
} else {
  browser = await chromium.launch({ channel: 'chrome', headless: !headed });
  context = await browser.newContext(storage ? { storageState: storage } : {});
  page = await context.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
}
await page.waitForTimeout(1500);

await page.evaluate(axeSource);
const raw = await page.evaluate(async (optIns) => {
  const rules = Object.fromEntries(Object.keys(optIns).map((id) => [id, { enabled: true }]));
  const r = await window.axe.run(document, { resultTypes: ['violations', 'incomplete'], rules });
  // The rule inventory, so the report can distinguish "a rule ran and passed" from
  // "no rule exists". getRules() lists every rule with its configured enabled flag;
  // the opt-ins above are forced on for this run, so union them in.
  const inventory = window.axe.getRules().map((r2) => ({
    id: r2.ruleId,
    tags: r2.tags ?? [],
    ran: r2.enabled !== false || Object.prototype.hasOwnProperty.call(optIns, r2.ruleId),
  }));
  const slim = (items) => items.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    helpUrl: v.helpUrl,
    tags: v.tags ?? [],
    nodes: v.nodes.slice(0, 10).map((n) => ({ target: n.target.join(' '), summary: n.failureSummary?.slice(0, 300) ?? null })),
    nodeCount: v.nodes.length,
  }));
  return { url: location.href, title: document.title, axeVersion: window.axe.version, inventory, violations: slim(r.violations), incomplete: slim(r.incomplete) };
}, RULE_OPT_INS);

// --- WCAG mapping -----------------------------------------------------------
// axe-core tags its rules with the success criteria they test: a criterion tag
// is `wcag` + principle + guideline + criterion number (wcag143 -> 1.4.3,
// wcag2410 -> 2.4.10), and a conformance tag is `wcag` + version + level
// (wcag2aa, wcag21aa, wcag22aa). This reads that metadata rather than carrying
// a hand-maintained table, so it cannot drift from the pinned axe-core.
//
// What this is NOT: a conformance verdict. axe implements rules for only a
// subset of the success criteria, so a criterion with no failing rule here is
// UNTESTED, which is not the same as satisfied. See reference/wcag-mapping.md.
function wcagFromTags(tags = []) {
  const criteria = [];
  let level = null, version = null;
  for (const t of tags) {
    let m = /^wcag(2|21|22)(a|aa|aaa)$/.exec(t);
    if (m) {
      const v = m[1] === '2' ? '2.0' : m[1] === '21' ? '2.1' : '2.2';
      const l = m[2].toUpperCase();
      // keep the lowest (most inclusive) level and the earliest version seen
      if (level === null || l.length < level.length) level = l;
      if (version === null || v < version) version = v;
      continue;
    }
    m = /^wcag(\d)(\d)(\d+)$/.exec(t);
    if (m) criteria.push(`${m[1]}.${m[2]}.${m[3]}`);
  }
  return { criteria: [...new Set(criteria)].sort(), level, version };
}
function wcagLabel(v) {
  const w = wcagFromTags(v.tags);
  if (!w.criteria.length) return '';
  const lvl = w.level ? ` ${w.level}` : '';
  return `  [WCAG${lvl}: ${w.criteria.join(', ')}]`;
}

const order = { critical: 0, serious: 1, moderate: 2, minor: 3 };
raw.violations.sort((a, b) => (order[a.impact] ?? 9) - (order[b.impact] ?? 9));

const out = [];
out.push(`# axe pass: ${name}  (axe-core ${raw.axeVersion})`);
out.push(`URL: ${raw.url}   Title: ${raw.title}`);
out.push(`Violations: ${raw.violations.length}   Needs review (incomplete): ${raw.incomplete.length}`);
if (raw.violations.length) {
  out.push('', '## Violations (deterministic)');
  for (const v of raw.violations) {
    out.push(`- [${v.impact}] ${v.id}: ${v.help} — ${v.nodeCount} node(s)${wcagLabel(v)}  (${v.helpUrl})`);
    for (const n of v.nodes.slice(0, 3)) out.push(`    · ${n.target}`);
  }
}
if (raw.incomplete.length) {
  out.push('', '## Needs review (axe could not decide — judge these, don\'t drop them)');
  for (const v of raw.incomplete) out.push(`- ${v.id}: ${v.help} — ${v.nodeCount} node(s)${wcagLabel(v)}`);
}
// --- Coverage ---------------------------------------------------------------
// Three grades this script can establish on its own, and it must not collapse them:
//   FAILED    a rule ran and found something -- a defect, with evidence.
//   REVIEW    a rule ran and could not decide -- a person judges it.
//   CHECKED   a rule ran and found nothing -- the automated check is satisfied.
//             NOT "the criterion is met": a rule tests part of a criterion.
//   NO RULE   no rule that ran reaches this criterion at all -- untested. Silence
//             here means nothing was looked at, which is the opposite of a pass.
// A fourth grade exists and is not this script's to assign: the baseline tier,
// contrast.mjs and the ARIA-widget checks look at criteria axe has no rule for.
// The report skill merges those in; axe.mjs reports only what axe did.
const criteriaOf = (tags) => wcagFromTags(tags).criteria;
const hitCriteria = new Set();
for (const v of raw.violations) for (const c of criteriaOf(v.tags)) hitCriteria.add(c);
const reviewCriteria = new Set();
for (const v of raw.incomplete) for (const c of criteriaOf(v.tags)) reviewCriteria.add(c);

// Criteria any rule that actually ran could have detected.
const reachable = new Set();
const offLimits = new Map(); // criterion -> rule ids that would reach it if enabled
for (const r of raw.inventory ?? []) {
  for (const c of criteriaOf(r.tags)) {
    if (r.ran) reachable.add(c);
    else if (!offLimits.has(c)) offLimits.set(c, [r.id]);
    else offLimits.get(c).push(r.id);
  }
}

const table = criteriaTable.criteria ?? [];
const grade = (c) => hitCriteria.has(c.sc) ? 'failed'
  : reviewCriteria.has(c.sc) ? 'review'
  : reachable.has(c.sc) ? 'checked' : 'none';
const byGrade = { failed: [], review: [], checked: [], none: [] };
for (const c of table) byGrade[grade(c)].push(c);
const fmt = (list) => list.map((c) => `${c.sc} ${c.name} (${c.level})`).join('; ');

out.push('', `## WCAG ${criteriaTable.wcagVersion ?? '2.2'} Level A/AA coverage`);
out.push(`${table.length} live A/AA criteria. ` +
  `Rule failed: ${byGrade.failed.length}. Needs review: ${byGrade.review.length}. ` +
  `Rule ran, nothing found: ${byGrade.checked.length}. **No rule reaches it: ${byGrade.none.length}.**`);
const ran = (raw.inventory ?? []).filter((r) => r.ran).length;
out.push(`axe-core ${raw.axeVersion}: ${ran} of ${(raw.inventory ?? []).length} rules ran` +
  (Object.keys(RULE_OPT_INS).length ? ` (including opt-ins: ${Object.keys(RULE_OPT_INS).join(', ')})` : ''));
if (byGrade.failed.length) out.push('', `**Failing:** ${fmt(byGrade.failed)}`);
if (byGrade.review.length) out.push('', `**Needs review:** ${fmt(byGrade.review)}`);
if (byGrade.checked.length) out.push('', `**Rule ran, nothing found** (the automated check is satisfied; the criterion is not thereby met): ${fmt(byGrade.checked)}`);
if (byGrade.none.length) {
  out.push('', `**No rule reaches these ${byGrade.none.length} — UNTESTED, not satisfied:**`);
  for (const c of byGrade.none) {
    const off = offLimits.get(c.sc);
    out.push(`- ${c.sc} ${c.name} (${c.level})` +
      (off ? `  [a disabled rule would reach it: ${[...new Set(off)].join(', ')}]` : ''));
  }
}
out.push('', 'This is coverage, not conformance. A criterion with no rule was not looked at by');
out.push('this script; some are covered by the baseline tier or by a person, and the rest are');
out.push('open. Nothing here is a conformance evaluation or a substitute for testing with');
out.push('assistive technology by a person. See reference/wcag-mapping.md.');

writeFileSync(resolve(outDir, 'axe.json'), JSON.stringify(raw, null, 2));
writeFileSync(resolve(outDir, 'axe.md'), out.join('\n'));
console.log(out.join('\n'));
console.log(`\nArtifacts → ${outDir}`);

if (cdp) process.exit(0); // never close the user's window
await context.close().catch(() => {});
await browser?.close?.().catch(() => {});
