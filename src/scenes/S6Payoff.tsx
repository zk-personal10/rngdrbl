import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import * as THREE from 'three';
import {Stage, CameraRig} from '../lib/Stage';
import {Studio} from '../env/Studio';
import {SharkSeats, Pedestal, SeatState, SHARKS} from '../env/Tank';
import {Doorbell} from '../models/Doorbell';
import {Tower, MirrorFloor} from '../env/Towers';
import {Text3D, Glow, Dust, RingWave} from '../lib/three-bits';
import {useT} from '../lib/useT';
import {FPS, SCENES, at, end} from '../timeline';
import {keys, prog, window01} from '../lib/ease';
import {C, Kicker, Reveal, Layer, SourceTag, Counter, fmtMoney, RecreationBadge} from '../ui/Type';
import {F} from '../lib/fonts';
import {ArchivalSlot} from '../ui/ArchivalSlot';

const S0 = SCENES.payoff[0];
const seq = (a: number, b: number) => ({from: Math.round((a - S0) * FPS), durationInFrames: Math.round((b - a) * FPS)});

const wallMat = new THREE.MeshStandardMaterial({color: '#2a2c30', roughness: 0.85});

/** Porch at night: a Ring doorbell on a wall. Used for the announcement and the final pull-back. */
const Porch: React.FC<{t: number; led: number}> = ({t, led}) => (
  <group>
    <mesh position={[0, 0, -0.06]} material={wallMat} receiveShadow>
      <boxGeometry args={[30, 20, 0.1]} />
    </mesh>
    <mesh position={[-2.2, -1.0, 0.05]} receiveShadow castShadow>
      <boxGeometry args={[2.2, 5.5, 0.12]} />
      <meshStandardMaterial color="#0f2b45" roughness={0.5} />
    </mesh>
    <Doorbell variant="ring" led={led} t={t} scale={0.5} position={[0, 0, 0.13]} />
    <pointLight position={[0.6, 2.5, 1.5]} intensity={6} distance={6} color="#ffcf8a" castShadow />
  </group>
);

const AnnounceShot: React.FC<{t: number}> = ({t}) => {
  const pulse = 1.6 + Math.max(0, Math.sin((t - at('p2')) * 5)) * 1.4 * window01(t, at('p2'), at('p3'), 0.2, 0.5);
  return (
    <Stage env={0.7} background="#020306" grade={{time: t, bloom: 0.9, bloomThreshold: 0.75, fade: Math.max(1 - prog(t, 248.0, 249.2), prog(t, 256.2, 256.7, 'power2.in')), flash: prog(t, 256.3, 256.7) * 0.9, flashColor: '#ffb04a', gain: [1.05, 1.0, 0.95]}}>
      <CameraRig
        t={t}
        path={[
          {t: 248.0, p: [0.0, -0.3, 1.3], l: [0, -0.3, 0], fov: 30},
          {t: at('p2'), p: [0.05, -0.2, 1.9], l: [0, -0.2, 0], fov: 30, e: 'sine.inOut'},
          {t: 256.6, p: [1.4, 0.2, 4.6], l: [0.2, 0, 0], fov: 34, e: 'power3.inOut'},
        ]}
      />
      <ambientLight intensity={0.15} color="#6a84b0" />
      <Porch t={t} led={pulse} />
      <Dust t={t} count={200} box={[6, 4, 3]} center={[0, 0, 1.5]} color="#ffe0b0" opacity={0.4} size={0.02} />
    </Stage>
  );
};

