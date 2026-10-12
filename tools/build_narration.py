"""Generate narration with Kokoro TTS (Apache-2.0 open model) and lay it out on the timeline.

Usage: python3 -I tools/build_narration.py
Env:   KOKORO_MODEL, KOKORO_VOICES (paths to kokoro-v1.0.onnx / voices-v1.0.bin)
Out:   public/audio/vo/<id>.wav, public/audio/narration.wav, src/data/narration.json
"""
import json, os, sys
import numpy as np
import soundfile as sf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
GAP = 0.35

def main():
    from kokoro_onnx import Kokoro
    from scipy.signal import resample_poly
    spec = json.load(open(os.path.join(ROOT, "script", "narration.json")))
    k = Kokoro(os.environ.get("KOKORO_MODEL", "/home/user/tts/kokoro-v1.0.onnx"),
               os.environ.get("KOKORO_VOICES", "/home/user/tts/voices-v1.0.bin"))
    out_lines, t_prev_end = [], 0.0
    for ln in spec["lines"]:
        samples, sr = k.create(ln["text"], voice=spec["voice"], speed=ln.get("speed", spec["speed"]), lang="en-us")
        s = resample_poly(samples, SR, sr).astype(np.float32)
        # trim silence
        thr = 0.01 * np.abs(s).max()
        idx = np.where(np.abs(s) > thr)[0]
        s = s[max(0, idx[0] - 1200): idx[-1] + 4800]
        fade = int(0.01 * SR); s[:fade] *= np.linspace(0, 1, fade); s[-fade:] *= np.linspace(1, 0, fade)
        start = max(ln["at"], t_prev_end + GAP)
        dur = len(s) / SR
        if start > ln["at"] + 0.05:
            print(f"  ! {ln['id']} pushed {start - ln['at']:.2f}s late", file=sys.stderr)
        sf.write(os.path.join(ROOT, "public/audio/vo", f"{ln['id']}.wav"), s, SR)
        out_lines.append({**ln, "start": round(start, 3), "end": round(start + dur, 3), "dur": round(dur, 3)})
        t_prev_end = start + dur
        print(f"{ln['id']:>4} {start:7.2f} -> {start+dur:7.2f}  {ln['text'][:60]}")
    total = out_lines[-1]["end"] + 1
    mix = np.zeros(int(total * SR) + SR, np.float32)
    for ln in out_lines:
        s, _ = sf.read(os.path.join(ROOT, "public/audio/vo", f"{ln['id']}.wav"), dtype="float32")
        i = int(ln["start"] * SR); mix[i:i + len(s)] += s
    mix *= 0.89 / np.abs(mix).max()
    sf.write(os.path.join(ROOT, "public/audio/narration.wav"), mix, SR)
    os.makedirs(os.path.join(ROOT, "src/data"), exist_ok=True)
    json.dump({"fps": spec["fps"], "lines": out_lines}, open(os.path.join(ROOT, "src/data/narration.json"), "w"), indent=1)

if __name__ == "__main__":
    main()
