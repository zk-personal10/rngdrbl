import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import * as THREE from 'three';
import {Stage, CameraRig} from '../lib/Stage';
import {Doorbell} from '../models/Doorbell';
import {Dust, RingWave, Glow} from '../lib/three-bits';
import {City, House} from '../env/City';
import {Tower, MirrorFloor} from '../env/Towers';
import {useT} from '../lib/useT';
import {FPS, SCENES, at, end} from '../timeline';
import {keys, prog, window01, clamp01} from '../lib/ease';
import {C, Kicker, Reveal, Layer, SourceTag, Counter, fmtMoney} from '../ui/Type';
import {F} from '../lib/fonts';

const S0 = SCENES.comeback[0];
const seq = (a: number, b: number) => ({from: Math.round((a - S0) * FPS), durationInFrames: Math.round((b - a) * FPS)});

const SWAP = 143.2; // DoorBot parts become Ring parts
const FLARE = () => at('c4') - 0.05;

// ---------- Rebuild: void, parts, rebrand flare, shockwave over a neighbourhood ----------
const RebuildShot: React.FC<{t: number}> = ({t}) => {
  const isRing = t >= SWAP;
  const explode = isRing ? keys(t, [[SWAP, 1], [147.6, 0, 'expo.inOut']]) : keys(t, [[136.0, 0.75], [141.5, 1, 'sine.inOut']]);
  const flare = prog(t, FLARE(), FLARE() + 0.25, 'expo.out') * (1 - prog(t, FLARE() + 0.6, FLARE() + 3.0, 'power2.out'));
  const led = isRing ? 1.2 + prog(t, 147.6, 148.4) * 0.8 + flare * 14 + prog(t, FLARE(), FLARE() + 0.3) * 1.2 : 0.4;
  const wave = prog(t, FLARE(), FLARE() + 7.5, 'power1.out');
  const lit = (h: House) => (h.dist < 9 ? 0 : clamp01((wave * 90 - h.dist) * 0.3));
  return (
    <Stage
      env={0.9}
      background="#020306"
      fog={['#020306', 14, 60]}
      grade={{
        time: t,
        bloom: 0.75 + flare * 1.2,
        bloomThreshold: (isRing ? 0.8 : 0.92) - flare * 0.3,
        flash: (t > SWAP - 0.08 && t < SWAP + 0.12 ? 0.5 : 0) + flare * 0.35,
        flashColor: '#bfe8ff',
        fade: Math.max(1 - prog(t, 136.0, 137.0), prog(t, 160.9, 161.6, 'power2.in')),
        saturation: isRing ? 1 : 0.55,
      }}
    >
      <CameraRig
        t={t}
        path={[
          {t: 136.0, p: [4.5, 1.8, 9.5], l: [0, 0, 0.3], fov: 32},
          {t: SWAP, p: [6.8, 1.0, 6.4], l: [0, 0, 0.4], fov: 32, e: 'sine.inOut'},
          {t: 147.8, p: [1.2, 0.3, 5.6], l: [0, 0, 0], fov: 30, e: 'power2.inOut'},
          {t: FLARE() - 0.6, p: [0.35, -0.55, 3.3], l: [0, -0.6, 0], fov: 30, e: 'power2.inOut'},
          {t: FLARE() + 1.2, p: [0.6, 0.6, 6.0], l: [0, -0.3, 0], fov: 34, e: 'power3.out'},
          {t: 161.6, p: [0, 14, 24], l: [0, -1.5, 0], fov: 40, e: 'power2.inOut'},
        ]}
      />
      <spotLight position={[3, 6, 5]} intensity={30} angle={0.5} penumbra={0.8} color="#eef4ff" castShadow />
      <pointLight position={[-4, 1, -2]} intensity={25} color="#38b6ff" distance={14} />
      <Doorbell variant={isRing ? 'ring' : 'doorbot'} explode={explode} t={t} led={led} ledColor="#38b6ff" ir={isRing ? 0.3 : 0.1} rotation={[0, keys(t, [[136, 0.6], [147.8, -0.15], [161, 0.2]]), 0]} />
      <Glow position={[0, -0.72, 0.4]} size={2 + flare * 9} color="#38b6ff" opacity={flare * 0.8} />
      {[0, 0.25, 0.5].map((d, i) => (
        <RingWave key={i} p={prog(t, FLARE() + d, FLARE() + d + 3.5, 'power2.out')} maxR={18} position={[0, -1.79, 0]} rotation={[-Math.PI / 2, 0, 0]} color="#38b6ff" width={0.05} />
      ))}
      {t > FLARE() ? (
        <group position={[0, -1.82, 0]} scale={0.32}>
          <City R={90} hole={10} seed={3} lit={lit} windowGlow={0.3} streetGlow={0.5} />
        </group>
      ) : null}
      <Dust t={t} count={500} box={[10, 6, 10]} color="#9fd3ff" opacity={0.45} size={0.02} />
    </Stage>
  );
};

