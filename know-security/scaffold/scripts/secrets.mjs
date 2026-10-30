#!/usr/bin/env node
/**
 * Credential candidates. **Candidates, not findings.**
 *
 * The distinction is the whole design. The sibling trailhead plugin ships a secrets check
 * that is a *gate*: it decides, and it blocks a commit. This one produces a work list for a
 * reviewer who will read the assignment and the sink before classifying anything, because
 * the single most common false positive in this whole domain is a hardcoded credential in a
 * test factory — which is the correct way to write a test factory.
 *
 * So: no verdict, no severity, no exit code. Every candidate carries its context and a
 * `benign` label when its path suggests one, and the reviewer applies the finding contract's
 * confirm procedure:
 *
 *   1. Trace the value to its ORIGIN.  2. Trace it to its SINK.  3. Then classify.
 *
 * ## Prefer a real scanner
 *
 * gitleaks and trufflehog have far better pattern tables than anything that belongs in this
 * file, and they can read git history, which the built-in table cannot. When one is
 * installed it is used and the built-in table is skipped. When none is, the fallback runs
 * and **says so** — an absent scanner degrades explicitly, never silently, because "no
 * candidates found" from a weaker detector reads identically to "no candidates found" from a
 * strong one.
 *
 *   node security/scripts/secrets.mjs           human-readable
 *   node security/scripts/secrets.mjs --json    for an agent
 *   node security/scripts/secrets.mjs --staged  the git index only, for a pre-commit path
 *
 * **Never prints a matched value.** A report that quotes the secret it found has copied the
 * secret into a new file, which is the original problem with extra steps. Candidates carry
 * the pattern name, the location, and a redacted excerpt.
 *
 * Zero dependencies. Never touches a network.
 */

