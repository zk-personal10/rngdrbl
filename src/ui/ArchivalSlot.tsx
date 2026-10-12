import React from 'react';
import {OffthreadVideo, staticFile, Sequence} from 'remotion';
import {FPS} from '../timeline';
import {window01} from '../lib/ease';
import {F} from '../lib/fonts';
import {SLOTS} from '../lib/archival';

/**
 * Composites licensed archival footage — picture AND sound — over the recreation when available.
 * While it plays, Documentary.tsx ducks the score and (optionally) mutes the narration, so the real
 * voices carry the moment. Footage is graded to sit with the film and labelled with its source.
 */
export const ArchivalSlot: React.FC<{id: string; t: number; sceneStart: number}> = ({id, t, sceneStart}) => {
  const s = SLOTS[id];
  if (!s || !s.available) return null;
  const o = window01(t, s.start, s.end, 0.4, 0.4);
  const n = Math.round((s.end - s.start) * FPS);
  const fadeF = Math.round(0.35 * FPS);
  return (
    <Sequence from={Math.round((s.start - sceneStart) * FPS)} durationInFrames={n} layout="none">
      <div style={{position: 'absolute', inset: 0, opacity: o}}>
        <OffthreadVideo
          src={staticFile(s.file)}
          startFrom={Math.round(s.trimFrom * FPS)}
          volume={(f) => s.volume * Math.min(1, f / fadeF, (n - f) / fadeF)}
          style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'contrast(1.08) saturate(0.85) brightness(0.95)'}}
        />
        <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)', mixBlendMode: 'multiply'}} />
        <div style={{position: 'absolute', right: 96, top: 72, fontFamily: F.mono, fontSize: 15, letterSpacing: '0.22em', color: 'rgba(230,238,245,0.75)'}}>ARCHIVAL · {s.rightsHolder.toUpperCase()}</div>
      </div>
    </Sequence>
  );
};
