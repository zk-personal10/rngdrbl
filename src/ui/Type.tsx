import React from 'react';
import {F} from '../lib/fonts';
import {clamp01, ease, prog, window01} from '../lib/ease';

export const C = {
  ink: '#05070a',
  white: '#f4f6f8',
  dim: 'rgba(230,238,245,0.55)',
  blue: '#38b6ff',
  blueDeep: '#0a6fb8',
  red: '#ff3b3b',
  amber: '#ffb347',
  orange: '#ff9a1f',
};

/** Absolute-positioned layer helper. */
export const Layer: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', ...style}}>{children}</div>
);

/** Per-letter reveal (blur + rise) on a timeline. a = start (s), dur per letter stagger. */
export const Reveal: React.FC<{
  t: number;
  a: number;
  b?: number; // out time
  text: string;
  stagger?: number;
  inDur?: number;
  outDur?: number;
  style?: React.CSSProperties;
  blur?: number;
  rise?: number;
  e?: string;
  tracking?: number; // extra tracking animation (em) collapsing in
}> = ({t, a, b = 1e9, text, stagger = 0.035, inDur = 0.7, outDur = 0.45, style, blur = 14, rise = 0.35, e = 'expo.out', tracking = 0}) => {
  const out = prog(t, b - outDur, b, 'power2.in');
  if (t < a - 0.01 || out >= 1) return null;
  const chars = Array.from(text);
  const tr = tracking ? tracking * (1 - prog(t, a, a + inDur + chars.length * stagger, 'expo.out')) : 0;
  return (
    <span style={{display: 'inline-block', whiteSpace: 'pre', letterSpacing: `calc(${(style?.letterSpacing as any) ?? '0em'} + ${tr}em)`, ...style, ...(tracking ? {letterSpacing: undefined} : {})}}>
      {chars.map((ch, i) => {
        const p = ease(e)(clamp01((t - a - i * stagger) / inDur));
        const o = p * (1 - out);
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              opacity: o,
              transform: `translateY(${(1 - p) * rise}em)`,
              filter: blur ? `blur(${(1 - p) * blur + out * blur * 0.6}px)` : undefined,
              marginRight: tracking ? `${tr}em` : undefined,
            }}
          >
            {ch}
          </span>
        );
      })}
    </span>
  );
};

/** Tracked monospace kicker with an animated rule. */
export const Kicker: React.FC<{t: number; a: number; b?: number; text: string; color?: string; rule?: boolean; size?: number; style?: React.CSSProperties; dot?: string}> = ({t, a, b = 1e9, text, color = C.white, rule = true, size = 22, style, dot}) => {
  const o = window01(t, a, b, 0.5, 0.4);
  if (o <= 0) return null;
  const pr = prog(t, a, a + 0.9, 'expo.out');
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 18, fontFamily: F.mono, fontWeight: 500, fontSize: size, letterSpacing: '0.32em', color, opacity: o, ...style}}>
      {dot ? <span style={{width: 10, height: 10, borderRadius: 10, background: dot, boxShadow: `0 0 14px ${dot}`}} /> : null}
      {rule ? <span style={{display: 'inline-block', height: 2, width: 64 * pr, background: color, opacity: 0.7}} /> : null}
      <Reveal t={t} a={a} b={b} text={text} stagger={0.018} inDur={0.5} blur={6} rise={0.2} />
    </div>
  );
};

/** Animated number (counts between values with GSAP ease), formatted. */
export const fmtMoney = (v: number, opts: {decimals?: number; suffix?: string} = {}) => {
  const d = opts.decimals ?? 0;
  const s = v.toLocaleString('en-US', {minimumFractionDigits: d, maximumFractionDigits: d});
  return '$' + s + (opts.suffix ?? '');
};