// $7M implied valuation vs >$1B reported price, at true scale (height ∝ value).
const H_PER_M = 0.012;
const ScaleShot: React.FC<{t: number}> = ({t}) => {
  const grow = prog(t, at('p3') + 2.2, at('p3') + 6.0, 'expo.inOut');
  return (
    <Stage env={1.0} background="#03050a" fog={['#03050a', 20, 80]} grade={{time: t, bloom: 0.9, bloomThreshold: 0.72, flash: (1 - prog(t, 256.6, 257.3)) * 0.8, flashColor: '#ffb04a', fade: prog(t, 270.0, 270.5, 'power2.in')}}>
      <CameraRig
        t={t}
        path={[
          {t: 256.6, p: [-0.6, 0.9, 5.0], l: [-2.6, 0.5, 0], fov: 32},
          {t: at('p3') + 2.2, p: [-0.4, 1.0, 5.6], l: [-2.6, 0.5, 0], fov: 32, e: 'sine.inOut'},
          {t: at('p3') + 6.2, p: [4, 8, 18], l: [1, 8, 0], fov: 40, e: 'power3.inOut'},
          {t: at('p4') + 1.0, p: [-6, 6, 22], l: [0, 6.5, 0], fov: 40, e: 'sine.inOut'},
          {t: 270.5, p: [-9, 3, 26], l: [0, 6, 0], fov: 40, e: 'sine.inOut'},
        ]}
      />
      <spotLight position={[-8, 26, 14]} intensity={500} angle={0.6} penumbra={0.9} color="#fff3e2" castShadow />
      <pointLight position={[3, 3, 6]} intensity={40} color="#ff9a1f" distance={24} />
      <MirrorFloor />
      <Tower x={-2.6} z={0} h={7 * H_PER_M} grow={1} w={0.7} amount="$7M" label="2013 · SHARK TANK" sub="IMPLIED VALUATION · NO DEAL" color="#ff3b3b" labelOpacity={1 - prog(t, at('p3') + 3, at('p3') + 4)} />
      <Tower x={1.4} z={-1} h={1000 * H_PER_M} grow={grow} w={3.2} amount="$1B+" label="2018 · AMAZON" sub="REPORTED ACQUISITION PRICE" color="#ff9a1f" labelOpacity={prog(t, at('p3') + 5.0, at('p3') + 6.0)} />
      <Dust t={t} count={400} box={[30, 16, 20]} center={[0, 8, 0]} color="#ffd8a8" opacity={0.3} size={0.05} />
    </Stage>
  );
};

const guestStates = (t: number): SeatState[] => {
  const on = prog(t, 270.6, 271.6);
  const guest = prog(t, at('p5') + 2.6, at('p5') + 3.4, 'expo.out');
  return [0, 1, 2, 3, 4, 5].map((i) => (i === 5 ? {color: '#38b6ff', glow: guest * 1.8, name: guest} : {color: '#e4ecf4', glow: 0.3 * on, name: on * 0.6}));
};

const GuestShot: React.FC<{t: number}> = ({t}) => (
  <Stage env={1.0} grade={{time: t, bloom: 0.8, bloomThreshold: 0.8, fade: Math.max(1 - prog(t, 270.4, 271.4), prog(t, 278.6, 279.2, 'power2.in')), vignette: 0.8}}>
    <CameraRig
      t={t}
      path={[
        {t: 270.4, p: [0, 2.2, 11.5], l: [0, 0.6, -3], fov: 38},
        {t: 279.2, p: [3.2, 0.9, 6.4], l: [3.0, 0.6, -3.5], fov: 34, e: 'sine.inOut'},
      ]}
    />
    <Studio t={t} keyI={0.6} cone={0.12} rim={0.6} spotPos={[0, 6.2, 0.4]} target={[0, -1.6, 0]} dust={0.4} />
    <Pedestal glow={0.6} />
    <SharkSeats n={6} radius={6.4} spread={1.45} states={guestStates(t)} names={[...SHARKS, 'JAMIE SIMINOFF']} />
  </Stage>
);

