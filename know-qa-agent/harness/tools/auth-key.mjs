#!/usr/bin/env node
import { environmentKeyForUrl, normalizeEnvironmentKey } from './lib/auth-profile.mjs';

const envIndex = process.argv.indexOf('--env');
const environment = envIndex !== -1 ? process.argv[envIndex + 1] : null;
const url = process.argv.find((value, index) => index > 1 && process.argv[index - 1] !== '--env' && !value.startsWith('--'));

if (!url) {
  console.error('Usage: node auth-key.mjs <url> [--env <name>]');
  process.exit(1);
}

console.log(environment ? normalizeEnvironmentKey(environment) : environmentKeyForUrl(url));

