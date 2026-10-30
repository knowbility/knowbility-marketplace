#!/usr/bin/env node
// QA capture harness — autonomous (headless by default) full-page capture.
// Drives Playwright directly (no MCP). Captures console output, page errors,
// failed/4xx-5xx network responses, and screenshots — the raw material for
// concrete engineer-facing feedback.
//
// Usage:
//   node capture.mjs --url <url> [--name <prefix>] [--headed] [--storage <state.json>]
//                    [--profile <dir>] [--wait <ms>] [--width 1440] [--height 900]
//
// Auth: if the page is gated, first run `login.mjs` to save a storageState,
// then pass it with --storage (or reuse the persistent profile with --profile).
// Outputs land in runs/<prefix>/ one level above this script.

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const require = createRequire(import.meta.url);

// Resolve playwright from common locations (npx cache, global, local).
function loadPlaywright() {
  const candidates = [
    process.env.PW_PATH,
    'playwright',
  ].filter(Boolean);
  for (const c of candidates) {
    try { return require(c); } catch { /* try next */ }
  }
  throw new Error('playwright not resolvable. Set PW_PATH or `npm i -D playwright`.');
}

function arg(flag, def) {
  const i = process.argv.indexOf(flag);
  return i !== -1 ? process.argv[i + 1] : def;
}
function has(flag) { return process.argv.includes(flag); }

const url = arg('--url', null);
if (!url) {
  console.error('Usage: node capture.mjs --url <url> [--name <prefix>] [--headed] [--storage <state.json>] [--profile <dir>] [--wait <ms>] [--width 1440] [--height 900]');
  process.exit(1);
}
const name = arg('--name', 'capture');
const waitMs = parseInt(arg('--wait', '3000'), 10);
const width = parseInt(arg('--width', '1440'), 10);
const height = parseInt(arg('--height', '900'), 10);
const storage = arg('--storage', null);
const profile = arg('--profile', null); // persistent user-data-dir from login.mjs
const headed = has('--headed');

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, '..', 'runs', name);
mkdirSync(outDir, { recursive: true });

const { chromium } = loadPlaywright();

const consoleLines = [];
const pageErrors = [];
const netIssues = [];

let browser = null;
let context;
if (profile) {
  // Reuse the logged-in persistent profile established by login.mjs.
  context = await chromium.launchPersistentContext(resolve(profile), {
    headless: !headed,
    channel: 'chrome',
    viewport: { width, height },
  });
} else {
  // channel 'chrome': setup.sh skips the bundled-browser download, so drive the
  // installed Chrome here too (same browser every other script uses).
  browser = await chromium.launch({ headless: !headed, channel: 'chrome' });
  context = await browser.newContext({
    viewport: { width, height },
    ...(storage ? { storageState: storage } : {}),
  });
}
const page = await context.newPage();

page.on('console', (msg) => {
  const loc = msg.location();
  consoleLines.push({
    type: msg.type(),
    text: msg.text(),
    url: loc.url,
    line: loc.lineNumber,
  });
});
page.on('pageerror', (err) => {
  pageErrors.push({ message: err.message, stack: err.stack });
});
page.on('response', (res) => {
  const s = res.status();
  if (s >= 400) netIssues.push({ status: s, url: res.url(), method: res.request().method() });
});
page.on('requestfailed', (req) => {
  netIssues.push({ status: 'FAILED', url: req.url(), method: req.method(), error: req.failure()?.errorText });
});

const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(waitMs);

const result = {
  url,
  finalUrl: page.url(),
  httpStatus: response?.status() ?? null,
  title: await page.title().catch(() => null),
  viewport: { width, height },
  counts: {
    errors: consoleLines.filter((c) => c.type === 'error').length,
    warnings: consoleLines.filter((c) => c.type === 'warning').length,
    pageErrors: pageErrors.length,
    netIssues: netIssues.length,
  },
};

await page.screenshot({ path: resolve(outDir, 'fullpage.png'), fullPage: true });
await page.screenshot({ path: resolve(outDir, 'viewport.png') });

writeFileSync(resolve(outDir, 'summary.json'), JSON.stringify({ ...result, consoleLines, pageErrors, netIssues }, null, 2));

const fmt = [];
fmt.push(`# Capture: ${name}`);
fmt.push(`URL: ${url}`);
fmt.push(`Final URL: ${result.finalUrl}`);
fmt.push(`HTTP: ${result.httpStatus}   Title: ${result.title}`);
fmt.push(`Console errors: ${result.counts.errors}  warnings: ${result.counts.warnings}  pageErrors: ${result.counts.pageErrors}  netIssues: ${result.counts.netIssues}`);
fmt.push('');
if (pageErrors.length) {
  fmt.push('## Uncaught page errors');
  for (const e of pageErrors) fmt.push(`- ${e.message}`);
  fmt.push('');
}
if (netIssues.length) {
  fmt.push('## Network failures (>=400 or failed)');
  for (const n of netIssues) fmt.push(`- [${n.status}] ${n.method} ${n.url}${n.error ? ' — ' + n.error : ''}`);
  fmt.push('');
}
const errs = consoleLines.filter((c) => c.type === 'error');
const warns = consoleLines.filter((c) => c.type === 'warning');
if (errs.length) {
  fmt.push('## Console errors');
  for (const c of errs) fmt.push(`- ${c.text}${c.url ? `  (${c.url}:${c.line})` : ''}`);
  fmt.push('');
}
if (warns.length) {
  fmt.push('## Console warnings');
  for (const c of warns) fmt.push(`- ${c.text}${c.url ? `  (${c.url}:${c.line})` : ''}`);
  fmt.push('');
}
writeFileSync(resolve(outDir, 'report.md'), fmt.join('\n'));

console.log(fmt.join('\n'));
console.log(`\nArtifacts → ${outDir}`);

await context.close();
if (browser) await browser.close();
