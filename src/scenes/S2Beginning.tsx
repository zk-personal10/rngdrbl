import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {Stage, CameraRig} from '../lib/Stage';
import {Studio} from '../env/Studio';
import {House, RoomLabel, DOORBELL, BENCH_PHONE} from '../env/House';
import {SignalArc} from '../lib/Arc';
import {Doorbell, PartKey} from '../models/Doorbell';
import {RingWave, Dust} from '../lib/three-bits';
import {useT} from '../lib/useT';
import {FPS, SCENES, at, end} from '../timeline';
import {keys, prog, window01, noise1} from '../lib/ease';
import {C, Kicker, Reveal, Layer, RecreationBadge} from '../ui/Type';
import {Broadcast} from '../ui/Broadcast';
import {F} from '../lib/fonts';
import {ArchivalSlot} from '../ui/ArchivalSlot';

const S0 = SCENES.beginning[0];
const seq = (a: number, b: number) => ({from: Math.round((a - S0) * FPS), durationInFrames: Math.round((b - a) * FPS)});

// Chime times: the doorbell rings (ding-dong) twice, the sound never reaches the garage.
export const CHIMES = [46.4, 47.1, 48.9, 49.6];

const HouseShot: React.FC<{t: number}> = ({t}) => {
  const dbl: [number, number, number] = [DOORBELL[0], DOORBELL[1], DOORBELL[2] + 0.05];
  const arcReveal = prog(t, at('b3') + 1.0, at('b3') + 3.0, 'power2.inOut');
  const live = t > at('b3') + 4.6;
  return (
    <Stage
      env={0.25}
      background="#04060a"
      fog={['#04060a', 16, 40]}
      grade={{
        time: t,
        bloom: 0.8,
        bloomThreshold: 0.75,
        flash: 1 - prog(t, 37.0, 37.9, 'power2.out'),
        flashColor: '#ffd9a6',
        fade: prog(t, 59.35, 59.7, 'power2.in'),
        lift: [0.01, 0.006, 0.0],
        gain: [1.04, 1.0, 0.95],
      }}
    >
      <CameraRig
        t={t}
        path={[
          {t: 37.0, p: [-2.9, 1.75, -0.2], l: [-4.4, 1.05, -2.3], fov: 34},
          {t: 44.8, p: [-5.0, 1.55, -0.7], l: [-4.0, 1.0, -2.4], fov: 34, e: 'sine.inOut'},
          {t: 49.6, p: [0.8, 9.6, 11.6], l: [0, 0.4, 0.6], fov: 34, e: 'power3.inOut'},
          {t: 56.8, p: [-2.4, 8.2, 10.6], l: [-0.6, 0.6, 0.0], fov: 34, e: 'sine.inOut'},
          {t: 58.2, p: [5.6, 2.2, 6.4], l: [DOORBELL[0], DOORBELL[1], DOORBELL[2]], fov: 34, e: 'power2.inOut'},
          {t: 59.7, p: [DOORBELL[0], DOORBELL[1] + 0.05, DOORBELL[2] + 0.12], l: [DOORBELL[0], DOORBELL[1] + 0.05, DOORBELL[2]], fov: 40, e: 'power3.in'},
        ]}
      />
      <ambientLight intensity={0.45} color="#6d84a8" />
      <directionalLight position={[-8, 12, 10]} intensity={1.1} color="#8aa6d6" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-10} />
      <House porch={1} bulb={1} ledGlow={CHIMES.some((c) => t > c && t < c + 0.6) ? 1 : 0.3} phone={live ? 'live' : 'idle'} phoneGlow={live ? prog(t, at('b3') + 4.6, at('b3') + 5.2) : arcReveal * 0.2} />
      {CHIMES.map((c, i) => (
        <group key={i}>
          <RingWave p={prog(t, c, c + 2.6, 'power2.out')} maxR={4.4} position={[dbl[0], 0.06, dbl[2] - 0.2]} rotation={[-Math.PI / 2, 0, 0]} color="#9fdcff" width={0.03} />
          <RingWave p={prog(t, c, c + 1.6, 'power2.out')} maxR={1.6} position={dbl} color="#cfefff" width={0.012} />
        </group>
      ))}
      <RoomLabel text="FRONT DOOR" position={[3.4, 3.0, 3.6]} opacity={window01(t, 46.2, 58.0, 0.6, 0.6)} />
      <RoomLabel text="GARAGE" position={[-3.8, 3.0, 0.2]} opacity={window01(t, 46.8, 58.0, 0.6, 0.6)} />
      <RoomLabel text="OUT OF EARSHOT" position={[-3.8, 2.6, 0.8]} opacity={window01(t, 49.4, 52.0, 0.4, 0.6)} color="#ff6a6a" />
      <RoomLabel text="WI-FI" position={[0.2, 4.4, 0.6]} opacity={window01(t, at('b3') + 1.8, 58.0, 0.5, 0.6)} color="#8fd6ff" />
      <SignalArc from={dbl} to={[BENCH_PHONE[0], BENCH_PHONE[1] + 0.1, BENCH_PHONE[2]]} lift={3.4} t={t} reveal={arcReveal} opacity={1 - prog(t, 58.2, 58.8)} />
      <Dust t={t} count={250} box={[3, 2, 3]} center={[-4.2, 1.6, -1.6]} color="#ffd8a8" opacity={0.5 * (1 - prog(t, 46, 49))} size={0.02} />
    </Stage>
  );
};

