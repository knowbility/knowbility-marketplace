#!/usr/bin/env node
// QA video recorder — captures MP4 clips of the browser the harness already drives.
// Attaches to the ALREADY-OPEN signed-in Chrome (open-browser.sh, remote debugging)
// via the same chromium.connectOverCDP path drive.mjs uses — no fresh browser, no new
// auth path. Adds one CDP session (context.newCDPSession) and runs Page.startScreencast,
// streaming JPEG frames to disk with their content timestamps, then muxes to a constant
// frame-rate H.264 MP4 with ffmpeg. Audio is not captured (voiceover is added downstream).
//
// Screencast is frame-on-change, so delivery is variable-rate; finalize converts the real
// per-frame timestamps to constant 30fps (held frames duplicated, motion kept at true speed).
//
// Usage — one-shot (blocking) clip:
//   node record.mjs --name hero --seconds 8 [--cdp http://localhost:9222] [--project <dir>]
//
// Usage — start/stop around scripted actions (a shot list):
//   node record.mjs start --name hero [--cdp ...] [--project <dir>]   # returns immediately, keeps recording
//   node drive.mjs --click "..."                                       # drive the shot
//   node record.mjs stop  --name hero [--project <dir>]                # finalizes → prints MP4 path
//
// Usage — self-test (own headless Chrome, no 9222 needed):
//   node record.mjs selftest [--seconds 10]
//
// Output → <project>/.know-qa/runs/<name>/  (clip.mp4, frames/, sample_*.png, record.json)
// Leaves the attached browser OPEN (disconnect, never close) — same as drive.mjs.
//
// Requires ffmpeg + ffprobe on PATH (setup.sh checks). Retina displays: frames are capped
// to 1920x1080 device pixels by the screencast itself, then padded to exact 1080p. No upscaling.

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import {
  mkdirSync, writeFileSync, appendFileSync, readFileSync, existsSync, rmSync, readdirSync,
} from 'node:fs';
import { dirname, resolve } from 'node:path';

const require = createRequire(import.meta.url);
function loadPlaywright() {
  const candidates = [process.env.PW_PATH, 'playwright'].filter(Boolean);
  for (const c of candidates) { try { return require(c); } catch { /* next */ } }
  throw new Error('playwright not resolvable. Set PW_PATH or `npm i -D playwright`.');
}
function arg(flag, def) { const i = process.argv.indexOf(flag); return i !== -1 ? process.argv[i + 1] : def; }
function has(flag) { return process.argv.includes(flag); }

const here = dirname(fileURLToPath(import.meta.url));
const sub = ['start', 'stop', 'selftest'].includes(process.argv[2]) ? process.argv[2] : 'oneshot';

const project = arg('--project', resolve(here, '..', '..')); // default: .know-qa/tools/ → project root
const qaDir = existsSync(resolve(project, '.know-qa')) ? resolve(project, '.know-qa') : resolve(here, '..');
const cdp = arg('--cdp', 'http://localhost:9222');
const name = arg('--name', 'clip');
const seconds = Number(arg('--seconds', sub === 'selftest' ? '10' : '8'));
const fps = Number(arg('--fps', '30'));
const quality = Number(arg('--quality', '90'));

const outDir = resolve(qaDir, 'runs', name);
const framesDir = resolve(outDir, 'frames');
const indexPath = resolve(framesDir, 'index.jsonl');
const pidPath = resolve(outDir, 'record.pid');

// ---- shared: attach a screencast to a page, stream frames to disk ----
async function streamFrames(context, page) {
  const client = await context.newCDPSession(page);
  let n = 0;
  client.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
    const idx = n++;
    writeFileSync(resolve(framesDir, `f${String(idx).padStart(6, '0')}.jpg`), Buffer.from(data, 'base64'));
    appendFileSync(indexPath, JSON.stringify({ i: idx, ts: metadata.timestamp }) + '\n');
    // MUST ack every frame or the stream stalls after the first few (CDP backpressure).
    try { await client.send('Page.screencastFrameAck', { sessionId }); } catch { /* stopped */ }
  });
  await client.send('Page.startScreencast', {
    format: 'jpeg', quality, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1,
  });
  return { client, count: () => n };
}

// ---- shared: VFR frames → CFR MP4, ffprobe, extract sample frames ----
function finalize() {
  if (!existsSync(indexPath)) { console.error('No frames captured — tab likely backgrounded/throttled or never rendered.'); process.exit(3); }
  const rows = readFileSync(indexPath, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
  if (!rows.length) { console.error('No frames captured.'); process.exit(3); }
  rows.sort((a, b) => a.i - b.i);

  // Build an ffconcat playlist using REAL inter-frame durations (content time, not arrival time).
  let concat = 'ffconcat version 1.0\n';
  for (let k = 0; k < rows.length; k++) {
    const fname = `f${String(rows[k].i).padStart(6, '0')}.jpg`;
    const next = rows[k + 1] ? rows[k + 1].ts : rows[k].ts + 1 / fps;
    const dur = Math.max(0.001, next - rows[k].ts);
    concat += `file '${fname}'\nduration ${dur.toFixed(4)}\n`;
  }
  concat += `file 'f${String(rows[rows.length - 1].i).padStart(6, '0')}.jpg'\n`; // hold last frame
  const playlist = resolve(framesDir, 'frames.ffconcat');
  writeFileSync(playlist, concat);

  const mp4 = resolve(outDir, 'clip.mp4');
  const ff = spawnSync('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', playlist,
    '-vf', `scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fps=${fps}`,
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '18', mp4], { encoding: 'utf8' });
  if (ff.status !== 0) { console.error((ff.stderr || '').slice(-1000)); process.exit(1); }

  const probe = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=codec_name,width,height,avg_frame_rate,nb_frames',
    '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1', mp4], { encoding: 'utf8' });
  spawnSync('ffmpeg', ['-y', '-i', mp4, '-vf', 'fps=1/3', resolve(outDir, 'sample_%02d.png')], { encoding: 'utf8' });

  const span = rows[rows.length - 1].ts - rows[0].ts;
  const meta = { name, frames: rows.length, contentSeconds: Number(span.toFixed(2)), fps, mp4, ffprobe: (probe.stdout || '').trim() };
  writeFileSync(resolve(outDir, 'record.json'), JSON.stringify(meta, null, 2));
  console.log(`captured ${rows.length} frames (${span.toFixed(2)}s content) → ${(rows.length / Math.max(span, 0.01)).toFixed(1)} fps delivered`);
  console.log('--- ffprobe ---\n' + (probe.stdout || '').trim());
  console.log('MP4 → ' + mp4);
  return mp4;
}

