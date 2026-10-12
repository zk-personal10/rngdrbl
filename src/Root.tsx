import React from 'react';
import {Composition} from 'remotion';
import {Lab} from './Lab';
import {loadFonts} from './lib/fonts';
import {Documentary} from './Documentary';
import {S1Hook} from './scenes/S1Hook';
import {FPS, SCENES, TOTAL_FRAMES} from './timeline';
loadFonts();

const dur = (k: keyof typeof SCENES) => Math.round((SCENES[k][1] - SCENES[k][0]) * FPS);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Documentary" component={Documentary} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1920} height={1080} />
    <Composition id="S1-Hook" component={S1Hook} durationInFrames={dur('hook')} fps={FPS} width={1920} height={1080} />
    <Composition id="Lab" component={Lab as any} durationInFrames={60} fps={30} width={1920} height={1080} defaultProps={{variant: 'ring', explode: 0}} />
  </>
);
