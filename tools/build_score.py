"""Original score + sound design for "The Billion-Dollar No", synthesized from scratch (no samples).

Leitmotif: the two-note doorbell chime (descending major third). Cues are derived from the same
narration timeline the video uses (src/data/narration.json), so music hits land on visual hits.

Usage: python3 -I tools/build_score.py
Out:   public/audio/stems/{music,sfx}.wav, public/audio/soundtrack.wav (music+sfx+narration, ducked)
"""
import json, os
import numpy as np
import soundfile as sf
from scipy.signal import fftconvolve, butter, sosfilt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
DUR = 305.0
N = int(DUR * SR)
rng = np.random.default_rng(7)

L = {l["id"]: l for l in json.load(open(os.path.join(ROOT, "src/data/narration.json")))["lines"]}
at = lambda i, o=0.0: L[i]["start"] + o
end = lambda i, o=0.0: L[i]["end"] + o

music = np.zeros((2, N), np.float32)
sfx = np.zeros((2, N), np.float32)

def mtof(m): return 440.0 * 2 ** ((m - 69) / 12)
NOTE = {n: i for i, n in enumerate(["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"])}
def nm(s):  # "D3" -> midi
    return NOTE[s[:-1]] + 12 * (int(s[-1]) + 1)

def add(buf, x, t, pan=0.0, gain=1.0):
    i = int(t * SR)
    if i >= N or i + x.shape[-1] <= 0: return
    if x.ndim == 1:
        lg, rg = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        x = np.stack([x * lg * 1.414, x * rg * 1.414])
    j = min(N, i + x.shape[1])
    s = max(0, -i)
    buf[:, max(i, 0):j] += gain * x[:, s:j - i]

def env(n, a, r, hold=None):
    e = np.ones(n, np.float32)
    na, nr = max(1, int(a * SR)), max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na) ** 2
    e[-nr:] *= np.linspace(1, 0, nr) ** 1.5
    return e

def lp(x, f, order=2):
    return sosfilt(butter(order, min(f, SR / 2 - 100), "low", fs=SR, output="sos"), x, axis=-1).astype(np.float32)
def hp(x, f, order=2):
    return sosfilt(butter(order, f, "high", fs=SR, output="sos"), x, axis=-1).astype(np.float32)
def bp(x, lo, hi):
    return sosfilt(butter(2, [lo, hi], "band", fs=SR, output="sos"), x, axis=-1).astype(np.float32)

# ---------------- instruments ----------------
def pad(notes, dur, attack=2.0, release=2.5, bright=6, detune=0.12, amp=0.06):
    n = int(dur * SR); t = np.arange(n) / SR
    out = np.zeros((2, n), np.float32)
    for k, m in enumerate(notes):
        f0 = mtof(m)
        for ch in range(2):
            for d in (-detune, 0, detune):
                f = f0 * 2 ** ((d + (0.03 if ch else -0.03)) / 12)
                ph = rng.random() * 6.28
                vib = 0.0015 * np.sin(2 * np.pi * (0.2 + 0.07 * k) * t)
                for h in range(1, bright + 1):
                    if f * h > 9000: break
                    out[ch] += (np.sin(2 * np.pi * f * h * t * (1 + vib) + ph * h) / h).astype(np.float32)
    out *= env(n, attack, release) * amp / (len(notes) * 3)
    return out

def piano(m, dur=4.0, amp=0.25, bright=1.0):
    n = int(dur * SR); t = np.arange(n) / SR; f = mtof(m)
    x = np.zeros(n, np.float32)
    for h in range(1, 9):
        fh = f * h * np.sqrt(1 + 0.0004 * h * h)
        if fh > 12000: break
        x += (np.sin(2 * np.pi * fh * t) * np.exp(-t * (0.8 + h * 0.9 / bright)) / h ** 1.2).astype(np.float32)
    x[:240] *= np.linspace(0, 1, 240)
    ham = lp(rng.standard_normal(1200).astype(np.float32), 3000) * np.exp(-np.arange(1200) / 150)
    x[:1200] += ham * 0.05
    return x * amp

