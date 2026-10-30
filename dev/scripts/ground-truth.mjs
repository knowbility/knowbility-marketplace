#!/usr/bin/env node
// Emits a mechanically-extracted inventory of what this marketplace actually contains:
// every plugin's manifest name and version, every skill and command with the exact string
// a user types to invoke it, and a RECURSIVE listing of every shipped file.
//
// It exists so a documentation review can be checked against the repository rather than
// against the documentation's own claims. The first readiness review was limited by a
// top-level-only inventory, which could not confirm whether a nested path like
// `reference/wcag-mapping.md` exists; this walks the whole tree for that reason.
//
// Invocation naming is empirical, not assumed:
//   - a skill's typed name is its own frontmatter `name:` when that name contains a colon,
//     otherwise the plugin name namespaces it (`<plugin>:<name>`)
//   - a command at `commands/<sub>/<file>.md` is typed `/<sub>:<file>`
//   - a command at `commands/<file>.md` is typed `/<plugin>:<file>`

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const out = [];
const say = (s = "") => out.push(s);

const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));

function walk(dir, base = dir) {
  const rows = [];
  for (const entry of readdirSync(dir).sort()) {
    if (entry === ".DS_Store") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) rows.push(...walk(full, base));
    else rows.push(relative(base, full));
  }
  return rows;
}

function skillName(dir, pluginName) {
  const f = join(dir, "SKILL.md");
  if (!existsSync(f)) return null;
  const m = /^name:\s*(.+)$/m.exec(readFileSync(f, "utf8"));
  if (!m) return null;
  const declared = m[1].trim();
  return { declared, typed: declared.includes(":") ? declared : `${pluginName}:${declared}` };
}

function commands(pluginDir, pluginName) {
  const dir = join(pluginDir, "commands");
  if (!existsSync(dir)) return [];
  return walk(dir)
    .filter((p) => p.endsWith(".md"))
    .map((p) => {
      const parts = p.replace(/\.md$/, "").split("/");
      const typed = parts.length > 1 ? `${parts[0]}:${parts.slice(1).join("/")}` : `${pluginName}:${parts[0]}`;
      return { path: `commands/${p}`, typed };
    });
}

const marketplace = readJson(join(root, ".claude-plugin", "marketplace.json"));

say("# Ground truth");
say();
say("Mechanically extracted from the repository by `dev/scripts/ground-truth.mjs`. Every");
say("invocable name, version, and shipped path that actually exists, listed recursively.");
say("Check the documentation against this, not against itself.");
say();
say("## Marketplace catalog");
say();
say(`- marketplace name: \`${marketplace.name}\`  (so install syntax is \`<plugin>@${marketplace.name}\`)`);
say(`- owner: ${marketplace.owner?.name ?? "(none)"}`);
say(`- registered plugins: ${marketplace.plugins.length}`);
say();
for (const p of marketplace.plugins) say(`  - \`${p.name}\` from \`${p.source}\``);

for (const entry of marketplace.plugins) {
  const pluginDir = join(root, entry.source.replace(/^\.\//, ""));
  const manifest = readJson(join(pluginDir, ".claude-plugin", "plugin.json"));
  say();
  say(`## ${manifest.name}`);
  say();
  say(`- manifest name: \`${manifest.name}\``);
  say(`- version: \`${manifest.version}\``);
  say(`- manifest description: \`${manifest.description}\``);
  say(`- catalog description: \`${entry.description}\``);
  say(`- install command: \`/plugin install ${manifest.name}@${marketplace.name}\``);

  const skillsDir = join(pluginDir, "skills");
  if (existsSync(skillsDir)) {
    say();
    say("**Skills (directory → frontmatter `name:` → how a user types it):**");
    say();
    for (const d of readdirSync(skillsDir).sort()) {
      const s = skillName(join(skillsDir, d), manifest.name);
      if (s) say(`- \`skills/${d}/\` → \`name: ${s.declared}\` → user types **\`/${s.typed}\`**`);
    }
  }

  const cmds = commands(pluginDir, manifest.name);
  if (cmds.length) {
    say();
    say("**Commands (path → how a user types it):**");
    say();
    for (const c of cmds) say(`- \`${c.path}\` → user types **\`/${c.typed}\`**`);
  }

  const agentsDir = join(pluginDir, "agents");
  if (existsSync(agentsDir)) {
    say();
    say("**Agents:**");
    say();
    for (const a of walk(agentsDir)) say(`- \`agents/${a}\``);
  }

  const files = walk(pluginDir);
  say();
  say(`**Every shipped file (${files.length} files, recursive):**`);
  say();
  for (const f of files) say(`- \`${f}\``);
}

say();
say("## Repository root (not shipped to plugin users)");
say();
for (const entry of readdirSync(root).sort()) {
  if (entry === ".DS_Store" || entry === ".git") continue;
  const isDir = statSync(join(root, entry)).isDirectory();
  say(`- \`${entry}${isDir ? "/" : ""}\``);
}

say();
console.log(out.join("\n"));
