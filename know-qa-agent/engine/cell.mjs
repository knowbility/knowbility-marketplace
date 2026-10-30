#!/usr/bin/env node
import { resolve } from 'node:path';
import {
  startCell,
  completeCell,
  blockCell,
  skipCell,
  reconcileRun,
  nextRunnableCell,
  validateResult,
} from './lib/result.mjs';
import { readJson } from './lib/store.mjs';

function arg(flag, fallback = null) {
  const index = process.argv.indexOf(flag);
  return index === -1 ? fallback : process.argv[index + 1];
}

const command = process.argv[2];
if (!command || process.argv.includes('--help')) {
  console.log(`Usage:
  node cell.mjs start    --manifest <path> --cell <id>
  node cell.mjs complete --manifest <path> --cell <id> --status <passed|failed|blocked|incomplete>
  node cell.mjs block    --manifest <path> --cell <id> --reason <text>
  node cell.mjs skip     --manifest <path> --cell <id> --reason <text>
  node cell.mjs reconcile --manifest <path>
  node cell.mjs next      --manifest <path>
  node cell.mjs validate --result <path>`);
  process.exit(command ? 0 : 2);
}

if (command === 'validate') {
  const path = resolve(arg('--result'));
  validateResult(readJson(path));
  console.log(`VALID ${path}`);
  process.exit(0);
}

const manifestPath = resolve(arg('--manifest'));
if (command === 'reconcile') {
  const repaired = reconcileRun(manifestPath);
  console.log(`${repaired.length} interrupted cell(s) reconciled`);
  process.exit(0);
}
if (command === 'next') {
  const cell = nextRunnableCell(manifestPath);
  console.log(cell ? JSON.stringify(cell) : 'DONE');
  process.exit(0);
}
const cellId = arg('--cell');
if (!cellId) throw new Error('--cell is required.');

let output;
if (command === 'start') output = startCell(manifestPath, cellId);
else if (command === 'complete') output = completeCell(manifestPath, cellId, arg('--status'));
else if (command === 'block') output = blockCell(manifestPath, cellId, arg('--reason'));
else if (command === 'skip') output = skipCell(manifestPath, cellId, arg('--reason'));
else throw new Error(`Unknown cell command "${command}".`);

console.log(`${output.cell.id}: ${output.cell.status}`);
