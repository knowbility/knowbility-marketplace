#!/usr/bin/env node
/**
 * The two-directional suite.
 *
 * The previous version of this file had 30 plants and every one asserted the same thing: the
 * checker goes red. That tested the tool only in the direction that could not kill it. A
 * security tool dies of **false positives** — three wrong findings and it gets switched off,
 * which is a total bypass nobody chose — so half of this file asserts the tool stays QUIET.
 *
 *   Part A  locate: finds what is there                    (true positives)
 *   Part B  locate: stays quiet on what is not             (FALSE POSITIVES — the new half)
 *   Part C  locate: the `unread` blind-spot signal fires
 *   Part D  secrets: both directions
 *   Part E  the gate: every path that must block, and every path that must not
 *
 * Every case builds a real repository in a temp directory and runs the **shipping** modules
 * against it. Nothing is mocked, and no state is hand-written that the product would not
 * itself produce — the sibling plugin once "proved" a defense that was inert because the
 * fixture contained hand-placed state, so the test measured the fixture rather than the code.
 *
 * Run from the marketplace root:
 *   node dev/security/tests/finder.test.mjs
 */

import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPTS = join(HERE, '..', '..', '..', 'know-security', 'scaffold', 'scripts');

const { locate } = await import(join(SCRIPTS, 'locate.mjs'));
const { scanSecrets } = await import(join(SCRIPTS, 'secrets.mjs'));
const { check } = await import(join(SCRIPTS, 'check.mjs'));
const { staleness } = await import(join(SCRIPTS, 'staleness.mjs'));
const { run: runDecisions } = await import(join(SCRIPTS, 'check-decisions.mjs'));

let passed = 0;
const failures = [];

function build(files, { git = false } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'sec-'));
  for (const [rel, body] of Object.entries(files)) {
    const path = join(root, rel);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, body);
  }
  if (git) {
    const q = { cwd: root, encoding: 'utf8' };
    spawnSync('git', ['init', '-q', '.'], q);
    spawnSync('git', ['config', 'user.email', 't@t'], q);
    spawnSync('git', ['config', 'user.name', 't'], q);
    spawnSync('git', ['add', '-A'], q);
    spawnSync('git', ['commit', '-qm', 'init'], q);

    // Substitute the real HEAD sha wherever a fixture wrote the `HEADSHA` placeholder. A
    // fixture cannot know the sha before the commit exists, and writing a fake one made
    // three cases fail for the wrong reason: the gate correctly reported the review commit
    // as unreachable, which is a *different* defect from the one those cases test. Binding
    // the fixture to the real history is what makes them test what they claim to.
    const sha = (spawnSync('git', ['rev-parse', '--short', 'HEAD'], q).stdout ?? '').trim();
    for (const rel of Object.keys(files)) {
      if (!files[rel].includes('HEADSHA')) continue;
      writeFileSync(join(root, rel), files[rel].replaceAll('HEADSHA', sha));
    }
  }
  return root;
}

function it(name, fn) {
  let root;
  try {
    const r = fn((files, opts) => (root = build(files, opts)));
    if (r === true) { passed += 1; return; }
    failures.push(`${name}\n      ${r}`);
  } catch (e) {
    failures.push(`${name}\n      THREW ${e.message}`);
  } finally {
    if (root) rmSync(root, { recursive: true, force: true });
  }
}

/** Same contract, for modules whose entry point is async (check-decisions exports `run`). */
async function itAsync(name, fn) {
  let root;
  try {
    const r = await fn((files, opts) => (root = build(files, opts)));
    if (r === true) { passed += 1; return; }
    failures.push(`${name}\n      ${r}`);
  } catch (e) {
    failures.push(`${name}\n      THREW ${e.message}`);
  } finally {
    if (root) rmSync(root, { recursive: true, force: true });
  }
}

const sinksOf = (out, cat) => out.sinks.filter((s) => s.category === cat);
const has = (out, cat) => sinksOf(out, cat).length > 0;

// ─── Part A · locate finds what is there ──────────────────────────────────────

console.log('\nA · locate: true positives');

it('A1 express route', (mk) => {
  const out = locate(mk({ 'src/routes/a.js': "const r = require('express').Router();\nr.get('/users', h);\n" }));
  return out.surfaces.some((s) => s.path === '/users' && s.method === 'GET') || `got ${JSON.stringify(out.surfaces)}`;
});

it('A2 fastify route-object, either property order', (mk) => {
  const out = locate(mk({ 'src/routes/b.ts': "app.route({ url: '/x', method: 'POST', handler: h });\n" }));
  return out.surfaces.some((s) => s.path === '/x' && s.method === 'POST') || `got ${JSON.stringify(out.surfaces)}`;
});

it('A3 flask emits EVERY method, not just the first', (mk) => {
  const out = locate(mk({ 'src/api/app.py': "@app.route('/thing', methods=['GET','POST'])\ndef thing(): pass\n" }));
  const m = out.surfaces.filter((s) => s.path === '/thing').map((s) => s.method).sort();
  return (m.includes('GET') && m.includes('POST')) || `expected GET and POST, got ${m.join(',')}`;
});

