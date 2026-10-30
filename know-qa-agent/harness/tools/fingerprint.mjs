#!/usr/bin/env node
// Captures a page's design fingerprint (shared shell + type scale + card/button
// tokens) so multiple pages can be diffed for consistency. Writes
// qa/runs/fp-<name>/fingerprint.json and prints a readable summary.
//
// Usage: node fingerprint.mjs --name <page> [--cdp <url>]

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const require = createRequire(import.meta.url);
function load() { for (const c of [process.env.PW_PATH, 'playwright'].filter(Boolean)) { try { return require(c); } catch {} } throw new Error('no playwright'); }
function arg(f, d) { const i = process.argv.indexOf(f); return i !== -1 ? process.argv[i + 1] : d; }

const cdp = arg('--cdp', 'http://localhost:9222');
const name = arg('--name', 'page');
const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, '..', 'runs', `fp-${name}`);
mkdirSync(outDir, { recursive: true });

const { chromium } = load();
const browser = await chromium.connectOverCDP(cdp);
const page = browser.contexts()[0].pages().find((p) => !p.isClosed());

const fp = await page.evaluate(() => {
  const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const round = (n) => Math.round(n);
  const pick = (el, props) => { const c = getComputedStyle(el); const o = {}; for (const p of props) o[p] = c[p]; return o; };

  // SIDEBAR / NAV
  let sidebar = null;
  const navEl = document.querySelector('aside') || document.querySelector('nav') || document.querySelector('[class*="sidebar" i]');
  if (navEl && vis(navEl)) {
    const c = getComputedStyle(navEl);
    const r = navEl.getBoundingClientRect();
    const links = Array.from(navEl.querySelectorAll('a')).filter(vis);
    const linkStyle = links[0] ? pick(links[0], ['fontSize', 'fontWeight', 'color', 'lineHeight']) : null;
    // active link: aria-current, or link whose bg differs from siblings
    const active = links.find((a) => a.getAttribute('aria-current')) ||
      links.find((a) => { const b = getComputedStyle(a).backgroundColor; return b !== 'rgba(0, 0, 0, 0)' && b !== 'transparent'; });
    sidebar = {
      width: round(r.width), bg: c.backgroundColor, borderRight: c.borderRightWidth + ' ' + c.borderRightStyle,
      navItem: linkStyle,
      activeItem: active ? pick(active, ['fontSize', 'fontWeight', 'color', 'backgroundColor', 'borderRadius']) : null,
      linkCount: links.length,
    };
  }

  // HEADINGS
  const h1 = document.querySelector('h1');
  const h2 = document.querySelector('h2');
  const headings = {
    h1: h1 && vis(h1) ? { text: (h1.textContent || '').trim().slice(0, 40), ...pick(h1, ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'color']) } : null,
    h2: h2 && vis(h2) ? { text: (h2.textContent || '').trim().slice(0, 40), ...pick(h2, ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'color']) } : null,
  };
  if (headings.h1) headings.h1.fontFamily = headings.h1.fontFamily.split(',')[0];
  if (headings.h2) headings.h2.fontFamily = headings.h2.fontFamily.split(',')[0];

  // CARDS: bordered, rounded, sizeable containers. Dedupe by signature.
  const sigs = {};
  for (const el of Array.from(document.querySelectorAll('div,article,section'))) {
    if (!vis(el)) continue;
    const c = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const radius = parseFloat(c.borderTopLeftRadius);
    const bw = parseFloat(c.borderTopWidth);
    if (radius >= 2 && bw >= 1 && r.width >= 200 && r.height >= 40) {
      const key = `r${c.borderTopLeftRadius}|b${c.borderTopWidth} ${c.borderTopStyle} ${c.borderTopColor}|bg${c.backgroundColor}|p${c.paddingTop}`;
      sigs[key] = sigs[key] || { borderRadius: c.borderTopLeftRadius, border: c.borderTopWidth + ' ' + c.borderTopStyle, borderColor: c.borderTopColor, bg: c.backgroundColor, padding: c.paddingTop + ' ' + c.paddingLeft, count: 0 };
      sigs[key].count++;
    }
  }
  const cards = Object.values(sigs).sort((a, b) => b.count - a.count).slice(0, 5);

  // BUTTONS: visible, dedupe filled vs outline.
  const btnSigs = {};
  for (const el of Array.from(document.querySelectorAll('button, a[role="button"], [role="button"]'))) {
    if (!vis(el)) continue;
    const c = getComputedStyle(el);
    const filled = c.backgroundColor !== 'rgba(0, 0, 0, 0)' && c.backgroundColor !== 'transparent';
    const key = `${filled ? 'filled' : 'ghost'}|bg${c.backgroundColor}|r${c.borderTopLeftRadius}|fs${c.fontSize}|fw${c.fontWeight}`;
    btnSigs[key] = btnSigs[key] || { kind: filled ? 'filled' : 'ghost', bg: c.backgroundColor, color: c.color, borderRadius: c.borderTopLeftRadius, padding: c.paddingTop + ' ' + c.paddingLeft, fontSize: c.fontSize, fontWeight: c.fontWeight, count: 0 };
    btnSigs[key].count++;
  }
  const buttons = Object.values(btnSigs).sort((a, b) => b.count - a.count).slice(0, 5);

  // BODY type baseline
  const bodyC = getComputedStyle(document.body);
  const body = { fontFamily: bodyC.fontFamily.split(',')[0], fontSize: bodyC.fontSize, lineHeight: bodyC.lineHeight, color: bodyC.color, bg: bodyC.backgroundColor };

  // Eyebrow / section labels: small uppercase tracked text
  let eyebrow = null;
  for (const el of Array.from(document.querySelectorAll('p,span,div,h2,h3')).slice(0, 4000)) {
    if (!vis(el) || el.children.length) continue;
    const c = getComputedStyle(el);
    if (c.textTransform === 'uppercase' && parseFloat(c.letterSpacing) > 0.3) {
      eyebrow = { ...pick(el, ['fontSize', 'fontWeight', 'letterSpacing', 'color']), text: (el.textContent || '').trim().slice(0, 24) };
      break;
    }
  }

  return { url: location.pathname, title: document.title, sidebar, headings, cards, buttons, body, eyebrow };
});

