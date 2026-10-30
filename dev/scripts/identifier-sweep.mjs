#!/usr/bin/env node
// identifier-sweep.mjs
//
// Pre-migration scan for identifying or operational detail that should not travel
// when a plugin is forked in from another organization.
//
// This exists because grepping for an organization's NAME is not enough. In this
// marketplace's own migration, a name-only grep reported one plugin as a
// two-reference, thirty-minute port; the real port carried six internal wiki page
// identifiers, a real personal email address, two real ticket keys, a live
// Atlassian cloudId, two commit shas, and a QA deployment hostname. None of those
// contain the organization's name.
//
// The pattern set below was then adversarially reviewed, which found three classes
// it could not catch at all (general secrets, plain-language identity fields and
// process rules, bare internal hosts and paths). Those are included now. Closing
// them surfaced no new findings in this repository, which is the point of writing
// them down: the next port starts from the better patterns.
//
// Usage:
//   node dev/scripts/identifier-sweep.mjs <dir> [<dir> ...]
//
// Exits 0 always. This is a candidate generator for a human, not a gate: it cannot
// tell a placeholder from a leak, and its highest-value classes are also its
// noisiest. Read every hit. An empty result is not proof of anything.
//
// What it CANNOT find, and what therefore still needs a human reading whole files:
// an operational assumption spread across several lines or files — a default, a
// selector, a routing rule, or a documented workflow that only makes sense for the
// source organization's product. That class does not look like a leak; it looks
// like a feature.
//
// No dependencies — Node 18+.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname, basename } from "node:path";

const PATTERNS = {
  // identity
  email:          /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
  name_field:     /\b(display_name|username|handle|avatar|owner|author|assignee|reporter|full_?name)\b\s*[:=]\s*\S+/i,
  org_suffix:     /\b(?:[A-Z][a-z]{2,}\s){1,2}(?:Inc|LLC|Ltd|Corp|Creative|Labs|Group|Holdings)\b/,
  // location
  url:            /https?:\/\/[^\s)"'`<>]+/,
  public_host:    /\b[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)+\.(?:com|net|org|io|dev|co|ai|app|cloud)\b/,
  internal_host:  /\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:internal|local|corp|lan|intranet)\b/i,
  unix_path:      /(?<![a-zA-Z0-9._/-])\/(?:srv|opt|var|home|mnt|data)\/[A-Za-z0-9._/-]+/,
  user_path:      /\/Users\/[A-Za-z0-9._-]+/,
  repo_slug:      /\b(repo|repository|workspace)\b\s*[:=]\s*["']?[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+/i,
  scp_repo:       /\bgit@[a-z0-9.-]+:[A-Za-z0-9._/-]+/,
  // tracker and document ids
  tracker_key:    /\b[A-Z][A-Z0-9_]{1,9}-\d{1,6}\b/,
  customfield:    /customfield_\d+/,
  digits7plus:    /\b\d{7,}\b/,
  // secrets
  secret_assign:  /\b(pass(word|wd)?|secret|token|api[_-]?key|authorization|bearer|credential)\b\s*[:=]\s*\S+/i,
  privkey:        /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  vendor_key:     /\b(?:sk|pk|gho|ghp|ghs|AIza|xox[bapr])[-_A-Za-z0-9]{8,}\b/,
  uuid:           /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/,
  hex7to40:       /\b[0-9a-f]{7,40}\b/,
  // operational assumption (noisy by nature; read these, do not trust the count)
  process_rule:   /\b(always route|must route|default_(area|style|project|board|env|owner)|approval queue|concierge)\b/i,
  slack_channel:  /#[a-z][a-z0-9-]{2,}/,
};

// Values that are reserved for documentation and are never a finding.
const BENIGN = [
  /\bexample\.(com|org|net)\b/, /\blocalhost\b/, /\b127\.0\.0\.1\b/, /\[::1\]/,
  /\bexample\.test\b/, /\bmy-?app\.example\b/,
];

const TEXT_EXT = new Set([".md", ".json", ".mjs", ".cjs", ".js", ".ts", ".sh", ".py",
                          ".html", ".txt", ".tmpl", ".yml", ".yaml", ".toml", ".env"]);

function walk(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === ".git") continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

const roots = process.argv.slice(2);
if (!roots.length) {
  console.error("Usage: node dev/scripts/identifier-sweep.mjs <dir> [<dir> ...]");
  process.exit(2);
}

let scanned = 0, skipped = 0, hits = 0;
const byClass = new Map();

for (const root of roots) {
  for (const file of walk(root)) {
    const ext = extname(file);
    if (!TEXT_EXT.has(ext) && basename(file) !== ".gitignore") { skipped += 1; continue; }
    scanned += 1;
    let lines;
    try { lines = readFileSync(file, "utf8").split("\n"); } catch { skipped += 1; continue; }
    lines.forEach((line, idx) => {
      const matched = Object.entries(PATTERNS)
        .filter(([, rx]) => rx.test(line))
        .map(([k]) => k);
      if (!matched.length) return;
      if (BENIGN.some((rx) => rx.test(line)) && !matched.some((m) => m === "privkey" || m === "vendor_key")) return;
      hits += 1;
      for (const m of matched) byClass.set(m, (byClass.get(m) ?? 0) + 1);
      console.log(`${file}:${idx + 1} [${matched.join(",")}]`);
      console.log(`    ${line.trim().slice(0, 200)}`);
    });
  }
}

console.log(`\n${hits} candidate line(s). ${scanned} file(s) scanned, ${skipped} not scanned (binary or unknown type).`);
if (byClass.size) {
  console.log("\nBy class:");
  for (const [k, n] of [...byClass].sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(16)} ${n}`);
}
console.log("\nCandidates, not findings. Read every line. An empty result proves nothing,");
console.log("and no pattern here can catch an operational assumption spread across files.");