def bell(m, dur=5.0, amp=0.3, muffle=None):
    n = int(dur * SR); t = np.arange(n) / SR; f = mtof(m)
    x = np.zeros(n, np.float32)
    for r, a, d in [(1, 1, 1.2), (2.0, 0.5, 1.8), (2.76, 0.35, 2.5), (5.4, 0.18, 4), (8.93, 0.08, 6)]:
        x += (a * np.sin(2 * np.pi * f * r * t) * np.exp(-t * d)).astype(np.float32)
    x[:120] *= np.linspace(0, 1, 120)
    if muffle: x = lp(x, muffle, 4)
    return x * amp

def chime(t0, gain=1.0, octave=5, muffle=None, pan=0.0, buf=None):
    buf = music if buf is None else buf
    add(buf, bell(nm("E" + str(octave)), amp=0.28 * gain, muffle=muffle), t0, pan)
    add(buf, bell(nm("C" + str(octave)), amp=0.3 * gain, muffle=muffle), t0 + 0.62, pan)

def pluck(m, dur=0.5, amp=0.12, cutoff=3000):
    n = int(dur * SR); t = np.arange(n) / SR; f = mtof(m)
    saw = (2 * ((f * t) % 1) - 1).astype(np.float32)
    saw = lp(saw * np.exp(-t * 7).astype(np.float32), cutoff)
    return saw * amp

def bassnote(m, dur, amp=0.25):
    n = int(dur * SR); t = np.arange(n) / SR; f = mtof(m)
    x = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t) + 0.12 * np.sign(np.sin(2 * np.pi * f * t))
    return lp(x.astype(np.float32), 900) * env(n, 0.01, min(0.3, dur * 0.5)) * amp

def kick(amp=0.7):
    n = int(0.5 * SR); t = np.arange(n) / SR
    f = 45 + 110 * np.exp(-t * 28)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7)
    x[:200] += rng.standard_normal(200) * 0.3 * np.linspace(1, 0, 200)
    return (np.tanh(x * 1.6) * amp).astype(np.float32)

def snare(amp=0.35):
    n = int(0.35 * SR); t = np.arange(n) / SR
    x = hp(rng.standard_normal(n).astype(np.float32), 1500) * np.exp(-t * 16) + 0.5 * np.sin(2 * np.pi * 190 * t) * np.exp(-t * 22)
    return (x * amp).astype(np.float32)

def hat(amp=0.08, dec=40):
    n = int(0.12 * SR); t = np.arange(n) / SR
    return (hp(rng.standard_normal(n).astype(np.float32), 7000) * np.exp(-t * dec) * amp).astype(np.float32)

def impact(amp=0.9, sub=38, tail=3.0, bright=1.0):
    n = int(tail * SR); t = np.arange(n) / SR
    f = sub + 90 * np.exp(-t * 10)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6)
    nz = lp(rng.standard_normal(n).astype(np.float32), 2500 * bright) * np.exp(-t * 9)
    x = np.tanh((s * 1.4 + nz * 0.6)) * amp
    return np.stack([x, np.roll(x, 90)]).astype(np.float32)

def whoosh(dur=1.2, amp=0.35, lo=300, hi=6000, rev=False):
    n = int(dur * SR)
    nz = rng.standard_normal(n).astype(np.float32)
    chunks = 24; out = np.zeros(n, np.float32); cs = n // chunks
    for c in range(chunks):
        p = c / (chunks - 1)
        fc = lo * (hi / lo) ** (p if not rev else 1 - p)
        seg = nz[c * cs:(c + 1) * cs + 2000]
        out[c * cs:c * cs + len(seg)] += bp(seg, max(40, fc * 0.6), min(20000, fc * 1.6))[: n - c * cs] * np.hanning(len(seg))[: n - c * cs]
    e = np.sin(np.linspace(0, np.pi, n)) ** 2
    if not rev: e = e ** 0.7
    x = out * e * amp
    pan = np.linspace(-0.7, 0.7, n)
    return np.stack([x * (1 - pan) * 0.8, x * (1 + pan) * 0.8]).astype(np.float32)

