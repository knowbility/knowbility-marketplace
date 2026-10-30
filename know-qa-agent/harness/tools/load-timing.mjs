#!/usr/bin/env node
// Cold-load timing for a route: hard-navigates directly to a URL (no prefetch
// benefit) and reads full Navigation Timing (TTFB, DOMContentLoaded, load) plus
// the slowest data requests. This is the worst-case a user feels on first visit
// or when Next prefetch hasn't landed — the case where the loading skeleton
// actually shows. Also logs console/network errors on the clean load.
//
// Usage:
//   node load-timing.mjs --url <url> [--name <prefix>] [--cdp <url>]

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
const url = arg('--url', null);
const name = arg('--name', 'load');
if (!url) {
  console.error('Usage: node load-timing.mjs --url <url> [--name <prefix>] [--cdp <url>]');
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, '..', 'runs', name);
mkdirSync(outDir, { recursive: true });

const { chromium } = loadPlaywright();
const browser = await chromium.connectOverCDP(cdp);
const context = browser.contexts()[0];
let page = context.pages().find((p) => !p.isClosed()) ?? (await context.newPage());
await page.bringToFront().catch(() => {});

const consoleErrs = [];
const netIssues = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrs.push(m.text()); });
page.on('response', (r) => { if (r.status() >= 400) netIssues.push({ status: r.status(), url: r.url() }); });
page.on('requestfailed', (r) => netIssues.push({ status: 'FAILED', url: r.url(), error: r.failure()?.errorText }));

const tStart = process.hrtime.bigint();
const resp = await page.goto(url, { waitUntil: 'load', timeout: 60000 });
const tLoaded = Number(process.hrtime.bigint() - tStart) / 1e6;
await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {});
const tIdle = Number(process.hrtime.bigint() - tStart) / 1e6;

const nav = await page.evaluate(() => {
  const n = performance.getEntriesByType('navigation')[0];
  if (!n) return null;
  return {
    ttfbMs: +(n.responseStart - n.requestStart).toFixed(0),
    domContentLoadedMs: +n.domContentLoadedEventEnd.toFixed(0),
    loadMs: +n.loadEventEnd.toFixed(0),
    transferKB: +((n.transferSize || 0) / 1024).toFixed(1),
  };
});
const res = await page.evaluate(() => {
  const list = performance.getEntriesByType('resource')
    .map((e) => ({ name: e.name, type: e.initiatorType, durMs: +e.duration.toFixed(0), kb: +((e.transferSize || 0) / 1024).toFixed(1) }))
    .sort((a, b) => b.durMs - a.durMs);
  return { count: list.length, totalKB: +list.reduce((s, e) => s + e.kb, 0).toFixed(0), slowest: list.slice(0, 6) };
});

await page.screenshot({ path: resolve(outDir, 'loaded.png') }).catch(() => {});

const out = {
  url, httpStatus: resp?.status() ?? null,
  wallLoadMs: +tLoaded.toFixed(0), wallIdleMs: +tIdle.toFixed(0),
  nav, resources: res, consoleErrs, netIssues,
};
writeFileSync(resolve(outDir, 'summary.json'), JSON.stringify(out, null, 2));

console.log(`URL: ${url}  [HTTP ${out.httpStatus}]`);
console.log(`  TTFB ${nav?.ttfbMs}ms | DOMContentLoaded ${nav?.domContentLoadedMs}ms | load ${nav?.loadMs}ms | wall-idle ${out.wallIdleMs}ms`);
console.log(`  resources ${res.count} / ${res.totalKB}KB | console-errors ${consoleErrs.length} | net-issues ${netIssues.length}`);
if (res.slowest.length) {
  const top = res.slowest[0];
  console.log(`  slowest: ${top.durMs}ms ${top.kb}KB ${top.name.replace(new URL(url).origin,'').slice(0,70)}`);
}
process.exit(0);
