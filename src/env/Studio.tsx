import React from 'react';
import * as THREE from 'three';
import {LightCone, Dust} from '../lib/three-bits';
import {drawTexture} from '../lib/textures';

export const radialFade = () =>
  drawTexture('radialFade', 512, 512, (g) => {
    const r = g.createRadialGradient(256, 256, 0, 256, 256, 256);
    r.addColorStop(0, '#fff');
    r.addColorStop(0.35, '#bbb');
    r.addColorStop(1, '#000');
    g.fillStyle = r;
    g.fillRect(0, 0, 512, 512);
  }, false);

/** Dark cinematic studio: glossy black floor, key spotlight with volumetric cone, rim lights, dust. */
export const Studio: React.FC<{t: number; keyI?: number; cone?: number; rim?: number; rimColor?: string; keyColor?: string; floorY?: number; dust?: number; spotPos?: [number, number, number]; target?: [number, number, number]}> = ({
  t,
  keyI = 1,
  cone = 0.25,
  rim = 1,
  rimColor = '#3aa8ff',
  keyColor = '#fff1de',
  floorY = -1.6,
  dust = 0.5,
  spotPos = [0, 7, 1.5],
  target = [0, floorY, 0],
}) => {
  const tgt = React.useMemo(() => new THREE.Object3D(), []);
  tgt.position.set(...target);
  return (
    <group>
      <primitive object={tgt} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, floorY, 0]} receiveShadow>
        <circleGeometry args={[14, 64]} />
        <meshPhysicalMaterial color="#060709" metalness={0.2} roughness={0.32} clearcoat={0.6} clearcoatRoughness={0.15} envMapIntensity={0.12} alphaMap={radialFade()} transparent depthWrite={false} />
      </mesh>
      {keyI > 0 ? (
        <spotLight position={spotPos} target={tgt} angle={0.42} penumbra={0.7} intensity={70 * keyI} distance={30} decay={2} color={keyColor} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004} />
      ) : null}
      <LightCone position={spotPos} rotation={[Math.atan2(spotPos[2] - target[2], spotPos[1] - target[1]) * -1 * 0, 0, 0]} length={spotPos[1] - floorY + 0.2} radius={2.6} opacity={cone * keyI} color={keyColor} />
      {rim > 0 ? (
        <>
          <pointLight position={[-4, 2, -3]} intensity={30 * rim} color={rimColor} distance={14} />
          <pointLight position={[4, 1, -2.5]} intensity={22 * rim} color={rimColor} distance={14} />
        </>
      ) : null}
      {dust > 0 ? <Dust t={t} count={500} box={[7, 7, 6]} center={[0, 1.2, 0]} opacity={dust} size={0.03} color="#fff4e6" speed={0.03} /> : null}
    </group>
  );
};