def riser(dur=3.0, amp=0.25, f0=200, f1=1800):
    n = int(dur * SR); t = np.arange(n) / SR
    f = f0 * (f1 / f0) ** (t / dur)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.5 * np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR)
    nz = hp(rng.standard_normal(n).astype(np.float32), 2000) * 0.5
    x = (tone * 0.4 + nz) * (t / dur) ** 2.2 * amp
    return x.astype(np.float32)

def click(amp=0.25, f=2400):
    n = int(0.05 * SR); t = np.arange(n) / SR
    return ((np.sin(2 * np.pi * f * t) * 0.6 + rng.standard_normal(n) * 0.4) * np.exp(-t * 160) * amp).astype(np.float32)

def blip(m, amp=0.12):
    n = int(0.4 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * mtof(m) * t) * np.exp(-t * 9) * amp).astype(np.float32)

def heartbeat(amp=0.5):
    a = kick(amp)[: int(0.3 * SR)]
    a = lp(a, 120)
    x = np.zeros(int(0.7 * SR), np.float32)
    x[: len(a)] += a; x[int(0.22 * SR): int(0.22 * SR) + len(a)] += a * 0.7
    return x

def seq_pattern(buf, t0, t1, bpm, fn, every=1.0, offset=0.0, swing=0.0):
    beat = 60 / bpm * every
    k = 0; t = t0 + offset
    while t < t1:
        fn(t, k); k += 1; t = t0 + offset + k * beat + (swing * beat if k % 2 else 0)

# ---------------- chords ----------------
Dm = ["D3", "F3", "A3", "D4"]; Bb = ["A#2", "F3", "A#3", "D4"]; F_ = ["F2", "C3", "A3", "C4"]; C_ = ["C3", "G3", "C4", "E4"]
D = ["D3", "F#3", "A3", "D4"]; A_ = ["A2", "E3", "A3", "C#4"]; Bm = ["B2", "F#3", "B3", "D4"]; G_ = ["G2", "D3", "B3", "D4"]
chord = lambda c, sh=0: [nm(x) + sh for x in c]

# =============== A · HOOK 0–37 ===============
add(music, pad([nm("D2"), nm("A2"), nm("D3")], 23.6, attack=4, release=1.5, bright=4, amp=0.10), 0.0)
add(music, pad([nm("D#4"), nm("D4"), nm("A4")], 10, attack=6, release=1.0, bright=3, amp=0.035), 10.2)  # tension cluster
for k in range(16):
    add(sfx, heartbeat(0.32 + k * 0.012), 3.0 + k * 1.05)
add(sfx, impact(0.5, tail=2.5), 5.6)  # spotlight on
add(sfx, click(0.4, 900), 5.6)
for i in range(4):
    add(sfx, impact(0.55, sub=45, tail=1.5), at("h4", 0.15 + i * 0.42), pan=-0.6 + i * 0.4)
