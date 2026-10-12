import React from 'react';
import {Composition} from 'remotion';
import {Lab} from './Lab';
import {loadFonts} from './lib/fonts';
import {Documentary} from './Documentary';
import {S1Hook} from './scenes/S1Hook';
import {S2Beginning} from './scenes/S2Beginning';
import {S3Rejection} from './scenes/S3Rejection';
import {S4Comeback} from './scenes/S4Comeback';
import {S5Explosion} from './scenes/S5Explosion';
import {FPS, SCENES, TOTAL_FRAMES} from './timeline';
loadFonts();

const dur = (k: keyof typeof SCENES) => Math.round((SCENES[k][1] - SCENES[k][0]) * FPS);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Documentary" component={Documentary} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1920} height={1080} />
    <Composition id="S1-Hook" component={S1Hook} durationInFrames={dur('hook')} fps={FPS} width={1920} height={1080} />
    <Composition id="S2-Beginning" component={S2Beginning} durationInFrames={dur('beginning')} fps={FPS} width={1920} height={1080} />
    <Composition id="S3-Rejection" component={S3Rejection} durationInFrames={dur('rejection')} fps={FPS} width={1920} height={1080} />
    <Composition id="S4-Comeback" component={S4Comeback} durationInFrames={dur('comeback')} fps={FPS} width={1920} height={1080} />
    <Composition id="S5-Explosion" component={S5Explosion} durationInFrames={dur('explosion')} fps={FPS} width={1920} height={1080} />
    <Composition id="Lab" component={Lab as any} durationInFrames={60} fps={30} width={1920} height={1080} defaultProps={{variant: 'ring', explode: 0}} />
  </>
);
