import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {Stage, CameraRig} from '../lib/Stage';
import {Studio} from '../env/Studio';
import {Doorbell} from '../models/Doorbell';
import {FloodlightCam, StickUpCam, AlarmBase} from '../models/Products';
import {City, House} from '../env/City';
import {Glow, Dust, Label3D} from '../lib/three-bits';
import {useT} from '../lib/useT';
import {FPS, SCENES, at, end} from '../timeline';
import {keys, prog, window01, clamp01, ease, mix, rand} from '../lib/ease';
import {C, Kicker, Reveal, Layer, SourceTag, RecreationBadge} from '../ui/Type';
import {F} from '../lib/fonts';
import {ArchivalSlot} from '../ui/ArchivalSlot';

const S0 = SCENES.explosion[0];
const seq = (a: number, b: number) => ({from: Math.round((a - S0) * FPS), durationInFrames: Math.round((b - a) * FPS)});

const PRODUCTS = [
  {id: 'e2a', x: -4.2, name: 'VIDEO DOORBELL'},
  {id: 'e2b', x: -1.4, name: 'FLOODLIGHT CAM'},
  {id: 'e2c', x: 1.4, name: 'STICK UP CAM'},
  {id: 'e2d', x: 4.2, name: 'ALARM'},
];

const LineupShot: React.FC<{t: number}> = ({t}) => {
  const rise = (id: string) => prog(t, at(id) - 0.15, at(id) + 0.7, 'expo.out');
  return (
    <Stage env={1.0} grade={{time: t, bloom: 0.7, bloomThreshold: 0.82, fade: Math.max(1 - prog(t, 197.0, 197.8), 0), flash: prog(t, 209.3, 209.75, 'power2.in') * 0.8, flashColor: '#bfe8ff'}}>
      <CameraRig
        t={t}
        path={[
          {t: 197.0, p: [0, 0.6, 11.5], l: [0, -0.1, 0], fov: 34},
          {t: 208.6, p: [0, 0.9, 9.4], l: [0, -0.1, 0], fov: 34, e: 'sine.inOut'},
          {t: 209.75, p: [0, 6.5, 6.5], l: [0, -1.5, -2], fov: 50, e: 'power3.in'},
        ]}
      />
      <Studio t={t} keyI={1} cone={0.1} rim={1} floorY={-1.6} spotPos={[0, 7, 4]} target={[0, -1.6, 0]} dust={0.3} />
      {PRODUCTS.map((p, i) => {
        const r = rise(p.id);
        const y = mix(-3.2, 0, r);
        const rot = keys(t, [[197, -0.6], [209.6, 0.5]]) + i * 0.08;
        return (
          <group key={p.id} position={[p.x, y, 0]} rotation={[0, rot, 0]} visible={r > 0.001}>
            {i === 0 ? <Doorbell variant="ring" led={2.4} scale={0.7} position={[0, -0.2, 0]} t={t} /> : null}
            {i === 1 ? <FloodlightCam scale={1.1} position={[0, -0.2, 0]} lamps={prog(t, at('e2b') + 0.4, at('e2b') + 0.6)} /> : null}
            {i === 2 ? <StickUpCam scale={1.15} position={[0, -0.4, 0]} /> : null}
            {i === 3 ? <AlarmBase scale={1.1} position={[-0.3, -0.5, 0]} /> : null}
            <Label3D text={p.name} font="mono" weight={500} size={56} tracking={0.3} color="#e6f2fb" height={0.14} position={[0, -1.45, 0.9]} rotation={[-Math.PI / 2 + 0.3, 0, 0]} opacity={prog(t, at(p.id) + 0.3, at(p.id) + 0.8)} />
          </group>
        );
      })}
    </Stage>
  );
};

