#!/usr/bin/env node
// check-namespace.mjs
//
// Convention 1 in the root AGENTS.md says: prefix the directory, the manifest `name`, and
// whatever a user actually types. For a plugin with command wrappers, the thing a user types
// comes from the `commands/` subdirectory. For a plugin without them, it comes from each
// skill's `name:` frontmatter. This checks whichever applies.
//
// It exists because an adversarial review pointed out that the convention was stated as a rule
// and mapped to no gate, so a new plugin could drift without anything catching it. The rule had
// already been rewritten once against observed host behavior; a rule nothing enforces is a
// rule that quietly stops being true.
//
// Usage:
//   node dev/scripts/check-namespace.mjs
//
// Exit 0 when every plugin satisfies the convention, 1 otherwise.
//
// What it CANNOT find: a namespace that is prefixed but wrong (`/know-blueprint:` on a plugin
// about photos), a command file that exists but does nothing, and a collision with a plugin
// outside this marketplace — which does not matter, because skills and commands are addressed
// `<plugin>:<name>` and the plugin name disambiguates. See convention 1 for the evidence.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const plugins = readdirSync(".").filter(
  (d) => d.startsWith("know-") && existsSync(join(d, ".claude-plugin/plugin.json")),
);

let bad = 0;
for (const p of plugins) {
  const manifest = JSON.parse(readFileSync(join(p, ".claude-plugin/plugin.json"), "utf8"));
  if (manifest.name !== p) {
    console.log(`FAIL  ${p}  manifest name "${manifest.name}" does not match the directory`);
    bad++;
  }
  if (!p.startsWith("know-")) {
    console.log(`FAIL  ${p}  directory is not know- prefixed`);
    bad++;
  }

  const cmdRoot = join(p, "commands");
  const hasCommands = existsSync(cmdRoot);

  if (hasCommands) {
    // The typed namespace is the commands/ subdirectory. It must be know- prefixed.
    const subs = readdirSync(cmdRoot, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
    if (subs.length === 0) {
      console.log(`FAIL  ${p}  commands/ has no namespace subdirectory`);
      bad++;
    }
    for (const s of subs) {
      if (!s.startsWith("know-")) {
        console.log(`FAIL  ${p}  commands/${s}/ is not know- prefixed, so /${s}: is unprefixed`);
        bad++;
      } else {
        console.log(`ok    ${p}  types as /${s}:<command>`);
      }
    }
  } else {
    // No wrappers, so each skill's own name is what gets typed. It must carry the namespace.
    const skillRoot = join(p, "skills");
    if (!existsSync(skillRoot)) {
      console.log(`FAIL  ${p}  neither commands/ nor skills/`);
      bad++;
      continue;
    }
    const names = [];
    for (const d of readdirSync(skillRoot, { withFileTypes: true })) {
      if (!d.isDirectory()) continue;
      const f = join(skillRoot, d.name, "SKILL.md");
      if (!existsSync(f)) continue;
      const m = /^name:\s*(.+)$/m.exec(readFileSync(f, "utf8"));
      if (m) names.push(m[1].trim());
    }
    const unprefixed = names.filter((n) => !n.startsWith("know-"));
    if (unprefixed.length) {
      console.log(
        `FAIL  ${p}  ships no commands/, so skill names are typed directly, but these are ` +
          `unprefixed: ${unprefixed.join(", ")}`,
      );
      bad += unprefixed.length;
    } else {
      console.log(`ok    ${p}  no commands/; ${names.length} skill name(s) carry the namespace`);
    }
  }
}

console.log(`\n${plugins.length} plugin(s) checked; ${bad} namespace violation(s).`);
process.exit(bad === 0 ? 0 : 1);
