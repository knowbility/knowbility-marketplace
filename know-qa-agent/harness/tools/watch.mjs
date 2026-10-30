#!/usr/bin/env node
// Passive monitor. Attaches to the open window and records console output, page
// errors, failed requests, and API/XHR/fetch activity (with timing) WITHOUT
// touching the page, so a human can interact while it watches. Runs until killed.
// Events stream to qa/runs/<name>/events.log (and stdout).
//
// Usage: node watch.mjs [--name <prefix>] [--cdp <url>]

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { mkdirSync, appendFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const require = createRequire(import.meta.url);
function loadPlaywright() {
  const candidates = [process.env.PW_PATH, 'playwright'].filter(Boolean);
  for (const c of candidates) { try { return require(c); } catch { /* next */ } }
  throw new Error('playwright not resolvable. Run setup.sh first.');
}
function arg(flag, def) { const i = process.argv.indexOf(flag); return i !== -1 ? process.argv[i + 1] : def; }

const cdp = arg('--cdp', 'http://localhost:9222');
const name = arg('--name', 'watch');
const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, '..', 'runs', name);
mkdirSync(outDir, { recursive: true });
const logPath = resolve(outDir, 'events.log');

function ts() { return new Date().toISOString().slice(11, 23); }
function log(line) { const s = `[${ts()}] ${line}`; try { appendFileSync(logPath, s + '\n'); } catch {} console.log(s); }
function short(u) { return String(u).replace(/^https?:\/\/[^/]+/, ''); }

process.on('unhandledRejection', () => {});

const { chromium } = loadPlaywright();
const browser = await chromium.connectOverCDP(cdp);
const context = browser.contexts()[0];
if (!context) { console.error('No context at', cdp); process.exit(1); }

function attach(page) {
  page.on('console', (m) => {
    const t = m.type();
    if (t === 'error' || t === 'warning') log(`console.${t}: ${m.text()}`);
  });
  page.on('pageerror', (e) => log(`PAGEERROR: ${e.message}`));
  page.on('response', (r) => {
    const s = r.status();
    const rt = r.request().resourceType();
    if (s >= 400) { log(`HTTP ${s} ${r.request().method()} ${short(r.url())}`); return; }
    if (rt === 'xhr' || rt === 'fetch') {
      let dur = '';
      try { const t = r.request().timing(); if (t && t.responseEnd >= 0) dur = ` (${Math.round(t.responseEnd)}ms)`; } catch {}
      log(`${rt} ${s} ${r.request().method()} ${short(r.url())}${dur}`);
    }
  });
  page.on('requestfailed', (r) => log(`REQ-FAILED ${r.method()} ${short(r.url())} :: ${r.failure()?.errorText || ''}`));
  page.on('websocket', (ws) => {
    log(`WS-OPEN ${short(ws.url())}`);
    ws.on('socketerror', (e) => log(`WS-ERROR ${short(ws.url())} :: ${e}`));
    ws.on('close', () => log(`WS-CLOSE ${short(ws.url())}`));
  });
}

context.pages().forEach(attach);
context.on('page', attach);

log(`WATCHING ${context.pages().map((p) => p.url())[0] || '(no page)'} — interact freely; this monitor is passive.`);

// Stay alive until killed.
setInterval(() => {}, 1 << 30);