const CityShot: React.FC<{t: number}> = ({t}) => {
  // adoption metaphor: porch lights turn blue in expanding, organic waves
  const lt = t - 209.6;
  const centers = [[0, 0, 0], [-30, 25, 3.5], [35, -20, 6], [-20, -40, 9], [40, 35, 12]];
  const lit = (h: House) => {
    let v = 0;
    for (const [cx, cz, d] of centers) {
      const dd = Math.hypot(h.x - cx, h.z - cz);
      v = Math.max(v, clamp01(((lt - d) * 6.5 - dd) / 5 + (h.r - 0.5) * 1.2));
    }
    return v;
  };
  const dawn = prog(t, at('e7') - 0.5, 248.6, 'sine.inOut');
  return (
    <Stage env={0.2} background="#03060b" fog={['#03060b', 20, 110]} shadows={false} grade={{time: t, bloom: 1.1, bloomThreshold: 0.55, bloomRadius: 0.7, flash: 1 - prog(t, 209.6, 210.3), flashColor: '#bfe8ff', fade: prog(t, 248.0, 248.6, 'power2.in'), gain: [1 + dawn * 0.12, 1 + dawn * 0.02, 1 - dawn * 0.08]}}>
      <CameraRig
        t={t}
        path={[
          {t: 209.6, p: [0, 7, 6], l: [0, 0, -6], fov: 50},
          {t: 216.0, p: [-14, 16, 18], l: [0, 0, -4], fov: 46, e: 'power2.inOut'},
          {t: 232.8, p: [-24, 30, 36], l: [6, 0, -8], fov: 42, e: 'sine.inOut'},
          {t: 241.0, p: [10, 34, 40], l: [4, 4, -20], fov: 42, e: 'sine.inOut'},
          {t: 248.6, p: [18, 22, 30], l: [20, 6, -60], fov: 44, e: 'sine.inOut'},
        ]}
      />
      <ambientLight intensity={0.3} color="#5c7aa8" />
      <directionalLight position={[-20, 30, 10]} intensity={0.4} color="#8fb6ff" />
      <City R={95} seed={7} lit={lit} windowGlow={0.5} />
      <Glow position={[40, -6, -140]} size={420 * (0.4 + dawn)} color="#ff9a1f" opacity={dawn} />
      <Glow position={[40, -10, -140]} size={120} color="#ffd29a" opacity={dawn * 0.6} />
      <Dust t={t} count={300} box={[120, 30, 120]} center={[0, 15, 0]} color="#9fd3ff" opacity={0.25} size={0.25} />
    </Stage>
  );
};

// Valuation chart (reported figures) — drawn in SVG over the city.
const POINTS = [
  {id: 'e5a', year: '2013', v: 7, label: '$7M', note: 'ASKED ON SHARK TANK'},
  {id: 'e5b', year: '2015', v: 60, label: '~$60M', note: 'SERIES B · CNBC'},
  {id: 'e5c', year: '2016', v: 204, label: '$204M', note: 'SERIES C · PITCHBOOK'},
  {id: 'e5d', year: '2017', v: 445, label: '$445M', note: 'SERIES D · PITCHBOOK'},
];
const Chart: React.FC<{t: number}> = ({t}) => {
  const o = window01(t, at('e4') - 0.2, 233.4, 0.6, 0.6);
  if (o <= 0) return null;
  const X0 = 220, X1 = 1500, Y0 = 860, Y1 = 260;
  const px = (i: number) => X0 + (i / 3) * (X1 - X0);
  const py = (v: number) => Y0 - (v / 445) * (Y0 - Y1);
  const reveal = POINTS.map((p) => prog(t, at(p.id), at(p.id) + 1.0, 'power3.out'));
  let d = `M ${px(0)} ${py(POINTS[0].v)}`;
  for (let i = 1; i < 4; i++) {
    const r = reveal[i];
    if (r <= 0) break;
    const x = mix(px(i - 1), px(i), r), y = mix(py(POINTS[i - 1].v), py(POINTS[i].v), r);
    d += ` L ${x} ${y}`;
  }
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: o}}>
      <defs>
        <filter id="glow"><feGaussianBlur stdDeviation="6" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#38b6ff" stopOpacity="0.35" /><stop offset="1" stopColor="#38b6ff" stopOpacity="0" /></linearGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="rgba(2,4,8,0.45)" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i} opacity={0.5}>
          <line x1={px(i)} x2={px(i)} y1={Y0 + 10} y2={Y1 - 40} stroke="rgba(200,225,250,0.12)" strokeWidth={1} />
          <text x={px(i)} y={Y0 + 50} fill="#cfe0ee" fontFamily="JetBrains Mono" fontSize={22} letterSpacing={4} textAnchor="middle">{POINTS[i].year}</text>
        </g>
      ))}
      <path d={d} fill="none" stroke="#38b6ff" strokeWidth={5} filter="url(#glow)" strokeLinejoin="round" />
      {POINTS.map((p, i) => {
        const r = reveal[i];
        if (r <= 0) return null;
        const x = px(i), y = py(p.v);
        return (
          <g key={p.id} opacity={r}>
            <circle cx={x} cy={y} r={10 + (1 - r) * 30} fill="none" stroke="#9fdcff" strokeWidth={2} opacity={1 - r * 0.6} />
            <circle cx={x} cy={y} r={8} fill="#e8f7ff" filter="url(#glow)" />
            <text x={x + (i === 3 ? -24 : 24)} y={y - 30} fill="#ffffff" fontFamily="Inter Tight" fontWeight={800} fontSize={64} textAnchor={i === 3 ? 'end' : 'start'}>{p.label}</text>
            <text x={x + (i === 3 ? -24 : 24)} y={y + 4} fill={i === 0 ? '#ff6a6a' : '#8fd6ff'} fontFamily="JetBrains Mono" fontSize={18} letterSpacing={3} textAnchor={i === 3 ? 'end' : 'start'}>{p.note}</text>
          </g>
        );
      })}
    </svg>
  );
};

