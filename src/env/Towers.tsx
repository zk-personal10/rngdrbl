import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Text3D, Label3D} from '../lib/three-bits';

/** Funding as architecture: a glass monolith whose height is proportional to the amount raised. */
export const Tower: React.FC<{x: number; z: number; h: number; grow: number; label: string; sub: string; amount: string; color?: string; w?: number; labelOpacity?: number}> = ({x, z, h, grow, label, sub, amount, color = '#38b6ff', w = 1.6, labelOpacity = 1}) => {
  const hh = Math.max(0.001, h * grow);
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), []);
  const edgeMat = useMemo(() => new THREE.LineBasicMaterial({toneMapped: false, transparent: true}), []);
  edgeMat.color.set(color).multiplyScalar(2.2);
  edgeMat.opacity = Math.min(1, grow * 3);
  const capMat = useMemo(() => new THREE.MeshBasicMaterial({toneMapped: false}), []);
  capMat.color.set(color).multiplyScalar(1.6);
  if (grow <= 0) return null;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, hh / 2, 0]} scale={[w, hh, w]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhysicalMaterial color="#16324a" metalness={0.3} roughness={0.1} clearcoat={1} envMapIntensity={2} emissive={color} emissiveIntensity={0.28} />
      </mesh>
      <lineSegments geometry={edges} material={edgeMat} position={[0, hh / 2, 0]} scale={[w * 1.002, hh, w * 1.002]} />
      <mesh position={[0, hh + 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} material={capMat}>
        <planeGeometry args={[w, w]} />
      </mesh>
      <group position={[0, hh + 0.75, 0]}>
        <Text3D text={amount} size={0.55} depth={0.12} bevel={0.012}>
          <meshStandardMaterial color="#f2f6fa" metalness={0.6} roughness={0.25} />
        </Text3D>
        <Label3D text={label} font="mono" weight={500} size={56} tracking={0.25} color="#8fd6ff" height={0.17} position={[0, 0.62, 0]} opacity={labelOpacity} />
        <Label3D text={sub} font="mono" size={44} tracking={0.15} color="#d8e4ee" height={0.13} position={[0, -0.52, 0]} opacity={labelOpacity * 0.85} />
      </group>
    </group>
  );
};

export const MirrorFloor: React.FC<{y?: number}> = ({y = 0}) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} receiveShadow>
    <planeGeometry args={[200, 200]} />
    <meshPhysicalMaterial color="#05080c" metalness={0.9} roughness={0.18} clearcoat={1} envMapIntensity={0.6} />
  </mesh>
);
