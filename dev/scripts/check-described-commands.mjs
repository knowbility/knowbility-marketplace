#!/usr/bin/env node
// check-described-commands.mjs
//
// Every slash-command string that appears inside a plugin manifest description or a
// marketplace catalog description must name an invocation that actually exists.
//
// This exists because of a defect found while porting the fifth plugin. The
// `know-photo-generator` manifest and catalog both said "/photo-setup handles the API key."
// There is no `/photo-setup`. The real command is `/know-photo:setup`, and the plugin's own
// changelog recorded that commands had *moved from* `/photo-setup` during the de-branding
// rename — the description simply kept the old name, in the one place a user reads before
// installing anything.
//
// Two earlier gates both passed it. `check-version-prefix.mjs` compares the `v<X.Y.Z> — `
// prefix across manifest, version field, and catalog entry. The documentation review's
// ground truth compared the manifest description to the catalog description and reported them
// identical — which they were, because the same wrong command name sat in both. Neither gate
// looked *inside* the prose. A description is documentation, and it is the documentation
// shown in the install UI, so a wrong command there is a first-run failure for a reader who
// has not yet seen any other file.
//
// Usage:
//   node dev/scripts/check-described-commands.mjs
//
// Exit 0 when every referenced invocation resolves, 1 otherwise. Run it from the repo root
// alongside check-version-prefix.mjs before any release.
//
// What it CANNOT find: a command that exists but does the wrong thing, a command named in a
// README rather than a description (the readiness review's own sweep covers those), and a
// description that is accurate but misleading. It checks resolvability, not truth.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const plugins = readdirSync(".").filter(
  (d) => d.startsWith("know-") && existsSync(join(d, ".claude-plugin/plugin.json")),
);

// Build the set of invocations a user can actually type. Two sources, and they resolve
// differently: a command at commands/<sub>/<file>.md is typed /<sub>:<file>, while a skill is
// typed by its own `name:` frontmatter when that name contains a colon, and namespaced under
// the plugin name when it does not.
const real = new Set();
for (const p of plugins) {
  const cmdRoot = join(p, "commands");
  if (existsSync(cmdRoot)) {
    for (const sub of readdirSync(cmdRoot, { withFileTypes: true })) {
      if (sub.isDirectory()) {
        for (const f of readdirSync(join(cmdRoot, sub.name))) {
          if (f.endsWith(".md")) real.add(`/${sub.name}:${f.replace(/\.md$/, "")}`);
        }
      } else if (sub.name.endsWith(".md")) {
        real.add(`/${p}:${sub.name.replace(/\.md$/, "")}`);
      }
    }
  }

  const skillRoot = join(p, "skills");
  if (existsSync(skillRoot)) {
    for (const d of readdirSync(skillRoot, { withFileTypes: true })) {
      if (!d.isDirectory()) continue;
      const f = join(skillRoot, d.name, "SKILL.md");
      if (!existsSync(f)) continue;
      const m = /^name:\s*(.+)$/m.exec(readFileSync(f, "utf8"));
      if (!m) continue;
      const declared = m[1].trim();
      real.add(declared.includes(":") ? `/${declared}` : `/${p}:${declared}`);
    }
  }
}

const catalog = JSON.parse(readFileSync(".claude-plugin/marketplace.json", "utf8"));
const sources = plugins.map((p) => ({
  where: `${p}/.claude-plugin/plugin.json`,
  text: JSON.parse(readFileSync(join(p, ".claude-plugin/plugin.json"), "utf8")).description,
}));
for (const e of catalog.plugins) sources.push({ where: `catalog:${e.name}`, text: e.description });

let bad = 0;
for (const { where, text } of sources) {
  for (const cmd of text.match(/\/[a-z][a-z0-9-]*(?::[a-z][a-z0-9-]*)?/g) ?? []) {
    if (real.has(cmd)) continue;
    console.log(`MISSING  ${where}  ${cmd}`);
    bad++;
  }
}

console.log(
  `\n${real.size} real invocations across ${plugins.length} plugins; ` +
    `${bad} description reference(s) that do not resolve.`,
);
process.exit(bad === 0 ? 0 : 1);
