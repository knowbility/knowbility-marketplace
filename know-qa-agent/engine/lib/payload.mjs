import { dirname, resolve } from 'node:path';
import { readJson, writeJsonAtomic } from './store.mjs';

const SECRET_KEY = /^(password|token|secret|authorization|cookie|api[_-]?key)$/i;
const SECRET_VALUE = /\b(Bearer|Basic)\s+(?!\[REDACTED\])[A-Za-z0-9._~+/=-]+|\b(password|token|secret|authorization)\s*[:=]\s*(?!\[REDACTED\]|%5BREDACTED%5D)[^\s]+/i;
function assertSafe(value, path = 'payload') {
  if (typeof value === 'string' && SECRET_VALUE.test(value)) throw new Error(`${path} contains secret-like text.`);
  if (Array.isArray(value)) value.forEach((item, index) => assertSafe(item, `${path}[${index}]`));
  else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      if (SECRET_KEY.test(key)) throw new Error(`${path}.${key} is a restricted field.`);
      assertSafe(item, `${path}.${key}`);
    }
  }
}

export function buildPayload(manifestPath, type) {
  if (!['sink', 'filing'].includes(type)) throw new Error('Payload type must be sink or filing.');
  const runDir = dirname(manifestPath);
  const summary = readJson(resolve(runDir, 'run-summary.json'));
  const manifest = readJson(manifestPath);
  const registry = readJson(resolve(runDir, '..', '..', 'findings-registry.json'));
  const eligible = registry.findings.filter((finding) =>
    finding.seen_occurrences?.some((occurrence) => occurrence.startsWith(`${manifest.run_id}:`))
    && (type === 'sink' || (
      finding.disposition === 'defect'
      && ['high', 'medium'].includes(String(finding.confidence).toLowerCase())
      && !finding.duplicate_of
    )));
  const payload = {
    schema_version: '1.0', type, run_id: manifest.run_id, overall: summary.overall,
    environment_name: manifest.environment.name, base_url: manifest.environment.base_url,
    counts: summary.cell_counts,
    findings: eligible.map(({ id, title, severity, confidence, reliability, symptom, expected, actual, area, owner, disposition }) =>
      ({ id, title, severity, confidence, reliability, symptom, expected, actual, area, owner, disposition })),
  };
  assertSafe(payload);
  writeJsonAtomic(resolve(runDir, 'payloads', `${type}.json`), payload);
  return payload;
}
