#!/usr/bin/env node
// Deterministic WCAG rule pass via axe-core (pinned in package.json). Injects
// axe into the page and runs the full default ruleset (~90 rules: ARIA validity,
// labels, contrast, landmarks, and kin). Violations are deterministic findings;
// axe's "incomplete" results are surfaced as needs-review, never silently dropped.
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

const here = dirname(fileURLToPath(import.meta.url));
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
const raw = await page.evaluate(async () => {
  const r = await window.axe.run(document, { resultTypes: ['violations', 'incomplete'] });
  const slim = (items) => items.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    helpUrl: v.helpUrl,
    tags: v.tags ?? [],
    nodes: v.nodes.slice(0, 10).map((n) => ({ target: n.target.join(' '), summary: n.failureSummary?.slice(0, 300) ?? null })),
    nodeCount: v.nodes.length,
  }));
  return { url: location.href, title: document.title, axeVersion: window.axe.version, violations: slim(r.violations), incomplete: slim(r.incomplete) };
});

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
// Criterion roll-up: which success criteria this page has a failing rule against.
// Deliberately not a per-criterion pass/fail table, because a criterion axe has no
// rule for is untested, and this script cannot tell untested from satisfied.
const hitCriteria = new Set();
for (const v of raw.violations) for (const c of wcagFromTags(v.tags).criteria) hitCriteria.add(c);
const reviewCriteria = new Set();
for (const v of raw.incomplete) for (const c of wcagFromTags(v.tags).criteria) reviewCriteria.add(c);
if (hitCriteria.size || reviewCriteria.size) {
  out.push('', '## WCAG success criteria touched');
  if (hitCriteria.size) out.push(`Failing: ${[...hitCriteria].sort().join(', ')}`);
  if (reviewCriteria.size) out.push(`Needs review: ${[...reviewCriteria].sort().join(', ')}`);
  out.push('', 'Criteria with no axe rule are UNTESTED, not satisfied. This is coverage, not conformance.');
}

writeFileSync(resolve(outDir, 'axe.json'), JSON.stringify(raw, null, 2));
writeFileSync(resolve(outDir, 'axe.md'), out.join('\n'));
console.log(out.join('\n'));
console.log(`\nArtifacts → ${outDir}`);

if (cdp) process.exit(0); // never close the user's window
await context.close().catch(() => {});
await browser?.close?.().catch(() => {});