import { join } from 'node:path';
import { realpathSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { filesMatching, readOr, lineAt } from './lib/scan.mjs';

const SCHEMA = 'knowbility.security.secrets/1';
const MAX_BUFFER = 8 * 1024 * 1024;

/**
 * The always-available floor: high-confidence prefixed credential formats only.
 *
 * Deliberately biased toward zero false positives, because a detector people learn to ignore
 * is worse than no detector. Entropy heuristics are NOT here on purpose — entropy without an
 * assignment context is benign class 4 in the finding contract, and a table that flags every
 * hash and UUID in a repository is the fastest route to this tool being switched off.
 *
 * This table intentionally mirrors trailhead's. The two plugins compose through files and
 * neither imports the other, so this is a copy — and a copy can drift. The mitigation is
 * that this one produces candidates while trailhead's decides, so a drift shows up as a
 * difference in a work list rather than as one tool blocking what the other allows.
 */
/**
 * Vendor-designated TEST-MODE credential formats.
 *
 * `sk_test_…` is Stripe's sandbox key: it cannot touch live data or move money, it is
 * routinely committed on purpose, and treating it as a leak is a false positive by
 * construction. The distinction is decidable from the prefix alone — exactly the kind of
 * format fact a script may decide — so it is drawn here rather than left to a path heuristic.
 *
 * Reported as a candidate, never blockable. The reviewer still sees it, because a project
 * that did not mean to commit even a test key should know.
 */
export const TEST_MODE = /\b(sk|pk|rk)_test_|\bAKIAIOSFODNN7EXAMPLE\b|\bxoxb-test-/i;

export const PATTERNS = [
  { name: 'Stripe secret key', re: /\bsk_(live|test)_[A-Za-z0-9]{16,}/g },
  { name: 'AWS access key id', re: /\b(AKIA|ASIA)[0-9A-Z]{16}\b/g },
  { name: 'GitHub token', re: /\b(gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{40,})/g },
  { name: 'GitLab token', re: /\bglpat-[A-Za-z0-9_-]{20,}/g },
  { name: 'Slack token', re: /\bxox[bpoasr]-[A-Za-z0-9-]{10,}/g },
  { name: 'Google API key', re: /\bAIza[0-9A-Za-z_-]{35}\b/g },
  { name: 'OpenAI key', re: /\bsk-(proj-)?[A-Za-z0-9_-]{32,}/g },
  { name: 'Anthropic key', re: /\bsk-ant-[A-Za-z0-9_-]{24,}/g },
  { name: 'private key block', re: /-----BEGIN (RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/g },
  { name: 'connection string with inline password', re: /\b[a-z][a-z0-9+.-]*:\/\/[^\s:@/]+:[^\s:@/]{6,}@/g },
];

/**
 * Credential-shaped ASSIGNMENTS with a literal value.
 *
 * This is the second signal and it catches what the prefix table cannot: a plain password or
 * an unprefixed API key. It requires an assignment to a credential-shaped NAME, because that
 * — not entropy — is what distinguishes a secret from a hash. `const h = 'a94a8fe5...'` is a
 * SHA-1; `const password = 'a94a8fe5...'` is a credential.
 */
const ASSIGNMENT = /\b(passwd|password|passphrase|secret|api[_-]?key|apikey|access[_-]?token|auth[_-]?token|private[_-]?key|client[_-]?secret|encryption[_-]?key)\b\s*[:=]\s*["'`]([^"'`\n]{6,})["'`]/gi;

const SKIP = /\.(png|jpe?g|gif|svg|pdf|ico|woff2?|ttf|otf|zip|gz|tar|mp4|mov|wasm|map)$|(^|\/)(\.DS_Store|package-lock\.json|yarn\.lock|pnpm-lock\.yaml|Cargo\.lock|go\.sum)$/i;
const SELF = /^security\/scripts\//;

/**
 * Applied to the MATCHED TEXT ONLY, never to the surrounding line.
 *
 * Applying it to the line would let a comment reading "not a real example" suppress a real
 * key beside it — the same class of defect as a comment satisfying a guard.
 */
const PLACEHOLDER = /(EXAMPLE|PLACEHOLDER|YOUR[_-]|CHANGE[_-]?ME|REDACTED|DUMMY|FAKE|SAMPLE|TODO|XXXX|\.\.\.|^<[a-z-]+>$|\$\{|^\*+$|^0+$)/i;

/** Path-shaped context. Labels, never excludes — a real key committed into a fixture directory is real. */
const BENIGN_PATH = [
  { label: 'test', re: /(^|\/)(test|tests|__tests__|spec|e2e)\/|\.(test|spec)\.\w+$/i },
  { label: 'fixture', re: /(^|\/)(fixtures?|factories|seeds?|mocks?|__mocks__|testdata)\//i },
  { label: 'example', re: /\.example$|\.sample$|\.template$|(^|\/)examples?\//i },
  { label: 'vendored', re: /(^|\/)(vendor|third_party|node_modules|\.venv|venv)\//i },
  { label: 'docs', re: /\.(md|mdx|rst|txt|adoc)$|(^|\/)docs?\//i },
];

function benignLabel(file) {
  for (const b of BENIGN_PATH) if (b.re.test(file)) return b.label;
  return null;
}

/** Never the value. Length and shape only, which is all a reviewer needs to locate it. */
function redact(matched) {
  return `<${matched.length} chars, starts ${JSON.stringify(matched.slice(0, 4))}>`;
}

function scanText(text, file, out) {
  for (const p of PATTERNS) {
    p.re.lastIndex = 0;
    let m;
    while ((m = p.re.exec(text)) !== null) {
      if (PLACEHOLDER.test(m[0])) continue;
      out.push({
        pattern: p.name,
        // A vendor test-mode key is a real format and a synthetic value. Reported so the
        // reviewer sees it; not blockable, because blocking it is a false positive by
        // construction and this is decidable from the prefix alone.
        signal: TEST_MODE.test(m[0]) ? 'test-mode-format' : 'prefixed-format',
        file,
        line: lineAt(text, m.index),
        redacted: redact(m[0]),
        benign: benignLabel(file),
      });
    }
  }
  ASSIGNMENT.lastIndex = 0;
  let a;
  while ((a = ASSIGNMENT.exec(text)) !== null) {
    if (PLACEHOLDER.test(a[2])) continue;
    // An assignment from a variable, a call, or an env read is not a literal credential.
    if (/^(process\.env|os\.environ|ENV\[|config\.|opts\.|options\.)/.test(a[2])) continue;
    out.push({
      pattern: `assignment to \`${a[1]}\``,
      signal: 'credential-shaped-assignment',
      file,
      line: lineAt(text, a.index),
      redacted: redact(a[2]),
      benign: benignLabel(file),
    });
  }
}

