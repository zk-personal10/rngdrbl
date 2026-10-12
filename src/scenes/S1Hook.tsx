import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import * as THREE from 'three';
import {Stage, CameraRig} from '../lib/Stage';
import {Studio} from '../env/Studio';
import {SharkSeats, Pedestal, SeatState} from '../env/Tank';
import {City, House} from '../env/City';
import {Doorbell} from '../models/Doorbell';
import {Text3D, Glow, Dust} from '../lib/three-bits';
import {useT} from '../lib/useT';
import {FPS, SCENES, at} from '../timeline';
import {keys, prog, window01, clamp01, ease, mix} from '../lib/ease';
import {C, Kicker, Reveal, Counter, Odometer, SourceTag, RecreationBadge, Layer, fmtMoney, Letterbox} from '../ui/Type';
import {F} from '../lib/fonts';
import {ArchivalSlot} from '../ui/ArchivalSlot';

const S0 = SCENES.hook[0];
const seq = (a: number, b: number) => ({from: Math.round((a - S0) * FPS), durationInFrames: Math.round((b - a) * FPS)});

// ---------- Shot A: the Tank (recreation) ----------
const seatStates = (t: number): SeatState[] => {
  const on = prog(t, 5.7, 6.6, 'power2.out');
  const res: SeatState[] = [];
  for (let i = 0; i < 5; i++) {
    if (i < 4) {
      const tr = at('h4') + 0.15 + i * 0.42;
      const hit = t >= tr ? 1 : 0;
      const decay = hit ? 1 - prog(t, tr + 0.1, tr + 1.1, 'power2.out') : 0;
      res.push({color: hit ? '#ff2a2a' : '#dfe8f2', glow: hit ? 1.6 * decay : 0.45 * on, name: on * (1 - prog(t, 20.2, 21, 'power1.in'))});
    } else {
      const ta = at('h4') + 2.0;
      const amber = t >= ta;
      const g = amber ? 1.3 * (1 - prog(t, ta + 1.6, ta + 2.6, 'power2.in')) : 0.45 * on;
      res.push({color: amber ? '#ffae3a' : '#dfe8f2', glow: g, name: on * (1 - prog(t, 20.2, 21, 'power1.in'))});
    }
  }
  return res;
};

const TankShot: React.FC<{t: number}> = ({t}) => {
  const spot = t < 5.6 ? 0 : t < 20.3 ? 1 : 0;
  const ledI = keys(t, [[0, 0], [1.6, 1.7, 'power2.out'], [5.4, 1.7], [7.5, 2.6], [20.3, 2.6], [22.5, 0.6, 'power2.in']]);
  const macro = t < 9.5;
  const focus = keys(t, [[0, 0.42], [4.8, 0.62], [9.5, 4.5]]);
  return (
    <Stage
      env={1.0}
      grade={{
        time: t,
        bloom: keys(t, [[0, 0.85], [5.4, 0.85], [6.4, 0.6]]),
        bloomThreshold: keys(t, [[0, 0.7], [5.4, 0.7], [6.4, 0.85]]),
        exposure: keys(t, [[0, 1], [10.4, 1], [11, 0.75], [14.8, 0.75], [15.4, 1]]),
        fade: Math.max(1 - prog(t, 0, 1.6, 'power2.out'), prog(t, 22.4, 23.5, 'power2.in')),
        flash: t >= 5.6 && t < 5.75 ? 0.25 : 0,
        dof: null,
        vignette: 0.75,
      }}
    >
      <CameraRig
        t={t}
        drift={1}
        path={[
          {t: 0, p: [0, -0.185, 2.0], l: [0, -0.185, 0], fov: 26},
          {t: 5.4, p: [0.08, -0.12, 2.6], l: [0, -0.08, 0], fov: 26, e: 'none'},
          {t: 10.4, p: [1.3, 0.3, 4.4], l: [0, -0.05, 0], fov: 32, e: 'power3.inOut'},
          {t: 15.2, p: [-1.9, -0.95, 3.7], l: [0, 0.35, -1.2], fov: 34, e: 'sine.inOut'},
          {t: 19.8, p: [0, 1.7, 8.6], l: [0, 0.5, -2.2], fov: 36, e: 'power2.inOut'},
          {t: 23.6, p: [0, 1.25, 7.3], l: [0, 0.2, -2], fov: 36, e: 'sine.inOut'},
        ]}
      />
      <Studio t={t} keyI={spot} cone={0.22} rim={spot * 0.8} spotPos={[0, 6.2, 0.4]} target={[0, -1.6, 0]} dust={0.55} />
      <Pedestal glow={spot * 0.8} />
      <SharkSeats states={seatStates(t)} />
      <Doorbell variant="doorbot" led={ledI} ledColor="#4cc3ff" ir={0.35} t={t} scale={0.5} position={[0, 0.09, 0]} rotation={[0, keys(t, [[0, 0], [10, -0.35], [24, 0.25]]), 0]} />
    </Stage>
  );
};

