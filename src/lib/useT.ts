import {useCurrentFrame} from 'remotion';
import {FPS, SCENES, SceneKey} from '../timeline';
/** Absolute film time in seconds for a scene mounted in a Sequence starting at SCENES[key][0]. */
export const useT = (key: SceneKey) => useCurrentFrame() / FPS + SCENES[key][0];
