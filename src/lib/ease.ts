import gsap from 'gsap';

// GSAP easing curves drive every tween in the film. Timelines are evaluated
// deterministically from the current frame, so renders are frame-accurate.
const cache: Record<string, (p: number) => number> = {};
export const ease = (name: string) => (cache[name] ??= gsap.parseEase(name) as (p: number) => number);

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
export const mix = (a: number, b: number, p: number) => a + (b - a) * p;
export const lerp3 = (a: number[], b: number[], p: number) => [mix(a[0], b[0], p), mix(a[1], b[1], p), mix(a[2], b[2], p)] as [number, number, number];

/** Eased progress of t through [a, b]. */
export const prog = (t: number, a: number, b: number, e = 'power2.inOut') => ease(e)(clamp01((t - a) / (b - a)));

/** Fade in over [a, a+inD], hold, fade out over [b-outD, b]. */
export const window01 = (t: number, a: number, b: number, inD = 0.5, outD = 0.5, e = 'power2.out') =>
  Math.min(prog(t, a, a + inD, e), 1 - prog(t, b - outD, b, 'power2.in'));

/** Piecewise keyframes: [[time, value, ease?], ...] */
export const keys = (t: number, k: [number, number, string?][]) => {
  if (t <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) {
    if (t <= k[i][0]) return mix(k[i - 1][1], k[i][1], prog(t, k[i - 1][0], k[i][0], k[i][2] ?? 'power2.inOut'));
  }
  return k[k.length - 1][1];
};

/** Deterministic pseudo-random in [0,1). */
export const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Smooth 1D value noise for handheld camera drift etc. */
export const noise1 = (x: number, seed = 0) => {
  const i = Math.floor(x), f = x - i;
  const u = f * f * (3 - 2 * f);
  return mix(rand(i + seed * 101.3), rand(i + 1 + seed * 101.3), u) * 2 - 1;
};
