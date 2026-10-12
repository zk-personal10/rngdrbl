import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useThree, useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/examples/jsm/postprocessing/OutputPass.js';
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass.js';
import {BokehPass} from 'three/examples/jsm/postprocessing/BokehPass.js';
import {WIDTH, HEIGHT} from '../timeline';

export type Grade = {
  bloom?: number; // strength
  bloomRadius?: number;
  bloomThreshold?: number;
  vignette?: number;
  grain?: number;
  ca?: number; // chromatic aberration
  fade?: number; // 0..1 to black
  flash?: number; // 0..1 to flashColor
  flashColor?: string;
  saturation?: number;
  lift?: [number, number, number];
  gain?: [number, number, number];
  exposure?: number;
  dof?: {focus: number; aperture: number; maxblur: number} | null;
  time?: number;
};

const FinalShader = {
  uniforms: {
    tDiffuse: {value: null},
    uTime: {value: 0},
    uVignette: {value: 0.6},
    uGrain: {value: 0.05},
    uCA: {value: 0.6},
    uFade: {value: 0},
    uFlash: {value: 0},
    uFlashColor: {value: new THREE.Color('#ffffff')},
    uSat: {value: 1},
    uLift: {value: new THREE.Vector3(0.0, 0.006, 0.014)},
    uGain: {value: new THREE.Vector3(1.0, 1.0, 1.0)},
  },
  vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; uniform float uTime, uVignette, uGrain, uCA, uFade, uFlash, uSat;
    uniform vec3 uFlashColor, uLift, uGain; varying vec2 vUv;
    float hash(vec2 p){ p = fract(p*vec2(443.897,441.423)); p += dot(p, p.yx+19.19); return fract((p.x+p.y)*p.x); }
    void main(){
      vec2 d = vUv - 0.5; float r2 = dot(d,d);
      vec2 off = d * r2 * uCA * 0.02;
      vec3 col = vec3(texture2D(tDiffuse, vUv - off).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv + off).b);
      float l = dot(col, vec3(0.2126,0.7152,0.0722));
      col = mix(vec3(l), col, uSat);
      col = col * uGain + uLift * (1.0 - col);
      float v = smoothstep(0.95, 0.25, length(d * vec2(1.0, 0.82)) * 1.25);
      col *= mix(1.0, v, uVignette);
      float g = hash(vUv * vec2(1920.0, 1080.0) + fract(uTime * 7.31) * 113.0) - 0.5;
      col += g * uGrain * (1.15 - l);
      col = mix(col, uFlashColor, clamp(uFlash, 0.0, 1.0));
      col *= (1.0 - clamp(uFade, 0.0, 1.0));
      gl_FragColor = vec4(col, 1.0);
    }`,
};

/** Dark photographic studio for reflections: black room + a few softbox strips (crisp, controllable highlights). */
const makeStudioEnv = () => {
  const sc = new THREE.Scene();
  const room = new THREE.Mesh(new THREE.BoxGeometry(40, 20, 40), new THREE.MeshBasicMaterial({color: new THREE.Color(0.012, 0.013, 0.016), side: THREE.BackSide}));
  sc.add(room);
  const box = (w: number, h: number, pos: [number, number, number], look: [number, number, number], k: number, tint = [1, 1, 1]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({color: new THREE.Color(tint[0] * k, tint[1] * k, tint[2] * k), side: THREE.DoubleSide}));
    m.position.set(...pos);
    m.lookAt(...look);
    sc.add(m);
  };
  box(8, 3, [0, 9.5, 2], [0, 0, 0], 2.2, [1, 0.97, 0.92]); // overhead softbox
  box(1.4, 9, [-9, 2, 4], [0, 0, 0], 3.0, [1, 0.96, 0.9]); // key strip left
  box(1.0, 9, [9, 2, -2], [0, 0, 0], 1.6, [0.75, 0.88, 1]); // cool rim strip right
  box(14, 1.2, [0, -1, -12], [0, 0, 0], 0.5, [0.6, 0.75, 1]); // low back kicker
  return sc;
};

const Environment: React.FC<{intensity: number}> = ({intensity}) => {
  const {gl, scene} = useThree();
  const tex = useMemo(() => {
    const p = new THREE.PMREMGenerator(gl);
    const t = p.fromScene(makeStudioEnv(), 0.02).texture;
    p.dispose();
    return t;
  }, [gl]);
  gl.localClippingEnabled = true;
  scene.environment = tex;
  scene.environmentIntensity = intensity;
  return null;
};

const Post: React.FC<{grade: Grade}> = ({grade}) => {
  const {gl, scene, camera, size} = useThree();
  const passes = useMemo(() => {
    const composer = new EffectComposer(gl);
    composer.setPixelRatio(1);
    const render = new RenderPass(scene, camera);
    composer.addPass(render);
    const bokeh = new BokehPass(scene, camera, {focus: 5, aperture: 0.002, maxblur: 0.006});
    bokeh.enabled = false;
    composer.addPass(bokeh);
    const bloom = new UnrealBloomPass(new THREE.Vector2(size.width, size.height), 0.8, 0.55, 0.72);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
    const fin = new ShaderPass(FinalShader);
    composer.addPass(fin);
    composer.setSize(size.width, size.height);
    return {composer, bloom, fin, bokeh};
  }, [gl, scene, camera, size.width, size.height]);
  const g = useRef(grade);
  g.current = grade;
  useFrame(() => {
    const {bloom, fin, composer, bokeh} = passes;
    const c = g.current;
    bloom.strength = c.bloom ?? 0.8;
    bloom.radius = c.bloomRadius ?? 0.55;
    bloom.threshold = c.bloomThreshold ?? 0.72;
    const u = fin.uniforms as any;
    u.uTime.value = c.time ?? 0;
    u.uVignette.value = c.vignette ?? 0.65;
    u.uGrain.value = c.grain ?? 0.055;
    u.uCA.value = c.ca ?? 0.8;
    u.uFade.value = c.fade ?? 0;
    u.uFlash.value = c.flash ?? 0;
    u.uFlashColor.value.set(c.flashColor ?? '#ffffff');
    u.uSat.value = c.saturation ?? 1;
    if (c.lift) u.uLift.value.set(...c.lift);
    if (c.gain) u.uGain.value.set(...c.gain);
    gl.toneMappingExposure = c.exposure ?? 1;
    if (c.dof) {
      bokeh.enabled = true;
      const bu = (bokeh as any).uniforms;
      bu.focus.value = c.dof.focus;
      bu.aperture.value = c.dof.aperture;
      bu.maxblur.value = c.dof.maxblur;
    } else bokeh.enabled = false;
    composer.render();
  }, 1);
  return null;
};

export type CamKey = {t: number; p: [number, number, number]; l: [number, number, number]; fov?: number; e?: string; roll?: number};

import {prog, mix, noise1} from './ease';

/** Evaluates a camera path at time t. Keys are piecewise eased; optional Catmull-Rom smoothing. */
export const evalCam = (t: number, path: CamKey[], spline = false) => {
  if (t <= path[0].t) return {...path[0], fov: path[0].fov ?? 35, roll: path[0].roll ?? 0};
  const last = path[path.length - 1];
  if (t >= last.t) return {...last, fov: last.fov ?? 35, roll: last.roll ?? 0};
  let i = 1;
  while (path[i].t < t) i++;
  const a = path[i - 1], b = path[i];
  const p = prog(t, a.t, b.t, b.e ?? 'power2.inOut');
  let pos: [number, number, number];
  let look: [number, number, number];
  if (spline && path.length > 2) {
    const pts = path.map((k) => new THREE.Vector3(...k.p));
    const lks = path.map((k) => new THREE.Vector3(...k.l));
    const cp = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    const cl = new THREE.CatmullRomCurve3(lks, false, 'centripetal');
    const u = (i - 1 + p) / (path.length - 1);
    pos = cp.getPoint(u).toArray() as any;
    look = cl.getPoint(u).toArray() as any;
  } else {
    pos = [mix(a.p[0], b.p[0], p), mix(a.p[1], b.p[1], p), mix(a.p[2], b.p[2], p)];
    look = [mix(a.l[0], b.l[0], p), mix(a.l[1], b.l[1], p), mix(a.l[2], b.l[2], p)];
  }
  return {t, p: pos, l: look, fov: mix(a.fov ?? 35, b.fov ?? 35, p), roll: mix(a.roll ?? 0, b.roll ?? 0, p)};
};

export const CameraRig: React.FC<{t: number; path: CamKey[]; spline?: boolean; shake?: number; drift?: number}> = ({t, path, spline, shake = 0, drift = 0.6}) => {
  const {camera} = useThree();
  const c = evalCam(t, path, spline);
  const cam = camera as THREE.PerspectiveCamera;
  const hx = noise1(t * 0.35, 1) * 0.02 * drift + noise1(t * 9, 4) * 0.02 * shake;
  const hy = noise1(t * 0.3, 2) * 0.015 * drift + noise1(t * 11, 5) * 0.02 * shake;
  cam.position.set(c.p[0] + hx, c.p[1] + hy, c.p[2]);
  cam.up.set(Math.sin(c.roll), Math.cos(c.roll), 0);
  cam.lookAt(c.l[0] + hx * 0.4, c.l[1] + hy * 0.4, c.l[2]);
  if (cam.fov !== c.fov) {
    cam.fov = c.fov;
  }
  cam.updateProjectionMatrix();
  return null;
};

export const Stage: React.FC<{
  grade: Grade;
  env?: number;
  background?: string;
  fog?: [string, number, number] | null;
  children: React.ReactNode;
  shadows?: boolean;
}> = ({grade, env = 1, background = '#000000', fog = null, children, shadows = true}) => {
  return (
    <ThreeCanvas
      width={WIDTH}
      height={HEIGHT}
      shadows={shadows ? {type: THREE.PCFSoftShadowMap} as any : false}
      camera={{fov: 35, near: 0.05, far: 2000, position: [0, 0, 10]}}
      gl={{antialias: true, toneMapping: THREE.ACESFilmicToneMapping, outputColorSpace: THREE.SRGBColorSpace, powerPreference: 'high-performance'}}
      style={{position: 'absolute', inset: 0}}
    >
      <color attach="background" args={[background]} />
      {fog ? <fog attach="fog" args={fog} /> : null}
      <Environment intensity={env} />
      <Post grade={grade} />
      {children}
    </ThreeCanvas>
  );
};
