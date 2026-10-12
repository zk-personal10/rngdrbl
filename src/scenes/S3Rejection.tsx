import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {Stage, CameraRig, CamKey} from '../lib/Stage';
import {Studio} from '../env/Studio';
import {SharkSeats, Pedestal, SeatState, seatPos, SHARKS} from '../env/Tank';
import {Doorbell} from '../models/Doorbell';
import {Dust} from '../lib/three-bits';
import {useT} from '../lib/useT';
import {FPS, SCENES, at, end} from '../timeline';
import {keys, prog, window01, rand} from '../lib/ease';
import {C, Kicker, Reveal, Layer, RecreationBadge, SourceTag, Counter, fmtMoney} from '../ui/Type';
import {F} from '../lib/fonts';
import {ArchivalSlot} from '../ui/ArchivalSlot';

const S0 = SCENES.rejection[0];
const seq = (a: number, b: number) => ({from: Math.round((a - S0) * FPS), durationInFrames: Math.round((b - a) * FPS)});

const SEAT_LINES = ['r3', 'r4', 'r5', 'r6'];
const CONCERNS = [
  'Not differentiated enough for a ~$200 price',
  'Big security companies could crush it',
  'A connected device could be hacked',
  "Can't see the path to tens of millions",
];

const outTime = (i: number) => end(SEAT_LINES[i], -0.3);

const states = (t: number): SeatState[] =>
  SHARKS.map((_, i) => {
    const on = prog(t, 82.0, 82.8);
    const off = prog(t, at('r9') - 0.1, at('r9') + 0.25, 'power2.in');
    if (i < 4) {
      const focus = window01(t, at(SEAT_LINES[i]) - 0.2, outTime(i), 0.4, 0.05);
      const ot = outTime(i);
      if (t >= ot) return {color: '#ff2a2a', glow: 1.7 * (1 - prog(t, ot + 0.15, ot + 1.4, 'power2.out')), name: 0.4 * (1 - off)};
      return {color: '#e4ecf4', glow: (0.35 + focus * 0.8) * on, name: on * (1 - off)};
    }
    const ta = at('r7');
    if (t >= ta) return {color: '#ffae3a', glow: (0.6 + 0.8 * prog(t, ta, ta + 0.8)) * (1 - prog(t, at('r8') + 4.0, at('r9'), 'power2.in')), name: 1 - off};
    return {color: '#e4ecf4', glow: 0.35 * on, name: on * (1 - off)};
  });

const seatCam = (i: number, t0: number, e = 'power3.inOut'): CamKey => {
  const [x, , z, a] = seatPos(i);
  // camera sits between pedestal and seat, looking at the seat back over the shoulder of the device
  const px = x * 0.12 + Math.cos(a) * 0.8, pz = z * 0.12 + 3.4;
  return {t: t0, p: [px, 0.45, pz], l: [x * 0.8, 0.5, z * 0.8], fov: 30, e};
};

const TankShot: React.FC<{t: number}> = ({t}) => {
  const lightsOut = prog(t, at('r9') - 0.1, at('r9') + 0.2, 'power2.in');
  const path: CamKey[] = [
    {t: 81.5, p: [0, 1.6, 9.5], l: [0, 0.3, -2], fov: 36},
    {t: 88.6, p: [2.6, -0.4, 4.6], l: [0, 0.1, 0], fov: 32, e: 'sine.inOut'},
    ...SEAT_LINES.flatMap((id, i) => [seatCam(i, at(id) - 0.1), {...seatCam(i, end(id) + 0.2), p: [seatCam(i, 0).p[0] - 0.4, 0.25, seatCam(i, 0).p[2] - 0.5] as [number, number, number], e: 'sine.inOut'}]),
    {...seatCam(4, at('r7')), fov: 28},
    {...seatCam(4, at('r8')), p: [seatCam(4, 0).p[0] - 0.8, 0.3, seatCam(4, 0).p[2] - 1.1] as [number, number, number], fov: 28, e: 'sine.inOut'},
    {t: at('r8') + 1.6, p: [0, 3.2, 10.5], l: [0, 0.2, -2], fov: 36, e: 'power2.inOut'},
    {t: 128.4, p: [0, 3.6, 12.5], l: [0, 0.0, -2], fov: 36, e: 'sine.inOut'},
  ];
  return (
    <Stage
      env={1.0}
      grade={{
        time: t,
        bloom: 0.7,
        bloomThreshold: 0.82,
        flash: (1 - prog(t, 81.5, 82.3)) * 0.6,
        flashColor: '#ff2020',
        fade: prog(t, at('r9') + 0.3, at('r9') + 0.8, 'power2.in'),
        vignette: 0.8,
        saturation: 0.9,
      }}
    >
      <CameraRig t={t} path={path} />
      <Studio t={t} keyI={1 - lightsOut} cone={0.2} rim={0.7 * (1 - lightsOut)} spotPos={[0, 6.2, 0.4]} target={[0, -1.6, 0]} dust={0.5} />
      <Pedestal glow={0.8 * (1 - lightsOut)} />
      <SharkSeats states={states(t)} />
      <Doorbell variant="doorbot" led={2.4} ir={0.35} t={t} scale={0.5} position={[0, 0.09, 0]} rotation={[0, keys(t, [[81.5, 0.3], [128, -0.3]]), 0]} />
    </Stage>
  );
};

