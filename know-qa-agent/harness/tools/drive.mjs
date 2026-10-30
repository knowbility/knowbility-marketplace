#!/usr/bin/env node
// Paired-QA driver. Attaches to the ALREADY-OPEN visible Chrome (launched via
// open-browser.sh with remote debugging) so Kelsey and Claude watch the same
// window. Performs one action (navigate / reload / click), captures console +
// network + screenshot around it, then DISCONNECTS without closing the window.
//
// Usage:
//   node drive.mjs [--url <url>] [--reload] [--click "<css>"] [--text "<visible text>"]
//                  [--name <prefix>] [--wait <ms>] [--cdp http://localhost:9222]
//                  [--allow-write]
//
// Safety tripwire: a click whose target text matches the destructive lexicon is
// refused unless the page origin is write-allowed in ../environments.json or
// --allow-write is passed (pass it only after a human confirmed that action).
//
// Leaves the browser open. Run again for the next step.

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { redactText, sanitizeEvidence } from './lib/evidence.mjs';
import { writeAllowedForConfig } from './lib/environment-policy.mjs';

const require = createRequire(import.meta.url);
function loadPlaywright() {
  const candidates = [
    process.env.PW_PATH,
    'playwright',
  ].filter(Boolean);
  for (const c of candidates) { try { return require(c); } catch { /* next */ } }
  throw new Error('playwright not resolvable. Set PW_PATH or `npm i -D playwright`.');
}
function arg(flag, def) { const i = process.argv.indexOf(flag); return i !== -1 ? process.argv[i + 1] : def; }
function has(flag) { return process.argv.includes(flag); }

const cdp = arg('--cdp', 'http://localhost:9222');
const url = arg('--url', null);
const click = arg('--click', null);
const text = arg('--text', null);
const reload = has('--reload');
const name = arg('--name', 'step');
const waitMs = parseInt(arg('--wait', '3000'), 10);
const allowWrite = has('--allow-write');

// Destructive-action lexicon. Catches the obvious mutating controls; it cannot
// know that an innocuous-looking button mutates — the agent's confirmation step
// is the backstop for what this misses.
const DESTRUCTIVE = /\b(delete|remove|deactivate|disable|unsubscribe|cancel|terminate|revoke|archive|pay|purchase|buy|checkout|transfer|submit|save|confirm|approve|publish|send)\b/i;

function writeAllowedFor(pageUrl) {
  // ../environments.json sits at .know-qa/environments.json when deployed to .know-qa/tools/.
  // Default-deny: missing file, unlisted origin, or write_allowed !== true all mean read-only.
  try {
    const envPath = resolve(here, '..', 'environments.json');
    if (!existsSync(envPath)) return false;
    const cfg = JSON.parse(readFileSync(envPath, 'utf8'));
    return writeAllowedForConfig(pageUrl, cfg);
  } catch { return false; }
}

async function guardClick(locator, fallbackLabel) {
  if (allowWrite) return;
  let label = fallbackLabel ?? '';
  try {
    const parts = [
      await locator.innerText({ timeout: 2000 }).catch(() => ''),
      await locator.getAttribute('aria-label').catch(() => ''),
      await locator.getAttribute('value').catch(() => ''),
    ].filter(Boolean);
    if (parts.length) label = parts.join(' ');
  } catch { /* unreadable target: judge the selector/text we were given */ }
  if (!DESTRUCTIVE.test(label)) return;
  if (writeAllowedFor(page.url())) return;
  console.error(`🛑 Refusing to click "${label.trim().slice(0, 80)}" on ${new URL(page.url()).origin}`);
  console.error('   The target matches the destructive-action lexicon and this origin is not');
  console.error('   write-allowed in .know-qa/environments.json. Confirm the action with the human,');
  console.error('   then re-run with --allow-write (or add the origin to environments.json).');
  process.exit(2);
}

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, '..', 'runs', name);
mkdirSync(outDir, { recursive: true });

const { chromium } = loadPlaywright();
const browser = await chromium.connectOverCDP(cdp);
const context = browser.contexts()[0];
if (!context) { console.error('No browser context found at', cdp); process.exit(1); }
let page = context.pages().find((p) => !p.isClosed()) ?? (await context.newPage());
await page.bringToFront().catch(() => {});

