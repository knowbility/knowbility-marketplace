/**
 * Filesystem helpers for the security checker.
 *
 * Deliberately self-contained rather than importing trailhead's `gate-lib.mjs`: the two
 * plugins compose through files in the deployment directory and neither may depend on the
 * other being installed. A shared import would be exactly the coupling the marketplace's
 * composition convention forbids, and it would mean uninstalling one plugin breaks the
 * other's gate — which is a bypass, not a dependency.
 *
 * Zero dependencies, node builtins only.
 */

import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative, sep } from 'node:path';

export const IGNORED_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', 'coverage', '.next', 'out',
  'target', '__pycache__', '.venv', 'venv', '.gates', '.cache', 'tmp',
]);

/** Minimal glob → RegExp. `**` any depth, `*` one segment, `?` one char, `{a,b}`. */
export function globToRegExp(pattern) {
  let out = '';
  for (let i = 0; i < pattern.length; i += 1) {
    const c = pattern[i];
    if (c === '*') {
      if (pattern[i + 1] === '*') {
        if (pattern[i + 2] === '/') { out += '(?:.*/)?'; i += 2; } else { out += '.*'; i += 1; }
      } else out += '[^/]*';
    } else if (c === '?') out += '[^/]';
    else if (c === '{') {
      const close = pattern.indexOf('}', i);
      if (close === -1) out += '\\{';
      else {
        out += `(?:${pattern.slice(i + 1, close).split(',').map((o) => o.replace(/[\\^$.|?*+()[\]{}]/g, '\\$&')).join('|')})`;
        i = close;
      }
    } else if ('\\^$.|+()[]'.includes(c)) out += `\\${c}`;
    else out += c;
  }
  return new RegExp(`^${out}$`);
}

/** Project-relative POSIX paths matching any pattern. */
export function filesMatching(root, patterns) {
  if (!patterns?.length) return [];
  const allowedDots = new Set(['.github', '.claude', '.gemini']);
  const res = patterns.map(globToRegExp);
  const found = [];
  const walk = (dir) => {
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (IGNORED_DIRS.has(e.name)) continue;
      if (e.name.startsWith('.') && e.isDirectory() && !allowedDots.has(e.name)) continue;
      const full = join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else {
        const rel = relative(root, full).split(sep).join('/');
        if (res.some((r) => r.test(rel))) found.push(rel);
      }
    }
  };
  walk(root);
  return found.sort();
}

export function readOr(path, fallback = null) {
  try { return existsSync(path) ? readFileSync(path, 'utf8') : fallback; } catch { return fallback; }
}

export function readJsonOr(path, fallback = null) {
  const t = readOr(path, null);
  if (t === null) return fallback;
  try { return JSON.parse(t); } catch { return fallback; }
}

export function sha256(text) {
  return createHash('sha256').update(text).digest('hex');
}

/** Newest mtime (epoch ms) across a set of project-relative paths. */
export function newestMtime(root, files) {
  let newest = 0;
  for (const f of files) {
    try { const { mtimeMs } = statSync(join(root, f)); if (mtimeMs > newest) newest = mtimeMs; } catch { /* raced */ }
  }
  return Math.round(newest);
}

/**
 * A uniform check result, shaped to trailhead's check-module contract so the same module
 * can be loaded by its runner or run standalone.
 *
 * `identities` is the set this check measured — surface IDs, invariant IDs. Ratcheting the
 * SET rather than its size is what stops deletion reading as improvement: two uncovered
 * surfaces, delete one, and the count falls, which is an improvement by every measure a
 * counter has.
 */
export function result(verdict, summary, { pass = 0, fail = 0, not_run = 0 } = {}, findings = [], identities = null) {
  return { verdict, summary, counts: { pass, fail, not_run }, findings, identities };
}

/** Line number of a character offset, 1-indexed. */
export function lineAt(text, index) {
  return text.slice(0, index).split('\n').length;
}

/**
 * Blank out comments, preserving byte offsets and line numbers.
 *
 * Two failures made this necessary. A commented-out route registered as a real surface, so
 * documentation became a phantom endpoint nobody could ever guard. And in the other
 * direction, a comment reading `// authorize` satisfied an authorization mechanism — a
 * one-token bypass of the strictest check here.
 *
 * Replacement rather than removal keeps every offset stable, so line numbers and
 * handler-body slices computed against the stripped text still point at the real source.
 */
export function stripComments(text, file = '') {
  const hashStyle = /\.(py|rb|sh|yml|yaml|toml)$/i.test(file);
  const sqlStyle = /\.sql$/i.test(file);
  const blank = (m) => m.replace(/[^\n]/g, ' ');
  let out = text;

  if (hashStyle) {
    out = out.replace(/(^|[^\\])#[^\n]*/g, (m, p1) => p1 + blank(m.slice(p1.length)));
  } else if (sqlStyle) {
    out = out.replace(/--[^\n]*/g, blank).replace(/\/\*[\s\S]*?\*\//g, blank);
  } else {
    // Walk the source so neither a `//` inside a string nor one inside a regex literal is
    // treated as a comment. The regex case is not hypothetical: `/https?:\\/\\//` blanks the
    // rest of its line, so a guard call after a URL pattern becomes invisible and the
    // surface reads as unguarded — a false failure, which is the direction that gets a gate
    // switched off.
    let result = '';
    let i = 0;
    let quote = null;
    let inRegex = false;
    // A `/` begins a regex only where a value may begin. After an identifier, a literal, or
    // a closing bracket it is division.
    const REGEX_MAY_START_AFTER = new Set(['(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}', ';', '+', '-', '*', '%', '<', '>', '~', '^', '\n']);
    const lastSignificant = (s) => {
      for (let k = s.length - 1; k >= 0; k -= 1) if (!/\s/.test(s[k])) return s[k];
      return '\n';
    };

    while (i < text.length) {
      const c = text[i];
      const next = text[i + 1];

      if (quote) {
        if (c === '\\') { result += text.slice(i, i + 2); i += 2; continue; }
        if (c === quote) quote = null;
        result += c;
        i += 1;
        continue;
      }
      if (inRegex) {
        if (c === '\\') { result += text.slice(i, i + 2); i += 2; continue; }
        if (c === '/' || c === '\n') inRegex = false;
        result += c;
        i += 1;
        continue;
      }
      if (c === '"' || c === "'" || c === '`') { quote = c; result += c; i += 1; continue; }
      if (c === '/' && next === '/') {
        const end = text.indexOf('\n', i);
        const stop = end === -1 ? text.length : end;
        result += ' '.repeat(stop - i);
        i = stop;
        continue;
      }
      if (c === '/' && next === '*') {
        const end = text.indexOf('*/', i + 2);
        const stop = end === -1 ? text.length : end + 2;
        result += blank(text.slice(i, stop));
        i = stop;
        continue;
      }
      if (c === '/' && REGEX_MAY_START_AFTER.has(lastSignificant(result))) {
        inRegex = true;
        result += c;
        i += 1;
        continue;
      }
      result += c;
      i += 1;
    }
    out = result;
  }
  return out;
}
