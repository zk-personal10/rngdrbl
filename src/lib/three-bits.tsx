import React, {useMemo} from 'react';
import * as THREE from 'three';
import {TextGeometry} from 'three/examples/jsm/geometries/TextGeometry.js';
import {FontLoader} from 'three/examples/jsm/loaders/FontLoader.js';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import interJson from '../data/intertight-800.typeface.json';
import serifJson from '../data/instrument-serif.typeface.json';
import {textTexture, TextOpts, glowTexture} from './textures';
import {rand} from './ease';

const loader = new FontLoader();
const FONTS = {inter: loader.parse(interJson as any), serif: loader.parse(serifJson as any)};

/** Flat text in 3D space (canvas texture). height = world units of the plane. */
export const Label3D: React.FC<
  TextOpts & {height?: number; position?: any; rotation?: any; opacity?: number; additive?: boolean; anchor?: 'left' | 'center' | 'right'; depthTest?: boolean; renderOrder?: number}
> = ({height = 0.2, position, rotation, opacity = 1, additive = false, anchor = 'center', depthTest = true, renderOrder, ...o}) => {
  const {tex, aspect} = textTexture(o);
  const w = height * aspect;
  const x = anchor === 'left' ? w / 2 : anchor === 'right' ? -w / 2 : 0;
  if (opacity <= 0.001) return null;
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[x, 0, 0]} renderOrder={renderOrder}>
        <planeGeometry args={[w, height]} />
        <meshBasicMaterial map={tex} transparent opacity={opacity} depthWrite={false} depthTest={depthTest} toneMapped={false} blending={additive ? THREE.AdditiveBlending : THREE.NormalBlending} />
      </mesh>
    </group>
  );
};

/** Extruded 3D type with bevels. */
export const Text3D: React.FC<{
  text: string;
  font?: 'inter' | 'serif';
  size?: number;
  depth?: number;
  bevel?: number;
  align?: 'left' | 'center' | 'right';
  children?: React.ReactNode; // material
  position?: any;
  rotation?: any;
  scale?: any;
  castShadow?: boolean;
}> = ({text, font = 'inter', size = 1, depth = 0.2, bevel = 0.02, align = 'center', children, castShadow, ...rest}) => {
  const geo = useMemo(() => {
    const g = new TextGeometry(text, {font: FONTS[font], size, depth, curveSegments: 6, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel * 0.6, bevelSegments: 3});
    g.computeBoundingBox();
    const bb = g.boundingBox!;
    const w = bb.max.x - bb.min.x;
    const dx = align === 'center' ? -bb.min.x - w / 2 : align === 'right' ? -bb.max.x : -bb.min.x;
    g.translate(dx, -(bb.max.y + bb.min.y) / 2, -depth / 2);
    return g;
  }, [text, font, size, depth, bevel, align]);
  return (
    <mesh geometry={geo} castShadow={castShadow} {...rest}>
      {children ?? <meshStandardMaterial color="#ddd" metalness={0.9} roughness={0.25} />}
    </mesh>
  );
};

export const RBox: React.FC<{args: [number, number, number, number?, number?]; children?: React.ReactNode; position?: any; rotation?: any; scale?: any; castShadow?: boolean; receiveShadow?: boolean; material?: any}> = ({args, children, ...rest}) => {
  const geo = useMemo(() => new RoundedBoxGeometry(args[0], args[1], args[2], args[4] ?? 4, args[3] ?? 0.05), [args.join(',')]);
  return (
    <mesh geometry={geo} {...rest}>
      {children}
    </mesh>
  );
};

/** Rounded rectangle extruded shape (for faceplates). */
export const roundedRectShape = (w: number, h: number, r: number) => {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
};

export const Slab: React.FC<{w: number; h: number; d: number; r: number; bevel?: number; children?: React.ReactNode; position?: any; rotation?: any; castShadow?: boolean; receiveShadow?: boolean; material?: any}> = ({w, h, d, r, bevel = 0.02, children, ...rest}) => {
  const geo = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(roundedRectShape(w - bevel * 2, h - bevel * 2, Math.max(0.001, r - bevel)), {depth: d - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: 24});
    g.translate(0, 0, -(d - bevel * 2) / 2);
    g.computeVertexNormals();
    return g;
  }, [w, h, d, r, bevel]);
  return (
    <mesh geometry={geo} {...rest}>
      {children}
    </mesh>
  );
};