add(music, pad(chord(F_, 12), 2.6, attack=0.3, release=1.0, amp=0.05), at("h4", 2.0))  # the amber offer
add(sfx, impact(1.0, sub=32, tail=4.0), 20.3)  # lights out / no deal
add(sfx, whoosh(0.9, 0.4, 200, 9000), 23.1)
add(sfx, impact(0.9, sub=40, tail=3, bright=2), 23.95)
add(music, pad(chord(D, 12), 7.0, attack=0.4, release=0.6, bright=8, amp=0.09), 23.95)
seq_pattern(music, 24.0, 30.5, 120, lambda t, k: add(music, pluck(nm(["D5", "A4", "F#5", "A4", "D6", "A4", "F#5", "E5"][k % 8]), amp=0.07, cutoff=2500 + k * 120), t, pan=0.3 * np.sin(k)), every=0.25)
seq_pattern(music, 24.0, 30.5, 120, lambda t, k: add(music, kick(0.45), t), every=1)
add(sfx, riser(3.0, 0.22, 300, 2400), 27.5)
add(sfx, impact(1.0, sub=34, tail=4.5), at("h7", 0.9))
chime(at("h7", 0.95), gain=1.0, octave=5)
add(music, pad(chord(Dm), 6.0, attack=0.1, release=3, amp=0.08), at("h7", 0.9))
add(sfx, whoosh(1.6, 0.45, 150, 8000), 35.8)

# =============== B · BEGINNING 37–82 ===============
add(sfx, impact(0.4, sub=50, tail=2), 37.0)
prog_b = [Dm, Bb, F_, C_, Dm, Bb, F_, C_]
for k, c in enumerate(prog_b):
    t0 = 37.2 + k * 2.8
    if t0 > 58: break
    add(music, pad(chord(c), 3.4, attack=1.0, release=1.2, bright=5, amp=0.055), t0)
    notes = chord(c, 12)
    for j, m in enumerate([notes[0], notes[2], notes[3], notes[1]]):
        add(music, piano(m + 12, 3, 0.07), t0 + j * 0.7, pan=-0.2 + j * 0.13)
CHIMES = [46.4, 47.1, 48.9, 49.6]
for c in CHIMES[::2]:
    chime(c, gain=0.55, octave=5, muffle=1600, pan=0.5, buf=sfx)
add(sfx, riser(2.2, 0.12, 800, 4000), at("b3", 0.8))
add(sfx, whoosh(1.6, 0.4, 200, 7000), 58.1)
add(sfx, impact(0.7, sub=36, tail=3), 59.7)
add(music, pad(chord(Dm, 12), 9, attack=0.6, release=3, amp=0.07), 59.7)
for k in range(11):
    add(sfx, click(0.2, 1800 + k * 130), 61.6 + k * 0.14 + rng.random() * 0.05, pan=rng.uniform(-0.6, 0.6))
add(sfx, whoosh(1.4, 0.25, 400, 5000), 61.5)
for i, idn in enumerate(["b5a", "b5b", "b5c", "b5d"]):
    add(sfx, blip(nm(["A5", "C6", "E6", "A6"][i]), 0.1), at(idn))
add(music, pad([nm("D3"), nm("D#3"), nm("A3")], 5.5, attack=1.0, release=1.5, bright=3, amp=0.05), at("b6"))
for k in range(9):
    add(sfx, click(0.12, 700), at("b6", 0.1 + k * 0.35 + rng.random() * 0.1))
seq_pattern(music, 74.6, 81.3, 100, lambda t, k: add(music, kick(0.3 + k * 0.02), t), every=1)
seq_pattern(music, 74.6, 81.3, 100, lambda t, k: add(music, bassnote(nm("D2"), 0.25, 0.18), t), every=0.5)
add(sfx, lp(rng.standard_normal(int(7 * SR)).astype(np.float32), 5000) * 0.015, 74.6)  # broadcast hiss
add(sfx, riser(2.2, 0.3, 200, 3000), 79.3)
add(sfx, impact(1.0, sub=34, tail=3), 81.5)

