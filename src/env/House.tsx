import React, {useMemo} from 'react';
import * as THREE from 'three';
import {RBox, Label3D, Glow} from '../lib/three-bits';
import {mats} from '../models/materials';
import {drawTexture, pegboardTexture} from '../lib/textures';
import {F} from '../lib/fonts';

// Dollhouse cutaway: roofless single-storey house. Front faces +z. Garage on the left (x < -1.6).
export const FRONT_DOOR: [number, number, number] = [3.4, 0, 3.0];
export const DOORBELL: [number, number, number] = [4.05, 1.25, 3.09];
export const BENCH_PHONE: [number, number, number] = [-4.2, 1.02, -2.05];

const wallMat = new THREE.MeshStandardMaterial({color: '#20242b', roughness: 0.9});
const wallTop = new THREE.MeshStandardMaterial({color: '#e8e2d6', roughness: 0.6});
const floorMat = new THREE.MeshStandardMaterial({color: '#2b2621', roughness: 0.75});
const garageFloor = new THREE.MeshStandardMaterial({color: '#1d1f22', roughness: 0.55, metalness: 0.1});
const wood = new THREE.MeshStandardMaterial({color: '#6a4a2e', roughness: 0.7});
const fabric = new THREE.MeshStandardMaterial({color: '#3a4250', roughness: 0.95});
const doorMat = new THREE.MeshStandardMaterial({color: '#0f2b45', roughness: 0.45, metalness: 0.2});