it('A4 sql-dynamic fires on an interpolated query', (mk) => {
  const out = locate(mk({ 'src/db/q.ts': 'db.prepare(`SELECT * FROM t WHERE ${col} = 1`);\n' }));
  return has(out, 'sql-dynamic') || 'no sql-dynamic sink';
});

it('A5 html-template fires on server-rendered HTML with an interpolation', (mk) => {
  const out = locate(mk({ 'src/web/p.ts': 'const page = `<div>${userName}</div>`;\n' }));
  return has(out, 'html-template') || 'no html-template sink';
});

it('A6 shell fires on a bare exec', (mk) => {
  const out = locate(mk({ 'src/vault/g.ts': "import { execFile } from 'node:child_process';\nexecFile('git', a);\n" }));
  return has(out, 'shell') || 'no shell sink';
});

it('A7 stores survive the CREATE/DROP/RENAME rebuild idiom', (mk) => {
  const out = locate(mk({
    'db/001.sql': 'CREATE TABLE users (id TEXT, email TEXT);\nCREATE TABLE assets (id TEXT);\n',
    'db/002.sql': 'CREATE TABLE users_new (id TEXT, email TEXT);\nDROP TABLE users;\nALTER TABLE users_new RENAME TO users;\n',
  }));
  const names = out.stores.map((s) => s.name).sort();
  return (names.includes('users') && names.includes('assets')) || `expected users and assets, got ${names.join(',')}`;
});

it('A8 schema-qualified table captured whole', (mk) => {
  const out = locate(mk({ 'db/001.sql': 'CREATE TABLE public.users (id TEXT);\n' }));
  return out.stores.some((s) => s.name === 'public.users') || `got ${out.stores.map((s) => s.name).join(',')}`;
});

it('A9 store columns are captured, for the PII lens to start from', (mk) => {
  const out = locate(mk({ 'db/001.sql': 'CREATE TABLE users (\n  id TEXT,\n  email TEXT,\n  date_of_birth TEXT\n);\n' }));
  const u = out.stores.find((s) => s.name === 'users');
  return (u && u.columns.includes('email') && u.columns.includes('date_of_birth')) || `got ${JSON.stringify(u?.columns)}`;
});

// ─── Part B · locate stays quiet ──────────────────────────────────────────────
// The half the old suite did not have. Each of these is a real false positive that either
// shipped or was caught late.

console.log('\nB · locate: FALSE positives (must stay quiet)');

it('B1 a Map/cache lookup is not a route', (mk) => {
  const out = locate(mk({ 'src/lib/c.ts': 'const v = cache.get(target);\nconst w = labels.get(rev);\nset.delete(x);\n' }));
  return out.surfaces.length === 0 || `invented ${JSON.stringify(out.surfaces.map((s) => s.id))}`;
});

it('B2 a commented-out route is documentation, not a surface', (mk) => {
  const out = locate(mk({ 'src/routes/c.ts': "// app.get('/legacy', h);\n/* app.post('/old', h); */\n" }));
  return out.surfaces.length === 0 || `invented ${JSON.stringify(out.surfaces.map((s) => s.id))}`;
});

it('B3 a regex .exec() is not a shell call', (mk) => {
  const out = locate(mk({ 'src/http/e.ts': 'const m = /^([A-Z_]+):/.exec(error.message)?.[1];\nconst n = /^g(\\d+)$/.exec(raw);\n' }));
  const s = sinksOf(out, 'shell');
  return s.length === 0 || `invented ${s.length} shell sink(s): ${s[0].excerpt}`;
});

it('B4 a redirect to a literal path is not an open redirect', (mk) => {
  const out = locate(mk({ 'src/web/a.ts': "reply.redirect('/auth/sign-in', 303);\nreply.redirect('/', 303);\n" }));
  const s = sinksOf(out, 'open-redirect');
  return s.length === 0 || `invented ${s.length}: ${s[0].excerpt}`;
});

it('B5 a fully parameterized query is not a dynamic query', (mk) => {
  const out = locate(mk({ 'src/db/q.ts': "db.prepare('SELECT * FROM t WHERE id = ?').get(id);\ndb.prepare('SELECT 1 FROM u WHERE a = ? AND b = ?').run(a, b);\n" }));
  const s = sinksOf(out, 'sql-dynamic');
  return s.length === 0 || `invented ${s.length}: ${s[0].excerpt}`;
});

it('B6 a regex literal does not blank the rest of its line', (mk) => {
  // `/https?:\/\//` used to be read as a comment, hiding a guard after it.
  const out = locate(mk({ 'src/routes/d.ts': "const u = /https?:\\/\\//; app.get('/after', h);\n" }));
  return out.surfaces.some((s) => s.path === '/after') || 'the route after a regex literal was lost';
});

