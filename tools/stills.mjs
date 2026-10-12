// Fast preview: bundle once, render many stills, assemble a contact sheet.
// node tools/stills.mjs <compositionId> <frame,frame,...> [scale]
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition, openBrowser} from '@remotion/renderer';
import {execSync} from 'child_process';
import fs from 'fs';
import path from 'path';
const [id, framesArg, scaleArg] = process.argv.slice(2);
const frames = framesArg.split(',').map(Number);
const scale = Number(scaleArg ?? 0.5);
const outDir = path.resolve('out/stills');
fs.mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const browser = await openBrowser('chrome', {browserExecutable: process.env.REMOTION_BROWSER ?? '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell', chromiumOptions: {gl: 'angle'}});
const composition = await selectComposition({serveUrl, id, puppeteerInstance: browser});
const files = [];
for (const f of frames) {
  const output = path.join(outDir, `${id}_${String(f).padStart(5, '0')}.jpg`);
  const t0 = Date.now();
  await renderStill({composition, serveUrl, frame: f, output, scale, imageFormat: 'jpeg', jpegQuality: 85, puppeteerInstance: browser, chromiumOptions: {gl: 'angle'}, timeoutInMilliseconds: 120000});
  console.log(f, (Date.now() - t0) + 'ms');
  files.push(output);
}
await browser.close({silent: true});
const cols = Math.min(3, files.length);
const sheet = path.resolve(`out/sheet_${id}.jpg`);
const inputs = files.map((f) => `-i ${f}`).join(' ');
const labels = files.map((_, i) => `[${i}:v]drawtext=text='${frames[i]} (${(frames[i] / 30).toFixed(1)}s)':x=10:y=10:fontsize=22:fontcolor=yellow:box=1:boxcolor=black@0.6[v${i}]`).join(';');
const layout = files.map((_, i) => `${(i % cols) === 0 ? '0' : Array.from({length: i % cols}, () => 'w0').join('+')}_${Math.floor(i / cols) === 0 ? '0' : Array.from({length: Math.floor(i / cols)}, () => 'h0').join('+')}`).join('|');
execSync(`ffmpeg -y -loglevel error ${inputs} -filter_complex "${labels};${files.map((_, i) => `[v${i}]`).join('')}xstack=inputs=${files.length}:layout=${layout}:fill=black" -q:v 3 ${sheet}`);
console.log(sheet);
