import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { readCleanupLedger } from './cleanup.mjs';
import { readJson, writeJsonAtomic, writeTextAtomic } from './store.mjs';
import { validateManifest } from './manifest.mjs';
import { validateResult } from './result.mjs';
import { sanitizeDerived } from './sanitize.mjs';

function counts(items, key = 'status') {
  return items.reduce((out, item) => {
    out[item[key]] = (out[item[key]] ?? 0) + 1;
    return out;
  }, {});
}

function findingKey(finding) {
  return (finding.dedup_key ?? `${finding.title ?? ''}|${finding.root_cause_hypothesis ?? ''}`)
    .toLowerCase().replace(/\s+/g, ' ').trim();
}

const FINDING_FIELDS = [
  'title', 'severity', 'confidence', 'reliability', 'disposition', 'symptom',
  'expected', 'actual', 'root_cause_hypothesis', 'evidence', 'duplicate_of',
  'area', 'owner',
];

function loadRegistry(qaDir) {
  const path = resolve(qaDir, 'findings-registry.json');
  if (existsSync(path)) return readJson(path);
  const markdownPath = resolve(qaDir, 'FINDINGS.md');
  if (existsSync(markdownPath) && /^## F-\d{8}-\d+/m.test(readFileSync(markdownPath, 'utf8'))) {
    throw new Error('Existing FINDINGS.md entries require explicit migration before the structured registry can be created.');
  }
  return { schema_version: '1.0', next_sequence: 1, findings: [] };
}

function updateRegistry(qaDir, results, manifest, now) {
  const registry = loadRegistry(qaDir);
  const byKey = new Map(registry.findings.map((finding) => [finding.dedup_key, finding]));
  for (const result of results) {
    const cell = manifest.cells.find((item) => item.id === result.cell_id);
    const scenario = manifest.scenarios.find((item) => item.id === cell.scenario_id);
    for (const rawSource of result.findings) {
      const source = sanitizeDerived(rawSource);
      if (!source?.title || !source?.severity || !source?.confidence || !source?.disposition) {
        throw new Error(`${result.cell_id}: finding requires title, severity, confidence, and disposition.`);
      }
      const key = findingKey(source);
      let finding = byKey.get(key);
      if (!finding) {
        const date = now.slice(0, 10).replaceAll('-', '');
        finding = {
          id: `F-${date}-${String(registry.next_sequence++).padStart(2, '0')}`,
          dedup_key: key,
          status: 'open',
          first_seen: now,
          occurrences: 0,
        };
        registry.findings.push(finding);
        byKey.set(key, finding);
      }
      const accepted = Object.fromEntries(FINDING_FIELDS
        .filter((field) => source[field] !== undefined)
        .map((field) => [field, source[field]]));
      Object.assign(finding, accepted, {
        dedup_key: key,
        last_seen: now,
        occurrences: finding.occurrences,
        area: source.area ?? scenario.area,
        owner: source.owner ?? scenario.owner,
        cells: [...new Set([...(finding.cells ?? []), result.cell_id])],
      });
      finding.seen_occurrences = finding.seen_occurrences ?? [];
      const occurrence = `${manifest.run_id}:${result.cell_id}:${key}`;
      if (!finding.seen_occurrences.includes(occurrence)) {
        finding.seen_occurrences.push(occurrence);
        finding.occurrences += 1;
      }
    }
  }
  writeJsonAtomic(resolve(qaDir, 'findings-registry.json'), registry);
  return registry;
}

function renderFindings(registry) {
  const lines = ['# QA Findings', '', '> Generated from `.know-qa/findings-registry.json`. Edit the registry through the QA workflow, not this view.', ''];
  for (const item of registry.findings) {
    lines.push(`## ${item.id} — ${item.title}`, '', `- **Status**: ${item.status}`);
    for (const key of ['disposition', 'severity', 'confidence', 'reliability', 'area', 'owner', 'symptom', 'expected', 'actual', 'root_cause_hypothesis', 'first_seen', 'last_seen', 'occurrences']) {
      if (item[key] !== undefined && item[key] !== null) lines.push(`- **${key}**: ${item[key]}`);
    }
    lines.push('');
  }
  return `${lines.join('\n')}\n`;
}