const Wall: React.FC<{a: [number, number]; b: [number, number]; h?: number; t?: number}> = ({a, b, h = 2.4, t = 0.18}) => {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  return (
    <group position={[(a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2]} rotation={[0, -ang, 0]}>
      <mesh position={[0, h / 2, 0]} material={wallMat} castShadow receiveShadow>
        <boxGeometry args={[len, h, t]} />
      </mesh>
      <mesh position={[0, h + 0.005, 0]} material={wallTop}>
        <boxGeometry args={[len, 0.01, t]} />
      </mesh>
    </group>
  );
};

export const phoneScreen = (state: 'idle' | 'ring' | 'live') =>
  drawTexture('phone-' + state, 360, 720, (g) => {
    const bg = g.createLinearGradient(0, 0, 0, 720);
    bg.addColorStop(0, '#0b1420');
    bg.addColorStop(1, '#05080d');
    g.fillStyle = bg;
    g.fillRect(0, 0, 360, 720);
    g.fillStyle = 'rgba(255,255,255,0.8)';
    g.font = `500 18px ${F.mono}`;
    g.fillText('9:41', 24, 36);
    if (state === 'idle') return;
    // "live view" of the porch (illustrative)
    const v = g.createLinearGradient(0, 120, 0, 420);
    v.addColorStop(0, '#2a3440');
    v.addColorStop(1, '#151b22');
    g.fillStyle = v;
    g.fillRect(20, 110, 320, 300);
    g.fillStyle = '#3b2a1c';
    g.fillRect(200, 150, 90, 230); // door
    const lamp = g.createRadialGradient(180, 150, 0, 180, 150, 120);
    lamp.addColorStop(0, 'rgba(255,200,120,0.6)');
    lamp.addColorStop(1, 'rgba(255,200,120,0)');
    g.fillStyle = lamp;
    g.fillRect(20, 110, 320, 300);
    g.fillStyle = '#0b0e12';
    g.beginPath();
    g.arc(120, 245, 34, 0, Math.PI * 2); // visitor silhouette
    g.fill();
    g.beginPath();
    g.ellipse(120, 370, 70, 90, 0, Math.PI, 0);
    g.fill();
    g.fillStyle = '#ff4646';
    g.beginPath();
    g.arc(42, 132, 6, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#fff';
    g.font = `700 15px ${F.mono}`;
    g.fillText('LIVE', 54, 137);
    g.font = `600 30px ${F.sans}`;
    g.fillText('Front Door', 24, 470);
    g.font = `400 20px ${F.sans}`;
    g.fillStyle = 'rgba(255,255,255,0.7)';
    g.fillText('Someone is at your door', 24, 505);
    g.fillStyle = '#2bb673';
    g.beginPath();
    g.roundRect(24, 580, 312, 70, 35);
    g.fill();
    g.fillStyle = '#fff';
    g.font = `600 26px ${F.sans}`;
    g.fillText('Answer', 135, 624);
  });

export const House: React.FC<{porch?: number; bulb?: number; ledGlow?: number; phone?: 'idle' | 'ring' | 'live'; phoneGlow?: number}> = ({porch = 1, bulb = 1, ledGlow = 1, phone = 'idle', phoneGlow = 0}) => {
  const m = mats();
  const ledM = useMemo(() => new THREE.MeshBasicMaterial({toneMapped: false}), []);
  ledM.color.set('#4cc3ff').multiplyScalar(0.4 + ledGlow * 2.5);
  const screenM = useMemo(() => new THREE.MeshBasicMaterial({toneMapped: false}), []);
  screenM.map = phoneScreen(phone);
  screenM.color.setScalar(0.15 + phoneGlow * 1.1);
  screenM.needsUpdate = true;
  return (
    <group>
      {/* lot + lawn */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 2]} receiveShadow>
        <planeGeometry args={[40, 30]} />
        <meshStandardMaterial color="#0b100c" roughness={1} />
      </mesh>
      {/* floors */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-3.8, 0.01, 0]} material={garageFloor} receiveShadow>
        <planeGeometry args={[4.4, 6]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2.2, 0.01, 0]} material={floorMat} receiveShadow>
        <planeGeometry args={[7.6, 6]} />
      </mesh>
      {/* path to the front door */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3.4, 0.005, 5.2]} receiveShadow>
        <planeGeometry args={[1.1, 4.4]} />
        <meshStandardMaterial color="#3a3833" roughness={0.9} />
      </mesh>
      {/* outer walls */}
      <Wall a={[-6, -3]} b={[6, -3]} />
      <Wall a={[-6, -3]} b={[-6, 3]} />
      <Wall a={[6, -3]} b={[6, 3]} />
      <Wall a={[-6, 3]} b={[2.85, 3]} />
      <Wall a={[3.95, 3]} b={[6, 3]} />
      {/* header above door */}
      <mesh position={[3.4, 2.2, 3]} material={wallMat}><boxGeometry args={[1.1, 0.4, 0.18]} /></mesh>
      {/* interior walls: garage | house, plus a hallway */}
      <Wall a={[-1.6, -3]} b={[-1.6, 0.6]} />
      <Wall a={[-1.6, 1.6]} b={[-1.6, 3]} />
      <Wall a={[1.6, -3]} b={[1.6, -0.4]} />
      {/* front door (ajar shut) */}
      <mesh position={[3.4, 1.0, 3.02]} material={doorMat} castShadow><boxGeometry args={[1.0, 2.0, 0.06]} /></mesh>
      <mesh position={[3.75, 1.0, 3.07]} material={m.brushed}><sphereGeometry args={[0.04, 12, 10]} /></mesh>
      {/* doorbell on the outside wall */}
      <group position={DOORBELL}>
        <RBox args={[0.12, 0.26, 0.04, 0.03]} material={m.blackGloss} />
        <mesh position={[0, -0.06, 0.022]} material={ledM}><torusGeometry args={[0.032, 0.006, 8, 32]} /></mesh>
      </group>
      {/* porch light */}
      <mesh position={[2.6, 1.9, 3.12]} material={m.brushed}><boxGeometry args={[0.1, 0.18, 0.08]} /></mesh>
      <Glow position={[2.6, 1.9, 3.2]} size={0.9} color="#ffcf8a" opacity={0.6 * porch} />
      <pointLight position={[2.6, 1.9, 3.5]} intensity={4 * porch} distance={5} color="#ffcf8a" />
      {/* living room */}
      <RBox args={[2.2, 0.45, 0.9, 0.1]} position={[3.6, 0.32, -2.2]} material={fabric} castShadow />
      <RBox args={[2.2, 0.6, 0.25, 0.1]} position={[3.6, 0.6, -2.6]} material={fabric} castShadow />
      <mesh position={[3.6, 0.22, -1.1]} material={wood} castShadow><boxGeometry args={[1.2, 0.08, 0.6]} /></mesh>
      <mesh position={[0, 0.4, 1.5]} material={wood} castShadow><boxGeometry args={[1.4, 0.06, 0.8]} /></mesh>
      {/* garage: workbench, pegboard, shelves, boxes */}
      <mesh position={[-4.2, 0.95, -2.35]} material={wood} castShadow receiveShadow><boxGeometry args={[2.8, 0.08, 0.9]} /></mesh>
      {[-5.5, -2.9].map((x) => (
        <mesh key={x} position={[x, 0.47, -2.35]} material={m.darkGrey} castShadow><boxGeometry args={[0.08, 0.94, 0.8]} /></mesh>
      ))}
      <mesh position={[-4.2, 1.8, -2.9]}>
        <planeGeometry args={[2.8, 1.3]} />
        <meshStandardMaterial map={pegboardTexture()} roughness={0.8} />
      </mesh>
      {[[-5.1, 1.7], [-4.6, 2.0], [-3.7, 1.75], [-3.3, 2.1]].map(([x, y], i) => (
        <mesh key={i} position={[x, y, -2.85]} rotation={[0, 0, i * 0.7]} material={m.brushed} castShadow><cylinderGeometry args={[0.025, 0.025, 0.45, 8]} /></mesh>
      ))}
      {/* bench clutter: boards, soldering iron, prototype */}
      <mesh position={[-4.8, 1.0, -2.2]} material={m.pcb} castShadow><boxGeometry args={[0.5, 0.02, 0.35]} /></mesh>
      <mesh position={[-3.6, 1.02, -2.3]} material={m.pcb} castShadow><boxGeometry args={[0.3, 0.02, 0.25]} /></mesh>
      <mesh position={[-3.2, 1.04, -2.5]} rotation={[0, 0.5, Math.PI / 2.3]} material={m.darkGrey} castShadow><cylinderGeometry args={[0.025, 0.012, 0.4, 10]} /></mesh>
      {/* phone on the bench */}
      <group position={BENCH_PHONE} rotation={[-1.1, 0.25, 0]}>
        <RBox args={[0.36, 0.72, 0.035, 0.05]} material={m.blackGloss} castShadow />
        <mesh position={[0, 0, 0.019]} material={screenM}><planeGeometry args={[0.32, 0.66]} /></mesh>
      </group>
      {phoneGlow > 0.05 ? <pointLight position={[BENCH_PHONE[0], BENCH_PHONE[1] + 0.3, BENCH_PHONE[2] + 0.2]} intensity={phoneGlow * 1.5} distance={1.6} color="#9fd2ff" /> : null}
      {/* shelves + boxes */}
      {[0.6, 1.3, 2.0].map((y) => (
        <mesh key={y} position={[-5.7, y, 0.4]} material={m.darkGrey} castShadow><boxGeometry args={[0.45, 0.04, 2.2]} /></mesh>
      ))}
      {[[-5.7, 0.78, -0.2], [-5.7, 0.8, 0.6], [-5.7, 1.48, 0.2], [-5.7, 2.16, 0.9], [-5.6, 0.2, 2.2], [-5.2, 0.2, 2.5]].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} material={wood} castShadow><boxGeometry args={[0.38, 0.32 + (i % 2) * 0.1, 0.42]} /></mesh>
      ))}
      {/* garage bulb */}
      <mesh position={[-4.2, 2.3, -1.6]}><sphereGeometry args={[0.07, 16, 12]} /><meshBasicMaterial color={new THREE.Color(1.0, 0.75, 0.42).multiplyScalar(0.3 + bulb * 3)} toneMapped={false} /></mesh>
      <mesh position={[-4.2, 2.55, -1.6]} material={m.darkGrey}><cylinderGeometry args={[0.005, 0.005, 0.5, 6]} /></mesh>
      <pointLight position={[-4.2, 2.2, -1.6]} intensity={9 * bulb} distance={7} color="#ffbb70" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.001} />
      <Glow position={[-4.2, 2.3, -1.6]} size={1.4} color="#ffbb70" opacity={0.5 * bulb} />
      {/* living room lamp */}
      <pointLight position={[4.6, 1.6, -1.8]} intensity={3} distance={5} color="#ffd29a" />
    </group>
  );
};

/** Labels floating over the cutaway. */
export const RoomLabel: React.FC<{text: string; position: [number, number, number]; opacity: number; color?: string}> = ({text, position, opacity, color = '#e8eef4'}) => (
  <Label3D text={text} font="mono" weight={500} size={64} tracking={0.3} color={color} height={0.2} position={position} rotation={[-0.6, 0, 0]} opacity={opacity} />
);