it('B7 a route inside a benign path is labelled, not dropped', (mk) => {
  const out = locate(mk({ 'src/routes/__tests__/e.test.ts': "app.get('/fixture', h);\n" }));
  const s = out.surfaces.find((x) => x.path === '/fixture');
  return (s && s.benign === 'test') || `expected benign:test, got ${JSON.stringify(s)}`;
});

it('B8 no truncation is silent', (mk) => {
  const many = Array.from({ length: 200 }, (_, i) => `logger.info(x${i});`).join('\n');
  const out = locate(mk({ 'src/lib/l.ts': many }));
  const t = out.truncated.find((x) => x.category === 'log');
  return (t && t.total === 200 && t.shown < t.total) || `truncation not reported: ${JSON.stringify(out.truncated)}`;
});

// ─── Part C · the blind-spot signal ───────────────────────────────────────────

console.log('\nC · locate: unread fires where it must');

it('C1 an unreadable framework is named, not silently absent', (mk) => {
  const out = locate(mk({
    'requirements.txt': 'Django==5.2.1\n',
    'src/api/views.py': 'from django.http import JsonResponse\ndef v(r): return JsonResponse({})\n',
  }));
  return out.unread.some((u) => /django/i.test(u.reason)) || `unread: ${JSON.stringify(out.unread)}`;
});

it('C2 requirements.txt pins are parsed (anchored regex over raw text never matched)', (mk) => {
  const out = locate(mk({ 'requirements.txt': 'Django==5.2.1\nflask>=2.0\n' }));
  return out.frameworks.some((f) => f.name === 'django' && f.declared) || `frameworks: ${JSON.stringify(out.frameworks)}`;
});

it('C3 ONE express route does not silence an unread fastify app (per-framework scoping)', (mk) => {
  const out = locate(mk({
    'package.json': JSON.stringify({ dependencies: { express: '4', fastify: '4' } }),
    'src/routes/health.js': "const e = require('express')();\ne.get('/health', h);\n",
    // Fastify imported, registers via a helper the locator cannot read.
    'src/routes/main.ts': "import Fastify from 'fastify';\nconst app = Fastify();\nregisterAllRoutes(app);\n",
  }));
  return out.unread.some((u) => /fastify/i.test(u.reason)) || `a project-wide gate would miss this. unread: ${JSON.stringify(out.unread)}`;
});

it('C4 a computed route path is reported as work', (mk) => {
  const out = locate(mk({ 'src/routes/f.ts': "app.get('/known', h);\napp.get(dynamicPath, h);\n" }));
  return out.unread.some((u) => /computed path/.test(u.reason)) || `unread: ${JSON.stringify(out.unread)}`;
});

// ─── Part D · secrets, both directions ────────────────────────────────────────

console.log('\nD · secrets: both directions');

it('D1 a prefixed key in source is a candidate', (mk) => {
  const out = scanSecrets(mk({ 'src/config.ts': "const k = 'AKIAIOSFODNN7REALKEY';\n" }));
  return out.candidates.some((c) => /AWS/.test(c.pattern)) || `got ${JSON.stringify(out.candidates)}`;
});

it('D2 the matched VALUE is never carried into the output', (mk) => {
  const secret = 'AKIAIOSFODNN7REALKEY';
  const out = scanSecrets(mk({ 'src/config.ts': `const k = '${secret}';\n` }));
  return !JSON.stringify(out).includes(secret) || 'THE SECRET VALUE APPEARS IN THE OUTPUT';
});

it('D3 a credential in a test fixture is labelled benign', (mk) => {
  const out = scanSecrets(mk({ 'test/fixtures/keys.ts': "const password = 'hunter2hunter2';\n" }));
  const c = out.candidates.find((x) => /password/.test(x.pattern));
  if (!c) return 'the candidate was dropped entirely — it must be reported WITH a label, since a real key in a fixture directory is still real';
  return c.benign === 'test' || c.benign === 'fixture' || `expected benign test|fixture, got ${JSON.stringify(c.benign)}`;
});

it('D4 .env.example placeholders are not candidates', (mk) => {
  const out = scanSecrets(mk({ '.env.example': 'API_KEY=YOUR_KEY_HERE\nSECRET=changeme\nAWS=AKIAIOSFODNN7EXAMPLE\n' }));
  return out.candidates.length === 0 || `invented ${JSON.stringify(out.candidates.map((c) => c.pattern))}`;
});

it('D5 a bare hash is not a secret (entropy without assignment context)', (mk) => {
  const out = scanSecrets(mk({ 'src/h.ts': "const sha = 'da39a3ee5e6b4b0d3255bfef95601890afd80709';\nconst id = '550e8400-e29b-41d4-a716-446655440000';\n" }));
  return out.candidates.length === 0 || `invented ${JSON.stringify(out.candidates.map((c) => c.pattern))}`;
});

it('D6 an env-read assignment is not a literal credential', (mk) => {
  const out = scanSecrets(mk({ 'src/c.ts': "const apiKey = process.env.API_KEY;\nconst secret = 'process.env.X';\n" }));
  return out.candidates.length === 0 || `invented ${JSON.stringify(out.candidates.map((c) => c.pattern))}`;
});