/** gitleaks or trufflehog, if the host has one. */
function externalScanner(root, staged) {
  for (const tool of ['gitleaks', 'trufflehog']) {
    // Probe by running the binary, not by shelling out to `command -v`. `shell: true` with an
    // argument array concatenates rather than escapes, which Node deprecated for exactly the
    // injection reason this plugin exists to find — and a security tool that emits a security
    // deprecation warning has undermined itself before it reports anything. An absent binary
    // surfaces as `error.code === 'ENOENT'`, which is all the detection needed.
    const probe = spawnSync(tool, ['--version'], { encoding: 'utf8' });
    if (probe.error) continue;

    const args = tool === 'gitleaks'
      ? (staged ? ['protect', '--staged', '--report-format', 'json', '--report-path', '-', '--no-banner']
        : ['detect', '--report-format', 'json', '--report-path', '-', '--no-banner'])
      : ['filesystem', '--json', '--no-update', '.'];

    const run = spawnSync(tool, args, { cwd: root, encoding: 'utf8', maxBuffer: MAX_BUFFER });
    if (run.error) continue;

    // Exit 0 = clean, 1 = findings. Anything else is the scanner failing, and accepting it
    // was a false-clean path: a config error, an unsupported CLI version, or a crash produced
    // an empty result that was then reported as "used gitleaks, zero candidates" — with the
    // built-in table skipped, so there was no fallback either. A broken strong scanner must
    // not read as a clean strong scan.
    if (run.status !== 0 && run.status !== 1) {
      return { tool, failed: true, status: run.status, stderr: String(run.stderr ?? '').trim().slice(0, 300) };
    }
    // Output that will not parse is the same failure wearing different clothes.
    try {
      JSON.parse(run.stdout || '[]');
    } catch {
      return { tool, failed: true, status: run.status, stderr: 'output was not parseable JSON' };
    }
    return { tool, raw: run.stdout ?? '', scans_history: tool === 'gitleaks' && !staged };
  }
  return null;
}

function parseExternal(found) {
  const out = [];
  let parsed;
  try { parsed = JSON.parse(found.raw || '[]'); } catch { return out; }
  const rows = Array.isArray(parsed) ? parsed : [parsed];
  for (const r of rows) {
    const file = r.File ?? r.file ?? r.SourceMetadata?.Data?.Filesystem?.file ?? '(unknown)';
    out.push({
      pattern: r.RuleID ?? r.Description ?? r.DetectorName ?? 'external rule',
      signal: `external:${found.tool}`,
      file,
      line: r.StartLine ?? r.line ?? 0,
      // The scanner reports the value; we do not carry it.
      redacted: r.Match ? redact(String(r.Match)) : '<not carried>',
      benign: benignLabel(file),
      commit: r.Commit ?? null,
    });
  }
  return out;
}

