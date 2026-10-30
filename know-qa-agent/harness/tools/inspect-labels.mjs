#!/usr/bin/env node
// Finds avatar/initial labels and tinted "bubble" message containers in the
// live chat, to confirm whether the user message carries a label and how the
// user bubble is styled. Reports small 1-3 char avatar elements and any
// right-aligned / tinted message bodies.
//
// Usage: node inspect-labels.mjs [--tint <regex over the bubble bg color>] [--page-bg <rgb()>] [--cdp <url>]
//
// --tint and --page-bg are project styling: --tint is a regex matched against a
// container's computed background-color to call it a "user bubble"; --page-bg is
// the page background to ignore as "not tinted". The defaults come from one
// worked example (a blue-tinted bubble on an
// off-white page) — pass your project's values when they differ.

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
function load() { for (const c of [process.env.PW_PATH, 'playwright'].filter(Boolean)) { try { return require(c); } catch {} } throw new Error('no playwright'); }
function arg(f, d) { const i = process.argv.indexOf(f); return i !== -1 ? process.argv[i + 1] : d; }

const tintSrc = arg('--tint', 'rgba?\\(\\s*0,\\s*66,\\s*198'); // worked-example default; pass --tint for your app
const pageBg = arg('--page-bg', 'rgb(250, 250, 247)');         // worked-example default; pass --page-bg for your app

const { chromium } = load();
const browser = await chromium.connectOverCDP(arg('--cdp', 'http://localhost:9222'));
const page = browser.contexts()[0].pages().find((p) => !p.isClosed());

const out = await page.evaluate(({ tintSrc, pageBg }) => {
  const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const inThread = (el) => el.closest('[class*="max-w-[760px]"]') || el.closest('main') || true;

  // 1. Avatar / initial labels: tiny elements with 1-3 char text.
  const avatars = [];
  for (const el of Array.from(document.querySelectorAll('body *'))) {
    const t = (el.textContent || '').trim();
    if (t.length >= 1 && t.length <= 3 && /^[A-Za-z]{1,3}$/.test(t) && vis(el)) {
      const r = el.getBoundingClientRect();
      if (r.width <= 48 && r.height <= 48 && el.children.length === 0) {
        avatars.push({ text: t, y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), cls: (el.getAttribute('class') || '').slice(0, 50) });
      }
    }
  }

  // 2. Tinted / right-aligned message bodies (candidate user bubbles).
  const bubbles = [];
  for (const el of Array.from(document.querySelectorAll('div,article,section,p'))) {
    if (!vis(el)) continue;
    const cs = getComputedStyle(el);
    const bg = cs.backgroundColor;
    const tinted = new RegExp(tintSrc).test(bg) || (bg.startsWith('rgb') && bg !== pageBg && bg !== 'rgba(0, 0, 0, 0)');
    const rounded = parseFloat(cs.borderTopLeftRadius) > 0;
    const constrained = cs.maxWidth !== 'none' && cs.maxWidth.includes('%');
    const txt = (el.textContent || '').trim().slice(0, 45);
    if ((tinted && rounded) && txt) {
      const r = el.getBoundingClientRect();
      bubbles.push({ txt, bg, radius: cs.borderTopLeftRadius, maxWidth: cs.maxWidth, padding: cs.paddingTop + ' ' + cs.paddingLeft, alignSelf: cs.alignSelf, y: Math.round(r.y), w: Math.round(r.width), cls: (el.getAttribute('class') || '').slice(0, 60) });
    }
  }
  return { avatars: avatars.slice(0, 15), bubbles: bubbles.slice(0, 10) };
}, { tintSrc, pageBg });

console.log(JSON.stringify(out, null, 2));
process.exit(0);
