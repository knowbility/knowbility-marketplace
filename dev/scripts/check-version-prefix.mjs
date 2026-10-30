#!/usr/bin/env node
// check-version-prefix.mjs
//
// Lints that every plugin's plugin.json description starts with the same
// version string the `version` field declares — the UI workaround that puts
// the plugin version into the marketplace card until Anthropic surfaces it
// natively. See AGENTS.md → "Release & versioning" for the release loop and
// why this exists.
//
// Also lints the catalog: each plugin's entry description in
// .claude-plugin/marketplace.json must carry the same prefix — the browse
// cards render the CATALOG description, not plugin.json's, so a prefix only
// in plugin.json never shows where people actually look.
//
// Run from the marketplace root:
//   node dev/scripts/check-version-prefix.mjs
//
// Exits 0 if every plugin matches, 1 otherwise. Prints one line per plugin.
//
// No dependencies — Node 18+.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..");

// Find every top-level directory with a .claude-plugin/plugin.json.
const candidates = readdirSync(repoRoot, { withFileTypes: true })
  .filter((e) => e.isDirectory() && !e.name.startsWith("."))
  .map((e) => e.name);

const plugins = candidates
  .map((name) => ({
    name,
    manifestPath: resolve(repoRoot, name, ".claude-plugin", "plugin.json"),
  }))
  .filter((p) => {
    try {
      return statSync(p.manifestPath).isFile();
    } catch {
      return false;
    }
  });

if (plugins.length === 0) {
  // An empty marketplace is a legitimate state while it is being scaffolded, so
  // this is not a failure. CI should not be red on day one.
  console.log("No plugins registered yet; nothing to check.");
  process.exit(0);
}

const VERSION_PREFIX = /^v(\d+\.\d+\.\d+) — /;
let failures = 0;

for (const p of plugins) {
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(p.manifestPath, "utf8"));
  } catch (e) {
    console.error(`FAIL  ${p.name}  could not parse plugin.json: ${e.message}`);
    failures += 1;
    continue;
  }
  const version = manifest.version;
  const description = manifest.description ?? "";
  const match = description.match(VERSION_PREFIX);

  if (!version) {
    console.error(`FAIL  ${p.name}  plugin.json has no version field`);
    failures += 1;
    continue;
  }
  if (!match) {
    console.error(
      `FAIL  ${p.name}  description does not start with 'v<X.Y.Z> — ' (version is ${version})`
    );
    failures += 1;
    continue;
  }
  const descVersion = match[1];
  if (descVersion !== version) {
    console.error(
      `FAIL  ${p.name}  description prefix v${descVersion} ≠ version field ${version}`
    );
    failures += 1;
    continue;
  }
  console.log(`OK    ${p.name}  v${version}`);
}

// --- catalog check: marketplace.json entry descriptions ---

const catalogPath = resolve(repoRoot, ".claude-plugin", "marketplace.json");
let catalog;
try {
  catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
} catch (e) {
  console.error(`FAIL  marketplace.json  could not parse: ${e.message}`);
  failures += 1;
  catalog = { plugins: [] };
}

const versionByName = new Map();
for (const p of plugins) {
  try {
    versionByName.set(p.name, JSON.parse(readFileSync(p.manifestPath, "utf8")).version);
  } catch { /* already reported above */ }
}

for (const entry of catalog.plugins ?? []) {
  const version = versionByName.get(entry.name);
  if (!version) {
    console.error(`FAIL  catalog:${entry.name}  no plugin dir/manifest found for this entry`);
    failures += 1;
    continue;
  }
  const match = (entry.description ?? "").match(VERSION_PREFIX);
  if (!match) {
    console.error(
      `FAIL  catalog:${entry.name}  marketplace.json description does not start with 'v<X.Y.Z> — ' (plugin version is ${version})`
    );
    failures += 1;
    continue;
  }
  if (match[1] !== version) {
    console.error(
      `FAIL  catalog:${entry.name}  marketplace.json prefix v${match[1]} ≠ plugin version ${version}`
    );
    failures += 1;
    continue;
  }
  console.log(`OK    catalog:${entry.name}  v${version}`);
}

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log(
  `\nAll ${plugins.length} plugin(s) and ${catalog.plugins?.length ?? 0} catalog entr(ies) carry a matching v-prefix.`
);
