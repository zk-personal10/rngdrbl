import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Slab, RBox, Label3D} from '../lib/three-bits';
import {mats, ledMat} from './materials';
import {clamp01, ease, mix, rand} from '../lib/ease';

export type Variant = 'doorbot' | 'ring';
export type PartKey = 'back' | 'housing' | 'battery' | 'pcb' | 'antenna' | 'camera' | 'ir' | 'speaker' | 'button' | 'glass' | 'face';

export const PART_LABELS: Record<PartKey, string> = {
  back: 'MOUNTING PLATE',
  housing: 'WEATHER-SEALED HOUSING',
  battery: 'BATTERY',
  pcb: 'MAIN LOGIC BOARD',
  antenna: 'WI-FI RADIO',
  camera: 'HD CAMERA MODULE',
  ir: 'INFRARED NIGHT VISION',
  speaker: 'SPEAKER + MIC',
  button: 'BUTTON + LIGHT RING',
  glass: 'FRONT GLASS',
  face: 'FACEPLATE',
};

export const PART_ORDER: PartKey[] = ['back', 'housing', 'battery', 'pcb', 'antenna', 'speaker', 'camera', 'ir', 'button', 'glass', 'face'];

// Exploded offsets (world units). Z spreads front/back; small X/Y offsets aid legibility from a 3/4 camera.
const EX: Record<PartKey, [number, number, number]> = {
  back: [-0.2, 0, -2.4],
  housing: [-0.1, 0, -1.6],
  battery: [0.15, -0.1, -0.95],
  pcb: [0, 0, -0.25],
  antenna: [0.35, 0.55, 0.15],
  speaker: [-0.35, -0.2, 0.45],
  camera: [0.05, 0.2, 1.0],
  ir: [0, 0.25, 1.45],
  button: [0.05, -0.25, 1.75],
  glass: [0, 0, 2.3],
  face: [0, 0, 2.9],
};

export type PartOverride = {pos?: [number, number, number]; rot?: [number, number, number]; scale?: number; mix: number};