const LABEL_TIMES = (): Partial<Record<PartKey, number>> => ({
  camera: at('b5a'),
  ir: at('b5a') + 0.35,
  button: at('b5b'),
  antenna: at('b5c'),
  pcb: at('b5d'),
  battery: at('b5d') + 0.25,
  speaker: at('b5d') + 0.5,
  face: at('b5d') + 0.75,
});

const ProductShot: React.FC<{t: number}> = ({t}) => {
  const explode = keys(t, [[61.4, 0], [63.2, 1, 'expo.inOut'], [at('b6'), 1], [at('b6') + 1.6, 0, 'expo.inOut']]);
  const lt = LABEL_TIMES();
  const labels: Partial<Record<PartKey, number>> = {};
  (Object.keys(lt) as PartKey[]).forEach((k) => (labels[k] = Math.min(prog(t, lt[k]!, lt[k]! + 0.6, 'power2.out'), 1 - prog(t, at('b6') - 0.3, at('b6') + 0.3))));
  const rough = window01(t, at('b6'), 74.0, 0.6, 1.0);
  const flicker = rough > 0 ? 0.6 + 0.4 * Math.max(0, noise1(t * 14, 3)) : 1;
  const tally = prog(t, 79.6, 80.4, 'power2.out');
  return (
    <Stage
      env={0.9}
      grade={{
        time: t,
        bloom: 0.75,
        bloomThreshold: 0.8,
        saturation: 1 - rough * 0.45,
        vignette: 0.7 + rough * 0.3,
        fade: Math.max(1 - prog(t, 59.65, 60.2, 'power2.out'), prog(t, 81.3, 82.0, 'power2.in')),
        flash: tally * 0.12 + prog(t, 81.0, 81.3) * 0.5,
        flashColor: '#ff2020',
      }}
    >
      <CameraRig
        t={t}
        path={[
          {t: 59.6, p: [0, 0.82, 0.75], l: [0, 0.82, 0], fov: 34},
          {t: 61.8, p: [1.6, 0.55, 6.6], l: [0, 0.1, 0], fov: 30, e: 'power3.out'},
          {t: 63.4, p: [8.6, 2.4, 8.4], l: [0, 0.1, 0.3], fov: 30, e: 'power2.inOut'},
          {t: 68.8, p: [6.4, 1.5, 10.2], l: [0, 0.0, 0.4], fov: 30, e: 'sine.inOut'},
          {t: 72.8, p: [2.0, 0.3, 6.0], l: [0, 0.1, 0], fov: 30, e: 'power2.inOut'},
          {t: 78.0, p: [0, 0.5, 10.5], l: [0, 0.2, 0], fov: 30, e: 'power2.inOut'},
          {t: 82.0, p: [0, 0.45, 9.2], l: [0, 0.2, 0], fov: 30, e: 'sine.in'},
        ]}
      />
      <Studio t={t} keyI={1} cone={0.12} rim={1} floorY={-1.75} spotPos={[1.5, 6.5, 3]} target={[0, -1.75, 0]} dust={0.35} />
      <Doorbell
        variant="doorbot"
        explode={explode}
        t={t}
        led={2.4 * flicker}
        ir={0.5}
        labels={labels}
        jitter={rough * 0.25 * (0.5 + 0.5 * noise1(t * 3, 9))}
        rotation={[0, keys(t, [[59.6, 0], [61.8, -0.2], [69, 0.15], [82, -0.15]]), 0]}
      />
    </Stage>
  );
};

