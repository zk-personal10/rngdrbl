import React from 'react';
import * as THREE from 'three';
import {RBox, Slab} from '../lib/three-bits';
import {mats, ledMat} from './materials';

// Stylized, unbranded product silhouettes for the line-up (not exact replicas).
export const FloodlightCam: React.FC<{led?: number; lamps?: number} & any> = ({led = 1, lamps = 1, ...rest}) => {
  const m = mats();
  const lamp = ledMat('flood', '#fff3dc', 0.3 + lamps * 2.2);
  return (
    <group {...rest}>
      <RBox args={[1.9, 0.28, 0.3, 0.1]} position={[0, 0.55, -0.1]} material={m.white} castShadow />
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.62, 0.6, 0.12]} rotation={[0.5, s * 0.35, 0]}>
          <RBox args={[0.7, 0.42, 0.22, 0.08]} material={m.white} castShadow />
          <mesh position={[0, 0, 0.112]} material={lamp}><planeGeometry args={[0.58, 0.3]} /></mesh>
        </group>
      ))}
      <RBox args={[0.42, 0.52, 0.4, 0.15]} position={[0, -0.05, 0.12]} material={m.white} castShadow />
      <mesh position={[0, -0.02, 0.33]} rotation={[Math.PI / 2, 0, 0]} material={m.blackGloss}><cylinderGeometry args={[0.15, 0.15, 0.03, 32]} /></mesh>
      <mesh position={[0, -0.02, 0.35]} material={m.lens}><sphereGeometry args={[0.08, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2.5]} /></mesh>
      <mesh position={[0, -0.2, 0.33]} material={ledMat('floodled', '#38b6ff', led * 2)}><torusGeometry args={[0.04, 0.008, 8, 24]} /></mesh>
    </group>
  );
};

export const StickUpCam: React.FC<{led?: number} & any> = ({led = 1, ...rest}) => {
  const m = mats();
  return (
    <group {...rest}>
      <mesh position={[0, 0.1, 0]} material={m.white} castShadow><cylinderGeometry args={[0.36, 0.38, 1.25, 48]} /></mesh>
      <mesh position={[0, 0.74, 0]} material={m.white}><sphereGeometry args={[0.36, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
      <mesh position={[0, 0.42, 0.33]} rotation={[Math.PI / 2, 0, 0]} material={m.blackGloss}><cylinderGeometry args={[0.2, 0.2, 0.08, 32]} /></mesh>
      <mesh position={[0, 0.42, 0.38]} material={m.lens}><sphereGeometry args={[0.11, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2.5]} /></mesh>
      <mesh position={[0, 0.1, 0.38]} rotation={[0, 0, 0]} material={ledMat('stick', '#38b6ff', led * 2)}><torusGeometry args={[0.05, 0.01, 8, 24]} /></mesh>
      <mesh position={[0, -0.58, 0]} material={m.darkGrey}><cylinderGeometry args={[0.42, 0.45, 0.12, 48]} /></mesh>
    </group>
  );
};

export const AlarmBase: React.FC<{led?: number} & any> = ({led = 1, ...rest}) => {
  const m = mats();
  return (
    <group {...rest}>
      <Slab w={1.3} h={1.3} d={0.42} r={0.3} rotation={[-Math.PI / 2 + 0.15, 0, 0]} position={[0, -0.35, 0]} material={m.white} castShadow />
      <mesh position={[0, -0.12, 0.2]} rotation={[-Math.PI / 2 + 0.15, 0, 0]} material={ledMat('alarm', '#38b6ff', led * 2)}><torusGeometry args={[0.32, 0.015, 8, 64]} /></mesh>
      <RBox args={[0.7, 0.9, 0.08, 0.05]} position={[0.95, -0.1, 0.1]} rotation={[-0.2, -0.3, 0]} material={m.blackGloss} castShadow />
      {[0, 1, 2].map((r) => [0, 1, 2].map((c) => (
        <mesh key={r + '' + c} position={[0.8 + c * 0.15, 0.15 - r * 0.2, 0.17]} rotation={[-0.2, -0.3, 0]} material={m.darkGrey}><boxGeometry args={[0.1, 0.12, 0.02]} /></mesh>
      )))}
    </group>
  );
};
