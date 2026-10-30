#!/usr/bin/env node
import { resolve } from 'node:path';
import { addCleanup, readCleanupLedger, resolveCleanup } from './lib/cleanup.mjs';

const arg = (flag, fallback = null) => {
  const index = process.argv.indexOf(flag);
  return index === -1 ? fallback : process.argv[index + 1];
};
const command = process.argv[2];
if (!command || process.argv.includes('--help')) {
  console.log('Usage: node cleanup.mjs <add|complete|waive|list> --manifest <path> [options]');
  process.exit(command ? 0 : 2);
}
const manifestPath = resolve(arg('--manifest'));
if (command === 'list') console.log(JSON.stringify(readCleanupLedger(manifestPath), null, 2));
else if (command === 'add') {
  console.log(JSON.stringify(addCleanup(manifestPath, {
    id: arg('--id'), cell_id: arg('--cell'), kind: arg('--kind'),
    description: arg('--description'), cleanup_action: arg('--action'),
  }), null, 2));
} else if (['complete', 'waive'].includes(command)) {
  console.log(JSON.stringify(resolveCleanup(manifestPath, arg('--id'), command === 'complete' ? 'completed' : 'waived', arg('--evidence')), null, 2));
} else throw new Error(`Unknown cleanup command "${command}".`);

