import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { readJson, writeJsonAtomic, writeTextAtomic } from './store.mjs';

export function evaluateMonitor(manifestPath, now = new Date().toISOString()) {
  const runDir = dirname(manifestPath);
  const qaDir = resolve(runDir, '..', '..');
  const summary = readJson(resolve(runDir, 'run-summary.json'));
  if (!summary.complete) throw new Error('Monitor requires a compiled, complete run.');
  const baselinePath = resolve(qaDir, '.monitor-baseline.json');
  const previous = existsSync(baselinePath) ? readJson(baselinePath) : null;
  const current = Object.fromEntries(summary.scenarios.map((scenario) => [scenario.id, scenario.status]));
  const regressions = previous
    ? summary.scenarios.filter((scenario) => previous.scenarios[scenario.id] === 'passed' && scenario.status !== 'passed')
    : [];
  const monitor = {
    schema_version: '1.0', run_id: summary.run_id, evaluated_at: now,
    baseline_run_id: previous?.run_id ?? null,
    regressions: regressions.map((scenario) => ({ id: scenario.id, name: scenario.name, from: 'passed', to: scenario.status })),
    baseline_updated: summary.overall === 'passed',
  };
  if (monitor.baseline_updated) {
    writeJsonAtomic(baselinePath, { schema_version: '1.0', run_id: summary.run_id, updated_at: now, scenarios: current });
  }
  writeJsonAtomic(resolve(runDir, 'monitor-summary.json'), monitor);
  const alertPath = resolve(runDir, 'monitor-alert.md');
  const text = regressions.length
    ? `# QA Monitor Alert\n\n${regressions.map((item) => `- REGRESSION: ${item.name} (${item.status})`).join('\n')}\n`
    : '# QA Monitor\n\nNo regressions detected.\n';
  writeTextAtomic(alertPath, text);
  return monitor;
}