/** Floating dust motes / particles (soft additive points). Positions drift deterministically with t. */
export const Dust: React.FC<{count?: number; box?: [number, number, number]; center?: [number, number, number]; t: number; size?: number; color?: string; opacity?: number; speed?: number; seed?: number}> = ({
  count = 600,
  box = [8, 5, 8],
  center = [0, 0, 0],
  t,
  size = 0.035,
  color = '#cfe6ff',
  opacity = 0.6,
  speed = 0.05,
  seed = 1,
}) => {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    return g;
  }, [count]);
  const pos = geo.attributes.position.array as Float32Array;
  for (let i = 0; i < count; i++) {
    const r1 = rand(i * 3 + seed), r2 = rand(i * 3 + 1 + seed), r3 = rand(i * 3 + 2 + seed);
    const ph = rand(i + 77 + seed) * 6.28;
    const wrap = (v: number, s: number) => ((((v / s + 0.5) % 1) + 1) % 1 - 0.5) * s;
    pos[i * 3] = center[0] + wrap((r1 - 0.5) * box[0] + Math.sin(t * 0.3 + ph) * 0.15, box[0]);
    pos[i * 3 + 1] = center[1] + wrap((r2 - 0.5) * box[1] + t * speed * (0.5 + r3), box[1]);
    pos[i * 3 + 2] = center[2] + wrap((r3 - 0.5) * box[2] + Math.cos(t * 0.23 + ph) * 0.15, box[2]);
  }
  geo.attributes.position.needsUpdate = true;
  return (
    <points geometry={geo} frustumCulled={false}>
      <pointsMaterial size={size} map={glowTexture()} color={color} transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation toneMapped={false} />
    </points>
  );
};

/** Fake volumetric light cone (additive, soft edges). Apex at origin pointing down -Y. */
const coneMat = (color: string) =>
  new THREE.ShaderMaterial({
    uniforms: {uColor: {value: new THREE.Color(color)}, uOpacity: {value: 0.3}},
    vertexShader: `varying vec3 vN; varying vec3 vV; varying float vH; void main(){ vec4 wp = modelMatrix*vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-(modelViewMatrix*vec4(position,1.0)).xyz); vH = uv.y; gl_Position = projectionMatrix*viewMatrix*wp; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uOpacity; varying vec3 vN; varying vec3 vV; varying float vH; void main(){ float f = pow(abs(dot(vN, vV)), 1.6); float h = pow(vH, 1.4); gl_FragColor = vec4(uColor * f * h * uOpacity, 1.0); }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });

export const LightCone: React.FC<{position?: any; rotation?: any; length?: number; radius?: number; color?: string; opacity?: number}> = ({length = 6, radius = 1.6, color = '#fff3e0', opacity = 0.3, ...rest}) => {
  const mat = useMemo(() => coneMat(color), [color]);
  mat.uniforms.uOpacity.value = opacity;
  const geo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.02, radius, length, 64, 1, true);
    g.translate(0, -length / 2, 0);
    return g;
  }, [length, radius]);
  if (opacity <= 0.001) return null;
  return <mesh geometry={geo} material={mat} {...rest} />;
};

/** Expanding ring wave (sound / signal). p in [0,1]. */
export const RingWave: React.FC<{p: number; maxR?: number; color?: string; width?: number; position?: any; rotation?: any; opacity?: number}> = ({p, maxR = 3, color = '#7fd3ff', width = 0.02, opacity = 1, ...rest}) => {
  if (p <= 0 || p >= 1) return null;
  const r = 0.05 + p * maxR;
  return (
    <mesh {...rest}>
      <ringGeometry args={[r, r + width * (1 + p * 2), 96]} />
      <meshBasicMaterial color={color} transparent opacity={(1 - p) * (1 - p) * opacity} toneMapped={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  );
};

export const Glow: React.FC<{position?: any; size?: number; color?: string; opacity?: number}> = ({size = 1, color = '#ffffff', opacity = 1, position}) =>
  opacity <= 0 ? null : (
    <sprite position={position} scale={[size, size, 1]}>
      <spriteMaterial map={glowTexture()} color={color} transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </sprite>
  );