# =============== C · REJECTION 81.5–136.6 ===============
cut = at("r9")
add(music, pad([nm("D2"), nm("A2"), nm("D3"), nm("F3")], cut - 81.5, attack=2, release=0.2, bright=4, amp=0.08), 81.5)
add(music, pad([nm("D#4"), nm("A4")], cut - 100, attack=8, release=0.2, bright=3, amp=0.03), 100.0)
seq_pattern(music, 82.0, cut - 0.3, 100, lambda t, k: add(music, bassnote(nm("D2") + (1 if k % 16 >= 12 else 0), 0.28, 0.17), t), every=0.5)
seq_pattern(music, 82.0, cut - 0.3, 100, lambda t, k: add(sfx, click(0.07, 3200 if k % 2 else 2600), t, pan=0.4 if k % 2 else -0.4), every=1)
for i, idn in enumerate(["r3", "r4", "r5", "r6"]):
    ot = end(idn, -0.3)
    add(sfx, impact(0.85, sub=40, tail=2.5), ot, pan=-0.5 + i * 0.33)
    add(music, piano(nm("D2"), 3, 0.25, bright=0.5), ot)
add(music, pad(chord(F_, 12), end("r7") - at("r7"), attack=1.0, release=1.0, amp=0.045), at("r7"))
add(sfx, impact(0.9, sub=60, tail=1.5, bright=1.5), at("r8", 1.4))  # DECLINED stamp
add(sfx, impact(1.15, sub=30, tail=5.0), cut)  # NO DEAL
# aftermath: hopeful, sparse (F major / D major colours), the orders arrive
for k, (c, t0) in enumerate([(F_, 128.6), (C_, 131.0), (Bb, 133.4)]):
    add(music, pad(chord(c, 12), 3.2, attack=1.2, release=1.4, amp=0.045), t0)
    for j, m in enumerate(chord(c, 24)[1:]):
        add(music, piano(m, 3, 0.06), t0 + 0.3 + j * 0.45, pan=0.3)
a0 = at("r10", 4.2)
for i in range(14):
    add(sfx, blip(nm("E6") + (i % 3) * 3, 0.07), a0 + (i ** 0.8) * 0.42, pan=0.6)

# =============== D · COMEBACK 136–197.6 ===============
SWAP, FL = 143.2, at("c4", -0.05)
add(music, pad([nm("A2"), nm("E3"), nm("A3"), nm("C4")], 7.2, attack=2.5, release=1.0, bright=3, amp=0.06), 136.0)
add(sfx, impact(0.6, sub=50, tail=2, bright=2), SWAP)
for k in range(18):
    add(sfx, click(0.16, 1500 + k * 90), SWAP + 0.2 + k * 0.24, pan=rng.uniform(-0.7, 0.7))
add(sfx, riser(FL - SWAP, 0.25, 150, 2600), SWAP)
add(music, pad(chord(A_), FL - SWAP, attack=3, release=0.5, bright=5, amp=0.05), SWAP)
add(sfx, impact(1.2, sub=30, tail=6, bright=2), FL)
chime(FL + 0.05, gain=1.2, octave=5)
add(sfx, whoosh(3.0, 0.4, 100, 9000), FL + 0.1)
add(music, pad(chord(D, 12), 6, attack=0.05, release=4, bright=9, amp=0.09), FL)
PROG = [D, A_, Bm, G_]
def drive(t0, t1, bpm, drums=True, density=1.0, base_amp=1.0):
    bar = 4 * 60 / bpm
    k = 0
    while t0 + k * bar < t1:
        tb = t0 + k * bar
        c = PROG[k % 4]
        add(music, pad(chord(c), bar + 0.4, attack=0.3, release=0.4, bright=6, amp=0.05 * base_amp), tb)
        for s in range(16):
            ts = tb + s * bar / 16
            if ts >= t1: break
            notes = chord(c, 24)
            add(music, pluck(notes[[0, 2, 1, 3, 2, 1, 3, 2][s % 8]], 0.3, 0.05 * base_amp * density, 2200 + 1500 * density), ts, pan=0.35 * np.sin(s * 1.7))
            if s % 2 == 0:
                add(music, bassnote(chord(c)[0] - 12, bar / 8, 0.2 * base_amp), ts)
            if drums:
                if s % 4 == 0: add(music, kick(0.55 * base_amp), ts)
                if s % 8 == 4: add(music, snare(0.28 * base_amp), ts)
                add(music, hat(0.05 * base_amp * (1.3 if s % 2 else 0.8)), ts, pan=0.3)
        k += 1