it('D7 an absent external scanner degrades LOUDLY', (mk) => {
  const out = scanSecrets(mk({ 'src/a.ts': 'const x = 1;\n' }));
  if (out.scanner !== 'built-in') return `skipped: a real scanner is installed (${out.scanner})`;
  return out.notes.some((n) => /DOES NOT READ GIT HISTORY/.test(n)) || `notes: ${JSON.stringify(out.notes)}`;
});

// ─── Part E · the gate ────────────────────────────────────────────────────────

console.log('\nE · gate: blocks and does not block');

/** Most E cases assert WHAT COUNTS AS A PROBLEM, which is mode-independent; advisory is E26. */
const BLOCKING = { gate: { mode: 'blocking' } };

const REG = (body) => `# Findings Registry\n\n${body}\n## Archive\n`;
const FINDING = (over) => [
  '## S-20260726-01 — Export queries model without tenant scope',
  `- status: ${over.status ?? 'open'}`,
  '- check: AUTHZ-03 · disposition: vulnerability',
  `- severity: ${over.severity ?? 'High'} · confidence: High · reachability: confirmed`,
  '- location: src/auth/login.ts:12',
  // The evidence its confidence claims. Written without these at first, which the new contract
  // validation correctly rejected: the fixtures modelled the entry's SHAPE but not its evidence
  // requirements, and a suite whose fixtures cannot satisfy the contract is not testing it.
  '- attack_path: GET /reports/export → requireAuth (identity only) → Report.findAll()',
  '- concrete_input: any authenticated session; the response carries rows from other tenants',
  ...(over.accepted ? [`- accepted: ${over.accepted}`] : []),
  '',
].join('\n');

const DECISIONS_OK = ['| ID | Decision | Status | Trigger | Answer |', '|---|---|---|---|---|',
  '| S-1 | What is the isolation unit? | DECIDED | `never/**` | the workspace |'].join('\n') + '\n';

const REPO = (registry, reviewed = true) => ({
  'src/auth/login.ts': 'export const x = 1;\n',
  'security/DECISIONS.md': DECISIONS_OK,
  'security/FINDINGS.md': registry,
  ...(reviewed ? { 'security/.state/reviews.json': JSON.stringify({ reviews: [{ path: 'src/auth', commit: 'HEADSHA', date: '2026-07-26', complete: true, files_reviewed: ['src/auth/login.ts'], unresolved: 0 }] }) } : {}),
});

await itAsync('E1 a missing registry is missing_input, never a pass', async (mk) => {
  const out = await check(mk({ 'src/a.ts': 'x\n' }));
  return out.verdict === 'missing_input' || `got ${out.verdict}`;
});

await itAsync('E2 THE EMPTY-SET PASS: empty registry + nothing reviewed is missing_input', async (mk) => {
  const out = await check(mk({ 'src/auth/login.ts': 'x\n', 'security/FINDINGS.md': REG('') }, { git: true }));
  return out.verdict === 'missing_input' || `an unexamined repository reported ${out.verdict}`;
});

await itAsync('E3 an unresolved High blocks, FOR THE RIGHT REASON', async (mk) => {
  const root = mk(REPO(REG(FINDING({}))), { git: true });
  const out = await check(root, BLOCKING);
  if (out.verdict !== 'fail') return `got ${out.verdict}: ${out.summary}`;
  // Assert the cause, not just the verdict. A `fail` produced by something else — stale
  // recency, an unreachable commit — would let this case pass while the thing it tests is
  // broken, which is how a suite ends up measuring its own fixtures.
  return out.findings.some((f) => /S-20260726-01/.test(f.title))
    || `failed for the wrong reason: ${JSON.stringify(out.findings.map((f) => f.title))}`;
});

await itAsync('E4 a Medium does not block at the default High threshold', async (mk) => {
  const root = mk(REPO(REG(FINDING({ severity: 'Medium' }))), { git: true });
  const out = await check(root, BLOCKING);
  return out.verdict === 'pass' || `got ${out.verdict}: ${out.summary}`;
});

await itAsync('E5 LAUNDERING: an unresolved finding below ## Archive still blocks', async (mk) => {
  // The natural mistake — appending to the end of the file lands below the heading, where a
  // naive parser treats it as history. Found by this suite producing a false green.
  const root = mk(REPO(`# Findings Registry\n\n## Archive\n\n${FINDING({})}`), { git: true });
  const out = await check(root, BLOCKING);
  return (out.verdict === 'fail' && out.findings.some((f) => /Archive section/.test(f.title)))
    || `got ${out.verdict}: ${JSON.stringify(out.findings.map((f) => f.title))}`;
});

await itAsync('E6 a malformed severity blocks rather than defaulting', async (mk) => {
  const root = mk(REPO(REG(FINDING({ severity: 'prettybad' }))), { git: true });
  const out = await check(root, BLOCKING);
  return (out.verdict === 'fail' && out.findings.some((f) => /cannot be parsed/.test(f.title))) || `got ${out.verdict}`;
});

