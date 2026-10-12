import React from 'react';
import {F} from '../lib/fonts';
import {C} from './Type';
import {prog} from '../lib/ease';

/** Camera viewfinder / broadcast framing: corner brackets, REC, timecode, ON AIR tally, scanlines. */
export const Broadcast: React.FC<{t: number; a: number; b: number; tally: number}> = ({t, a, b, tally}) => {
  const o = Math.min(prog(t, a, a + 0.6, 'power2.out'), 1 - prog(t, b - 0.4, b, 'power2.in'));
  if (o <= 0) return null;
  const tc = Math.max(0, t - a);
  const ff = Math.floor((tc * 30) % 30), ss = Math.floor(tc % 60);
  const corner = (s: React.CSSProperties) => <div style={{position: 'absolute', width: 70, height: 70, borderColor: 'rgba(255,255,255,0.85)', borderStyle: 'solid', borderWidth: 0, ...s}} />;
  const blink = Math.floor(t * 2) % 2 === 0;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: o}}>
      <div style={{position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, transparent 2px, transparent 4px)'}} />
      {corner({left: 90, top: 90, borderLeftWidth: 3, borderTopWidth: 3})}
      {corner({right: 90, top: 90, borderRightWidth: 3, borderTopWidth: 3})}
      {corner({left: 90, bottom: 90, borderLeftWidth: 3, borderBottomWidth: 3})}
      {corner({right: 90, bottom: 90, borderRightWidth: 3, borderBottomWidth: 3})}
      <div style={{position: 'absolute', left: 130, top: 120, fontFamily: F.mono, fontSize: 24, letterSpacing: '0.2em', color: C.white, display: 'flex', alignItems: 'center', gap: 14}}>
        <span style={{width: 16, height: 16, borderRadius: 16, background: blink ? C.red : 'transparent', border: `2px solid ${C.red}`}} />
        REC
      </div>
      <div style={{position: 'absolute', right: 130, top: 120, fontFamily: F.mono, fontSize: 24, letterSpacing: '0.12em', color: C.white}}>
        00:00:{String(ss).padStart(2, '0')}:{String(ff).padStart(2, '0')}
      </div>
      <div style={{position: 'absolute', left: '50%', top: 112, transform: 'translateX(-50%)', padding: '10px 26px', border: `2px solid rgba(255,59,59,${0.4 + tally * 0.6})`, background: `rgba(255,40,40,${tally * 0.85})`, boxShadow: `0 0 ${60 * tally}px rgba(255,40,40,${tally})`, fontFamily: F.mono, fontWeight: 700, fontSize: 26, letterSpacing: '0.4em', color: C.white}}>
        ON AIR
      </div>
      <div style={{position: 'absolute', left: '50%', top: '50%', width: 60, height: 60, transform: 'translate(-50%,-50%)'}}>
        <div style={{position: 'absolute', left: 29, top: 0, width: 2, height: 60, background: 'rgba(255,255,255,0.5)'}} />
        <div style={{position: 'absolute', top: 29, left: 0, height: 2, width: 60, background: 'rgba(255,255,255,0.5)'}} />
      </div>
    </div>
  );
};
