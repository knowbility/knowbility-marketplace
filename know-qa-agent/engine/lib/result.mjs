import { resolve, dirname } from 'node:path';
import { readJson, writeJsonAtomic } from './store.mjs';

export const CELL_STATUSES = [
  'pending',
  'running',
  'passed',
  'failed',
  'blocked',
  'skipped',
  'incomplete',
];

const LEGAL_TRANSITIONS = new Map([
  ['pending', new Set(['running', 'blocked', 'skipped'])],
  ['running', new Set(['passed', 'failed', 'blocked', 'incomplete'])],
  ['incomplete', new Set(['running', 'blocked', 'skipped'])],
  ['passed', new Set()],
  ['failed', new Set()],
  ['blocked', new Set()],
  ['skipped', new Set()],
]);

export function assertTransition(from, to) {
  if (!CELL_STATUSES.includes(from) || !CELL_STATUSES.includes(to)) {
    throw new Error(`Unknown status transition ${from} -> ${to}.`);
  }
  if (!LEGAL_TRANSITIONS.get(from).has(to)) {
    throw new Error(`Illegal status transition ${from} -> ${to}.`);
  }
}

export function validateResult(result) {
  const errors = [];
  if (result?.schema_version !== '1.0') errors.push('schema_version must be 1.0');
  for (const key of ['run_id', 'cell_id', 'started_at', 'status']) {
    if (!result?.[key]) errors.push(`${key} is required`);
  }
  if (!['running', 'passed', 'failed', 'blocked', 'skipped', 'incomplete'].includes(result?.status)) {
    errors.push(`invalid result status "${result?.status}"`);
  }
  if (result?.status === 'running' && result?.completed_at !== null) {
    errors.push('running result completed_at must be null');
  }
  if (result?.status !== 'running' && !result?.completed_at) {
    errors.push('terminal result completed_at is required');
  }
  for (const key of ['actions', 'assertions', 'observations', 'evidence', 'findings', 'surfaced_decisions', 'cleanup']) {
    if (!Array.isArray(result?.[key])) errors.push(`${key} must be an array`);
  }
  if (!result?.runtime || typeof result.runtime !== 'object' || Array.isArray(result.runtime)) {
    errors.push('runtime must be an object');
  }
  if (errors.length) throw new Error(`Invalid cell result:\n- ${errors.join('\n- ')}`);
  return result;
}

function deriveScenarioStatus(cells) {
  const statuses = cells.map((cell) => cell.status);
  if (statuses.includes('failed')) return 'failed';
  if (statuses.includes('running')) return 'running';
  if (statuses.every((status) => status === 'passed')) return 'passed';
  if (statuses.some((status) => status === 'pending')) return 'pending';
  if (statuses.includes('incomplete')) return 'incomplete';
  if (statuses.includes('blocked')) return 'blocked';
  if (statuses.every((status) => status === 'skipped')) return 'skipped';
  return 'incomplete';
}

function resultPathFor(manifestPath, cell) {
  return resolve(dirname(manifestPath), cell.result_path);
}

function updateCell(manifest, cellId, nextStatus) {
  const cell = manifest.cells.find((item) => item.id === cellId);
  if (!cell) throw new Error(`Cell "${cellId}" not found.`);
  assertTransition(cell.status, nextStatus);
  cell.status = nextStatus;
  const scenario = manifest.scenarios.find((item) => item.id === cell.scenario_id);
  const scenarioCells = manifest.cells.filter((item) => item.scenario_id === cell.scenario_id);
  scenario.status = deriveScenarioStatus(scenarioCells);
  return cell;
}

export function startCell(manifestPath, cellId, now = new Date().toISOString()) {
  const manifest = readJson(manifestPath);
  const cell = updateCell(manifest, cellId, 'running');
  const result = validateResult({
    schema_version: '1.0',
    run_id: manifest.run_id,
    cell_id: cell.id,
    started_at: now,
    completed_at: null,
    status: 'running',
    actions: [],
    assertions: [],
    observations: [],
    evidence: [],
    findings: [],
    surfaced_decisions: [],
    cleanup: [],
    runtime: {
      node: process.version,
      browser: cell.browser,
      cli_browser: cell.cli_browser,
    },
  });
  writeJsonAtomic(resultPathFor(manifestPath, cell), result);
  writeJsonAtomic(manifestPath, manifest);
  return { manifest, cell, result };
}

export function completeCell(manifestPath, cellId, status, now = new Date().toISOString()) {
  if (!['passed', 'failed', 'blocked', 'incomplete'].includes(status)) {
    throw new Error(`Completion status must be passed, failed, blocked, or incomplete; received "${status}".`);
  }
  const manifest = readJson(manifestPath);
  const cell = manifest.cells.find((item) => item.id === cellId);
  if (!cell) throw new Error(`Cell "${cellId}" not found.`);
  const resultPath = resultPathFor(manifestPath, cell);
  const result = readJson(resultPath);
  if (result.run_id !== manifest.run_id || result.cell_id !== cell.id) {
    throw new Error('Result identity does not match manifest cell.');
  }
  assertTransition(cell.status, status);
  result.status = status;
  result.completed_at = now;
  validateResult(result);
  updateCell(manifest, cellId, status);
  writeJsonAtomic(resultPath, result);
  writeJsonAtomic(manifestPath, manifest);
  return { manifest, cell, result };
}

