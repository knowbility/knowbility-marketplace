#!/usr/bin/env node
import { resolve } from 'node:path';
import { detectCapabilities } from './lib/capabilities.mjs';
const index = process.argv.indexOf('--project');
console.log(JSON.stringify(detectCapabilities(resolve(index === -1 ? '.' : process.argv[index + 1])), null, 2));
