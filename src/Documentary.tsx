import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {FPS, SCENES} from './timeline';
import {S1Hook} from './scenes/S1Hook';
import {S2Beginning} from './scenes/S2Beginning';
import {S3Rejection} from './scenes/S3Rejection';
import {S4Comeback} from './scenes/S4Comeback';
import {S5Explosion} from './scenes/S5Explosion';
import {S6Payoff} from './scenes/S6Payoff';
import {anySlotAvailable, narrationGain, musicGain} from './lib/archival';

const seq = (k: keyof typeof SCENES) => ({from: Math.round(SCENES[k][0] * FPS), durationInFrames: Math.round((SCENES[k][1] - SCENES[k][0]) * FPS)});

// Scenes overlap by a fraction of a second; later scenes sit on top and open from black/flash,
// so each hand-off reads as one continuous move. Soundtrack = narration + score + SFX, pre-mixed
// by tools/build_score.py (stems in public/audio/stems).
export const Documentary: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    {anySlotAvailable ? (
      // Archival clips present: play the stems separately so the score ducks and the narration
      // gives way while real footage (with its own sound) is on screen.
      <>
        <Audio src={staticFile('audio/stems/vo_mix.wav')} volume={(f) => narrationGain(f / FPS)} />
        <Audio src={staticFile('audio/stems/music_mix.wav')} volume={(f) => musicGain(f / FPS)} />
        <Audio src={staticFile('audio/stems/sfx_mix.wav')} volume={(f) => musicGain(f / FPS)} />
      </>
    ) : (
      <Audio src={staticFile('audio/soundtrack.wav')} />
    )}
    <Sequence {...seq('hook')} name="01 Hook">
      <S1Hook />
    </Sequence>
    <Sequence {...seq('beginning')} name="02 The Beginning">
      <S2Beginning />
    </Sequence>
    <Sequence {...seq('rejection')} name="03 The Rejection">
      <S3Rejection />
    </Sequence>
    <Sequence {...seq('comeback')} name="04 The Comeback">
      <S4Comeback />
    </Sequence>
    <Sequence {...seq('explosion')} name="05 The Explosion">
      <S5Explosion />
    </Sequence>
    <Sequence {...seq('payoff')} name="06 The Payoff">
      <S6Payoff />
    </Sequence>
  </AbsoluteFill>
);
