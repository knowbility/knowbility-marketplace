#!/usr/bin/env node
import { resolve } from 'node:path';
import { buildPayload } from './lib/payload.mjs';
const arg = (flag) => {
  const index = process.argv.indexOf(flag);
  return index === -1 ? null : process.argv[index + 1];
};
console.log(JSON.stringify(buildPayload(resolve(arg('--manifest')), arg('--type')), null, 2));