export function scanSecrets(root, { staged = false } = {}) {
  const candidates = [];
  const notes = [];
  const external = externalScanner(root, staged);

  if (external?.failed) {
    // Fall through to the built-in table rather than reporting an empty result from a broken
    // scanner. Loudly: the caller must be able to tell "nothing found" from "nothing ran".
    notes.push(
      `${external.tool} IS INSTALLED BUT FAILED (exit ${external.status}${external.stderr ? `: ${external.stderr}` : ''}). ` +
      'Its results are NOT in this output. Fell back to the built-in table, which is weaker ' +
      'and does not read git history. Fix the scanner before trusting a clean result.',
    );
  }
  if (external && !external.failed) {
    candidates.push(...parseExternal(external));
    notes.push(`Used ${external.tool}.${external.scans_history ? ' Git history was scanned.' : ' Working tree only.'}`);
  } else {
    notes.push(
      'NO EXTERNAL SCANNER INSTALLED. Used the built-in table, which covers ten prefixed ' +
      'credential formats plus credential-shaped assignments and DOES NOT READ GIT HISTORY. ' +
      'A credential removed from the working tree but present in a reachable commit is not ' +
      'found here. Install gitleaks for history coverage (SEC-03).',
    );

    if (staged) {
      const names = spawnSync('git', ['diff', '--cached', '--name-only', '-z', '--diff-filter=ACM'], { cwd: root, encoding: 'utf8', maxBuffer: MAX_BUFFER });
      for (const file of (names.stdout ?? '').split('\0').filter(Boolean)) {
        if (SKIP.test(file) || SELF.test(file)) continue;
        // Read the INDEX, not the working tree. A key can be staged and then removed from
        // the file on disk, and a working-tree read would miss exactly the bytes about to
        // be committed.
        const blob = spawnSync('git', ['show', `:${file}`], { cwd: root, encoding: 'utf8', maxBuffer: MAX_BUFFER });
        if (blob.status !== 0) continue;
        scanText(blob.stdout ?? '', file, candidates);
      }
    } else {
      for (const file of filesMatching(root, ['**/*'])) {
        if (SKIP.test(file) || SELF.test(file)) continue;
        const text = readOr(join(root, file), '');
        if (!text || text.includes('\0')) continue;
        scanText(text, file, candidates);
      }
    }
  }

  const byBenign = new Map();
  for (const c of candidates) byBenign.set(c.benign ?? 'unlabelled', (byBenign.get(c.benign ?? 'unlabelled') ?? 0) + 1);

  return {
    schema: SCHEMA,
    generated_at: new Date().toISOString(),
    scanner: external && !external.failed ? external.tool : 'built-in',
    scanner_failed: external?.failed ? external.tool : null,
    scans_history: (external && !external.failed && external.scans_history) ?? false,
    mode: staged ? 'staged' : 'tree',
    _note:
      'CANDIDATES, NOT FINDINGS. Read the assignment and the sink before classifying — a ' +
      'hardcoded credential in a test factory is the correct way to write a test factory. ' +
      'The `benign` label is path-derived context, not a verdict: a real key committed into ' +
      'a fixture directory is still a real key. No value is carried in this output.',
    counts: { candidates: candidates.length, by_context: Object.fromEntries(byBenign) },
    notes,
    candidates,
  };
}

function main() {
  const root = process.cwd();
  const staged = process.argv.includes('--staged');
  const out = scanSecrets(root, { staged });

  if (process.argv.includes('--json')) {
    process.stdout.write(`${JSON.stringify(out, null, 2)}\n`);
    return;
  }

  const lines = [`${out.counts.candidates} candidate(s) · scanner: ${out.scanner} · mode: ${out.mode}`];
  for (const n of out.notes) lines.push(`  note: ${n}`);
  const unlabelled = out.candidates.filter((c) => !c.benign);
  const labelled = out.candidates.filter((c) => c.benign);
  if (unlabelled.length) {
    lines.push('', 'In non-test paths — read these first:');
    for (const c of unlabelled.slice(0, 25)) lines.push(`  ${c.file}:${c.line} — ${c.pattern} ${c.redacted}`);
    if (unlabelled.length > 25) lines.push(`  … and ${unlabelled.length - 25} more (use --json)`);
  }
  if (labelled.length) {
    const by = new Map();
    for (const c of labelled) by.set(c.benign, (by.get(c.benign) ?? 0) + 1);
    lines.push('', `In paths that suggest a benign class (still read them): ${[...by].map(([k, v]) => `${k} ${v}`).join(', ')}`);
  }
  lines.push('', 'Candidates, not findings. Nothing here is classified.');
  process.stdout.write(`${lines.join('\n')}\n`);
}

// Resolve symlinks before comparing; a bare `file://${process.argv[1]}` comparison fails
// through a symlink and the script silently no-ops and exits 0.
if (process.argv[1] && pathToFileURL(realpathSync(process.argv[1])).href === import.meta.url) main();
