#!/usr/bin/env node
// check-channel-routing.mjs
//
// Checks that a plugin's source-discovery routing actually resolves: every channel a
// type-channel map activates has a playbook on disk, every playbook is reachable from at
// least one map, each playbook's three identifiers agree, and the resolver skill carries a
// section for every channel it can be asked to run.
//
// It exists because know-researcher 1.19.0 fixed five routing lines that asked the
// `regulatory` channel for technical standards and regulation text, which that channel does
// not implement — and nothing in the repo could have noticed. That particular defect is
// still beyond a static check (see "What it CANNOT find"), but the structural failures
// around it are not, and three of the four checks below are one edit away from happening:
// add a channel to a map and forget the playbook, rename a playbook and orphan the maps
// pointing at it, or ship a playbook and a map entry and forget the resolver's tool
// guidance for it. The last one is the step that was done by hand in 1.19.0.
//
// Resolution is by FILENAME. The resolver reads `channel-playbooks/{channel-name}.md` where
// {channel-name} comes from a map's `active-channels` frontmatter, so the filename is
// canonical and the `name:` and `channel-type:` fields are documentation. They are checked
// because a reader who trusts a stale `channel-type:` is misled about which file runs.
//
// Usage:
//   node dev/scripts/check-channel-routing.mjs
//
// Exit 0 when every plugin's routing resolves, 1 otherwise.
//
// What it CANNOT find:
//   - A channel that resolves but whose playbook does not implement what the map asks it
//     for. This is the 1.19.0 defect exactly: market-industry.md listed `regulatory` in
//     active-channels, regulatory.md existed, its name and channel-type agreed, and the
//     routing was still wrong, because the map asked that channel for standards text and
//     the channel is SEC EDGAR and ProPublica 990s. Every check here passes on that tree.
//     Matching a request to a channel's actual capability is a reading job.
//   - A channel named in a map's PROSE rather than its frontmatter. Tried and rejected: a
//     naive version flagged three files, and all three were "Channel scope note" lines that
//     name a channel in order to say it is EXCLUDED ("Academic and regulatory channels are
//     excluded"). Separating that from a real mis-route means parsing English negation,
//     which fails in both directions — so prose routing is unverified here, and the body of
//     a map is still something a person has to read.
//   - Whether a channel SHOULD be active for a research type. Presence is structural;
//     suitability is editorial.
//   - A playbook whose query templates are wrong, stale, or were never run. Those are facts
//     about the outside world and no static check reaches them.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

const DISCOVERY = join("reference", "discovery");
const PLAYBOOKS = join(DISCOVERY, "channel-playbooks");
const MAPS = join(DISCOVERY, "type-channel-maps");

// Read the frontmatter block (between the first two --- fences) of a markdown file.
function frontmatter(file) {
  const text = readFileSync(file, "utf8");
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  return { fm: m ? m[1] : "", text };
}

function scalar(fm, key) {
  const m = new RegExp(`^${key}:\\s*(.+)$`, "m").exec(fm);
  return m ? m[1].trim() : null;
}

// A YAML block list: `active-channels:` followed by `  - name` lines.
function list(fm, key) {
  const m = new RegExp(`^${key}:\\s*\\r?\\n((?:[ \\t]*-[ \\t]*\\S+\\r?\\n?)+)`, "m").exec(fm);
  if (!m) return null;
  return m[1]
    .split(/\r?\n/)
    .map((l) => l.replace(/^[ \t]*-[ \t]*/, "").trim())
    .filter(Boolean);
}

const plugins = readdirSync(repoRoot, { withFileTypes: true })
  .filter((e) => e.isDirectory() && !e.name.startsWith("."))
  .map((e) => e.name)
  .filter((n) => existsSync(join(repoRoot, n, PLAYBOOKS)) && existsSync(join(repoRoot, n, MAPS)));

if (plugins.length === 0) {
  // No plugin ships this structure. Not a failure — the pattern is know-researcher's, and a
  // marketplace without it is a legitimate state.
  console.log("No plugin ships a discovery channel structure; nothing to check.");
  process.exit(0);
}

