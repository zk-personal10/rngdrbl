# The Billion-Dollar No — the story of Ring

A ~5-minute cinematic documentary about DoorBot → Ring: rejected on Shark Tank in 2013, acquired by
Amazon in 2018 for a reported $1B+. Built entirely in code: **Remotion + React + Three.js (React Three
Fiber) + GSAP easing**, with original 3D environments, a procedurally synthesized score, and TTS narration.

## Watch / render
```bash
npm install
npm run studio                 # live preview & timeline scrubbing in the browser
npm run render                 # → out/the-billion-dollar-no.mp4 (1920×1080, 30 fps, H.264)
```
Rendering is CPU/GPU-bound (WebGL). With a real GPU, Chrome's default GL is fast; in headless/cloud
environments `remotion.config.ts` uses ANGLE/SwiftShader (~1 s/frame). Useful flags:
`--concurrency=4`, `--frames=0-1121` (render one scene), `REMOTION_BROWSER=/path/to/chrome`.

Per-scene compositions for faster iteration: `S1-Hook`, `S2-Beginning`, `S3-Rejection`,
`S4-Comeback`, `S5-Explosion`, `S6-Payoff`. Contact sheets: `node tools/stills.mjs S3-Rejection 60,200,400`.

## Audio pipeline
```bash
pip install kokoro-onnx soundfile scipy numpy
python3 -I tools/build_narration.py   # script/narration.json → public/audio/vo/*.wav + src/data/narration.json (timings)
python3 -I tools/build_score.py       # score + SFX cued to narration timings → stems + mixed soundtrack
ffmpeg -i public/audio/soundtrack_raw.wav -af loudnorm=I=-16:TP=-1.5 public/audio/soundtrack.wav
```
Kokoro model files: `kokoro-v1.0.onnx`, `voices-v1.0.bin` from github.com/thewh1teagle/kokoro-onnx releases
(set `KOKORO_MODEL` / `KOKORO_VOICES`). The narration timing JSON drives every on-screen cue, so editing a
line and re-running both scripts keeps picture and sound in sync.

## Structure
```
script/narration.json      the script (single source of truth for timing)
src/timeline.ts            scene ranges + narration lookup (at('r9') = start of "No deal.")
src/scenes/S1…S6           the six acts; each is a few 3D "shots" (Stage) + an HTML typography layer
src/lib/Stage.tsx          WebGL stage: studio environment map, bloom, DOF, grade (CA, grain, vignette), camera rig
src/models/                procedural DoorBot / Ring doorbell (explodable), product line-up
src/env/                   studio, the Tank (abstract seats), cutaway house, instanced night city, funding towers
src/ui/                    kinetic type, counters, source tags, recreation badges, archival slot compositor
tools/                     narration, score, typeface conversion, contact-sheet stills
sources/SOURCES.md         fact check: every claim → sources
LICENSING.md               what's licensed, what's a placeholder, who to contact
```

## Archival footage
No third-party footage is included. `src/data/media-manifest.json` defines six timed slots (Shark Tank pitch,
rejection, interview, Ring ad, acquisition news, guest-Shark appearance). Drop a licensed clip in
`public/media/licensed/`, flip `available` to `true`, re-render. See `LICENSING.md`.
