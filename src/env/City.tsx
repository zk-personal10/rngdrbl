import React, {useMemo} from 'react';
import * as THREE from 'three';
import {rand} from '../lib/ease';
import {drawTexture, glowTexture} from '../lib/textures';

export type House = {x: number; z: number; w: number; d: number; h: number; rot: number; dist: number; r: number; i: number};

const SP = 2.6; // house spacing
const BLOCK = 4; // houses per block side
const ROAD = 2.2;

/** Deterministic suburban grid. */
export const makeHouses = (R: number, seed = 1): House[] => {
  const out: House[] = [];
  const cell = BLOCK * SP + ROAD;
  const nb = Math.ceil(R / cell);
  let i = 0;
  for (let bx = -nb; bx <= nb; bx++)
    for (let bz = -nb; bz <= nb; bz++) {
      for (let hx = 0; hx < BLOCK; hx++)
        for (let hz = 0; hz < 2; hz++) {
          const x = bx * cell + (hx - (BLOCK - 1) / 2) * SP + (rand(i * 3 + seed) - 0.5) * 0.3;
          const z = bz * cell + (hz - 0.5) * SP * 1.25;
          const dist = Math.hypot(x, z);
          if (dist > R) {
            i++;
            continue;
          }
          const r = rand(i * 7 + seed * 13);
          out.push({x, z, w: 1.5 + r * 0.5, d: 1.4 + rand(i + 5) * 0.4, h: 0.9 + (r > 0.7 ? 0.8 : 0) + rand(i + 9) * 0.2, rot: hz === 0 ? Math.PI : 0, dist, r, i});
          i++;
        }
    }
  return out;
};

const roadTexture = () =>
  drawTexture(
    'roads',
    1024,
    1024,
    (g) => {
      g.fillStyle = '#07090c';
      g.fillRect(0, 0, 1024, 1024);
      // one cell of the grid: road along two edges
      const cell = BLOCK * SP + ROAD;
      const roadPx = (ROAD / cell) * 1024;
      g.fillStyle = '#101318';
      g.fillRect(0, 0, 1024, roadPx);
      g.fillRect(0, 0, roadPx, 1024);
      g.strokeStyle = 'rgba(255,214,150,0.18)';
      g.setLineDash([24, 30]);
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(0, roadPx / 2);
      g.lineTo(1024, roadPx / 2);
      g.moveTo(roadPx / 2, 0);
      g.lineTo(roadPx / 2, 1024);
      g.stroke();
    },
    true,
  );

const tmp = new THREE.Object3D();
const col = new THREE.Color();

/**
 * Night suburb. `lit(h)` returns 0..1 porch-light activation for each house.
 * Porch lights are emissive (bloom), windows warm.
 */
