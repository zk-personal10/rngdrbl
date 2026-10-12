import manifest from '../data/media-manifest.json';
import {prog} from './ease';

export type Slot = {
  title: string;
  rightsHolder: string;
  file: string;
  available: boolean;
  start: number;
  end: number;
  trimFrom: number;
  volume: number; // archival clip's own audio level
  replacesNarration: boolean; // mute narration while the clip plays
  musicDuck: number; // score + SFX level while the clip plays (0..1)
};

export const SLOTS = manifest.slots as Record<string, Slot>;
export const ACTIVE_SLOTS = Object.values(SLOTS).filter((s) => s.available);
export const anySlotAvailable = ACTIVE_SLOTS.length > 0;

const RAMP = 0.35; // seconds

/** 0..1: how much a slot "owns" the moment t (with short ramps at the edges). */
const presence = (s: Slot, t: number) => Math.min(prog(t, s.start - RAMP, s.start, 'sine.inOut'), 1 - prog(t, s.end, s.end + RAMP, 'sine.inOut'));

export const narrationGain = (t: number) => ACTIVE_SLOTS.reduce((g, s) => (s.replacesNarration ? Math.min(g, 1 - presence(s, t)) : g), 1);
export const musicGain = (t: number) => ACTIVE_SLOTS.reduce((g, s) => Math.min(g, 1 - presence(s, t) * (1 - s.musicDuck)), 1);