/** Final: the doorbell, one last chime, pull back into darkness, title. */
const FinaleShot: React.FC<{t: number}> = ({t}) => {
  const chime = at('p7') + 1.6;
  const led = 1.4 + prog(t, chime, chime + 0.15) * 2.5 * (1 - prog(t, chime + 0.6, chime + 2.5));
  const ringOn = prog(t, 288.0, 289.2, 'expo.out');
  const ringMat = React.useMemo(() => new THREE.MeshBasicMaterial({toneMapped: false}), []);
  ringMat.color.set('#38b6ff').multiplyScalar(0.2 + ringOn * 3.0);
  return (
    <Stage env={0.9} background="#010204" grade={{time: t, bloom: 0.9, bloomThreshold: 0.72, fade: Math.max(1 - prog(t, 279.0, 280.2), prog(t, 286.2, 287.0, 'power2.in') * (1 - prog(t, 287.2, 288.2)), prog(t, 295.4, 296.6, 'power2.in'))}}>
      {t < 287.2 ? (
        <>
          <CameraRig
            t={t}
            path={[
              {t: 279.0, p: [0.9, 0.1, 3.6], l: [0, -0.1, 0], fov: 32},
              {t: 286.8, p: [0.2, -0.25, 2.3], l: [0, -0.3, 0], fov: 30, e: 'sine.inOut'},
            ]}
          />
          <ambientLight intensity={0.12} color="#6a84b0" />
          <Porch t={t} led={led} />
          {[0, 0.5].map((d) => (
            <RingWave key={d} p={prog(t, chime + d, chime + d + 2.2, 'power2.out')} maxR={1.6} position={[0, -0.36, 0.25]} color="#9fdcff" width={0.01} />
          ))}
        </>
      ) : (
        <>
          <CameraRig t={t} path={[{t: 287.2, p: [0.2, -0.3, 12.5], l: [0.25, -0.55, 0], fov: 30}, {t: 296.6, p: [0.25, -0.35, 9.8], l: [0.25, -0.55, 0], fov: 30, e: 'sine.inOut'}]} />
          <spotLight position={[-3, 5, 6]} intensity={90} angle={0.5} penumbra={0.8} color="#fff0dc" />
          <pointLight position={[4, -1, 3]} intensity={20} color="#38b6ff" />
          <group position={[0, -0.55, 0]}>
            <Text3D text="N" font="serif" size={2.3} depth={0.35} bevel={0.03} position={[-0.75, -0.02, 0]}>
              <meshPhysicalMaterial color="#d9dde2" metalness={1} roughness={0.22} clearcoat={0.6} />
            </Text3D>
            <mesh position={[1.25, -0.38, 0]} material={ringMat}>
              <torusGeometry args={[0.62, 0.075, 32, 160]} />
            </mesh>
            <Glow position={[1.25, -0.38, 0.1]} size={3.8 * ringOn} color="#38b6ff" opacity={ringOn * 0.5} />
          </group>
          <Dust t={t} count={300} box={[12, 6, 6]} opacity={0.4} color="#bfe4ff" />
        </>
      )}
    </Stage>
  );
};

const CREDITS: [string, string][] = [
  ['NARRATION', 'Synthetic voice · Kokoro TTS (Apache-2.0)'],
  ['MUSIC & SOUND DESIGN', 'Original score, procedurally synthesized for this film'],
  ['IMAGERY', 'All 3D sequences are original recreations · no archival footage shown'],
  ['SOURCES', 'Reuters · Wall Street Journal · TechCrunch · Fortune · PitchBook · CNBC · Inc. · LA Business Journal · GeekWire · SlashGear · Primetimer'],
  ['NOTE', 'Shark concerns are paraphrased, not quoted. Acquisition price was reported; terms were not disclosed.'],
];

