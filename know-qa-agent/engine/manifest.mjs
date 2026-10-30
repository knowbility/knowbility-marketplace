#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { parseSpec } from './lib/spec-parser.mjs';
import { buildManifest, validateManifest } from './lib/manifest.mjs';

function arg(flag, fallback = null) {
  const index = process.argv.indexOf(flag);
  return index === -1 ? fallback : process.argv[index + 1];
}
function listArg(flag) {
  const value = arg(flag, '');
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

if (process.argv.includes('--help')) {
  console.log(`Usage: node manifest.mjs --project <path> [options]

Options:
  --spec <name>       One .know-qa spec (without .md); omit for all specs
  --url <base-url>    Override environment/spec base URL
  --tag <a,b>         OR-filter scenarios by tag
  --env <name>        Select a named spec environment
  --area <a,b>        Select one or more configured areas
  --owner <handle>    Select every implemented area owned by a handle
  --run-id <id>       Stable run id override (tests/integration)
  --help              Show this help

Writes .know-qa/runs/<run-id>/run-manifest.json.`);
  process.exit(0);
}

const project = resolve(arg('--project', '.'));
const qaDir = resolve(project, '.know-qa');
const requestedSpec = arg('--spec');
const specPaths = requestedSpec
  ? [resolve(qaDir, requestedSpec.endsWith('.md') ? requestedSpec : `${requestedSpec}.md`)]
  : readdirSync(qaDir)
      .filter((name) => name.endsWith('.md') && !['README.md', 'FINDINGS.md', 'HISTORY.md', 'QA-SESSION-STATE.md'].includes(name))
      .map((name) => resolve(qaDir, name))
      .sort();
if (!specPaths.length) throw new Error(`No QA specs found in ${qaDir}.`);

const sourceContents = new Map();
const specs = specPaths.map((path) => {
  const sourcePath = relative(qaDir, path);
  const content = readFileSync(path, 'utf8');
  sourceContents.set(sourcePath, content);
  return parseSpec(content, sourcePath);
});
const areasPath = resolve(qaDir, 'areas.json');
const areasConfig = existsSync(areasPath)
  ? JSON.parse(readFileSync(areasPath, 'utf8'))
  : { areas: [] };
const now = new Date();
const runId = arg('--run-id', `${now.toISOString().replace(/[:.]/g, '')}-${specs.map((spec) => spec.spec_slug).join('-')}`);
const manifest = validateManifest(buildManifest({
  project,
  specInputs: specs,
  sourceContents,
  tags: listArg('--tag'),
  areaKeys: listArg('--area'),
  owner: arg('--owner'),
  areasConfig,
  environmentName: arg('--env'),
  urlOverride: arg('--url'),
  runId,
  createdAt: now.toISOString(),
}));
const runDir = resolve(qaDir, 'runs', runId);
mkdirSync(resolve(runDir, 'results'), { recursive: true });
const outputPath = resolve(runDir, 'run-manifest.json');
writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(outputPath);
console.log(`${manifest.scenarios.length} scenario(s), ${manifest.cells.length} cell(s), ${manifest.selection.auto_included_dependencies.length} auto-included dependency scenario(s)`);
