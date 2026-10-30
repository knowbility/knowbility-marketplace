#!/usr/bin/env node
// Deterministic WCAG contrast pass. Computes exact contrast ratios for visible
// text over SOLID backgrounds (alpha-blended up the ancestor chain until opaque)
// and judges them against WCAG 2.x AA (4.5:1 normal text, 3:1 large text).
// Text whose effective background can't be resolved to a solid color (background
// images, gradients, or no opaque ancestor) is reported as NEEDS REVIEW, never
// guessed — that's the honest boundary of computed-style math.
//
// Usage:
//   node contrast.mjs --url <url> [--name <prefix>] [--headed]      # standalone launch
//   node contrast.mjs --cdp http://localhost:9222 [--name <prefix>] # attach to open Chrome
//   Optional: --storage <state.json> | --profile <dir>   (auth, standalone mode)

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';
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
const name = arg('--name', 'contrast');
const storage = arg('--storage', null);
const profile = arg('--profile', null);
const headed = has('--headed');
if (!url && !cdp) { console.error('Need --url <url> (standalone) or --cdp <endpoint> (attach).'); process.exit(1); }

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, '..', 'runs', `contrast-${name}`);
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

// All math runs in-page: WCAG relative luminance + ratio, alpha blending up the
// ancestor chain. Returns one record per unique (fg, bg, size) text style.
const result = await page.evaluate(() => {
  const parse = (c) => {
    const m = c.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
    return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] } : null;
  };
  const lum = ({ r, g, b }) => {
    const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
  const blend = (top, under) => ({
    r: top.r * top.a + under.r * (1 - top.a),
    g: top.g * top.a + under.g * (1 - top.a),
    b: top.b * top.a + under.b * (1 - top.a),
    a: 1,
  });

  // Resolve the effective solid background under an element, or null if a
  // background image/gradient intervenes or no opaque ancestor is found.
  const effectiveBg = (el) => {
    const layers = [];
    for (let node = el; node; node = node.parentElement) {
      const s = getComputedStyle(node);
      if (s.backgroundImage && s.backgroundImage !== 'none') return null; // image/gradient: not computable
      const bg = parse(s.backgroundColor);
      if (bg && bg.a > 0) {
        layers.push(bg);
        if (bg.a === 1) {
          let acc = layers.pop();
          while (layers.length) acc = blend(layers.pop(), acc);
          return acc;
        }
      }
    }
    // Document canvas defaults to white when nothing opaque was hit.
    let acc = { r: 255, g: 255, b: 255, a: 1 };
    while (layers.length) acc = blend(layers.pop(), acc);
    return acc;
  };

  const seen = new Map();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let t;
  while ((t = walker.nextNode())) {
    if (!t.textContent.trim()) continue;
    const el = t.parentElement;
    if (!el) continue;
    const s = getComputedStyle(el);
    if (s.visibility === 'hidden' || s.display === 'none' || +s.opacity === 0) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;

    const fgRaw = parse(s.color);
    if (!fgRaw) continue;
    const sizePx = parseFloat(s.fontSize);
    const weight = +s.fontWeight || 400;
    const large = sizePx >= 24 || (sizePx >= 18.66 && weight >= 700);
    const bg = effectiveBg(el);
    const fg = bg && fgRaw.a < 1 ? blend(fgRaw, bg) : fgRaw;

    const key = [s.color, bg ? `${bg.r},${bg.g},${bg.b}` : 'unresolved', large].join('|');
    if (seen.has(key)) { seen.get(key).count++; continue; }
    seen.set(key, {
      sample: t.textContent.trim().slice(0, 60),
      selector: el.tagName.toLowerCase() + (el.id ? `#${el.id}` : el.className && typeof el.className === 'string' ? `.${el.className.split(/\s+/)[0]}` : ''),
      color: s.color,
      background: bg ? `rgb(${Math.round(bg.r)}, ${Math.round(bg.g)}, ${Math.round(bg.b)})` : null,
      fontSize: s.fontSize,
      fontWeight: weight,
      large,
      ratio: bg ? Math.round(ratio(fg, bg) * 100) / 100 : null,
      required: large ? 3 : 4.5,
      count: 1,
    });
  }

  const records = [...seen.values()];
  return {
    url: location.href,
    title: document.title,
    failures: records.filter((r) => r.ratio !== null && r.ratio < r.required),
    passes: records.filter((r) => r.ratio !== null && r.ratio >= r.required),
    needsReview: records.filter((r) => r.ratio === null),
  };
});

writeFileSync(resolve(outDir, 'contrast.json'), JSON.stringify(result, null, 2));

const out = [];
out.push(`# Contrast pass: ${name}`);
out.push(`URL: ${result.url}   Title: ${result.title}`);
out.push(`WCAG AA failures: ${result.failures.length}   passes: ${result.passes.length} text styles   needs review (non-solid bg): ${result.needsReview.length}`);
if (result.failures.length) {
  out.push('', '## Failures (exact math — deterministic)');
  for (const f of result.failures) out.push(`- ${f.ratio}:1 (needs ${f.required}:1) ${f.selector} "${f.sample}" — ${f.color} on ${f.background}, ${f.fontSize}/${f.fontWeight}${f.large ? ' (large)' : ''}, ×${f.count}`);
}
if (result.needsReview.length) {
  out.push('', '## Needs review (background image/gradient — ratio not computable from styles)');
  for (const f of result.needsReview) out.push(`- ${f.selector} "${f.sample}" — ${f.color}, ${f.fontSize}/${f.fontWeight}, ×${f.count}`);
}
writeFileSync(resolve(outDir, 'contrast.md'), out.join('\n'));
console.log(out.join('\n'));
console.log(`\nArtifacts → ${outDir}`);

if (cdp) process.exit(0); // never close the user's window
await context.close().catch(() => {});
await browser?.close?.().catch(() => {});
