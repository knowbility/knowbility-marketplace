#!/usr/bin/env node
// Production-readiness audit of the current page: form-field labeling, dead
// links, images missing alt, icon buttons without an accessible name, duplicate
// element IDs, the heading outline, and user-facing copy problems (leaked debug
// values/exceptions, raw HTTP errors, placeholder/dummy text, and -- as review
// flags only -- non-descriptive action labels and inconsistent label casing).
// Catches the class of issues a manual pass tends to miss. Read-only; does not
// interact with the page.
//
// Usage: node audit.mjs --name <page> [--cdp <url>]

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
const outDir = resolve(here, '..', 'runs', `audit-${name}`);
mkdirSync(outDir, { recursive: true });

const { chromium } = load();
const browser = await chromium.connectOverCDP(cdp);
const page = browser.contexts()[0].pages().find((p) => !p.isClosed());

const res = await page.evaluate(() => {
  const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const txt = (el) => (el.textContent || '').trim();

  function accName(el) {
    if (el.getAttribute('aria-label')) return el.getAttribute('aria-label');
    const lbl = el.getAttribute('aria-labelledby');
    if (lbl) { const t = document.getElementById(lbl); if (t) return txt(t); }
    if (el.id) { const l = document.querySelector(`label[for="${CSS.escape(el.id)}"]`); if (l) return txt(l); }
    if (el.closest('label')) return txt(el.closest('label'));
    if (el.getAttribute('title')) return el.getAttribute('title');
    if (el.getAttribute('placeholder')) return '(placeholder only) ' + el.getAttribute('placeholder');
    return '';
  }

  // Form controls without a proper label (placeholder-only counts as weak).
  const controls = Array.from(document.querySelectorAll('input, select, textarea')).filter(vis)
    .filter((el) => el.type !== 'hidden');
  const unlabeled = [];
  for (const el of controls) {
    const n = accName(el);
    if (!n || n.startsWith('(placeholder only)')) {
      unlabeled.push({ tag: el.tagName.toLowerCase(), type: el.type || '', name: el.getAttribute('name') || '', placeholder: el.getAttribute('placeholder') || '', accName: n });
    }
  }

  // Dead links: href missing, "#", empty, or javascript:void.
  const deadLinks = Array.from(document.querySelectorAll('a')).filter(vis)
    .filter((a) => { const h = a.getAttribute('href'); return !h || h === '#' || h.trim() === '' || h.startsWith('javascript:'); })
    .map((a) => ({ text: txt(a).slice(0, 40) || '(no text)', href: a.getAttribute('href') }))
    .slice(0, 20);

  // Images missing alt.
  const imgNoAlt = Array.from(document.querySelectorAll('img')).filter(vis)
    .filter((i) => !i.hasAttribute('alt'))
    .map((i) => ({ src: (i.getAttribute('src') || '').slice(0, 60) })).slice(0, 20);

  // Buttons/links with no accessible name (icon-only).
  const namelessButtons = Array.from(document.querySelectorAll('button, a[role="button"], [role="button"]')).filter(vis)
    .filter((b) => !txt(b) && !b.getAttribute('aria-label') && !b.getAttribute('title'))
    .map((b) => ({ tag: b.tagName.toLowerCase(), cls: (b.getAttribute('class') || '').slice(0, 40) })).slice(0, 20);

  // Duplicate IDs.
  const idCount = {};
  for (const el of document.querySelectorAll('[id]')) { const id = el.id; idCount[id] = (idCount[id] || 0) + 1; }
  const dupeIds = Object.entries(idCount).filter(([, c]) => c > 1).map(([id, c]) => ({ id, count: c }));

  // Heading outline.
  const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4')).filter(vis)
    .map((h) => `${h.tagName} ${txt(h).slice(0, 36)}`).slice(0, 30);

  // --- User-facing text quality (production-readiness copy scan) ---
  // Tier 1 (errorLeakage, unfinished) are defects: debug output or placeholder
  // copy that shipped to a real screen. Tier 2 (genericLabels, casingVariants)
  // are flags surfaced for a human to judge, never asserted as wrong.
  const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'CODE', 'PRE']);
  const locOf = (el) => el ? el.tagName.toLowerCase() + (el.id ? `#${el.id}` : (typeof el.className === 'string' && el.className.trim() ? `.${el.className.trim().split(/\s+/)[0]}` : '')) : '';
  const textNodes = [];
  {
    const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        if (!n.textContent || !n.textContent.trim()) return NodeFilter.FILTER_REJECT;
        const p = n.parentElement;
        if (!p || SKIP.has(p.tagName) || !vis(p)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    let n; while ((n = tw.nextNode())) textNodes.push(n);
  }

  // Tier 1: leaked debug values / exceptions / raw HTTP errors in rendered text.
  const leakRules = [
    { rule: 'js-value', test: (s) => /^(undefined|null|NaN)$/.test(s) || /\[object [A-Z]\w*\]/.test(s) },
    { rule: 'exception', test: (s) => /\b(TypeError|ReferenceError|SyntaxError|RangeError)\s*:/.test(s) || /\bUncaught\b/.test(s) || /Cannot read propert(?:y|ies)/.test(s) || /\bis not a function\b/.test(s) || /\.[jt]sx?:\d+/.test(s) },
    { rule: 'http-error', test: (s) => /\b(?:error|status)\b[\s:#]*(?:4\d\d|5\d\d)\b/i.test(s) || /^(?:4\d\d|5\d\d)$/.test(s) },
  ];
  // Tier 1: placeholder / dummy / unfinished copy.
  const unfRules = [
    { rule: 'lorem', test: (s) => /lorem ipsum|dolor sit amet/i.test(s) },
    { rule: 'todo-marker', test: (s) => /\b(?:TODO|FIXME|PLACEHOLDER)\b/.test(s) || /\[\s*(?:xxx|tbd|todo|placeholder)\s*\]/i.test(s) },
    { rule: 'dummy-data', test: (s) => /\b(?:test@test\.com|example@example\.com|foo@bar\.com|john doe|jane doe)\b/i.test(s) || /^(?:asdf|asdfgh|qwerty|test test|a{4,}|x{4,})$/i.test(s) },
  ];
  const errorLeakage = [], unfinished = [];
  const seenCopy = new Set();
  for (const node of textNodes) {
    const s = node.textContent.trim().replace(/\s+/g, ' ');
    if (s.length > 200) continue; // long prose is not where these leak
    for (const r of leakRules) {
      if (r.test(s)) { const k = 'L' + r.rule + s.slice(0, 60); if (!seenCopy.has(k)) { seenCopy.add(k); errorLeakage.push({ rule: r.rule, text: s.slice(0, 120), at: locOf(node.parentElement) }); } break; }
    }
    for (const r of unfRules) {
      if (r.test(s)) { const k = 'U' + r.rule + s.slice(0, 60); if (!seenCopy.has(k)) { seenCopy.add(k); unfinished.push({ rule: r.rule, text: s.slice(0, 120), at: locOf(node.parentElement) }); } break; }
    }
  }

  // Tier 2: action controls with non-descriptive labels, and casing drift.
  const GENERIC = new Set(['submit', 'submit form', 'ok', 'okay', 'click here', 'here', 'learn more', 'read more']);
  const actionEls = Array.from(document.querySelectorAll('button, a[href], [role="button"]')).filter(vis);
  const genericLabels = [];
  const casings = new Map();
  for (const el of actionEls) {
    const raw = txt(el).replace(/\s+/g, ' ').trim();
    if (!raw || raw.length > 40) continue;
    if (GENERIC.has(raw.toLowerCase())) genericLabels.push({ tag: el.tagName.toLowerCase(), label: raw.slice(0, 40), at: locOf(el) });
    const norm = raw.toLowerCase();
    if (!casings.has(norm)) casings.set(norm, new Set());
    casings.get(norm).add(raw);
  }
  const casingVariants = [];
  for (const [, set] of casings) { if (set.size > 1) casingVariants.push({ variants: [...set] }); }

  const copy = {
    errorLeakage: errorLeakage.slice(0, 40),
    unfinished: unfinished.slice(0, 40),
    genericLabels: genericLabels.slice(0, 40),
    casingVariants: casingVariants.slice(0, 40),
  };

  return {
    counts: { controls: controls.length, unlabeled: unlabeled.length, deadLinks: deadLinks.length, imgNoAlt: imgNoAlt.length, namelessButtons: namelessButtons.length, dupeIds: dupeIds.length, copyDefects: errorLeakage.length + unfinished.length, copyFlags: genericLabels.length + casingVariants.length },
    unlabeled, deadLinks, imgNoAlt, namelessButtons, dupeIds, headings, copy,
  };
});

writeFileSync(resolve(outDir, 'audit.json'), JSON.stringify(res, null, 2));

const L = [];
L.push(`# Production audit: ${name}`);
L.push(`controls=${res.counts.controls} unlabeled=${res.counts.unlabeled} deadLinks=${res.counts.deadLinks} imgNoAlt=${res.counts.imgNoAlt} namelessBtns=${res.counts.namelessButtons} dupeIds=${res.counts.dupeIds} copyDefects=${res.counts.copyDefects} copyFlags=${res.counts.copyFlags}`);
if (res.unlabeled.length) { L.push('', '## Form controls without a real label'); for (const u of res.unlabeled) L.push(`- <${u.tag} type=${u.type} name="${u.name}"> ${u.accName || 'NO NAME'}`); }
if (res.deadLinks.length) { L.push('', '## Dead links (href missing / # / empty)'); for (const d of res.deadLinks) L.push(`- "${d.text}" href=${JSON.stringify(d.href)}`); }
if (res.imgNoAlt.length) { L.push('', '## Images missing alt'); for (const i of res.imgNoAlt) L.push(`- ${i.src}`); }
if (res.namelessButtons.length) { L.push('', '## Icon buttons with no accessible name'); for (const b of res.namelessButtons) L.push(`- <${b.tag} class="${b.cls}">`); }
if (res.dupeIds.length) { L.push('', '## Duplicate element IDs'); for (const d of res.dupeIds) L.push(`- #${d.id} x${d.count}`); }
const c = res.copy;
if (c.errorLeakage.length) { L.push('', '## Error/debug text leaking into the UI (defect)'); for (const e of c.errorLeakage) L.push(`- [${e.rule}] "${e.text}"  (${e.at})`); }
if (c.unfinished.length) { L.push('', '## Unfinished / placeholder content (defect)'); for (const u of c.unfinished) L.push(`- [${u.rule}] "${u.text}"  (${u.at})`); }
if (c.genericLabels.length) { L.push('', '## Non-descriptive action labels (review)'); for (const g of c.genericLabels) L.push(`- <${g.tag}> "${g.label}"  (${g.at})`); }
if (c.casingVariants.length) { L.push('', '## Inconsistent label casing (review)'); for (const v of c.casingVariants) L.push(`- ${v.variants.map((x) => `"${x}"`).join(' / ')}`); }
L.push('', '## Heading outline', ...res.headings.map((h) => `- ${h}`));
writeFileSync(resolve(outDir, 'audit.md'), L.join('\n'));
console.log(L.join('\n'));
console.log(`\nSaved → ${outDir}`);
process.exit(0);
