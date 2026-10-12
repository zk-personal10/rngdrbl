import * as THREE from 'three';
import {brushedTexture, pcbTexture, grilleTexture} from '../lib/textures';

let M: ReturnType<typeof make> | null = null;
const make = () => ({
  brushed: new THREE.MeshPhysicalMaterial({color: '#c8ccd2', metalness: 1, roughness: 0.3, roughnessMap: brushedTexture(), clearcoat: 0.35, clearcoatRoughness: 0.2}),
  nickel: new THREE.MeshPhysicalMaterial({color: '#bdb6aa', metalness: 1, roughness: 0.34, roughnessMap: brushedTexture(), clearcoat: 0.5, clearcoatRoughness: 0.15}),
  blackGloss: new THREE.MeshPhysicalMaterial({color: '#040507', metalness: 0.1, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.03}),
  blackMatte: new THREE.MeshStandardMaterial({color: '#101114', metalness: 0.2, roughness: 0.62}),
  darkGrey: new THREE.MeshStandardMaterial({color: '#2a2d33', metalness: 0.4, roughness: 0.5}),
  white: new THREE.MeshPhysicalMaterial({color: '#e9ebee', metalness: 0, roughness: 0.35, clearcoat: 0.6}),
  lens: new THREE.MeshPhysicalMaterial({color: '#05070a', metalness: 0.2, roughness: 0.02, clearcoat: 1, iridescence: 1, iridescenceIOR: 1.8, iridescenceThicknessRange: [180, 520]}),
  gold: new THREE.MeshStandardMaterial({color: '#d7a548', metalness: 1, roughness: 0.28}),
  copper: new THREE.MeshStandardMaterial({color: '#c27a4a', metalness: 1, roughness: 0.35}),
  pcb: new THREE.MeshStandardMaterial({map: pcbTexture(), metalness: 0.3, roughness: 0.45}),
  chip: new THREE.MeshStandardMaterial({color: '#141518', metalness: 0.3, roughness: 0.35}),
  battery: new THREE.MeshPhysicalMaterial({color: '#1d2a3a', metalness: 0.6, roughness: 0.35, clearcoat: 0.8}),
  grille: new THREE.MeshStandardMaterial({map: grilleTexture(), metalness: 0.5, roughness: 0.5}),
  irLed: new THREE.MeshPhysicalMaterial({color: '#2a0505', metalness: 0, roughness: 0.1, clearcoat: 1, emissive: new THREE.Color('#ff2010'), emissiveIntensity: 0}),
});
export const mats = () => (M ??= make());

/** Emissive LED material whose brightness can exceed 1.0 to drive bloom. */
const ledCache = new Map<string, THREE.MeshBasicMaterial>();
export const ledMat = (key: string, color: string, intensity: number) => {
  let m = ledCache.get(key);
  if (!m) {
    m = new THREE.MeshBasicMaterial({toneMapped: false, transparent: true});
    ledCache.set(key, m);
  }
  m.color.set(color).multiplyScalar(intensity);
  m.opacity = 1;
  return m;
};