export const S6Payoff: React.FC = () => {
  const t = useT('payoff');
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Sequence {...seq(248.0, 256.7)} layout="none">
        <AnnounceShot t={t} />
      </Sequence>
      <Sequence {...seq(256.5, 270.6)} layout="none">
        <ScaleShot t={t} />
      </Sequence>
      <Sequence {...seq(270.3, 279.3)} layout="none">
        <GuestShot t={t} />
      </Sequence>
      <Sequence {...seq(279.0, 296.7)} layout="none">
        <FinaleShot t={t} />
      </Sequence>
      <ArchivalSlot id="NW-01" t={t} sceneStart={S0} />
      <ArchivalSlot id="ST-03" t={t} sceneStart={S0} />
      <Layer>
        <div style={{position: 'absolute', left: 110, top: 120, fontFamily: F.serif, fontSize: 120, color: C.white, lineHeight: 1}}>
          <Reveal t={t} a={at('p1') - 0.1} b={at('p2') + 0.2} text="February 27, 2018" stagger={0.04} inDur={0.9} />
        </div>
        {(() => {
          const a = at('p2');
          const o = window01(t, a - 0.1, 256.4, 0.3, 0.3);
          if (o <= 0) return null;
          const line = prog(t, a + 0.9, a + 1.8, 'expo.inOut');
          return (
            <div style={{position: 'absolute', left: 110, top: 300, opacity: o}}>
              <div style={{fontFamily: F.sans, fontWeight: 800, fontSize: 170, lineHeight: 0.92, letterSpacing: '-0.03em', color: C.white}}>
                <Reveal t={t} a={a} text="Amazon" stagger={0.04} inDur={0.5} blur={20} />
              </div>
              <div style={{height: 8, width: 520 * line, background: C.orange, borderRadius: 8, margin: '18px 0 22px', boxShadow: `0 0 30px ${C.orange}`}} />
              <div style={{fontFamily: F.mono, fontSize: 34, letterSpacing: '0.5em', color: C.white}}>
                <Reveal t={t} a={a + 1.0} text="TO ACQUIRE RING" stagger={0.03} blur={6} />
              </div>
            </div>
          );
        })()}
        <SourceTag t={t} a={at('p2')} b={256.3} text="Announced Feb 27, 2018 · deal closed April 2018" />
        {t > at('p3') ? (
          <div style={{position: 'absolute', left: 0, right: 0, bottom: 110, textAlign: 'center', opacity: window01(t, at('p3') + 0.2, at('p4') - 0.2, 0.5, 0.4)}}>
            <div style={{fontFamily: F.mono, fontSize: 22, letterSpacing: '0.4em', color: C.orange}}>REPORTED PRICE</div>
            <div style={{fontFamily: F.sans, fontWeight: 800, fontSize: 130, color: C.white, fontVariantNumeric: 'tabular-nums', textShadow: '0 0 40px rgba(255,154,31,0.4)'}}>
              <Counter t={t} a={at('p3') + 2.2} dur={3.8} from={7000000} to={1000000000} e="expo.inOut" format={(v) => fmtMoney(Math.round(v / 100000) * 100000) + (t > at('p3') + 5.9 ? '+' : '')} />
            </div>
          </div>
        ) : null}
        <SourceTag t={t} a={at('p3') + 1} b={270.0} text="Reuters, WSJ: “more than $1 billion” · heights to scale ($7M vs $1B)" />
        {/* the contrast */}
        {(() => {
          const o = window01(t, at('p4') - 0.2, 270.2, 0.5, 0.4);
          if (o <= 0) return null;
          const l = prog(t, at('p4'), at('p4') + 0.8, 'expo.out'), r = prog(t, at('p4') + 1.6, at('p4') + 2.4, 'expo.out');
          return (
            <div style={{position: 'absolute', left: 0, right: 0, top: 120, display: 'flex', justifyContent: 'space-between', padding: '0 110px', opacity: o}}>
              <div style={{opacity: l, transform: `translateX(${(1 - l) * -40}px)`}}>
                <div style={{fontFamily: F.mono, fontSize: 22, letterSpacing: '0.35em', color: C.red}}>2013 · SHARK TANK</div>
                <div style={{fontFamily: F.serif, fontSize: 96, color: C.white}}>$700,000 ask</div>
                <div style={{fontFamily: F.mono, fontSize: 22, letterSpacing: '0.35em', color: C.dim}}>NO DEAL</div>
              </div>
              <div style={{textAlign: 'right', opacity: r, transform: `translateX(${(1 - r) * 40}px)`}}>
                <div style={{fontFamily: F.mono, fontSize: 22, letterSpacing: '0.35em', color: C.orange}}>2018 · AMAZON</div>
                <div style={{fontFamily: F.serif, fontSize: 96, color: C.white}}>$1B+ exit</div>
                <div style={{fontFamily: F.mono, fontSize: 22, letterSpacing: '0.35em', color: C.dim}}>REPORTED</div>
              </div>
            </div>
          );
        })()}
        {/* guest shark */}
        <div style={{position: 'absolute', left: 110, top: 110}}>
          <Kicker t={t} a={at('p5') + 0.4} b={278.8} text="OCTOBER 2018 · SHARK TANK SEASON 10" color={C.blue} />
        </div>
        <div style={{position: 'absolute', left: 110, bottom: 140, fontFamily: F.serif, fontStyle: 'italic', fontSize: 76, color: C.white}}>
          <Reveal t={t} a={at('p5') + 3.0} b={278.8} text="This time, in the Shark's chair." stagger={0.03} />
        </div>
        <RecreationBadge t={t} a={270.6} b={278.8} />
        {/* the line */}
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 480, background: 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0))', opacity: window01(t, at('p6') - 0.3, 286.4, 0.6, 0.4)}} />
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 110, textAlign: 'center', fontFamily: F.serif, fontStyle: 'italic', fontSize: 66, color: C.white, lineHeight: 1.3}}>
          <Reveal t={t} a={at('p6') + 0.1} b={286.4} text="Sometimes, the most important deal you'll ever make…" stagger={0.022} />
          <br />
          <span style={{fontStyle: 'normal'}}>
            <Reveal t={t} a={at('p7')} b={286.4} text="is the one you walk away from." stagger={0.03} />
          </span>
        </div>
        {/* title */}
        {t > 287.6 && t < 296.8 ? (
          <>
            <div style={{position: 'absolute', left: 0, right: 0, top: 170, textAlign: 'center', fontFamily: F.serif, fontStyle: 'italic', fontSize: 96, color: C.white, opacity: 1 - prog(t, 295.4, 296.4)}}>
              <Reveal t={t} a={288.2} text="The Billion-Dollar" stagger={0.04} inDur={1.0} />
            </div>
            <div style={{position: 'absolute', left: 0, right: 0, bottom: 130, display: 'flex', justifyContent: 'center', opacity: 1 - prog(t, 295.4, 296.4)}}>
              <Kicker t={t} a={289.6} text="THE STORY OF RING" rule={false} size={22} />
            </div>
          </>
        ) : null}
        {/* sources / credits */}
        {t > 296.6 ? (
          <div style={{position: 'absolute', inset: 0, background: '#000', padding: '150px 200px', opacity: prog(t, 296.6, 297.4)}}>
            {CREDITS.map(([k, v], i) => (
              <div key={k} style={{display: 'flex', gap: 60, padding: '22px 0', borderTop: i ? '1px solid rgba(255,255,255,0.1)' : 'none', opacity: prog(t, 297.0 + i * 0.25, 297.6 + i * 0.25) * (1 - prog(t, 304.2, 305))}}>
                <div style={{width: 380, fontFamily: F.mono, fontSize: 20, letterSpacing: '0.3em', color: C.blue}}>{k}</div>
                <div style={{flex: 1, fontFamily: F.sans, fontSize: 30, color: C.white, lineHeight: 1.4}}>{v}</div>
              </div>
            ))}
          </div>
        ) : null}
      </Layer>
    </AbsoluteFill>
  );
};