drive(156.0, 161.4, 112, drums=False, density=0.6, base_amp=0.8)
drive(161.4, 166.3, 112, drums=False, density=0.4, base_amp=0.6)
add(sfx, blip(nm("G6"), 0.12), at("c6", 0.9)); add(sfx, blip(nm("B6"), 0.1), at("c6", 1.05))
drive(166.4, 197.2, 112, drums=True, density=0.9, base_amp=0.95)
for idn in ["c7", "c8", "c9"]:
    add(sfx, riser(1.4, 0.18, 300, 2400), at(idn, 0.0))
    add(sfx, impact(1.0, sub=34, tail=3.5), at(idn, 1.4))
    add(sfx, whoosh(1.2, 0.25, 200, 4000, rev=True), at(idn, 1.3))
add(sfx, impact(0.5, sub=70, tail=1.2, bright=2), at("c10", 2.4))  # the Sharks' $0
add(sfx, whoosh(1.2, 0.35, 200, 8000), 196.6)

# =============== E · EXPLOSION 197–248.6 ===============
drive(197.4, 209.4, 120, drums=True, density=1.0, base_amp=1.0)
for idn in ["e2a", "e2b", "e2c", "e2d"]:
    add(sfx, impact(0.7, sub=42, tail=2, bright=1.5), at(idn, -0.1))
    add(sfx, whoosh(0.7, 0.2, 300, 6000, rev=True), at(idn, -0.6))
add(sfx, riser(1.6, 0.3, 200, 4000), 207.8)
add(sfx, whoosh(1.8, 0.5, 120, 9000), 209.0)
add(sfx, impact(1.1, sub=32, tail=4), 209.6)
drive(209.6, 241.4, 120, drums=True, density=1.0, base_amp=1.05)
for i, idn in enumerate(["e5a", "e5b", "e5c", "e5d"]):
    add(sfx, blip(nm(["A5", "C#6", "E6", "A6"][i]), 0.14), at(idn))
    add(sfx, impact(0.45, sub=60, tail=1.2, bright=2), at(idn))
add(music, pad(chord(D, 12) + [nm("A5")], 8, attack=1.0, release=2, bright=8, amp=0.06), at("e6"))
add(music, pad(chord(G_), 248.6 - 241.4, attack=3, release=1.5, bright=5, amp=0.07), 241.4)
add(sfx, riser(7.0, 0.18, 100, 1600), 241.6)

# =============== F · PAYOFF 248–305 ===============
add(music, pad([nm("D3"), nm("A3")], 4.6, attack=1.5, release=0.5, bright=3, amp=0.05), 248.0)
add(sfx, impact(1.2, sub=30, tail=5, bright=1.5), at("p2"))
add(music, pad(chord(D) + [nm("D5")], 4.0, attack=0.05, release=1.5, bright=9, amp=0.1), at("p2"))
add(sfx, whoosh(0.8, 0.4, 300, 9000), 256.0)
add(sfx, impact(1.0, sub=36, tail=3), 256.6)
add(sfx, riser(3.8, 0.28, 120, 3000), at("p3", 2.2))
add(sfx, impact(1.2, sub=28, tail=6), at("p3", 6.0))
add(sfx, impact(0.6, sub=50, tail=2), at("p4")); add(sfx, impact(0.8, sub=36, tail=3), at("p4", 1.6))
# anthem
bar = 4 * 60 / 84
k = 0
MEL = [("F#5", 0), ("E5", 1), ("D5", 2), ("A5", 3), ("F#5", 4), ("E5", 6), ("D5", 8), ("B4", 9), ("D5", 10), ("E5", 12), ("A4", 14)]
while 258.0 + k * bar < 278.8:
    tb = 258.0 + k * bar
    c = PROG[k % 4]
    add(music, pad(chord(c), bar + 0.6, attack=0.6, release=0.8, bright=7, amp=0.075), tb)
    add(music, bassnote(chord(c)[0] - 12, bar, 0.22), tb)
    for j, m in enumerate(chord(c, 12)):
        add(music, piano(m, 3.5, 0.05), tb + j * bar / 4, pan=-0.3 + j * 0.2)
    k += 1