// ---------- Funding: amounts become architecture ----------
const ROUNDS = [
  {id: 'c7', x: -5, h: 28, amount: '$28M', label: 'SERIES B · 2015', sub: 'CO-LED BY RICHARD BRANSON'},
  {id: 'c8', x: 0, h: 61.2, amount: '$61.2M', label: 'SERIES C · MAR 2016', sub: 'LED BY KLEINER PERKINS'},
  {id: 'c9', x: 5, h: 109, amount: '$109M', label: 'SERIES D · JAN 2017', sub: 'DFJ GROWTH · GOLDMAN SACHS · QUALCOMM'},
];
const SCALE = 0.075;

const FundingShot: React.FC<{t: number}> = ({t}) => {
  const g = ROUNDS.map((r) => prog(t, at(r.id) + 1.4, at(r.id) + 3.2, 'expo.out'));
  const sharks = prog(t, at('c10') + 2.4, at('c10') + 3.0);
  return (
    <Stage
      env={1.0}
      background="#03060a"
      fog={['#03060a', 18, 70]}
      grade={{time: t, bloom: 0.85, bloomThreshold: 0.75, fade: Math.max(1 - prog(t, 166.0, 166.8), prog(t, 196.6, 197.6, 'power2.in')), vignette: 0.75}}
    >
      <CameraRig
        t={t}
        path={[
          {t: 166.0, p: [-9.5, 0.6, 8], l: [-6.8, 0.8, 0], fov: 34},
          {t: at('c7') + 3.5, p: [-7.8, 1.7, 6.0], l: [-6.6, 1.9, 0], fov: 34, e: 'sine.inOut'},
          {t: at('c8') + 3.2, p: [-3.0, 2.6, 8.0], l: [-1.6, 3.4, 0], fov: 34, e: 'power2.inOut'},
          {t: at('c9') + 3.5, p: [2.0, 4.6, 10.0], l: [5, 5.8, 0], fov: 36, e: 'power2.inOut'},
          {t: at('c10') + 1.0, p: [6.5, 9.0, 12.5], l: [2, 6.2, 0], fov: 38, e: 'sine.inOut'},
          {t: 197.6, p: [-1, 6.5, 21], l: [0, 3.8, 0], fov: 40, e: 'sine.inOut'},
        ]}
      />
      <spotLight position={[-6, 18, 10]} intensity={260} angle={0.6} penumbra={0.9} color="#e8f1ff" castShadow />
      <pointLight position={[0, 2, 6]} intensity={30} color="#38b6ff" distance={20} />
      <MirrorFloor />
      {ROUNDS.map((r, i) => (
        <Tower key={r.id} x={r.x} z={0} h={r.h * SCALE} grow={g[i]} label={r.label} sub={r.sub} amount={r.amount} labelOpacity={prog(t, at(r.id) + 2.4, at(r.id) + 3.0)} />
      ))}
      {/* the Sharks' $0: a sliver at ground level */}
      <Tower x={-9.2} z={2.4} h={0.02} grow={sharks} label="SHARK TANK · 2013" sub="DEAL DECLINED" amount="$0" color="#ff3b3b" w={1.0} labelOpacity={sharks} />
      <Dust t={t} count={500} box={[30, 14, 20]} center={[0, 6, 0]} color="#bfe4ff" opacity={0.35} size={0.04} />
    </Stage>
  );
};