export const Doorbell: React.FC<{
  variant?: Variant;
  explode?: number; // 0..1
  led?: number; // LED ring intensity
  ledColor?: string;
  ir?: number;
  t?: number;
  overrides?: Partial<Record<PartKey, PartOverride>>;
  hidden?: Partial<Record<PartKey, boolean>>;
  labels?: Partial<Record<PartKey, number>>; // opacity per part label
  labelSide?: number;
  jitter?: number;
  clip?: THREE.Plane[] | null;
  position?: any;
  rotation?: any;
  scale?: any;
}> = ({variant = 'ring', explode = 0, led = 1.0, ledColor = '#33b6ff', ir = 0, t = 0, overrides = {}, hidden = {}, labels = {}, labelSide = 1, jitter = 0, clip = null, ...rest}) => {
  const m = mats();
  const isBot = variant === 'doorbot';
  const W = isBot ? 1.32 : 1.24;
  const H = isBot ? 2.72 : 2.52;
  const camY = isBot ? 0.82 : 0.78;
  const btnY = isBot ? -0.55 : -0.72;
  const btnR = isBot ? 0.3 : 0.27;

  const faceGeo = useMemo(() => {
    // faceplate with holes: doorbot = frame around black glass; ring = full nickel with window + button hole
    const outer = new THREE.Shape();
    const r = isBot ? 0.32 : 0.36;
    const w = W, h = H, x = -w / 2, y = -h / 2;
    outer.moveTo(x + r, y);
    outer.lineTo(x + w - r, y);
    outer.quadraticCurveTo(x + w, y, x + w, y + r);
    outer.lineTo(x + w, y + h - r);
    outer.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    outer.lineTo(x + r, y + h);
    outer.quadraticCurveTo(x, y + h, x, y + h - r);
    outer.lineTo(x, y + r);
    outer.quadraticCurveTo(x, y, x + r, y);
    const hole = new THREE.Path();
    if (isBot) {
      const iw = w - 0.2, ih = h - 0.2, ix = -iw / 2, iy = -ih / 2, ir2 = r - 0.08;
      hole.moveTo(ix + ir2, iy);
      hole.lineTo(ix + iw - ir2, iy);
      hole.quadraticCurveTo(ix + iw, iy, ix + iw, iy + ir2);
      hole.lineTo(ix + iw, iy + ih - ir2);
      hole.quadraticCurveTo(ix + iw, iy + ih, ix + iw - ir2, iy + ih);
      hole.lineTo(ix + ir2, iy + ih);
      hole.quadraticCurveTo(ix, iy + ih, ix, iy + ih - ir2);
      hole.lineTo(ix, iy + ir2);
      hole.quadraticCurveTo(ix, iy, ix + ir2, iy);
      outer.holes.push(hole);
    } else {
      // top window (black glass shows through) and button hole
      const iw = w - 0.22, ih = 0.86, ix = -iw / 2, iy = camY - ih / 2 + 0.02, ir2 = 0.26;
      hole.moveTo(ix + ir2, iy);
      hole.lineTo(ix + iw - ir2, iy);
      hole.quadraticCurveTo(ix + iw, iy, ix + iw, iy + ir2);
      hole.lineTo(ix + iw, iy + ih - ir2);
      hole.quadraticCurveTo(ix + iw, iy + ih, ix + iw - ir2, iy + ih);
      hole.lineTo(ix + ir2, iy + ih);
      hole.quadraticCurveTo(ix, iy + ih, ix, iy + ih - ir2);
      hole.lineTo(ix, iy + ir2);
      hole.quadraticCurveTo(ix, iy, ix + ir2, iy);
      outer.holes.push(hole);
      const b = new THREE.Path();
      b.absarc(0, btnY, btnR + 0.06, 0, Math.PI * 2, true);
      outer.holes.push(b);
    }
    const g = new THREE.ExtrudeGeometry(outer, {depth: 0.06, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 4, curveSegments: 32});
    g.translate(0, 0, -0.03);
    return g;
  }, [isBot, W, H, camY, btnY, btnR]);

  const ledM = ledMat(variant + 'led', ledColor, led);
  const irM = m.irLed;
  irM.emissiveIntensity = ir * 3;

  const allMats = [m.brushed, m.nickel, m.blackGloss, m.blackMatte, m.darkGrey, m.lens, m.gold, m.pcb, m.chip, m.battery, m.grille, irM, ledM];
  allMats.forEach((mm) => {
    (mm as any).clippingPlanes = clip;
    (mm as any).clipShadows = !!clip;
  });

  const parts: Record<PartKey, {base: [number, number, number]; node: React.ReactNode; labelAt: [number, number, number]}> = {
    back: {base: [0, 0, -0.24], labelAt: [W / 2, 0.6, 0], node: (
      <group>
        <Slab w={W - 0.04} h={H - 0.04} d={0.06} r={0.3} material={m.darkGrey} castShadow />
        {[-1, 1].map((s) => (
          <mesh key={s} position={[0, s * (H / 2 - 0.25), 0.04]} rotation={[Math.PI / 2, 0, 0]} material={m.gold}><cylinderGeometry args={[0.05, 0.05, 0.03, 20]} /></mesh>
        ))}
        <mesh position={[0, -0.1, 0.04]} material={m.copper}><boxGeometry args={[0.36, 0.12, 0.02]} /></mesh>
      </group>
    )},
    housing: {base: [0, 0, -0.08], labelAt: [W / 2, -0.5, 0], node: <Slab w={W - 0.02} h={H - 0.02} d={0.26} r={isBot ? 0.3 : 0.34} material={isBot ? m.blackMatte : m.darkGrey} castShadow />},
    battery: {base: [0, -0.25, -0.02], labelAt: [0.45, 0, 0], node: (
      <group>
        <RBox args={[0.78, 1.2, 0.14, 0.06]} material={m.battery} castShadow />
        <Label3D text="Li-ion 3.7V" font="mono" size={48} color="#9fc8ff" height={0.07} position={[0, 0.35, 0.075]} />
      </group>
    )},
    pcb: {base: [0, 0.1, 0.06], labelAt: [0.5, -0.3, 0], node: (
      <group>
        <RBox args={[W - 0.24, H - 0.4, 0.03, 0.01]} material={m.pcb} castShadow />
        {[[0.15, 0.3, 0.32, 0.32], [-0.2, -0.15, 0.22, 0.18], [0.2, -0.45, 0.18, 0.12], [-0.22, 0.45, 0.14, 0.2], [0.1, 0.0, 0.1, 0.1]].map(([x, y, w, h], i) => (
          <mesh key={i} position={[x, y, 0.03]} material={m.chip} castShadow><boxGeometry args={[w, h, 0.04]} /></mesh>
        ))}
      </group>
    )},
    antenna: {base: [0, H / 2 - 0.32, 0.1], labelAt: [0.45, 0.05, 0], node: (
      <group>
        <mesh material={m.gold}><boxGeometry args={[0.85, 0.05, 0.01]} /></mesh>
        <mesh position={[0.4, -0.08, 0]} material={m.gold}><boxGeometry args={[0.05, 0.2, 0.01]} /></mesh>
        <mesh position={[-0.2, -0.06, 0]} material={m.gold}><boxGeometry args={[0.04, 0.14, 0.01]} /></mesh>
      </group>
    )},
    speaker: {base: [0, btnY + 0.55, 0.12], labelAt: [-0.3, 0, 0], node: (
      <mesh rotation={[Math.PI / 2, 0, 0]} material={m.grille} castShadow><cylinderGeometry args={[0.16, 0.16, 0.05, 40]} /></mesh>
    )},
    camera: {base: [0, camY, isBot ? 0.19 : 0.16], labelAt: [0.25, 0.05, 0], node: (
      <group>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={m.blackMatte} castShadow><cylinderGeometry args={[0.2, 0.22, 0.16, 48]} /></mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.05]} material={m.brushed}><torusGeometry args={[0.165, 0.025, 16, 48]} /></mesh>
        <mesh position={[0, 0, 0.06]} material={m.lens}><sphereGeometry args={[0.15, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2.6]} /></mesh>
      </group>
    )},
    ir: {base: [0, camY, isBot ? 0.225 : 0.17], labelAt: [0.42, 0.1, 0], node: (
      <group>
        {Array.from({length: 6}, (_, i) => {
          const a = (i / 6) * Math.PI * 2 + 0.3;
          return <mesh key={i} position={[Math.cos(a) * 0.3, Math.sin(a) * 0.3, 0]} material={irM}><sphereGeometry args={[0.032, 16, 12]} /></mesh>;
        })}
      </group>
    )},
    button: {base: [0, btnY, isBot ? 0.235 : 0.18], labelAt: [btnR + 0.1, 0, 0], node: (
      <group>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={isBot ? m.brushed : m.nickel} castShadow><cylinderGeometry args={[btnR, btnR, 0.07, 64]} /></mesh>
        <mesh position={[0, 0, 0.0]} material={ledM}><torusGeometry args={[btnR + 0.025, 0.017, 16, 96]} /></mesh>
        <mesh position={[0, 0, 0.037]} material={isBot ? m.brushed : m.nickel}><circleGeometry args={[btnR - 0.04, 48]} /></mesh>
      </group>
    )},
    glass: {base: [0, 0, 0.2], labelAt: [W / 2, 0.9, 0], node: isBot ? (
      <RBox args={[W - 0.16, H - 0.16, 0.035, 0.25]} material={m.blackGloss} />
    ) : (
      <RBox args={[W - 0.2, 0.88, 0.03, 0.24]} position={[0, camY + 0.02, 0]} material={m.blackGloss} />
    )},
    face: {base: [0, 0, 0.215], labelAt: [W / 2, -0.9, 0], node: <mesh geometry={faceGeo} material={isBot ? m.brushed : m.nickel} castShadow />},
  };

  const n = PART_ORDER.length;
  return (
    <group {...rest}>
      {PART_ORDER.map((k, i) => {
        if (hidden[k]) return null;
        const pt = parts[k];
        // staggered explode: front parts lead slightly
        const st = clamp01(explode * 1.25 - (Math.abs(i - n / 2) / n) * 0.25);
        const e = ease('expo.inOut')(st);
        const j = jitter * (rand(i * 7) - 0.5);
        let pos: [number, number, number] = [pt.base[0] + EX[k][0] * e + j * 0.3, pt.base[1] + EX[k][1] * e + Math.sin(t * 1.3 + i) * 0.02 * e, pt.base[2] + EX[k][2] * e];
        let rot: [number, number, number] = [j * 0.4 + e * 0.04 * Math.sin(i), e * 0.12 * (rand(i) - 0.5) + j, 0];
        let sc = 1;
        const o = overrides[k];
        if (o && o.mix > 0) {
          pos = [mix(pos[0], o.pos?.[0] ?? pos[0], o.mix), mix(pos[1], o.pos?.[1] ?? pos[1], o.mix), mix(pos[2], o.pos?.[2] ?? pos[2], o.mix)];
          if (o.rot) rot = [mix(rot[0], o.rot[0], o.mix), mix(rot[1], o.rot[1], o.mix), mix(rot[2], o.rot[2], o.mix)];
          sc = mix(1, o.scale ?? 1, o.mix);
        }
        const lo = labels[k] ?? 0;
        return (
          <group key={k} position={pos} rotation={rot} scale={sc}>
            {pt.node}
            {lo > 0.01 ? <PartLabel text={PART_LABELS[k]} at={pt.labelAt} opacity={lo} side={labelSide} index={i} /> : null}
          </group>
        );
      })}
    </group>
  );
};