export function compileRun(manifestPath, now = new Date().toISOString()) {
  const manifest = validateManifest(readJson(manifestPath));
  const runDir = dirname(manifestPath);
  const qaDir = resolve(runDir, '..', '..');
  const results = [];
  const missing_results = [];
  for (const cell of manifest.cells) {
    const path = resolve(runDir, cell.result_path);
    if (!existsSync(path)) {
      if (cell.status !== 'pending') missing_results.push(cell.id);
      continue;
    }
    const result = validateResult(readJson(path));
    if (result.cell_id !== cell.id || result.status !== cell.status) {
      throw new Error(`${cell.id}: manifest/result status or identity mismatch.`);
    }
    results.push(result);
  }
  if (missing_results.length) throw new Error(`Missing results: ${missing_results.join(', ')}`);
  const cleanup = readCleanupLedger(manifestPath);
  const registry = updateRegistry(qaDir, results, manifest, now);
  const scenarioCounts = counts(manifest.scenarios);
  const cellCounts = counts(manifest.cells);
  const pendingCleanup = cleanup.entries.filter((item) => item.status === 'pending');
  const complete = !manifest.cells.some((cell) => ['pending', 'running', 'incomplete'].includes(cell.status));
  const overall = !complete ? 'incomplete'
    : cellCounts.failed ? 'failed'
    : !(cellCounts.passed) && ((cellCounts.blocked ?? 0) + (cellCounts.skipped ?? 0) === manifest.cells.length) ? 'blocked'
    : cellCounts.blocked || cellCounts.skipped || pendingCleanup.length ? 'pass-with-concerns'
    : 'passed';
  const summary = {
    schema_version: '1.0', run_id: manifest.run_id, compiled_at: now,
    environment: manifest.environment, overall, complete,
    scenario_counts: scenarioCounts, cell_counts: cellCounts,
    pending_cleanup: pendingCleanup, findings_seen: results.reduce((n, result) => n + result.findings.length, 0),
    scenarios: manifest.scenarios.map((scenario) => ({ id: scenario.id, name: scenario.name, status: scenario.status })),
  };
  writeJsonAtomic(resolve(runDir, 'run-summary.json'), summary);
  const report = [
    `# QA Run ${manifest.run_id}`, '',
    `- **Compiled**: ${now}`, `- **URL**: ${manifest.environment.base_url}`,
    `- **Overall**: ${overall}`, `- **Cells**: ${JSON.stringify(cellCounts)}`,
    `- **Pending cleanup**: ${pendingCleanup.length}`, '',
    '## Scenarios', '',
    ...summary.scenarios.map((item) => `- ${item.status.toUpperCase()} — ${item.name}`),
    '', '## Findings observed', '',
    ...results.flatMap((result) => result.findings.map((finding) => `- **${finding.severity}/${finding.confidence}** ${finding.title} (${result.cell_id})`)),
    ...(summary.findings_seen ? [] : ['- None']),
    '',
  ].join('\n');
  writeTextAtomic(resolve(runDir, 'report.md'), report);
  writeTextAtomic(resolve(qaDir, 'reports', `${manifest.run_id}.md`), report);
  writeTextAtomic(resolve(qaDir, 'FINDINGS.md'), renderFindings(registry));
  const historyPath = resolve(qaDir, 'HISTORY.md');
  const marker = `<!-- run:${manifest.run_id} -->`;
  const oldHistory = existsSync(historyPath) ? readFileSync(historyPath, 'utf8') : '# QA History\n';
  if (!oldHistory.includes(marker)) {
    writeTextAtomic(historyPath, `${oldHistory.trimEnd()}\n\n${marker}\n## Run: ${now}\n- **Run ID**: ${manifest.run_id}\n- **URL**: ${manifest.environment.base_url}\n- **Overall**: ${overall}\n- **Results**: ${cellCounts.passed ?? 0} passed, ${cellCounts.failed ?? 0} failed, ${(cellCounts.blocked ?? 0) + (cellCounts.skipped ?? 0)} concerns\n`);
  }
  return summary;
}