export const S2Beginning: React.FC = () => {
  const t = useT('beginning');
  const tally = prog(t, 79.6, 80.4, 'power2.out');
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Sequence {...seq(37.0, 59.75)} layout="none">
        <HouseShot t={t} />
      </Sequence>
      <Sequence {...seq(59.6, 82.0)} layout="none">
        <ProductShot t={t} />
      </Sequence>
      <ArchivalSlot id="IV-01" t={t} sceneStart={S0} />
      <Layer>
        <div style={{position: 'absolute', left: 92, bottom: 140, fontFamily: F.serif, fontSize: 210, lineHeight: 1, color: C.white}}>
          <Reveal t={t} a={at('b1') - 0.1} b={44.6} text="2011" stagger={0.08} inDur={1.1} />
        </div>
        <div style={{position: 'absolute', left: 98, bottom: 110}}>
          <Kicker t={t} a={at('b1') + 0.6} b={44.6} text="A GARAGE IN SOUTHERN CALIFORNIA" />
        </div>
        <RecreationBadge t={t} a={38.0} b={59.0} text="ILLUSTRATIVE RECONSTRUCTION" />
        <div style={{position: 'absolute', left: 0, right: 0, top: 120, textAlign: 'center', fontFamily: F.serif, fontStyle: 'italic', fontSize: 64, color: C.white}}>
          <Reveal t={t} a={at('b3') + 4.4} b={58.0} text="The front door, on his phone." stagger={0.03} />
        </div>
        {/* product reveal */}
        <div style={{position: 'absolute', left: 120, top: 380}}>
          <div style={{fontFamily: F.serif, fontSize: 190, color: C.white, lineHeight: 1}}>
            <Reveal t={t} a={at('b4') + 0.1} b={62.6} text="DoorBot" stagger={0.06} inDur={1.0} blur={18} />
          </div>
          <div style={{marginTop: 16}}>
            <Kicker t={t} a={at('b4') + 0.7} b={62.6} text="WI-FI VIDEO DOORBELL" color={C.blue} />
          </div>
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 120, textAlign: 'center', fontFamily: F.serif, fontSize: 70, color: C.white}}>
          <Reveal t={t} a={at('b5d') + 0.1} b={68.8} text="Answer the door, from anywhere." stagger={0.03} />
        </div>
        <div style={{position: 'absolute', left: 98, top: 110}}>
          <Kicker t={t} a={at('b6') + 0.2} b={73.0} text="EARLY HARDWARE  ·  TIGHT MONEY" color={C.amber} />
        </div>
        <Broadcast t={t} a={74.6} b={81.9} tally={tally} />
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 170, textAlign: 'center', fontFamily: F.mono, fontSize: 30, letterSpacing: '0.6em', color: C.white}}>
          <Reveal t={t} a={at('b7') + 2.4} b={81.4} text="NATIONAL TELEVISION" stagger={0.04} blur={8} />
        </div>
      </Layer>
    </AbsoluteFill>
  );
};