writeFileSync(resolve(outDir, 'fingerprint.json'), JSON.stringify(fp, null, 2));
await page.screenshot({ path: resolve(outDir, 'page.png'), fullPage: true }).catch(() => {});

console.log(`# Fingerprint: ${name}  (${fp.url})`);
console.log(`title: ${fp.title}`);
if (fp.sidebar) console.log(`sidebar: ${fp.sidebar.width}px | navItem ${fp.sidebar.navItem?.fontSize}/${fp.sidebar.navItem?.fontWeight} | borderRight ${fp.sidebar.borderRight}`);
if (fp.headings.h1) console.log(`h1: "${fp.headings.h1.text}" ${fp.headings.h1.fontFamily} ${fp.headings.h1.fontSize}/${fp.headings.h1.fontWeight} lh${fp.headings.h1.lineHeight}`);
if (fp.headings.h2) console.log(`h2: "${fp.headings.h2.text}" ${fp.headings.h2.fontFamily} ${fp.headings.h2.fontSize}/${fp.headings.h2.fontWeight}`);
console.log(`body: ${fp.body.fontFamily} ${fp.body.fontSize} lh${fp.body.lineHeight}`);
console.log(`cards (top): ${fp.cards.map((c) => `r${c.borderRadius}/${c.border}/${c.padding} x${c.count}`).join('  |  ') || 'none'}`);
console.log(`buttons (top): ${fp.buttons.map((b) => `${b.kind} r${b.borderRadius}/${b.fontSize}/${b.fontWeight} x${b.count}`).join('  |  ') || 'none'}`);
if (fp.eyebrow) console.log(`eyebrow: ${fp.eyebrow.fontSize}/${fp.eyebrow.fontWeight} ls${fp.eyebrow.letterSpacing}`);
console.log(`\nSaved → ${outDir}`);
process.exit(0);
