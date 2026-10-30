#!/usr/bin/env node
// Measures a real in-app navigation (soft client-side route change) on the
// live visible Chrome: click a nav link, time how long until the route commits
// and the network settles, and log every request + console message during the
// transition. Engineer-facing load-time evidence.
//
// Usage:
//   node nav-timing.mjs --href <substr> --expect "**/advisors**" [--name <prefix>]
//                       [--idle-timeout <ms>] [--settle <ms>] [--cdp <url>]

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const require = createRequire(import.meta.url);
function loadPlaywright() {
  const candidates = [
    process.env.PW_PATH, 'playwright',
  ].filter(Boolean);
  for (const c of candidates) { try { return require(c); } catch { /* next */ } }
  throw new Error('playwright not resolvable.');
}
function arg(flag, def) { const i = process.argv.indexOf(flag); return i !== -1 ? process.argv[i + 1] : def; }

const cdp = arg('--cdp', 'http://localhost:9222');
const fromUrl = arg('--from', null); // reset to this origin before measuring
const hrefSubstr = arg('--href', null);
if (!hrefSubstr) {
  console.error('Usage: node nav-timing.mjs --href <substr> [--expect "**/path**"] [--from <url>] [--name <prefix>] [--idle-timeout <ms>] [--settle <ms>] [--cdp <url>]');
  process.exit(1);
}
const expectGlob = arg('--expect', `**/${hrefSubstr}**`);
const name = arg('--name', 'nav-timing');
const idleTimeout = parseInt(arg('--idle-timeout', '15000'), 10);
const settle = parseInt(arg('--settle', '1500'), 10);

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, '..', 'runs', name);
mkdirSync(outDir, { recursive: true });

const { chromium } = loadPlaywright();
const browser = await chromium.connectOverCDP(cdp);
const context = browser.contexts()[0];
let page = context.pages().find((p) => !p.isClosed()) ?? (await context.newPage());
await page.bringToFront().catch(() => {});

if (fromUrl) {
  await page.goto(fromUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(500);
}

const startUrl = page.url();

// Enumerate sidebar/nav links so we report exactly what we clicked.
const links = await page.evaluate(() =>
  Array.from(document.querySelectorAll('a[href]')).map((a) => ({
    text: (a.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40),
    href: a.getAttribute('href'),
  })).filter((l) => l.href && !l.href.startsWith('#'))
);
const candidates = links.filter((l) => (l.href || '').includes(hrefSubstr));

if (candidates.length === 0) {
  console.log(`No link whose href contains "${hrefSubstr}". Available links:`);
  for (const l of links.slice(0, 40)) console.log(`  ${l.text.padEnd(28)} ${l.href}`);
  process.exit(2);
}
const target = candidates[0];

// Collect requests + console during the transition.
const reqs = new Map();
const consoleLines = [];
const pageErrors = [];
page.on('request', (r) => reqs.set(r, { url: r.url(), method: r.method(), type: r.resourceType(), start: r.timing?.() }));
page.on('console', (m) => { const l = m.location(); consoleLines.push({ type: m.type(), text: m.text(), url: l.url, line: l.lineNumber }); });
page.on('pageerror', (e) => pageErrors.push({ message: e.message }));

const finished = []; // resolved network timing per response
page.on('response', async (res) => {
  let timing = null; try { timing = res.request().timing(); } catch { /* */ }
  finished.push({
    url: res.url(), method: res.request().method(), status: res.status(),
    type: res.request().resourceType(), timing,
  });
});

// Mark a page-side start, clear resource buffer for a clean read.
await page.evaluate(() => { performance.clearResourceTimings(); window.__navT0 = performance.now(); });

const tClick = process.hrtime.bigint();
await page.locator(`a[href="${target.href}"]`).first().click({ timeout: 10000 }).catch(async () => {
  await page.getByText(target.text, { exact: false }).first().click({ timeout: 10000 });
});

let urlChangeMs = null, networkIdleMs = null;
try {
  await page.waitForURL(expectGlob, { timeout: idleTimeout });
  urlChangeMs = Number(process.hrtime.bigint() - tClick) / 1e6;
} catch { /* url never matched */ }

try {
  await page.waitForLoadState('networkidle', { timeout: idleTimeout });
  networkIdleMs = Number(process.hrtime.bigint() - tClick) / 1e6;
} catch { /* never idle (polling/analytics) */ }

await page.waitForTimeout(settle);

// Read page-side resource timings produced since the click.
const perf = await page.evaluate(() => {
  const t0 = window.__navT0 ?? 0;
  const entries = performance.getEntriesByType('resource')
    .filter((e) => e.startTime >= t0)
    .map((e) => ({
      name: e.name, initiatorType: e.initiatorType,
      startMs: +(e.startTime - t0).toFixed(1),
      durationMs: +e.duration.toFixed(1),
      transferKB: +((e.transferSize || 0) / 1024).toFixed(1),
    }))
    .sort((a, b) => b.durationMs - a.durationMs);
  return entries;
});

await page.screenshot({ path: resolve(outDir, 'viewport.png') }).catch(() => {});

const netIssues = finished.filter((f) => f.status >= 400 || f.status === 0);
const errs = consoleLines.filter((c) => c.type === 'error');
const warns = consoleLines.filter((c) => c.type === 'warning');

const out = [];
out.push(`# Navigation timing: ${name}`);
out.push(`From: ${startUrl}`);
out.push(`To:   ${page.url()}`);
out.push(`Clicked: "${target.text}" → ${target.href}`);
out.push('');
out.push('## Timings (from click)');
out.push(`- Route committed (URL → ${expectGlob}): ${urlChangeMs != null ? urlChangeMs.toFixed(0) + ' ms' : 'NOT reached within ' + idleTimeout + ' ms'}`);
out.push(`- Network idle (all requests settled): ${networkIdleMs != null ? networkIdleMs.toFixed(0) + ' ms' : 'NOT reached within ' + idleTimeout + ' ms (page keeps polling)'}`);
out.push(`- Requests fired during transition: ${perf.length}`);
out.push(`- Total transferred: ${perf.reduce((s, e) => s + e.transferKB, 0).toFixed(0)} KB`);
out.push('');
out.push('## Slowest requests during the transition (top 12)');
out.push('| ms (dur) | start ms | KB | type | url |');
out.push('|---:|---:|---:|---|---|');
for (const e of perf.slice(0, 12)) {
  const u = e.name.replace(new URL(startUrl).origin, '').slice(0, 80);
  out.push(`| ${e.durationMs} | ${e.startMs} | ${e.transferKB} | ${e.initiatorType} | ${u} |`);
}
out.push('');
if (netIssues.length) {
  out.push('## Network failures during transition (>=400)');
  for (const n of netIssues) out.push(`- [${n.status}] ${n.method} ${n.url}`);
  out.push('');
}
if (errs.length) {
  out.push('## Console errors during transition');
  for (const c of errs) out.push(`- ${c.text}${c.url ? `  (${c.url}:${c.line})` : ''}`);
  out.push('');
}
if (warns.length) {
  out.push('## Console warnings during transition');
  for (const c of warns) out.push(`- ${c.text}${c.url ? `  (${c.url}:${c.line})` : ''}`);
  out.push('');
}

writeFileSync(resolve(outDir, 'report.md'), out.join('\n'));
writeFileSync(resolve(outDir, 'summary.json'), JSON.stringify({
  startUrl, endUrl: page.url(), clicked: target, urlChangeMs, networkIdleMs, perf, netIssues, errs, warns,
}, null, 2));

console.log(out.join('\n'));
console.log(`\nArtifacts → ${outDir}`);
process.exit(0);