await itAsync('E7 an acceptance without owner/date/expiry is rejected, not honored', async (mk) => {
  const root = mk(REPO(REG(FINDING({ status: 'accepted', accepted: 'owner=kelsey' }))), { git: true });
  const out = await check(root, BLOCKING);
  return out.verdict === 'fail' || `an unaudited suppression was honored: ${out.verdict}`;
});

await itAsync('E8 an expired acceptance reopens', async (mk) => {
  const root = mk(REPO(REG(FINDING({ status: 'accepted', accepted: 'owner=k date=2026-01-01 expires=2026-02-01 commit=HEADSHA' }))), { git: true });
  const out = await check(root, BLOCKING);
  return (out.verdict === 'fail' && out.findings.some((f) => /expired/.test(f.title))) || `got ${out.verdict}`;
});

await itAsync('E9 a valid unexpired acceptance parks, and passes', async (mk) => {
  const root = mk(REPO(REG(FINDING({ status: 'accepted', accepted: 'owner=k date=2026-07-26 expires=2099-01-01 commit=HEADSHA' }))), { git: true });
  const out = await check(root, BLOCKING);
  return out.verdict === 'pass' || `got ${out.verdict}: ${out.summary}`;
});

await itAsync('E10 an acceptance bound to an unreachable commit does not hold', async (mk) => {
  const root = mk(REPO(REG(FINDING({ status: 'accepted', accepted: 'owner=k date=2026-07-26 expires=2099-01-01 commit=deadbee' }))), { git: true });
  const out = await check(root, BLOCKING);
  return (out.verdict === 'fail' && out.findings.some((f) => /not in this history/.test(f.title))) || `got ${out.verdict}`;
});

await itAsync('E11 finding ids are returned as identities, so deleting a red row is detectable', async (mk) => {
  const root = mk(REPO(REG(FINDING({}))), { git: true });
  const out = await check(root, BLOCKING);
  return out.identities?.includes('S-20260726-01') || `identities: ${JSON.stringify(out.identities)}`;
});

await itAsync('E12 a resolved finding in Archive is fine', async (mk) => {
  const root = mk(REPO(`# Findings Registry\n\n## Archive\n\n${FINDING({ status: 'resolved' })}`), { git: true });
  const out = await check(root, BLOCKING);
  return out.verdict === 'pass' || `got ${out.verdict}: ${out.summary}`;
});

await itAsync('E13 a typo in block_at_severity fails closed AND says why', async (mk) => {
  // It used to leave the threshold at -1, so every severity compared `>= -1` and even a Low
  // finding blocked — fail-closed, but for a reason nobody could read from the output.
  const root = mk({ ...REPO(REG(FINDING({ severity: 'Low' }))), 'security/config.json': '{"gate":{"block_at_severity":"Hihg"}}' }, { git: true });
  const out = await check(root, { gate: { mode: 'blocking', block_at_severity: 'Hihg' } });
  return (out.verdict === 'fail' && out.findings.some((f) => /not a severity/.test(f.title)))
    || `got ${out.verdict}: ${JSON.stringify(out.findings.map((f) => f.title))}`;
});

/** Write a file AFTER the initial commit and stage it, so it is genuinely in the index. */
function stage(root, rel, body) {
  const p = join(root, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, body);
  spawnSync('git', ['add', rel], { cwd: root, encoding: 'utf8' });
}

await itAsync('E14 BYPASS: a credential staged inside a .md still blocks', async (mk) => {
  // `docs` is a benign label earned by a file extension, not by the value being synthetic.
  // Suppressing the block on it made "paste it into notes.md" a one-step bypass, and
  // documentation is exactly where people paste real credentials.
  const root = mk(REPO(REG('')), { git: true });
  stage(root, 'RUNBOOK.md', 'Use AKIAIOSFODNN7REALKEY for the prod bucket.\n');
  const out = await check(root, BLOCKING);
  return (out.verdict === 'fail' && out.findings.some((f) => /credential of a known format staged/.test(f.title)))
    || `got ${out.verdict}: ${JSON.stringify(out.findings.map((f) => f.title))}`;
});

await itAsync('E15 …and a real prefixed key under tests/ blocks too — path never suppresses', async (mk) => {
  // This case previously asserted the opposite, encoding the defect: suppressing by path
  // discarded a genuine credential unread because of where it sat. A prefixed key does not
  // occur by accident, and one committed into a fixture directory still has to be rotated.
  const root = mk(REPO(REG('')), { git: true });
  stage(root, 'test/fixtures/k.ts', 'const k = "AKIAIOSFODNN7REALKEY";');
  const out = await check(root, BLOCKING);
  return (out.verdict === 'fail' && out.findings.some((f) => /known format staged/.test(f.title)))
    || `a real key under tests/ was suppressed: ${out.summary}`;
});

