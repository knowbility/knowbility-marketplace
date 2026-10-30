#!/usr/bin/env node
import { resolve } from 'node:path';
import { compileRun } from './lib/compile.mjs';
const index = process.argv.indexOf('--manifest');
if (index === -1 || !process.argv[index + 1]) throw new Error('--manifest is required.');
console.log(JSON.stringify(compileRun(resolve(process.argv[index + 1])), null, 2));