// ---------- Shot B: flash-forward over the city ----------
const CityShot: React.FC<{t: number}> = ({t}) => {
  const lt = t - 23.9;
  const lit = (h: House) => clamp01((lt * 14 - h.dist) / 6 + (h.r - 0.5) * 0.8);
  return (
    <Stage env={0.15} background="#03060b" fog={['#03060b', 12, 70]} shadows={false} grade={{time: t, bloom: 1.25, bloomThreshold: 0.55, bloomRadius: 0.7, flash: 1 - prog(t, 23.95, 24.6, 'power2.out'), flashColor: '#cfefff', fade: prog(t, 30.4, 30.8, 'power2.in'), ca: 1.6}}>
      <CameraRig
        t={t}
        path={[
          {t: 23.9, p: [-34, 5.5, 30], l: [-20, 1.5, 16], fov: 52},
          {t: 30.8, p: [6, 4.0, -6], l: [18, 0.5, -20], fov: 46, e: 'power1.inOut'},
        ]}
        shake={0.3}
      />
      <ambientLight intensity={0.25} color="#5c7aa8" />
      <directionalLight position={[-20, 30, 10]} intensity={0.35} color="#8fb6ff" />
      <City R={60} lit={lit} windowGlow={0.55} />
    </Stage>
  );
};

// ---------- Shot C: title "The Billion-Dollar No" ----------
const TitleShot: React.FC<{t: number}> = ({t}) => {
  const a = at('h7');
  const ringOn = prog(t, a + 0.9, a + 1.6, 'expo.out');
  const flyIn = prog(t, 35.6, 37.4, 'power3.in');
  const ringMat = React.useMemo(() => new THREE.MeshBasicMaterial({toneMapped: false}), []);
  ringMat.color.set('#38b6ff').multiplyScalar(0.2 + ringOn * 3.2);
  return (
    <Stage env={1.2} grade={{time: t, bloom: 0.9, bloomThreshold: 0.8, fade: Math.max(1 - prog(t, 30.9, 31.6), 0), flash: prog(t, 37.0, 37.4, 'power2.in') * 0.9, flashColor: '#ffd9a6', vignette: 0.8}}>
      <CameraRig
        t={t}
        path={[
          {t: 30.8, p: [-0.6, 0.2, 10.5], l: [0.2, 0, 0], fov: 30},
          {t: 35.6, p: [0.4, -0.2, 8.6], l: [0.9, -0.5, 0], fov: 30, e: 'sine.inOut'},
          {t: 37.4, p: [1.25, -0.93, 0.15], l: [1.25, -0.93, -3], fov: 40, e: 'power3.in'},
        ]}
        drift={0.4 * (1 - flyIn)}
      />
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
    </Stage>
  );
};