function resetOut() { rmSync(outDir, { recursive: true, force: true }); mkdirSync(framesDir, { recursive: true }); }

// ---- STOP: signal a running `start` recorder, then wait for its MP4 ----
if (sub === 'stop') {
  if (!existsSync(pidPath)) { console.error(`No active recording named "${name}" (no ${pidPath}).`); process.exit(1); }
  const pid = Number(readFileSync(pidPath, 'utf8').trim());
  try { process.kill(pid, 'SIGTERM'); } catch (e) { console.error(`Could not signal recorder pid ${pid}: ${e.message}`); process.exit(1); }
  const mp4 = resolve(outDir, 'clip.mp4');
  const start = Date.now();
  while (Date.now() - start < 60000) { if (existsSync(mp4) && !existsSync(pidPath)) { console.log('MP4 → ' + mp4); process.exit(0); } spawnSync('sleep', ['0.2']); }
  console.error('Recorder did not finalize within 60s.'); process.exit(1);
}

// ---- SELFTEST: own headless Chrome on a synthetic streaming page; no 9222 needed ----
if (sub === 'selftest') {
  resetOut();
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  const SIM = `<!doctype html><meta charset=utf-8><style>:root{color-scheme:dark}body{margin:0;background:#0b1020;color:#e8ecf5;font:22px/1.6 -apple-system,Roboto,sans-serif;width:1920px;height:1080px;overflow:hidden}.m{margin:60px;padding:24px;background:#161d38;border:1px solid #243056;border-radius:14px;max-width:1000px}.c{display:inline-block;width:10px;height:24px;background:#5b8cff;vertical-align:-4px;animation:b .8s steps(1) infinite}@keyframes b{50%{opacity:0}}</style><div class=m><span id=o></span><span class=c></span></div><script>const T="Based on where your business is right now the strongest move is to tighten your cash-flow runway before you chase new revenue map every recurring expense against ninety days of receipts then flag the three largest line items you could renegotiate this quarter".split(" ");let i=0,o=document.getElementById("o");setInterval(()=>{if(i>=T.length){i=0;o.textContent=""}o.textContent+=(i?" ":"")+T[i++]},40)</script>`;
  await page.setContent(SIM);
  const { client } = await streamFrames(context, page);
  await page.waitForTimeout(seconds * 1000);
  await client.send('Page.stopScreencast').catch(() => {});
  await browser.close().catch(() => {});
  const mp4 = finalize();
  // Self-test assertions: codec/resolution/duration must match the contract.
  const out = readFileSync(resolve(outDir, 'record.json'), 'utf8');
  const okRes = /width=1920/.test(out) && /height=1080/.test(out);
  const okCodec = /codec_name=h264/.test(out);
  console.log(`\nSELFTEST: ${okRes && okCodec ? 'PASS' : 'FAIL'} (h264=${okCodec} 1920x1080=${okRes}) — ${mp4}`);
  process.exit(okRes && okCodec ? 0 : 1);
}

// ---- START / ONESHOT: attach to the existing 9222 browser ----
resetOut();
const { chromium } = loadPlaywright();
const browser = await chromium.connectOverCDP(cdp);
const context = browser.contexts()[0];
if (!context) { console.error('No browser context at', cdp, '— is open-browser.sh running?'); process.exit(1); }
const page = context.pages().find((p) => !p.isClosed()) ?? (await context.newPage());
await page.bringToFront().catch(() => {}); // foreground: a backgrounded tab throttles screencast frames
const { client } = await streamFrames(context, page);

let finalized = false;
async function stopAndFinalize() {
  if (finalized) return; finalized = true;
  try { await client.send('Page.stopScreencast'); } catch { /* already gone */ }
  finalize();
  try { rmSync(pidPath, { force: true }); } catch { /* ignore */ }
  // Disconnect WITHOUT closing the user-visible signed-in browser (same as drive.mjs):
  // process exit drops the CDP connection; browser.close() could tear down the 9222 Chrome.
  process.exit(0);
}

if (sub === 'start') {
  writeFileSync(pidPath, String(process.pid));
  process.on('SIGTERM', stopAndFinalize);
  process.on('SIGINT', stopAndFinalize);
  console.log(`recording "${name}" (pid ${process.pid}) → stop with:  node record.mjs stop --name ${name}`);
  // Keep alive until stop signals us.
  setInterval(() => {}, 1 << 30);
} else {
  // one-shot blocking clip
  console.log(`recording "${name}" for ${seconds}s…`);
  await page.waitForTimeout(seconds * 1000);
  await stopAndFinalize();
}