/** Leader line + tracked mono label attached to a part. */
const PartLabel: React.FC<{text: string; at: [number, number, number]; opacity: number; side: number; index: number}> = ({text, at, opacity, side, index}) => {
  const len = 0.55 * ease('power3.out')(opacity);
  const x0 = at[0] * side;
  return (
    <group position={[x0, at[1], at[2] + 0.05]}>
      <mesh position={[side * len / 2, 0, 0]}>
        <planeGeometry args={[len, 0.008]} />
        <meshBasicMaterial color="#9fdcff" transparent opacity={opacity} toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh>
        <circleGeometry args={[0.022, 20]} />
        <meshBasicMaterial color="#c8f0ff" transparent opacity={opacity} toneMapped={false} depthWrite={false} />
      </mesh>
      <Label3D text={text} font="mono" weight={500} size={56} tracking={0.18} color="#e6f6ff" height={0.085} anchor={side > 0 ? 'left' : 'right'} position={[side * (len + 0.04), 0, 0]} opacity={opacity} />
      <Label3D text={`0${index + 1}`.slice(-2)} font="mono" size={40} color="#5fb8e8" height={0.06} anchor={side > 0 ? 'left' : 'right'} position={[side * (len + 0.04), 0.08, 0]} opacity={opacity * 0.8} />
    </group>
  );
};