await itAsync('E15b …but a credential-SHAPED ASSIGNMENT never blocks — a script cannot decide it', async (mk) => {
  // `const password = "correct-horse-battery-staple"` in ordinary source is a fixture, a
  // sample, or a live credential, and only reading the origin and sink separates them. The
  // gate blocking it was the gate judging, which the operating model forbids.
  const root = mk(REPO(REG('')), { git: true });
  stage(root, 'src/app.ts', 'const password = "correct-horse-battery";');
  const out = await check(root, BLOCKING);
  return out.verdict === 'pass' || `blocked on an undecidable candidate: ${JSON.stringify(out.findings.map((f) => f.title))}`;
});


await itAsync('E16 the "files directly in this root" unit counts only those files', async (mk) => {
  // `src/*` had its `/*` stripped and the bare directory passed to git, which counted the
  // ENTIRE subtree — so a root-level entry point's recency tracked activity in unrelated
  // subdirectories. `:(glob)` makes `*` stop at a separator.
  const root = mk({ 'src/top.ts': 'a\n', 'src/auth/deep.ts': 'b\n' }, { git: true });
  const q = { cwd: root, encoding: 'utf8' };
  for (const n of [1, 2]) {
    writeFileSync(join(root, 'src/auth/deep.ts'), `b${n}\n`);
    spawnSync('git', ['add', '-A'], q);
    spawnSync('git', ['commit', '-qm', `c${n}`], q);
  }
  const out = staleness(root);
  const rootUnit = out.units.find((u) => u.unit === 'src/*');
  const authUnit = out.units.find((u) => u.unit === 'src/auth');
  if (!rootUnit) return `no src/* unit: ${JSON.stringify(out.units.map((u) => u.unit))}`;
  return (rootUnit.commits_since === 1 && authUnit.commits_since === 3)
    || `src/* should see 1 commit and src/auth 3; got ${rootUnit.commits_since} and ${authUnit.commits_since}`;
});

await itAsync('E17 the confidence weld is MECHANICAL: High without evidence is rejected', async (mk) => {
  // Codex ran parseFindings() on a two-field entry and got malformed: []. The contract said
  // High requires the path read end to end and a named input; nothing checked. A requirement
  // that lives only in prose is the exact failure this codebase has shipped before.
  const bare = ['## S-20260726-09 — unsupported claim', '- status: open', '- severity: High',
    '- confidence: High', '- location: src/a.ts:1', ''].join('\n');
  const root = mk(REPO(REG(bare)), { git: true });
  const out = await check(root, BLOCKING);
  return (out.verdict === 'fail' && out.findings.some((f) => /without attack_path and concrete_input/.test(f.detail ?? '')))
    || `got ${out.verdict}: ${JSON.stringify(out.findings.map((f) => f.title + ' :: ' + (f.detail ?? '')))}`;
});

await itAsync('E18 …and a Low-confidence finding needs no such evidence', async (mk) => {
  const root = mk(REPO(REG(FINDING({ confidence: 'Low', severity: 'Low' }))), { git: true });
  const out = await check(root, BLOCKING);
  return out.verdict === 'pass' || `over-rejected: ${JSON.stringify(out.findings.map((f) => f.title))}`;
});

await itAsync('E19 CRITICAL: a review with no completion marker cannot reach a green run', async (mk) => {
  // The single shortest path from an agent exhausting its context to a green build. Its only
  // completion condition was that the agent 'returned a result' — and a truncated run that
  // says 'none found' over half a subsystem is a result. Recorded, reported current, PASS.
  const files = REPO(REG(''));
  files['security/.state/reviews.json'] = JSON.stringify({ reviews: [{ path: 'src/auth', commit: 'HEADSHA', date: '2026-07-26' }] });
  const out = await check(mk(files, { git: true }), BLOCKING);
  // Either signal is correct: the partial unit does not count as reviewed, so with an empty
  // registry the unexamined-repository guard fires first. What must never happen is pass.
  const named = out.findings.some((f) => /without a completion marker/.test(f.title))
    || /has been reviewed/.test(out.summary);
  return (out.verdict !== 'pass' && named)
    || `a partial review produced ${out.verdict}: ${out.summary}`;
});

await itAsync('E20 …and the same record WITH complete:true is a real review', async (mk) => {
  const out = await check(mk(REPO(REG('')), { git: true }), BLOCKING);
  return out.verdict === 'pass' || `a completed review was rejected: ${out.summary}`;
});