let failures = 0;

for (const plugin of plugins) {
  const pbDir = join(repoRoot, plugin, PLAYBOOKS);
  const mapDir = join(repoRoot, plugin, MAPS);

  const playbooks = readdirSync(pbDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => basename(f, ".md"))
    .sort();
  const maps = readdirSync(mapDir).filter((f) => f.endsWith(".md")).sort();

  console.log(`\n${plugin}  ${playbooks.length} playbook(s), ${maps.length} type-channel map(s)`);

  // --- Check 3: playbook identity. Filename is canonical; name and channel-type must agree.
  for (const pb of playbooks) {
    const { fm } = frontmatter(join(pbDir, `${pb}.md`));
    const name = scalar(fm, "name");
    const type = scalar(fm, "channel-type");
    const problems = [];
    if (name !== pb) problems.push(`name: "${name}"`);
    if (type !== pb) problems.push(`channel-type: "${type}"`);
    if (problems.length) {
      console.error(
        `FAIL  ${plugin}  playbook ${pb}.md resolves by filename "${pb}" but declares ` +
          problems.join(", ") +
          ` — a reader trusting the frontmatter is told the wrong file runs`,
      );
      failures++;
    }
  }

  // --- Check 1: every activated channel resolves to a playbook file.
  const referenced = new Set();
  for (const mapFile of maps) {
    const { fm } = frontmatter(join(mapDir, mapFile));
    const active = list(fm, "active-channels");
    if (active === null) {
      console.error(
        `FAIL  ${plugin}  ${mapFile} has no active-channels list in its frontmatter, so the ` +
          `resolver reads it and activates nothing`,
      );
      failures++;
      continue;
    }
    const dangling = active.filter((c) => !playbooks.includes(c));
    for (const c of dangling) {
      console.error(
        `FAIL  ${plugin}  ${mapFile} activates "${c}" but ${PLAYBOOKS}/${c}.md does not exist`,
      );
      failures++;
    }
    active.forEach((c) => referenced.add(c));
    if (dangling.length === 0) {
      console.log(`ok    ${plugin}  ${mapFile}  ${active.length} channel(s) resolve`);
    }
  }

  // --- Check 2: every playbook is reachable from at least one map.
  const orphans = playbooks.filter((pb) => !referenced.has(pb));
  for (const pb of orphans) {
    console.error(
      `FAIL  ${plugin}  playbook ${pb}.md is in no map's active-channels, so no research ` +
        `type can reach it`,
    );
    failures++;
  }

  // --- Check 4: the resolver skill carries a section for every channel it can be asked to run.
  const skillsDir = join(repoRoot, plugin, "skills");
  const resolvers = existsSync(skillsDir)
    ? readdirSync(skillsDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => join(skillsDir, d.name, "SKILL.md"))
        .filter((f) => existsSync(f) && readFileSync(f, "utf8").includes("channel-playbooks"))
    : [];

  if (resolvers.length === 0) {
    console.error(
      `FAIL  ${plugin}  ships ${playbooks.length} playbook(s) but no skill references ` +
        `channel-playbooks, so nothing reads them`,
    );
    failures++;
  }
  for (const r of resolvers) {
    const text = readFileSync(r, "utf8");
    const rel = r.slice(repoRoot.length + 1);
    const missing = playbooks.filter((pb) => !text.includes(`channel-type: ${pb}`));
    if (missing.length) {
      console.error(
        `FAIL  ${plugin}  ${rel} has no "(channel-type: <name>)" section for: ` +
          `${missing.join(", ")} — the channel resolves to a playbook the resolver gives no ` +
          `tool guidance for`,
      );
      failures += missing.length;
    } else {
      console.log(
        `ok    ${plugin}  ${rel}  covers all ${playbooks.length} channel(s)`,
      );
    }
  }
}

if (failures > 0) {
  console.error(`\n${failures} routing check(s) failed.`);
  process.exit(1);
}
console.log(
  `\n${plugins.length} plugin(s) checked; every activated channel resolves, every playbook is ` +
    `reachable, and the resolver covers all of them.`,
);