export const City: React.FC<{R?: number; seed?: number; lit: (h: House) => number; porchColor?: string; windowGlow?: number; streetGlow?: number; groundY?: number; hole?: number}> = ({R = 70, hole = 0, seed = 1, lit, porchColor = '#38b6ff', windowGlow = 0.6, streetGlow = 1, groundY = 0}) => {
  const houses = useMemo(() => makeHouses(R, seed).filter((h) => h.dist >= hole), [R, seed, hole]);
  const n = houses.length;
  const {body, roof, porch, win, street, ground} = useMemo(() => {
    const bodyGeo = new THREE.BoxGeometry(1, 1, 1);
    bodyGeo.translate(0, 0.5, 0);
    const roofGeo = new THREE.CylinderGeometry(0.62, 0.62, 1, 3, 1);
    roofGeo.rotateZ(Math.PI / 2);
    roofGeo.rotateX(Math.PI);
    roofGeo.translate(0, 0.3, 0);
    const bodyMat = new THREE.MeshStandardMaterial({color: '#1a1e25', roughness: 0.85, metalness: 0.05});
    const roofMat = new THREE.MeshStandardMaterial({color: '#0f1217', roughness: 0.7, metalness: 0.1});
    const body = new THREE.InstancedMesh(bodyGeo, bodyMat, n);
    const roof = new THREE.InstancedMesh(roofGeo, roofMat, n);
    const porchGeo = new THREE.SphereGeometry(0.09, 10, 8);
    const porch = new THREE.InstancedMesh(porchGeo, new THREE.MeshBasicMaterial({toneMapped: false}), n);
    const winGeo = new THREE.PlaneGeometry(0.34, 0.26);
    const win = new THREE.InstancedMesh(winGeo, new THREE.MeshBasicMaterial({toneMapped: false}), n * 2);
    houses.forEach((h, i) => {
      tmp.position.set(h.x, groundY, h.z);
      tmp.rotation.set(0, h.rot, 0);
      tmp.scale.set(h.w, h.h, h.d);
      tmp.updateMatrix();
      body.setMatrixAt(i, tmp.matrix);
      tmp.position.set(h.x, groundY + h.h, h.z);
      tmp.scale.set(h.w * 1.08, 0.9, h.d * 1.6);
      tmp.rotation.set(0, h.rot + Math.PI / 2, 0);
      tmp.updateMatrix();
      roof.setMatrixAt(i, tmp.matrix);
      const fz = h.rot === 0 ? 1 : -1; // facing direction
      tmp.rotation.set(0, h.rot, 0);
      tmp.scale.set(1, 1, 1);
      tmp.position.set(h.x + 0.3 * (h.rot === 0 ? 1 : -1), groundY + 0.45, h.z + fz * (h.d / 2 + 0.06));
      tmp.updateMatrix();
      porch.setMatrixAt(i, tmp.matrix);
      for (let k = 0; k < 2; k++) {
        tmp.position.set(h.x + (k ? -0.4 : 0.05) * (h.rot === 0 ? 1 : -1), groundY + (k ? 0.55 : h.h - 0.3 + 0.05), h.z + fz * (h.d / 2 + 0.01));
        tmp.updateMatrix();
        win.setMatrixAt(i * 2 + k, tmp.matrix);
      }
    });
    porch.instanceMatrix.needsUpdate = true;
    // street lights
    const pts: number[] = [];
    const cell = BLOCK * SP + ROAD;
    const nb = Math.ceil(R / cell);
    for (let a = -nb; a <= nb; a++)
      for (let b = -nb * 3; b <= nb * 3; b++) {
        const x = a * cell - cell / 2 + 0.2, z = (b * cell) / 3;
        if (Math.hypot(x, z) < R) pts.push(x, groundY + 0.9, z);
        if (Math.hypot(z, x) < R) pts.push(z, groundY + 0.9, x - 0.2);
      }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const street = new THREE.Points(sg, new THREE.PointsMaterial({map: glowTexture(), size: 0.9, color: new THREE.Color('#ffb76b'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false}));
    const tex = roadTexture();
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    const cellSize = BLOCK * SP + ROAD;
    tex.repeat.set((R * 2.4) / cellSize, (R * 2.4) / cellSize);
    tex.offset.set(0.5 - ROAD / 2 / cellSize + 0.5, 0.5 - ROAD / 2 / cellSize + 0.5);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(R * 2.4, R * 2.4), new THREE.MeshStandardMaterial({map: tex, roughness: 0.9, metalness: 0}));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = groundY - 0.001;
    ground.receiveShadow = true;
    return {body, roof, porch, win, street, ground};
  }, [houses, n, R, groundY]);

  const base = new THREE.Color(porchColor);
  houses.forEach((h, i) => {
    const l = lit(h);
    col.setRGB(0.05, 0.035, 0.02).lerp(new THREE.Color(base.r * 5, base.g * 5, base.b * 5), l);
    porch.setColorAt(i, col);
    const w1 = h.r > 0.45 ? windowGlow : windowGlow * 0.08;
    const w2 = rand(h.i * 3.3) > 0.6 ? windowGlow : 0.03;
    col.setRGB(1.6 * w1, 0.95 * w1, 0.45 * w1);
    win.setColorAt(i * 2, col);
    col.setRGB(1.6 * w2, 0.95 * w2, 0.45 * w2);
    win.setColorAt(i * 2 + 1, col);
  });
  if (porch.instanceColor) porch.instanceColor.needsUpdate = true;
  if (win.instanceColor) win.instanceColor.needsUpdate = true;
  (street.material as THREE.PointsMaterial).opacity = 0.55 * streetGlow;
  return (
    <group>
      <primitive object={ground} />
      <primitive object={body} />
      <primitive object={roof} />
      <primitive object={porch} />
      <primitive object={win} />
      <primitive object={street} />
    </group>
  );
};
