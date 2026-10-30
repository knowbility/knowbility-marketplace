import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { writeJsonAtomic } from './store.mjs';

function commandAvailable(command) {
  try {
    execFileSync('/usr/bin/which', [command], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function detectCapabilities(project, env = process.env, now = new Date().toISOString()) {
  const browserOverride = env.QA_AVAILABLE_BROWSERS;
  const availableBrowsers = browserOverride === undefined
    ? ['chrome', 'firefox', 'webkit'].filter((browser) =>
      browser === 'chrome'
        ? ['/Applications/Google Chrome.app', '/Applications/Chromium.app'].some(existsSync)
        : commandAvailable('playwright-cli'))
    : browserOverride.split(',').map((item) => item.trim()).filter(Boolean);
  const playwright = commandAvailable('playwright-cli');
  const chrome = availableBrowsers.includes('chrome');
  const nativeLoop = env.QA_NATIVE_LOOP === '1';
  const report = {
    schema_version: '1.0', detected_at: now, node: process.version,
    playwright_cli: playwright, available_browsers: availableBrowsers,
    modes: {
      manifest: true, reporting: true,
      autonomous_browser: playwright,
      paired_browser: chrome,
      native_monitor_loop: nativeLoop,
      external_sinks: 'connector-dependent',
      tracker_filing: 'connector-dependent',
    },
    degradations: [
      ...(!playwright ? ['Autonomous browser execution unavailable; use paired Chrome or generate plans/reports only.'] : []),
      ...(!chrome ? ['Paired Chrome execution unavailable on this host.'] : []),
      ...(!nativeLoop ? ['Native recurring monitor loop unavailable; invoke monitor from an external scheduler.'] : []),
    ],
  };
  writeJsonAtomic(resolve(project, '.know-qa', 'capabilities.json'), report);
  return report;
}