await itAsync('E21 SEAM: a partial review must not block harder than a never-reviewed one', async (mk) => {
  // These blocked unconditionally while never_reviewed was waved through by default, so a
  // unit nobody opened passed and a unit someone partly reviewed failed. That punishes
  // attempting a review. Both mean 'not reviewed' and belong on the same switch.
  const files = REPO(REG(''));
  files['security/.state/reviews.json'] = JSON.stringify({ reviews: [
    { path: 'src/auth', commit: 'HEADSHA', date: '2026-07-26', complete: true, files_reviewed: ['src/auth/login.ts'] },
    { path: 'src/other', commit: 'HEADSHA', date: '2026-07-26' } ] });
  files['src/other/x.ts'] = 'export const x = 1;';
  const out = await check(mk(files, { git: true }), BLOCKING);
  const partial = out.findings.find((f) => /without a completion marker/.test(f.title));
  if (!partial) return 'the partial unit was not reported at all';
  return partial.severity === 'info' || `partial reported at ${partial.severity} while never_reviewed defaults to non-blocking`;
});

await itAsync('E22 a completion that names no files read is self-contradictory', async (mk) => {
  const files = REPO(REG(''));
  files['security/.state/reviews.json'] = JSON.stringify({ reviews: [
    { path: 'src/auth', commit: 'HEADSHA', date: '2026-07-26', complete: true, files_reviewed: [] } ] });
  const out = await check(mk(files, { git: true }), BLOCKING);
  return out.verdict !== 'pass' || 'an empty completion claim counted as a review';
});

await itAsync('E23 SEAM: a due decision is visible even on an unexamined repository', async (mk) => {
  // The decisions call was first placed AFTER the empty-registry early return, so it was
  // invisible on exactly the project that needs it most — a brand-new repository, where an
  // isolation or deletion decision is cheapest to make and most expensive to defer.
  const files = { 'src/a/f.ts': 'export const x = 1;', 'db/001.sql': 'CREATE TABLE t (id TEXT);',
    'security/FINDINGS.md': REG(''),
    'security/DECISIONS.md': ['| ID | Decision | Status | Trigger | Answer |', '|---|---|---|---|---|',
      '| S-1 | What is the isolation unit? | UNDECIDED | `db/**/*.sql` | |'].join('\n') };
  const out = await check(mk(files, { git: true }), BLOCKING);
  return out.findings.some((f) => /S-1 is due/.test(f.title))
    || `the due decision was hidden: ${JSON.stringify(out.findings.map((f) => f.title))}`;
});

await itAsync('E24 a vendor TEST-MODE key is reported but never blocks', async (mk) => {
  // sk_test_ is Stripe sandbox: real format, synthetic value, routinely committed on purpose.
  // The signal rule blocked every prefixed format regardless of path, so fixing the false
  // negative under tests/ created this false positive one step over.
  const root = mk(REPO(REG('')), { git: true });
  stage(root, 'test/fixtures/stripe.ts', 'const k = "sk_test_1234567890ABCDEF";');
  const out = await check(root, BLOCKING);
  return out.verdict === 'pass' || `blocked on a vendor test-mode key: ${JSON.stringify(out.findings.map((f) => f.title))}`;
});

await itAsync('E25 …while the LIVE-mode sibling still blocks', async (mk) => {
  const root = mk(REPO(REG('')), { git: true });
  stage(root, 'test/fixtures/stripe.ts', 'const k = "sk_live_1234567890ABCDEF";');
  const out = await check(root, BLOCKING);
  return (out.verdict === 'fail' && out.findings.some((f) => /known format staged/.test(f.title)))
    || `a live key under tests/ was let through: ${out.summary}`;
});

await itAsync('E26 ADVISORY by default: a High finding reports without failing the build', async (mk) => {
  const out = await check(mk(REPO(REG(FINDING({}))), { git: true }));
  return (out.verdict === 'advisory' && out.findings.some((f) => /S-20260726-01/.test(f.title)))
    || `got ${out.verdict}: ${out.summary}`;
});

await itAsync('E27 …but an IRREVERSIBLE finding blocks even in advisory mode', async (mk) => {
  // You cannot un-leak a key by configuring a gate. Everything else this script knows is
  // recoverable; a credential that reached a remote is rotated, not undone.
  const root = mk(REPO(REG('')), { git: true });
  stage(root, 'src/cfg.ts', 'const k = "AKIAIOSFODNN7REALKEY";');
  const out = await check(root);
  return out.verdict === 'fail' || `a staged live credential did not block: ${out.verdict}`;
});

await itAsync('E28 LAUNDERING: status resolved with no evidence is rejected', async (mk) => {
  // The entire gate was one word wide — change a Critical to resolved and it vanished, with
  // the finding identity intact so no deletion check fired either.
  const out = await check(mk(REPO(REG(FINDING({ status: 'resolved', confidence: 'Low' }))), { git: true }), BLOCKING);
  return (out.verdict === 'fail' && out.findings.some((f) => /resolved with no evidence/.test(f.title)))
    || `got ${out.verdict}: ${JSON.stringify(out.findings.map((f) => f.title))}`;
});

await itAsync('E29 LAUNDERING: decision-due naming no decision row is rejected', async (mk) => {
  const out = await check(mk(REPO(REG(FINDING({ status: 'decision-due', confidence: 'Low' }))), { git: true }), BLOCKING);
  return (out.verdict === 'fail' && out.findings.some((f) => /names no decision/.test(f.title)))
    || `got ${out.verdict}: ${JSON.stringify(out.findings.map((f) => f.title))}`;
});