export const S1Hook: React.FC = () => {
  const t = useT('hook');
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Sequence {...seq(0, 24.0)} layout="none">
        <TankShot t={t} />
      </Sequence>
      <Sequence {...seq(23.9, 30.9)} layout="none">
        <CityShot t={t} />
      </Sequence>
      <Sequence {...seq(30.8, 37.4)} layout="none">
        <TitleShot t={t} />
      </Sequence>
      <ArchivalSlot id="ST-01" t={t} sceneStart={S0} />

      <Layer>
        <Letterbox amount={keys(t, [[0, 1], [5.4, 1], [6.6, 0, 'power3.inOut'], [30.6, 0], [31.4, 0.0]])} />
        <div style={{position: 'absolute', left: 96, top: 84}}>
          <Kicker t={t} a={1.2} b={9.2} text="ABC  ·  SHARK TANK  ·  SEASON 5" />
        </div>
        <div style={{position: 'absolute', left: 92, bottom: 150, fontFamily: F.serif, fontSize: 156, color: C.white, lineHeight: 1}}>
          <Reveal t={t} a={at('h1') - 0.1} b={9.0} text="November 2013" stagger={0.045} inDur={1.1} />
        </div>
        <RecreationBadge t={t} a={5.4} b={23.0} />

        {/* the ask */}
        <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 55% 40% at 50% 47%, rgba(0,0,0,0.72), rgba(0,0,0,0) 75%)', opacity: window01(t, at('h3') + 0.7, 15.1, 0.6, 0.5)}} />
        <div style={{position: 'absolute', left: 0, right: 0, top: 330, textAlign: 'center'}}>
          <div style={{fontFamily: F.serif, fontSize: 250, color: C.white, lineHeight: 1, textShadow: '0 0 60px rgba(56,182,255,0.25)'}}>
            <Reveal t={t} a={at('h3') + 0.9} b={15.1} text="$700,000" stagger={0.05} inDur={0.8} blur={20} />
          </div>
          <div style={{marginTop: 22, display: 'flex', justifyContent: 'center'}}>
            <Kicker t={t} a={at('h3') + 2.3} b={15.1} text="FOR 10% OF THE COMPANY" rule={false} size={26} />
          </div>
          {t > at('h3') + 3.0 && t < 15.2 ? (
            <div style={{marginTop: 26, fontFamily: F.mono, fontSize: 22, letterSpacing: '0.3em', color: C.blue, opacity: window01(t, at('h3') + 3.0, 15.1, 0.4, 0.4)}}>
              IMPLIED VALUATION&nbsp;&nbsp;
              <Counter t={t} a={at('h3') + 3.0} dur={1.6} from={0} to={7000000} format={(v) => fmtMoney(v)} style={{color: C.white}} />
            </div>
          ) : null}
        </div>

        {/* the verdict */}
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 120, textAlign: 'center', fontFamily: F.mono, fontSize: 24, letterSpacing: '0.5em', color: C.red}}>
          {t > at('h4') ? <Reveal t={t} a={at('h4') + 0.2} b={19.6} text="4 OUT  ·  1 OFFER" stagger={0.03} blur={4} /> : null}
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 500, textAlign: 'center', fontFamily: F.mono, fontSize: 34, letterSpacing: '1.1em', color: C.red, textShadow: '0 0 30px rgba(255,40,40,0.6)'}}>
          {t > 20.2 ? <Reveal t={t} a={20.35} b={22.6} text="NO DEAL" stagger={0.06} blur={10} /> : null}
        </div>

        {/* flash-forward */}
        <div style={{position: 'absolute', left: 96, top: 84}}>
          <Kicker t={t} a={24.3} b={30.5} text="FIVE YEARS LATER" color={C.white} dot={C.orange} />
        </div>
        {t > 24.6 && t < 30.7 ? (
          <div style={{position: 'absolute', left: 0, right: 0, top: 380, textAlign: 'center', opacity: window01(t, 24.6, 30.6, 0.5, 0.3)}}>
            <div style={{fontFamily: F.sans, fontWeight: 800, fontSize: 150, color: C.white, letterSpacing: '-0.02em', textShadow: '0 0 50px rgba(56,182,255,0.45)'}}>
              <Counter t={t} a={25.0} dur={4.4} from={700000} to={1000000000} e="expo.inOut" format={(v) => fmtMoney(Math.round(v / 1000) * 1000) + (t > 29.3 ? '+' : '')} />
            </div>
            <div style={{marginTop: 18, fontFamily: F.mono, fontSize: 24, letterSpacing: '0.34em', color: C.orange}}>REPORTED VALUE OF AMAZON’S DEAL FOR RING</div>
          </div>
        ) : null}
        <SourceTag t={t} a={25.0} b={30.5} text="Reuters, Wall St. Journal (2018) · price reported, terms not disclosed" />

        {/* title */}
        {t > at('h7') - 0.4 ? (
          <>
            <div style={{position: 'absolute', left: 0, right: 0, top: 170, textAlign: 'center', fontFamily: F.serif, fontStyle: 'italic', fontSize: 96, color: C.white, opacity: 1 - prog(t, 35.4, 36.4)}}>
              <Reveal t={t} a={at('h7') + 0.2} text="The Billion-Dollar" stagger={0.04} inDur={1.0} />
            </div>
            <div style={{position: 'absolute', left: 0, right: 0, bottom: 130, display: 'flex', justifyContent: 'center', opacity: 1 - prog(t, 35.4, 36.4)}}>
              <Kicker t={t} a={at('h7') + 1.6} text="THE STORY OF RING" rule={false} size={22} />
            </div>
          </>
        ) : null}
      </Layer>
    </AbsoluteFill>
  );
};