for m, beat in MEL:
    add(music, piano(nm(m) + 12, 4, 0.09), 266.0 + beat * 60 / 84 * 1.0, pan=0.1)
add(sfx, impact(0.5, sub=50, tail=2), 270.6)
chime(at("p5", 2.6), gain=0.5, octave=6)
add(music, pad(chord(D, 12), 9, attack=2, release=3, bright=4, amp=0.05), 279.0)
chime(end("p7", 1.6) - (end("p7") - at("p7")), gain=0.9, octave=5)  # = at(p7)+1.6
add(sfx, impact(1.2, sub=30, tail=7), 288.0)
add(music, pad(chord(D) + [nm("A4"), nm("D5"), nm("F#5")], 9.0, attack=0.05, release=6, bright=9, amp=0.1), 288.0)
chime(288.05, gain=0.8, octave=5)
add(music, pad([nm("D3"), nm("A3"), nm("F#4")], 9.0, attack=2, release=4, bright=3, amp=0.04), 296.4)

# ---------------- reverb & mix ----------------
def reverb(x, secs=2.8, wet=0.28, damp=5000):
    n = int(secs * SR); t = np.arange(n) / SR
    ir = np.stack([rng.standard_normal(n) * np.exp(-t * 6.9 / secs) for _ in range(2)]).astype(np.float32)
    ir = lp(ir, damp); ir[:, :int(0.012 * SR)] = 0
    ir /= np.sqrt((ir ** 2).sum(axis=1, keepdims=True))
    y = np.stack([fftconvolve(x[c], ir[c])[: x.shape[1]] for c in range(2)]).astype(np.float32)
    return x * (1 - wet) + y * wet * 1.2

music = reverb(hp(music, 30), 3.2, 0.32)
sfx = reverb(hp(sfx, 25), 2.2, 0.18)

vo, _ = sf.read(os.path.join(ROOT, "public/audio/narration.wav"), dtype="float32")
vo = vo[:N] if vo.ndim == 1 else vo[:N, 0]
vo = np.pad(vo, (0, N - len(vo)))
# sidechain: duck music under narration
e = np.abs(vo)
win = int(0.05 * SR)
e = np.convolve(e, np.ones(win) / win, mode="same")
rel = int(0.35 * SR)
from scipy.ndimage import maximum_filter1d
e = maximum_filter1d(e, rel)
e = np.convolve(e, np.ones(win * 4) / (win * 4), mode="same")
duck = 1 - 0.55 * np.clip(e / (e.max() * 0.25), 0, 1)
music *= duck
sfx *= (1 - 0.25 * (1 - duck))

def norm(x, peak):
    return x * (peak / (np.abs(x).max() + 1e-9))
music = norm(music, 0.6)
sfx = norm(sfx, 0.75)
mix = music * 0.9 + sfx * 0.85 + np.stack([vo, vo]) * 1.0
# soft limiter
mix = np.tanh(mix * 1.05) / np.tanh(1.05)
fade = int(2.5 * SR)
mix[:, -fade:] *= np.linspace(1, 0, fade)
os.makedirs(os.path.join(ROOT, "public/audio/stems"), exist_ok=True)
sf.write(os.path.join(ROOT, "public/audio/stems/music.wav"), music.T, SR, subtype="PCM_16")
sf.write(os.path.join(ROOT, "public/audio/stems/sfx.wav"), sfx.T, SR, subtype="PCM_16")
sf.write(os.path.join(ROOT, "public/audio/soundtrack_raw.wav"), mix.T, SR, subtype="PCM_24")
print("ok", mix.shape, float(np.abs(mix).max()))
