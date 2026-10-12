import {Config} from '@remotion/cli/config';

// Use the pre-installed Chromium headless shell (no download needed in sandboxed envs).
// Override with REMOTION_BROWSER=/path/to/chrome if rendering elsewhere.
const browser =
  process.env.REMOTION_BROWSER ??
  '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
import fs from 'fs';
if (fs.existsSync(browser)) Config.setBrowserExecutable(browser);

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setChromiumOpenGlRenderer((process.env.REMOTION_GL as any) ?? 'angle');
Config.setConcurrency(Number(process.env.REMOTION_CONCURRENCY ?? 2));
Config.setCodec('h264');
Config.setCrf(20);
Config.setPixelFormat('yuv420p');
Config.setTimeoutInMilliseconds(240000);