const consoleLines = [];
const pageErrors = [];
const netIssues = [];
page.on('console', (m) => { const l = m.location(); consoleLines.push({ type: m.type(), text: m.text(), url: l.url, line: l.lineNumber }); });
page.on('pageerror', (e) => pageErrors.push({ message: e.message }));
page.on('response', (r) => { if (r.status() >= 400) netIssues.push({ status: r.status(), url: r.url(), method: r.request().method() }); });
page.on('requestfailed', (r) => netIssues.push({ status: 'FAILED', url: r.url(), method: r.method(), error: r.failure()?.errorText }));

let action = 'observe';
try {
  if (url) { action = `navigate ${url}`; await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }); }
  if (reload) { action = 'reload'; await page.reload({ waitUntil: 'domcontentloaded', timeout: 45000 }); }
  if (click) { const loc = page.locator(click).first(); await guardClick(loc, click); action = `click css ${click}`; await loc.click({ timeout: 10000 }); }
  if (text) { const loc = page.getByText(text, { exact: false }).first(); await guardClick(loc, text); action = `click text "${text}"`; await loc.click({ timeout: 10000 }); }
} catch (e) {
  console.log(`⚠️  Action error during [${action}]: ${e.message}`);
}

await page.waitForTimeout(waitMs);

const result = {
  action,
  finalUrl: page.url(),
  title: await page.title().catch(() => null),
  counts: {
    errors: consoleLines.filter((c) => c.type === 'error').length,
    warnings: consoleLines.filter((c) => c.type === 'warning').length,
    pageErrors: pageErrors.length,
    netIssues: netIssues.length,
  },
};

await page.screenshot({ path: resolve(outDir, 'viewport.png') }).catch(() => {});
await page.screenshot({ path: resolve(outDir, 'fullpage.png'), fullPage: true }).catch(() => {});
const rawSummary = { ...result, consoleLines, pageErrors, netIssues };
writeFileSync(resolve(outDir, 'summary.raw.json'), JSON.stringify(rawSummary, null, 2));
writeFileSync(resolve(outDir, 'summary.json'), JSON.stringify(sanitizeEvidence(rawSummary), null, 2));

const out = [];
out.push(`# Step: ${name}`);
out.push(`Action: ${action}`);
out.push(`URL: ${result.finalUrl}   Title: ${result.title}`);
out.push(`Console errors: ${result.counts.errors}  warnings: ${result.counts.warnings}  pageErrors: ${result.counts.pageErrors}  netIssues: ${result.counts.netIssues}`);
if (pageErrors.length) { out.push('', '## Uncaught page errors'); for (const e of pageErrors) out.push(`- ${e.message}`); }
const errs = consoleLines.filter((c) => c.type === 'error');
if (errs.length) { out.push('', '## Console errors'); for (const c of errs) out.push(`- ${c.text}${c.url ? `  (${c.url}:${c.line})` : ''}`); }
if (netIssues.length) { out.push('', '## Network failures (>=400 or failed)'); for (const n of netIssues) out.push(`- [${n.status}] ${n.method} ${n.url}${n.error ? ' — ' + n.error : ''}`); }
const rawReport = out.join('\n');
const shareableReport = redactText(rawReport);
writeFileSync(resolve(outDir, 'report.raw.md'), rawReport);
writeFileSync(resolve(outDir, 'report.md'), shareableReport);
writeFileSync(resolve(outDir, 'EVIDENCE-POLICY.md'), [
  '# Evidence policy',
  '',
  '- `report.md` and `summary.json` are text-sanitized derivatives intended for review.',
  '- `report.raw.md`, `summary.raw.json`, `viewport.png`, and `fullpage.png` are restricted raw evidence.',
  '- Screenshots are never presumed safe to share. Review and crop/redact them before copying',
  '  anything into `.know-qa/assets/`, a durable report, a reporting sink, or a tracker ticket.',
  '- Text sanitization reduces common exposure but is not proof that arbitrary application',
  '  content contains no personal or confidential data. Review promoted evidence.',
].join('\n'));
console.log(shareableReport);
console.log(`\nArtifacts → ${outDir}`);

// Disconnect WITHOUT closing the user-visible browser.
process.exit(0);