export const Counter: React.FC<{t: number; a: number; dur: number; from: number; to: number; format: (v: number) => string; e?: string; style?: React.CSSProperties}> = ({t, a, dur, from, to, format, e = 'expo.out', style}) => {
  const p = prog(t, a, a + dur, e);
  const v = from + (to - from) * p;
  return <span style={{fontVariantNumeric: 'tabular-nums', ...style}}>{format(v)}</span>;
};

/** Odometer: each digit rolls vertically. */
export const Odometer: React.FC<{value: number; digits?: number; style?: React.CSSProperties; commas?: boolean; prefix?: string; suffix?: string; height?: number}> = ({value, style, commas = true, prefix = '$', suffix = '', height = 1}) => {
  const str = Math.floor(value).toString();
  const parts: React.ReactNode[] = [];
  const n = str.length;
  for (let i = 0; i < n; i++) {
    const place = n - 1 - i;
    const exact = value / Math.pow(10, place);
    const digitF = exact % 10;
    // smooth roll for lower place, snap for high
    const frac = digitF - Math.floor(digitF);
    const roll = place === 0 ? digitF : Math.floor(digitF) + (frac > 0.85 ? (frac - 0.85) / 0.15 : 0);
    parts.push(
      <span key={'d' + i} style={{display: 'inline-block', height: `${height}em`, overflow: 'hidden', verticalAlign: 'top', position: 'relative', width: '0.62em', textAlign: 'center'}}>
        <span style={{display: 'block', transform: `translateY(${-(roll % 10) * height}em)`}}>
          {Array.from({length: 11}, (_, k) => (
            <span key={k} style={{display: 'block', height: `${height}em`, lineHeight: `${height}em`}}>
              {k % 10}
            </span>
          ))}
        </span>
      </span>,
    );
    if (commas && place > 0 && place % 3 === 0) parts.push(<span key={'c' + i}>,</span>);
  }
  return (
    <span style={{display: 'inline-flex', lineHeight: `${height}em`, fontVariantNumeric: 'tabular-nums', ...style}}>
      {prefix}
      {parts}
      {suffix}
    </span>
  );
};

/** Bottom-left source attribution tag. */
export const SourceTag: React.FC<{t: number; a: number; b: number; text: string; style?: React.CSSProperties}> = ({t, a, b, text, style}) => {
  const o = window01(t, a, b, 0.6, 0.5);
  if (o <= 0) return null;
  return (
    <div style={{position: 'absolute', left: 96, bottom: 64, fontFamily: F.mono, fontSize: 17, letterSpacing: '0.18em', color: 'rgba(220,232,242,0.62)', opacity: o, textTransform: 'uppercase', ...style}}>
      <span style={{color: C.blue, marginRight: 12}}>◆</span>
      {text}
    </div>
  );
};

/** Badge that marks a shot as an original visual recreation (not archival footage). */
export const RecreationBadge: React.FC<{t: number; a: number; b: number; text?: string}> = ({t, a, b, text = 'VISUAL RECREATION · NOT ARCHIVAL FOOTAGE'}) => {
  const o = window01(t, a, b, 0.6, 0.6);
  if (o <= 0) return null;
  return (
    <div style={{position: 'absolute', right: 96, top: 72, display: 'flex', alignItems: 'center', gap: 12, fontFamily: F.mono, fontSize: 15, letterSpacing: '0.22em', color: 'rgba(230,238,245,0.6)', opacity: o * 0.9}}>
      <span style={{width: 8, height: 8, borderRadius: 8, border: '1.5px solid rgba(230,238,245,0.7)'}} />
      {text}
    </div>
  );
};

/** Cinematic letterbox bars (animated amount 0..1 => 2.39:1). */
export const Letterbox: React.FC<{amount: number}> = ({amount}) => {
  const h = ((1080 - 1920 / 2.39) / 2) * amount;
  if (h <= 0.5) return null;
  return (
    <>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: h, background: '#000'}} />
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: h, background: '#000'}} />
    </>
  );
};