export const S4Comeback: React.FC = () => {
  const t = useT('comeback');
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Sequence {...seq(136.0, 161.7)} layout="none">
        <RebuildShot t={t} />
      </Sequence>
      <Sequence {...seq(161.5, 166.9)} layout="none">
        <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 55%, #0a1622 0%, #020306 70%)'}} />
      </Sequence>
      <Sequence {...seq(166.0, 197.6)} layout="none">
        <FundingShot t={t} />
      </Sequence>
      <Layer>
        <div style={{position: 'absolute', left: 110, bottom: 150, fontFamily: F.serif, fontStyle: 'italic', fontSize: 84, color: C.white}}>
          <Reveal t={t} a={at('c1') + 1.6} b={140.8} text="It sharpens it." stagger={0.04} inDur={0.9} />
        </div>
        {['BETTER VIDEO', 'BETTER DESIGN', 'A BIGGER MISSION'].map((s, i) => (
          <div key={s} style={{position: 'absolute', left: 110, top: 300 + i * 70}}>
            <Kicker t={t} a={at('c2') + 2.4 + i * 1.1} b={148.2} text={s} color={i === 2 ? C.blue : C.white} size={26} />
          </div>
        ))}
        <div style={{position: 'absolute', left: 110, top: 110}}>
          <Kicker t={t} a={at('c3') + 0.6} b={160.6} text="SEPTEMBER 2014" />
        </div>
        {/* rename: DoorBot struck through, Ring arrives */}
        {(() => {
          const o = window01(t, at('c3') + 1.4, 160.6, 0.5, 0.6);
          if (o <= 0) return null;
          const strike = prog(t, at('c3') + 2.4, at('c3') + 3.0, 'expo.inOut');
          const fall = prog(t, FLARE() - 0.5, FLARE(), 'power2.in');
          return (
            <div style={{position: 'absolute', left: 110, top: 190, opacity: o}}>
              <div style={{position: 'relative', display: 'inline-block', fontFamily: F.serif, fontSize: 110, color: 'rgba(240,244,248,0.55)', opacity: 1 - fall, transform: `translateY(${fall * 30}px)`, filter: `blur(${fall * 8}px)`}}>
                DoorBot
                <div style={{position: 'absolute', left: 0, top: '54%', height: 5, width: `${strike * 100}%`, background: C.red}} />
              </div>
              <div style={{fontFamily: F.sans, fontWeight: 800, fontSize: 210, lineHeight: 0.9, letterSpacing: '-0.03em', color: C.white, textShadow: '0 0 60px rgba(56,182,255,0.7)'}}>
                <Reveal t={t} a={FLARE()} text="Ring" stagger={0.05} inDur={0.5} blur={30} />
              </div>
            </div>
          );
        })()}
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 120, textAlign: 'center', fontFamily: F.serif, fontStyle: 'italic', fontSize: 64, color: C.white}}>
          <Reveal t={t} a={at('c5') + 1.6} b={161.0} text="To make neighborhoods safer." stagger={0.03} />
        </div>
        {/* Branson's email — illustrative notification */}
        {(() => {
          const a = at('c6') + 0.9;
          const o = window01(t, a, 166.6, 0.5, 0.5);
          if (o <= 0) return null;
          const p = prog(t, a, a + 0.7, 'expo.out');
          return (
            <div style={{position: 'absolute', left: '50%', top: '50%', transform: `translate(-50%, -50%) translateY(${(1 - p) * 40}px) scale(${0.96 + p * 0.04})`, width: 720, padding: '30px 34px', borderRadius: 24, background: 'rgba(20,28,38,0.85)', border: '1px solid rgba(170,215,255,0.25)', boxShadow: '0 40px 120px rgba(0,0,0,0.7), 0 0 80px rgba(56,182,255,0.15)', opacity: o, fontFamily: F.sans, color: C.white}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
                <div style={{width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg,#2a6fd6,#38b6ff)', display: 'grid', placeItems: 'center', fontSize: 30}}>✉</div>
                <div>
                  <div style={{fontFamily: F.mono, fontSize: 16, letterSpacing: '0.25em', opacity: 0.6}}>NEW MESSAGE</div>
                  <div style={{fontWeight: 700, fontSize: 36, marginTop: 4}}>From: Richard Branson</div>
                </div>
              </div>
              <div style={{marginTop: 20, fontFamily: F.mono, fontSize: 14, letterSpacing: '0.18em', opacity: 0.5}}>ILLUSTRATIVE · EVENT REPORTED BY INC.</div>
            </div>
          );
        })()}
        {/* running total */}
        {t > at('c7') ? (
          <div style={{position: 'absolute', left: 110, top: 110, textAlign: 'left', opacity: window01(t, at('c7') + 1.0, 197.2, 0.6, 0.5)}}>
            <div style={{fontFamily: F.mono, fontSize: 18, letterSpacing: '0.3em', color: C.dim}}>VENTURE FUNDING RAISED</div>
            <div style={{fontFamily: F.sans, fontWeight: 800, fontSize: 92, color: C.white, fontVariantNumeric: 'tabular-nums'}}>
              {(() => {
                const v = 28 * prog(t, at('c7') + 1.4, at('c7') + 3.2, 'expo.out') + 61.2 * prog(t, at('c8') + 1.4, at('c8') + 3.2, 'expo.out') + 109 * prog(t, at('c9') + 1.4, at('c9') + 3.2, 'expo.out') + 11 * prog(t, at('c10'), at('c10') + 1.6, 'expo.out');
                return '$' + v.toFixed(v > 200 ? 0 : 1) + 'M' + (t > at('c10') + 1.6 ? '+' : '');
              })()}
            </div>
          </div>
        ) : null}
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 120, textAlign: 'center', fontFamily: F.serif, fontStyle: 'italic', fontSize: 60, color: C.white}}>
          <Reveal t={t} a={at('c10') + 3.6} b={197.2} text="…for the company the Sharks passed on." stagger={0.025} />
        </div>
        <SourceTag t={t} a={at('c7') + 1} b={197.0} text="PitchBook · TechCrunch · Fortune · CNBC · total incl. earlier rounds ≈ $209M" />
      </Layer>
    </AbsoluteFill>
  );
};
