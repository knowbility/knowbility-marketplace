#!/usr/bin/env node
// One-time headed login. Opens a real Chrome window so you can sign in to the
// site you are testing (through whatever auth it uses). The script waits until
// you land on your target page, then saves your session to .auth/ so every
// later run reuses it. Run once per machine, or again when a session expires.
//
// Usage:
//   node login.mjs --url <url> [--timeout <seconds>]

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { environmentKeyForUrl, normalizeEnvironmentKey, targetReached } from './lib/auth-profile.mjs';

const require = createRequire(import.meta.url);
function loadPlaywright() {
  const candidates = [process.env.PW_PATH, 'playwright'].filter(Boolean);
  for (const c of candidates) { try { return require(c); } catch { /* next */ } }
  throw new Error('playwright not resolvable. Run setup.sh (npm install) first.');
}
function arg(flag, def) {
  const i = process.argv.indexOf(flag);
  return i !== -1 ? process.argv[i + 1] : def;
}
function args(flag) {
  return process.argv.flatMap((value, index) => value === flag ? [process.argv[index + 1]] : []).filter(Boolean);
}

const url = arg('--url', null);
if (!url) {
  console.error('Usage: node login.mjs --url <url of the page you want to test>');
  process.exit(1);
}
const timeoutS = parseInt(arg('--timeout', '300'), 10);
const target = new URL(url);
const targetPath = target.pathname.replace(/\/$/, '') || '/';
const environmentKey = arg('--env', null)
  ? normalizeEnvironmentKey(arg('--env', null))
  : environmentKeyForUrl(url);
const allowedRedirectOrigins = args('--allow-redirect-origin');

const here = dirname(fileURLToPath(import.meta.url));
const authDir = resolve(here, '.auth');
const environmentDir = resolve(authDir, environmentKey);
const profileDir = resolve(environmentDir, 'profile');
const statePath = resolve(environmentDir, 'state.json');
const legacyProfileDir = resolve(authDir, 'profile');
mkdirSync(profileDir, { recursive: true });

if (existsSync(legacyProfileDir)) {
  console.warn(`⚠️  Legacy shared auth profile found at ${legacyProfileDir}.`);
  console.warn('   It is not reused automatically. Sign in to this isolated environment profile,');
  console.warn('   then remove the legacy profile after confirming no other workflow needs it.');
}

const { chromium } = loadPlaywright();

const context = await chromium.launchPersistentContext(profileDir, {
  headless: false,
  channel: 'chrome',
  viewport: { width: 1440, height: 900 },
});
const page = context.pages()[0] ?? (await context.newPage());

console.log('\n→ A Chrome window is opening. Sign in fully until you can SEE your target page.');
console.log(`→ Waiting up to ${timeoutS}s for you to reach ${target.host}${targetPath} ...\n`);
console.log(`→ Auth environment: ${environmentKey}`);

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});

function isReached(u) {
  return targetReached(u.href, target.href, allowedRedirectOrigins);
}

let reached = false;
const intervalMs = 2000;
const maxTicks = Math.ceil((timeoutS * 1000) / intervalMs);
for (let tick = 0; tick < maxTicks; tick++) {
  await page.waitForTimeout(intervalMs);
  let u;
  try { u = new URL(page.url()); } catch { continue; }
  if (isReached(u)) {
    // Confirm it stays settled (redirect chains can bounce briefly).
    await page.waitForTimeout(3000);
    try { if (isReached(new URL(page.url()))) { reached = true; break; } } catch { /* keep polling */ }
  }
  if (tick % 5 === 0) console.log(`   ...still waiting (${page.url().slice(0, 80)})`);
}

if (reached) {
  await context.storageState({ path: statePath });
  console.log('\n✅ Session captured.');
  console.log(`   Persistent profile: ${profileDir}`);
  console.log(`   Storage state:      ${statePath}`);
  console.log('\nYou can now drive a visible window (open-browser.sh) or capture headless:');
  console.log(`   node capture.mjs --url "${url}" --profile ".auth/${environmentKey}/profile" --name check`);
} else {
  await context.storageState({ path: statePath }).catch(() => {});
  console.log('\n⚠️  Did not detect your target page within the timeout.');
  console.log('   Saved whatever session exists. If login finished late, the persistent');
  console.log(`   profile at ${profileDir} may still work with --profile.`);
}

await context.close();