await itAsync('E30 an acceptance expiring on a non-date is rejected', async (mk) => {
  const out = await check(mk(REPO(REG(FINDING({ status: 'accepted', confidence: 'Low',
    accepted: 'owner=k date=2026-07-26 expires=9999-99-99 commit=HEADSHA' }))), { git: true }), BLOCKING);
  return (out.verdict === 'fail' && out.findings.some((f) => /not a real date/.test(f.title)))
    || `an unexpirable acceptance held: ${JSON.stringify(out.findings.map((f) => f.title))}`;
});

await itAsync('E31 FAIL-OPEN: deleting the decisions ledger does not delete the check on it', async (mk) => {
  const files = REPO(REG(''));
  delete files['security/DECISIONS.md'];
  const out = await check(mk(files, { git: true }), BLOCKING);
  return out.findings.some((f) => /decisions ledger is missing or empty/.test(f.title))
    || `removing the ledger removed the check: ${JSON.stringify(out.findings.map((f) => f.title))}`;
});

await itAsync('E32 the carve-out survives the early return on a FRESH repository', async (mk) => {
  // Running the credential scan early was not enough: the early returns build their own
  // findings array and return missing_input, which exits 0 in advisory mode — so a staged key
  // on a day-one repository was detected, dropped from the result, and exited clean.
  const files = REPO(REG(''));
  delete files['security/.state/reviews.json'];
  const root = mk(files, { git: true });
  stage(root, 'src/cfg.ts', 'const k = "AKIAIOSFODNN7REALKEY";');
  const out = await check(root);
  return (out.verdict === 'fail' && out.findings.some((f) => /known format staged/.test(f.title)))
    || `got ${out.verdict}: ${JSON.stringify(out.findings.map((f) => f.title))}`;
});

// ─── Part F · the decisions gate ──────────────────────────────────────────────
// All four were open findings a prior review left PARTIAL, carried in with the file.

console.log('\nF · decisions gate: non-decisions and non-dates');

const DEC = (rows) => ({
  'security/DECISIONS.md': ['| ID | Decision | Status | Trigger | Answer |', '|---|---|---|---|---|', ...rows].join('\n') + '\n',
});
const decide = (root) => runDecisions({ root });

await itAsync('F1 a date-SHAPED non-date cannot defer forever', async (mk) => {
  // `revisit 9999-99-99` matched the date pattern, so the row looked dated; Date.parse then
  // returned NaN and `NaN < Date.now()` is false, so the expiry guard never fired.
  const out = await decide(mk(DEC(['| S-1 | Isolation unit? | DEFERRED | `never/**` | revisit 9999-99-99 |'])));
  return (out.verdict === 'fail' && out.findings.some((f) => /not a real date/.test(f.title)))
    || `got ${out.verdict}: ${JSON.stringify(out.findings.map((f) => f.title))}`;
});

await itAsync('F2 DECIDED with "TBD" records no decision', async (mk) => {
  const out = await decide(mk(DEC(['| S-1 | Isolation unit? | DECIDED | `never/**` | TBD |'])));
  return (out.verdict === 'fail' && out.findings.some((f) => /records no decision/.test(f.title)))
    || `got ${out.verdict}: ${JSON.stringify(out.findings.map((f) => f.title))}`;
});

await itAsync('F3 …but a real decision that CONTAINS the word tbd passes', async (mk) => {
  const out = await decide(mk(DEC(['| S-1 | Isolation unit? | DECIDED | `never/**` | the workspace; the TBD on per-seat quotas is tracked separately |'])));
  return out.verdict === 'pass' || `over-rejected a real answer: ${JSON.stringify(out.findings.map((f) => f.title))}`;
});

await itAsync('F4 a deferral naming BOTH dates uses the later one', async (mk) => {
  // The error message asks for "when it was deferred and when it will be revisited"; the
  // check matched the FIRST date and reported that exact format as already expired.
  const out = await decide(mk(DEC(['| S-1 | Which layer? | DEFERRED | `never/**` | deferred 2026-07-26, revisit 2099-01-01 |'])));
  return out.verdict === 'pass' || `punished its own instructed format: ${JSON.stringify(out.findings.map((f) => f.title))}`;
});

await itAsync('F5 a genuinely expired deferral still fails', async (mk) => {
  const out = await decide(mk(DEC(['| S-1 | Which layer? | DEFERRED | `never/**` | deferred 2026-01-01, revisit 2026-02-01 |'])));
  return (out.verdict === 'fail' && out.findings.some((f) => /has passed/.test(f.title)))
    || `got ${out.verdict}: ${JSON.stringify(out.findings.map((f) => f.title))}`;
});

// ─── ──────────────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(66)}`);
if (failures.length === 0) {
  console.log(`ALL ${passed} CASES PASSED`);
} else {
  console.log(`${passed} passed, ${failures.length} FAILED\n`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exitCode = 1;
}
