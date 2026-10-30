#!/usr/bin/env node
import { resolve } from 'node:path';
import { blockUnavailableBrowsers } from './lib/result.mjs';

function arg(flag, fallback = null) {
  const index = process.argv.indexOf(flag);
  return index === -1 ? fallback : process.argv[index + 1];
}

if (process.argv.includes('--help')) {
  console.log(`Usage:
  node browser-preflight.mjs --manifest <path> --available <chrome,firefox,webkit>

Marks every pending/incomplete cell whose cli_browser is absent as blocked.
Detection of installed browsers is host-specific; this command records the
resolved capability set without shrinking the manifest.`);
  process.exit(0);
}

const manifestPath = resolve(arg('--manifest'));
const available = arg('--available', '').split(',').map((item) => item.trim()).filter(Boolean);
const blocked = blockUnavailableBrowsers(manifestPath, available);

console.log(`${blocked.length} cell(s) blocked; available browsers: ${available.join(', ') || 'none'}`);
