import React from 'react';
import {OffthreadVideo, staticFile, Sequence} from 'remotion';
import manifest from '../data/media-manifest.json';
import {FPS} from '../timeline';
import {window01} from '../lib/ease';
import {F} from '../lib/fonts';

type Slot = {title: string; rightsHolder: string; file: string; available: boolean; start: number; end: number; trimFrom: number};

/**
 * Composites licensed archival footage over the recreation when it is available.
 * The footage is graded to match the film (contrast, teal shadows, grain from the global layer),
 * framed with a subtle broadcast-safe vignette and labelled with its archival source.
 * `t` is the absolute time in seconds, `sceneStart` the scene's start (for Sequence offsets).
 */
export const ArchivalSlot: React.FC<{id: keyof typeof manifest.slots; t: number; sceneStart: number}> = ({id, t, sceneStart}) => {
  const s = (manifest.slots as Record<string, Slot>)[id];
  if (!s || !s.available) return null;
  const o = window01(t, s.start, s.end, 0.4, 0.4);
  return (
    <Sequence from={Math.round((s.start - sceneStart) * FPS)} durationInFrames={Math.round((s.end - s.start) * FPS)} layout="none">
      <div style={{position: 'absolute', inset: 0, opacity: o}}>
        <OffthreadVideo src={staticFile(s.file)} startFrom={Math.round(s.trimFrom * FPS)} muted style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'contrast(1.08) saturate(0.85) brightness(0.95)'}} />
        <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)', mixBlendMode: 'multiply'}} />
        <div style={{position: 'absolute', right: 96, top: 72, fontFamily: F.mono, fontSize: 15, letterSpacing: '0.22em', color: 'rgba(230,238,245,0.75)'}}>ARCHIVAL · {s.rightsHolder.toUpperCase()}</div>
      </div>
    </Sequence>
  );
};