/** After the broadcast: the orders arrive (illustrative). */
const AftermathShot: React.FC<{t: number}> = ({t}) => (
  <Stage env={0.6} grade={{time: t, bloom: 0.9, bloomThreshold: 0.7, fade: Math.max(1 - prog(t, at('r10'), at('r10') + 1.2), prog(t, 135.6, 136.6, 'power2.in')), vignette: 0.9}}>
    <CameraRig t={t} path={[{t: 127, p: [0, 0.1, 3.6], l: [0, 0, 0], fov: 30}, {t: 136.6, p: [0, 0.05, 2.4], l: [0, 0, 0], fov: 30, e: 'sine.inOut'}]} />
    <Studio t={t} keyI={0.35} cone={0.0} rim={0.6} floorY={-1.4} spotPos={[0, 6, 2]} target={[0, -1.4, 0]} dust={0.8} />
    <Doorbell variant="doorbot" led={2.6} ir={0.3} t={t} scale={0.55} position={[0, 0, 0]} rotation={[0, 0.25, 0]} />
    <Dust t={t} count={400} box={[6, 4, 4]} color="#7fd3ff" opacity={0.7} size={0.025} speed={0.12} seed={5} />
  </Stage>
);

const ORDERS = 14;
const Toasts: React.FC<{t: number}> = ({t}) => {
  const a0 = at('r10') + 4.2;
  return (
    <div style={{position: 'absolute', right: 110, top: 150, width: 460}}>
      {Array.from({length: ORDERS}, (_, i) => {
        const ti = a0 + Math.pow(i, 0.8) * 0.42;
        const p = prog(t, ti, ti + 0.45, 'expo.out');
        if (p <= 0) return null;
        const shift = Math.max(0, ORDERS - 1 - i) * 0;
        const stack = Math.max(0, (t - ti) / 0.42);
        const y = Math.min(stack, 6) * 92;
        const o = p * (1 - prog(t, 135.4, 136.4)) * (stack > 6 ? Math.max(0, 1 - (stack - 6)) : 1);
        return (
          <div key={i} style={{position: 'absolute', right: 0, top: y + shift, width: 440, padding: '18px 22px', borderRadius: 16, background: 'rgba(18,24,32,0.78)', border: '1px solid rgba(160,210,255,0.25)', backdropFilter: 'blur(8px)', opacity: o, transform: `translateX(${(1 - p) * 60}px)`, display: 'flex', gap: 16, alignItems: 'center', fontFamily: F.sans, color: C.white}}>
            <div style={{width: 40, height: 40, borderRadius: 10, background: C.blueDeep, boxShadow: `0 0 18px ${C.blue}`}} />
            <div>
              <div style={{fontWeight: 700, fontSize: 21}}>New order</div>
              <div style={{fontSize: 17, opacity: 0.65}}>DoorBot · {['CA', 'TX', 'NY', 'FL', 'WA', 'IL', 'OH', 'GA', 'AZ', 'CO', 'NJ', 'MA', 'OR', 'NC'][i]}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const S3Rejection: React.FC = () => {
  const t = useT('rejection');
  const card = window01(t, at('r1') + 0.2, 89.2, 0.6, 0.5);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Sequence {...seq(81.5, 127.4)} layout="none">
        <TankShot t={t} />
      </Sequence>
      <Sequence {...seq(127.2, 136.6)} layout="none">
        <AftermathShot t={t} />
      </Sequence>
      <ArchivalSlot id="ST-02" t={t} sceneStart={S0} />
      <Layer>
        <RecreationBadge t={t} a={82} b={126.6} />
        {/* the terms */}
        {card > 0 ? (
          <div style={{position: 'absolute', left: 110, top: 250, width: 620, padding: '40px 44px', borderRadius: 22, background: 'rgba(8,12,18,0.62)', border: '1px solid rgba(200,225,250,0.18)', backdropFilter: 'blur(10px)', opacity: card, fontFamily: F.mono, color: C.white}}>
            <div style={{fontSize: 18, letterSpacing: '0.3em', color: C.blue, marginBottom: 26}}>THE PITCH · DOORBOT</div>
            {[
              ['ASK', '$700,000', at('r1') + 0.4],
              ['EQUITY', '10%', at('r1') + 0.9],
              ['IMPLIED VALUATION', null, at('r1') + 1.4],
              ['RETAIL PRICE', '≈ $200', at('r1') + 4.4],
            ].map(([k, v, a], i) => (
              <div key={i} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '16px 0', borderTop: i ? '1px solid rgba(255,255,255,0.1)' : 'none', opacity: prog(t, a as number, (a as number) + 0.5)}}>
                <span style={{fontSize: 19, letterSpacing: '0.2em', opacity: 0.7}}>{k}</span>
                <span style={{fontFamily: F.sans, fontWeight: 700, fontSize: 44}}>
                  {v ?? <Counter t={t} a={a as number} dur={1.6} from={0} to={7000000} format={(x) => fmtMoney(x)} />}
                </span>
              </div>
            ))}
          </div>
        ) : null}
        {/* each Shark's concern */}
        {SEAT_LINES.map((id, i) => {
          const a = at(id), b = outTime(i) + 1.2;
          const o = window01(t, a, b, 0.4, 0.4);
          if (o <= 0) return null;
          const out = t >= outTime(i);
          return (
            <div key={id} style={{position: 'absolute', left: 110, bottom: 150, opacity: o}}>
              <div style={{fontFamily: F.mono, fontSize: 22, letterSpacing: '0.34em', color: out ? C.red : C.white}}>
                {SHARKS[i]}
                {out ? <span style={{marginLeft: 26, padding: '4px 12px', border: `2px solid ${C.red}`}}>OUT</span> : null}
              </div>
              <div style={{marginTop: 18, fontFamily: F.serif, fontStyle: 'italic', fontSize: 64, color: C.white, maxWidth: 1300}}>
                <Reveal t={t} a={a + 0.3} text={CONCERNS[i]} stagger={0.018} inDur={0.6} />
              </div>
            </div>
          );
        })}
        <SourceTag t={t} a={92} b={109.2} text="Concerns paraphrased from published recaps of the episode (SlashGear, Primetimer) · not verbatim quotes" />
        {/* the offer */}
        {(() => {
          const o = window01(t, at('r7') + 1.4, at('r8') + 3.2, 0.6, 0.1);
          const burn = prog(t, at('r8') + 2.2, at('r8') + 3.4, 'power2.in');
          if (o <= 0 && burn <= 0) return null;
          return (
            <div style={{position: 'absolute', right: 120, top: 210, width: 640, padding: '40px 46px', borderRadius: 6, background: '#efe9dd', color: '#181512', fontFamily: F.mono, opacity: Math.max(0, o) * (1 - burn), transform: `rotate(-1.5deg) scale(${1 - burn * 0.06})`, filter: `blur(${burn * 16}px)`, boxShadow: '0 40px 90px rgba(0,0,0,0.6)'}}>
              <div style={{fontSize: 18, letterSpacing: '0.3em', opacity: 0.6}}>OFFER · KEVIN O'LEARY</div>
              <div style={{fontFamily: F.serif, fontSize: 72, marginTop: 14}}>$700,000</div>
              <div style={{fontSize: 20, lineHeight: 1.7, marginTop: 14}}>
                · Structured like a loan<br />· Royalty on every unit until repaid<br />· Ongoing royalty after that<br />· Plus an equity stake
              </div>
              <div style={{marginTop: 22, fontSize: 14, letterSpacing: '0.1em', opacity: 0.55}}>REPORTED TERMS VARY BY SOURCE</div>
              {t > at('r8') + 1.4 ? (
                <div style={{position: 'absolute', right: 40, bottom: 60, transform: `rotate(-14deg) scale(${1.6 - prog(t, at('r8') + 1.4, at('r8') + 1.7, 'back.out') * 0.6})`, padding: '8px 24px', border: `5px solid ${C.red}`, color: C.red, fontFamily: F.mono, fontWeight: 700, fontSize: 48, letterSpacing: '0.2em', opacity: prog(t, at('r8') + 1.4, at('r8') + 1.55)}}>
                  DECLINED
                </div>
              ) : null}
            </div>
          );
        })()}
        <div style={{position: 'absolute', left: 0, right: 0, top: 420, textAlign: 'center', fontFamily: F.serif, fontSize: 220, color: C.white, lineHeight: 1}}>
          <Reveal t={t} a={at('r9') - 0.05} b={at('r10') + 0.2} text="No deal." stagger={0.05} inDur={0.9} blur={24} />
        </div>
        <div style={{position: 'absolute', left: 110, top: 110}}>
          <Kicker t={t} a={at('r10') + 2.6} b={136.2} text="WHEN THE EPISODE AIRS" color={C.blue} />
        </div>
        <Toasts t={t} />
        <SourceTag t={t} a={at('r10') + 4.2} b={136.2} text="Illustrative · Siminoff has said the broadcast drove a surge of sales" />
      </Layer>
    </AbsoluteFill>
  );
};
