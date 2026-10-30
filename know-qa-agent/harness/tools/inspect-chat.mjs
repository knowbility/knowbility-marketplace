#!/usr/bin/env node
// Reads computed styles of live chat messages so we can compare against the
// design mockup. For each text snippet, reports the text element's font/size and
// walks ancestors to surface any "bubble/card" treatment (background, border,
// border-radius, max-width). Also reports whether a message row carries an
// avatar/initial label.
//
// Usage: node inspect-chat.mjs --texts "snippet a||snippet b" [--cdp <url>]

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
function loadPlaywright() {
  const candidates = [process.env.PW_PATH, 'playwright'].filter(Boolean);
  for (const c of candidates) { try { return require(c); } catch { /* next */ } }
  throw new Error('playwright not resolvable.');
}
function arg(flag, def) { const i = process.argv.indexOf(flag); return i !== -1 ? process.argv[i + 1] : def; }

const cdp = arg('--cdp', 'http://localhost:9222');
const texts = arg('--texts', '').split('||').map((s) => s.trim()).filter(Boolean);

const { chromium } = loadPlaywright();
const browser = await chromium.connectOverCDP(cdp);
const context = browser.contexts()[0];
const page = context.pages().find((p) => !p.isClosed());

const result = await page.evaluate((snippets) => {
  function deepest(snippet) {
    const all = Array.from(document.querySelectorAll('body *'));
    let best = null;
    for (const el of all) {
      if ((el.textContent || '').includes(snippet)) {
        if (!best || el.contains(best) === false && best.contains(el)) best = el;
        best = el; // last/deepest in DOM order that contains it
      }
    }
    // pick the smallest element containing the snippet
    const containing = all.filter((el) => (el.textContent || '').includes(snippet));
    containing.sort((a, b) => (a.textContent || '').length - (b.textContent || '').length);
    return containing[0] || best;
  }
  function box(el) {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      tag: el.tagName.toLowerCase(),
      cls: (el.getAttribute('class') || '').slice(0, 70),
      fontSize: cs.fontSize, lineHeight: cs.lineHeight, fontFamily: cs.fontFamily.split(',')[0],
      fontWeight: cs.fontWeight, color: cs.color, textAlign: cs.textAlign,
      bg: cs.backgroundColor, border: cs.borderTopWidth + ' ' + cs.borderStyle, borderRadius: cs.borderTopLeftRadius,
      maxWidth: cs.maxWidth, padding: cs.paddingTop + ' ' + cs.paddingLeft,
      marginTop: cs.marginTop, borderTopWidth: cs.borderTopWidth,
      width: Math.round(r.width),
    };
  }
  function hasBubble(cs) {
    return (cs.bg !== 'rgba(0, 0, 0, 0)' && cs.bg !== 'transparent') ||
           parseFloat(cs.border) > 0 || cs.maxWidth !== 'none';
  }
  const out = [];
  for (const snip of snippets) {
    const el = deepest(snip);
    if (!el) { out.push({ snippet: snip, found: false }); continue; }
    const textBox = box(el);
    // Walk ancestors, collect any that look like a bubble/card.
    const ancestors = [];
    let p = el.parentElement, depth = 0;
    while (p && depth < 8) {
      const b = box(p);
      if (hasBubble(b)) ancestors.push({ depth, ...b });
      p = p.parentElement; depth++;
    }
    out.push({ snippet: snip.slice(0, 40), found: true, text: textBox, bubbleAncestors: ancestors });
  }
  return out;
}, texts);

console.log(JSON.stringify(result, null, 2));
process.exit(0);