const INVESTORS = ['Richard Branson', 'Kleiner Perkins', 'DFJ Growth', 'Goldman Sachs Investment Partners', 'Qualcomm Ventures', 'True Ventures', 'American Family Insurance', 'Shea Ventures'];
const Investors: React.FC<{t: number}> = ({t}) => {
  const a0 = at('e6') + 0.4;
  return (
    <>
      {INVESTORS.map((n, i) => {
        const a = a0 + i * 0.55;
        const o = window01(t, a, 241.4, 0.8, 0.6);
        if (o <= 0) return null;
        const POS = [[160, 230], [1080, 190], [560, 380], [1260, 470], [180, 560], [820, 660], [1300, 780], [300, 820]];
        const [x, y] = POS[i];
        const drift = (t - a) * 6;
        const z = 0.75 + rand(i + 3) * 0.5;
        return (
          <div key={n} style={{position: 'absolute', left: x, top: y - drift, opacity: o * (0.55 + z * 0.4), fontFamily: F.serif, fontSize: 44 * z, color: C.white, filter: `blur(${(1.25 - z) * 2}px)`, textShadow: '0 0 30px rgba(56,182,255,0.5)', whiteSpace: 'nowrap'}}>
            {n}
          </div>
        );
      })}
    </>
  );
};

export const S5Explosion: React.FC = () => {
  const t = useT('explosion');
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Sequence {...seq(197.0, 209.8)} layout="none">
        <LineupShot t={t} />
      </Sequence>
      <Sequence {...seq(209.6, 248.6)} layout="none">
        <CityShot t={t} />
      </Sequence>
      <ArchivalSlot id="AD-01" t={t} sceneStart={S0} />
      <Layer>
        <div style={{position: 'absolute', left: 0, right: 0, top: 130, textAlign: 'center', fontFamily: F.serif, fontSize: 96, color: C.white}}>
          <Reveal t={t} a={at('e1') + 1.3} b={208.8} text="It's a system." stagger={0.04} inDur={0.9} />
        </div>
        <RecreationBadge t={t} a={198} b={208.8} text="STYLIZED PRODUCT MODELS" />
        <div style={{position: 'absolute', left: 110, top: 110}}>
          <Kicker t={t} a={at('e3') + 0.4} b={215.2} text="FRONT DOOR BY FRONT DOOR" color={C.blue} />
        </div>
        <SourceTag t={t} a={at('e3') + 0.6} b={215.2} text="Visual metaphor for adoption · not a map of actual customers" />
        <Chart t={t} />
        <div style={{position: 'absolute', left: 110, top: 110}}>
          <Kicker t={t} a={at('e4') + 0.3} b={233.2} text="REPORTED VALUATION" />
        </div>
        <SourceTag t={t} a={at('e5a')} b={233.2} text="2013: implied by the Shark Tank ask · 2015: CNBC · 2016–17: PitchBook" />
        <Investors t={t} />
        <div style={{position: 'absolute', left: 110, bottom: 120}}>
          <Kicker t={t} a={at('e6') + 1.0} b={241.4} text="BACKED BY" color={C.blue} />
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 150, textAlign: 'center', fontFamily: F.serif, fontStyle: 'italic', fontSize: 70, color: C.white}}>
          <Reveal t={t} a={at('e7') + 1.4} b={248.2} text="Someone is paying attention." stagger={0.035} />
        </div>
      </Layer>
    </AbsoluteFill>
  );
};
