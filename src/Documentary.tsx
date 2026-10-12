import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {FPS, SCENES} from './timeline';
import {S1Hook} from './scenes/S1Hook';

const seq = (k: keyof typeof SCENES) => ({from: Math.round(SCENES[k][0] * FPS), durationInFrames: Math.round((SCENES[k][1] - SCENES[k][0]) * FPS)});

export const Documentary: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <Audio src={staticFile('audio/narration.wav')} />
    <Sequence {...seq('hook')} name="01 Hook">
      <S1Hook />
    </Sequence>
  </AbsoluteFill>
);