export function blockCell(manifestPath, cellId, reason, now = new Date().toISOString()) {
  if (!reason?.trim()) throw new Error('A blocking reason is required.');
  const manifest = readJson(manifestPath);
  const cell = updateCell(manifest, cellId, 'blocked');
  const result = validateResult({
    schema_version: '1.0',
    run_id: manifest.run_id,
    cell_id: cell.id,
    started_at: now,
    completed_at: now,
    status: 'blocked',
    actions: [],
    assertions: [],
    observations: [{ kind: 'blocker', reason: reason.trim() }],
    evidence: [],
    findings: [],
    surfaced_decisions: [],
    cleanup: [],
    runtime: {
      node: process.version,
      browser: cell.browser,
      cli_browser: cell.cli_browser,
    },
  });
  writeJsonAtomic(resultPathFor(manifestPath, cell), result);
  writeJsonAtomic(manifestPath, manifest);
  return { manifest, cell, result };
}

export function skipCell(manifestPath, cellId, reason, now = new Date().toISOString()) {
  if (!reason?.trim()) throw new Error('A skip reason is required.');
  const manifest = readJson(manifestPath);
  const cell = updateCell(manifest, cellId, 'skipped');
  const result = validateResult({
    schema_version: '1.0',
    run_id: manifest.run_id,
    cell_id: cell.id,
    started_at: now,
    completed_at: now,
    status: 'skipped',
    actions: [],
    assertions: [],
    observations: [{ kind: 'skip', reason: reason.trim() }],
    evidence: [],
    findings: [],
    surfaced_decisions: [],
    cleanup: [],
    runtime: {
      node: process.version,
      browser: cell.browser,
      cli_browser: cell.cli_browser,
    },
  });
  writeJsonAtomic(resultPathFor(manifestPath, cell), result);
  writeJsonAtomic(manifestPath, manifest);
  return { manifest, cell, result };
}

export function reconcileRun(manifestPath, now = new Date().toISOString()) {
  const manifest = readJson(manifestPath);
  const repaired = [];
  for (const cell of manifest.cells) {
    if (cell.status !== 'running') continue;
    const path = resultPathFor(manifestPath, cell);
    let result;
    try {
      result = readJson(path);
    } catch {
      result = {
        schema_version: '1.0',
        run_id: manifest.run_id,
        cell_id: cell.id,
        started_at: manifest.created_at,
        completed_at: now,
        status: 'incomplete',
        actions: [],
        assertions: [],
        observations: [{ kind: 'recovery', reason: 'Running cell had no readable result after interruption.' }],
        evidence: [],
        findings: [],
        surfaced_decisions: [],
        cleanup: [],
        runtime: { node: process.version, browser: cell.browser, cli_browser: cell.cli_browser },
      };
    }
    result.status = 'incomplete';
    result.completed_at = now;
    result.observations = Array.isArray(result.observations) ? result.observations : [];
    result.observations.push({ kind: 'recovery', reason: 'Running cell reconciled after interruption.' });
    validateResult(result);
    cell.status = 'incomplete';
    writeJsonAtomic(path, result);
    repaired.push(cell.id);
  }
  for (const scenario of manifest.scenarios) {
    scenario.status = deriveScenarioStatus(manifest.cells.filter((cell) => cell.scenario_id === scenario.id));
  }
  if (repaired.length) writeJsonAtomic(manifestPath, manifest);
  return repaired;
}

export function nextRunnableCell(manifestPath) {
  reconcileRun(manifestPath);
  let manifest = readJson(manifestPath);
  const scenarioById = new Map(manifest.scenarios.map((scenario) => [scenario.id, scenario]));

  for (const scenario of manifest.scenarios) {
    const failedDependency = scenario.depends_on
      .map((id) => scenarioById.get(id))
      .find((dependency) => dependency && ['failed', 'blocked', 'skipped'].includes(dependency.status));
    if (!failedDependency) continue;
    for (const cell of manifest.cells.filter((item) =>
      item.scenario_id === scenario.id && ['pending', 'incomplete'].includes(item.status))) {
      skipCell(manifestPath, cell.id, `Dependency "${failedDependency.name}" ended ${failedDependency.status}.`);
    }
    manifest = readJson(manifestPath);
  }

  for (const cell of manifest.cells) {
    if (!['pending', 'incomplete'].includes(cell.status)) continue;
    const scenario = scenarioById.get(cell.scenario_id);
    const dependenciesReady = scenario.depends_on.every((id) => scenarioById.get(id)?.status === 'passed');
    if (dependenciesReady) return cell;
  }
  return null;
}

export function blockUnavailableBrowsers(manifestPath, availableBrowsers) {
  const available = new Set(availableBrowsers);
  const supported = new Set(['chrome', 'firefox', 'webkit']);
  for (const browser of available) {
    if (!supported.has(browser)) throw new Error(`Unsupported available-browser value "${browser}".`);
  }
  const snapshot = readJson(manifestPath);
  const blocked = [];
  for (const cell of snapshot.cells) {
    if (!['pending', 'incomplete'].includes(cell.status)) continue;
    if (available.has(cell.cli_browser)) continue;
    blockCell(
      manifestPath,
      cell.id,
      `Requested browser "${cell.browser}" is unavailable on this host.`,
    );
    blocked.push(cell.id);
  }
  return blocked;
}
