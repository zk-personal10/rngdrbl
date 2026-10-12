import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Stage, CameraRig} from './lib/Stage';
import {Studio} from './env/Studio';
import {Doorbell} from './models/Doorbell';

export const Lab: React.FC<{variant: 'doorbot' | 'ring'; explode: number}> = ({variant, explode}) => {
  const f = useCurrentFrame();
  const t = f / 30;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Stage grade={{bloom: 0.9, time: t}} env={0.35}>
        <CameraRig t={t} path={[{t: 0, p: explode > 0 ? [5.5, 1.6, 6.5] : [1.6, 0.6, 6], l: [0, 0.1, 0], fov: 30}]} />
        <Studio t={t} keyI={1} floorY={-1.6} />
        <Doorbell variant={variant} explode={explode} t={t} ir={0.6} led={3} rotation={[0, explode > 0 ? 0.1 : -0.25, 0]} labels={explode > 0 ? {camera: 1, button: 1, antenna: 1, battery: 1, pcb: 1, face: 1} : {}} />
      </Stage>
    </AbsoluteFill>
  );
};
