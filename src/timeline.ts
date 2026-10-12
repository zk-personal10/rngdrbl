import narration from './data/narration.json';

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

// Scene ranges in seconds (absolute). Scenes overlap slightly where a transition is shared.
export const SCENES = {
  hook: [0, 37.4],
  beginning: [37, 82],
  rejection: [81.5, 136.6],
  comeback: [136, 197.6],
  explosion: [197, 248.6],
  payoff: [248, 305],
} as const;
export type SceneKey = keyof typeof SCENES;
export const TOTAL_SECONDS = 305;
export const TOTAL_FRAMES = TOTAL_SECONDS * FPS;

type Line = {id: string; scene: string; text: string; start: number; end: number};
const LINES: Record<string, Line> = Object.fromEntries((narration.lines as Line[]).map((l) => [l.id, l]));
export const LINE_LIST = narration.lines as Line[];

/** Narration line timing (seconds, absolute). */
export const vo = (id: string): Line => {
  const l = LINES[id];
  if (!l) throw new Error(`Unknown narration line ${id}`);
  return l;
};
/** Start time of a narration line (seconds) plus optional offset. */
export const at = (id: string, offset = 0) => vo(id).start + offset;
export const end = (id: string, offset = 0) => vo(id).end + offset;
