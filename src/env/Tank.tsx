import React from 'react';
import * as THREE from 'three';
import {Label3D, Slab, Glow} from '../lib/three-bits';
import {mats} from '../models/materials';

export const SHARKS = ['LORI GREINER', 'DAYMOND JOHN', 'ROBERT HERJAVEC', 'MARK CUBAN', "KEVIN O'LEARY"];

export const seatPos = (i: number, n = 5, radius = 6.2, spread = 1.15): [number, number, number, number] => {
  const a = (i - (n - 1) / 2) * (spread / ((n - 1) / 2)) * 0.5;
  // arc behind the pedestal (negative z), facing it
  return [Math.sin(a) * radius, 0, -Math.cos(a) * radius + 1.2, a];
};

export type SeatState = {color: string; glow: number; name?: number};

const stripMats = new Map<number, THREE.MeshBasicMaterial>();
const stripMat = (i: number, color: string, k: number) => {
  let m = stripMats.get(i);
  if (!m) {
    m = new THREE.MeshBasicMaterial({toneMapped: false});
    stripMats.set(i, m);
  }
  m.color.set(color).multiplyScalar(k);
  return m;
};

/** Abstract Shark chairs: tall glass backs with a vertical light strip. Not likenesses of any person. */
export const SharkSeats: React.FC<{states: SeatState[]; floorY?: number; n?: number; names?: string[]; radius?: number; spread?: number}> = ({states, floorY = -1.6, n = 5, names = SHARKS, radius = 6.2, spread = 1.15}) => {
  const m = mats();
  return (
    <group>
      {states.map((s, i) => {
        const [x, , z, a] = seatPos(i, n, radius, spread);
        return (
          <group key={i} position={[x, floorY, z]} rotation={[0, -a, 0]}>
            {/* seat */}
            <Slab w={1.5} h={1.3} d={0.2} r={0.12} position={[0, 0.85, 0]} rotation={[Math.PI / 2, 0, 0]} material={m.blackMatte} castShadow receiveShadow />
            <mesh position={[0, 0.42, 0]} material={m.brushed} castShadow><cylinderGeometry args={[0.07, 0.12, 0.84, 24]} /></mesh>
            <mesh position={[0, 0.02, 0]} material={m.brushed} receiveShadow><cylinderGeometry args={[0.55, 0.6, 0.04, 40]} /></mesh>
            {/* tall back */}
            <Slab w={1.6} h={2.9} d={0.16} r={0.25} position={[0, 2.35, -0.62]} rotation={[-0.08, 0, 0]} material={m.blackGloss} castShadow />
            {/* light strip */}
            {/* backlight halo: emissive slab just behind the back, glowing around its silhouette */}
            <Slab w={1.68} h={2.98} d={0.02} r={0.28} position={[0, 2.35, -0.74]} rotation={[-0.08, 0, 0]} material={stripMat(i, s.color, s.glow * 1.8)} />
            {s.glow > 0.05 ? <pointLight position={[0, 4.2, 0.6]} intensity={s.glow * 3} distance={3.5} color={s.color} /> : null}
            {(s.name ?? 0) > 0.01 ? (
              <Label3D text={names[i] ?? ''} font="mono" weight={500} size={60} tracking={0.25} color="#e8eef4" height={0.13} position={[0, 0.12, 1.0]} rotation={[-Math.PI / 2, 0, 0]} opacity={s.name} />
            ) : null}
          </group>
        );
      })}
    </group>
  );
};

/** Product pedestal with a glowing base ring. */
export const Pedestal: React.FC<{floorY?: number; glow?: number; color?: string; height?: number}> = ({floorY = -1.6, glow = 1, color = '#38b6ff', height = 1.0}) => {
  const m = mats();
  const ringM = React.useMemo(() => new THREE.MeshBasicMaterial({toneMapped: false}), []);
  ringM.color.set(color).multiplyScalar(glow * 2.5);
  return (
    <group position={[0, floorY, 0]}>
      <mesh position={[0, height / 2, 0]} material={m.blackGloss} castShadow receiveShadow><cylinderGeometry args={[0.85, 0.95, height, 64]} /></mesh>
      <mesh position={[0, height + 0.01, 0]} material={m.brushed} receiveShadow><cylinderGeometry args={[0.86, 0.86, 0.03, 64]} /></mesh>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} material={ringM}><ringGeometry args={[1.02, 1.06, 96]} /></mesh>
    </group>
  );
};
