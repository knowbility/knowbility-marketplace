import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { readJson, writeJsonAtomic } from './store.mjs';

export function cleanupPath(manifestPath) {
  return resolve(dirname(manifestPath), 'cleanup-ledger.json');
}

export function readCleanupLedger(manifestPath) {
  try {
    return readJson(cleanupPath(manifestPath));
  } catch {
    return { schema_version: '1.0', run_id: readJson(manifestPath).run_id, entries: [] };
  }
}

export function addCleanup(manifestPath, entry, now = new Date().toISOString()) {
  if (!entry?.kind || !entry?.description || !entry?.cleanup_action) {
    throw new Error('Cleanup kind, description, and cleanup_action are required.');
  }
  const ledger = readCleanupLedger(manifestPath);
  const item = {
    id: entry.id ?? `cleanup-${randomUUID()}`,
    cell_id: entry.cell_id ?? null,
    kind: entry.kind,
    description: entry.description,
    cleanup_action: entry.cleanup_action,
    created_at: now,
    status: 'pending',
    completed_at: null,
    evidence: null,
  };
  ledger.entries.push(item);
  writeJsonAtomic(cleanupPath(manifestPath), ledger);
  return item;
}

export function resolveCleanup(manifestPath, id, status, evidence, now = new Date().toISOString()) {
  if (!['completed', 'waived'].includes(status)) throw new Error('Cleanup status must be completed or waived.');
  if (!evidence?.trim()) throw new Error('Cleanup completion or waiver evidence is required.');
  const ledger = readCleanupLedger(manifestPath);
  const entry = ledger.entries.find((item) => item.id === id);
  if (!entry) throw new Error(`Cleanup entry "${id}" not found.`);
  if (entry.status !== 'pending') throw new Error(`Cleanup entry "${id}" is already ${entry.status}.`);
  entry.status = status;
  entry.completed_at = now;
  entry.evidence = evidence.trim();
  writeJsonAtomic(cleanupPath(manifestPath), ledger);
  return entry;
}

