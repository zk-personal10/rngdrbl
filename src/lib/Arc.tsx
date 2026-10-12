import React, {useMemo} from 'react';
import * as THREE from 'three';

/** Signal arc: a tube along a quadratic bezier with travelling light pulses (custom shader). */
export const SignalArc: React.FC<{from: [number, number, number]; to: [number, number, number]; lift?: number; t: number; reveal: number; color?: string; radius?: number; opacity?: number}> = ({from, to, lift = 3, t, reveal, color = '#4cc3ff', radius = 0.025, opacity = 1}) => {
  const geo = useMemo(() => {
    const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
    const c = a.clone().add(b).multiplyScalar(0.5);
    c.y += lift;
    return new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, c, b), 160, radius, 10, false);
  }, [from.join(), to.join(), lift, radius]);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {uT: {value: 0}, uReveal: {value: 0}, uColor: {value: new THREE.Color(color)}, uOpacity: {value: 1}},
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
        fragmentShader: `uniform float uT, uReveal, uOpacity; uniform vec3 uColor; varying vec2 vUv;
          void main(){
            float u = vUv.x;
            if (u > uReveal) discard;
            float head = smoothstep(uReveal - 0.08, uReveal, u) * step(uReveal, 0.999);
            float pulse = pow(0.5 + 0.5*sin((u*14.0 - uT*5.0)*6.2831), 6.0);
            float base = 0.35 + 0.65*pulse;
            vec3 col = uColor * (base * 2.2 + head * 4.0);
            gl_FragColor = vec4(col * uOpacity, 1.0);
          }`,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    [color],
  );
  mat.uniforms.uT.value = t;
  mat.uniforms.uReveal.value = reveal;
  mat.uniforms.uOpacity.value = opacity;
  if (reveal <= 0 || opacity <= 0) return null;
  return <mesh geometry={geo} material={mat} />;
};
