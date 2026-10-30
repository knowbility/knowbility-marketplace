#!/usr/bin/env node
// Catches the transient loading UI shown DURING an in-app navigation by holding
// the route's RSC fetch open, so the loading.tsx fallback stays on screen long
// enough to screenshot and identify the exact component. Engineer evidence for
// "the loading animation makes navigation feel slower than it is."
//
// Usage:
//   node capture-loading.mjs --from <url> --href <substr> [--match <regex>]
//                            [--hold <ms>] [--name <prefix>] [--cdp <url>]

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
const fromUrl = arg('--from', null);
const hrefSubstr = arg('--href', null);
if (!fromUrl || !hrefSubstr) {
  console.error('Usage: node capture-loading.mjs --from <url> --href <substr> [--match <regex>] [--hold <ms>] [--name <prefix>] [--cdp <url>]');
  process.exit(1);
}
const matchRe = new RegExp(arg('--match', `/${hrefSubstr}\\?.*_rsc`));
const holdMs = parseInt(arg('--hold', '2000'), 10);
const name = arg('--name', `${hrefSubstr}-loading-state`);

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, '..', 'runs', name);
mkdirSync(outDir, { recursive: true });

const { chromium } = loadPlaywright();
const browser = await chromium.connectOverCDP(cdp);
const context = browser.contexts()[0];
let page = context.pages().find((p) => !p.isClosed()) ?? (await context.newPage());
await page.bringToFront().catch(() => {});

// Reset to the origin screen.
await page.goto(fromUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
await page.screenshot({ path: resolve(outDir, '0-before.png') });

// Hold the navigation's RSC fetch open so the loading fallback lingers.
let releaseRoute;
const released = new Promise((res) => { releaseRoute = res; });
let markHit;
const hit = new Promise((res) => { markHit = res; });
let held = false;
process.on('unhandledRejection', () => { /* tolerate route races */ });
await page.route(matchRe, async (route) => {
  if (held) { try { await route.continue(); } catch { /* already handled */ } return; }
  held = true;
  markHit();
  await released;
  try { await route.continue(); } catch { /* aborted/retried by Next */ }
});

const link = page.locator(`a[href*="${hrefSubstr}"]`).first();
const clickedText = (await link.textContent().catch(() => '') || '').trim().replace(/\s+/g, ' ');
await link.click({ timeout: 10000 }).catch(() => {});

// Wait for the held request to fire, then let the loading UI paint.
await Promise.race([hit, page.waitForTimeout(4000)]);
await page.waitForTimeout(350);

// Screenshot the loading state and identify any loader/skeleton/spinner.
await page.screenshot({ path: resolve(outDir, '1-loading.png') });
const loaders = await page.evaluate(() => {
  const sel = '[class*="load" i],[class*="spin" i],[class*="skeleton" i],[class*="shimmer" i],[aria-busy="true"],[role="status"],[class*="animate" i],svg[class*="animate" i]';
  const out = [];
  for (const el of Array.from(document.querySelectorAll(sel)).slice(0, 25)) {
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;
    out.push({
      tag: el.tagName.toLowerCase(),
      cls: (el.getAttribute('class') || '').slice(0, 120),
      role: el.getAttribute('role') || el.getAttribute('aria-busy') ? (el.getAttribute('role') || 'aria-busy') : '',
      animationName: cs.animationName,
      animationDuration: cs.animationDuration,
      rect: { w: Math.round(rect.width), h: Math.round(rect.height), full: rect.width >= innerWidth * 0.6 && rect.height >= innerHeight * 0.5 },
      html: el.outerHTML.replace(/\s+/g, ' ').slice(0, 200),
    });
  }
  return { count: out.length, items: out, bodyHasOverlay: !!document.querySelector('[class*="overlay" i],[class*="backdrop" i]') };
});

releaseRoute();
await page.unroute(matchRe).catch(() => {});
await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
await page.waitForTimeout(400);
await page.screenshot({ path: resolve(outDir, '2-loaded.png') });

const out = [];
out.push(`# Loading-state capture: ${name}`);
out.push(`From: ${fromUrl}`);
out.push(`Clicked: "${clickedText}" (href contains "${hrefSubstr}")`);
out.push(`Held the matching request (${matchRe}) open for the screenshot.`);
out.push('');
out.push(`## Loader elements detected during transition: ${loaders.count}`);
out.push(`Full-screen overlay present: ${loaders.bodyHasOverlay}`);
out.push('');
for (const it of loaders.items) {
  out.push(`- <${it.tag} class="${it.cls}"> ${it.rect.full ? '**(full-screen)**' : `(${it.rect.w}×${it.rect.h})`}`);
  out.push(`  animation: ${it.animationName} / ${it.animationDuration}`);
  out.push(`  html: ${it.html}`);
}
out.push('');
out.push('## Screenshots');
out.push('- `0-before.png` — origin screen before click');
out.push('- `1-loading.png` — the loading animation users see mid-navigation');
out.push('- `2-loaded.png` — destination fully rendered');
writeFileSync(resolve(outDir, 'report.md'), out.join('\n'));
writeFileSync(resolve(outDir, 'summary.json'), JSON.stringify(loaders, null, 2));

console.log(out.join('\n'));
console.log(`\nArtifacts → ${outDir}`);
process.exit(0);
