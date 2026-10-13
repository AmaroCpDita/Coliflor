export type CompanionPose = 'idle' | 'walk' | 'play' | 'rest';
export interface CompanionCue {
  x: number;
  y: number;
  facingRight: boolean;
  pose: CompanionPose;
  duration: number;
  delay?: number;
}
export interface CompanionMoment {
  duration: number;
  max: CompanionCue;
  abi: CompanionCue;
}

// The lower grass bank follows the diagonal strip between the path and pond.
export function clampCompanionPosition(x: number, y: number) {
  const boundedY = Math.max(17, Math.min(22, y));
  const minX = 54 + (22 - boundedY) * 0.8;
  const maxX = 68 - (boundedY - 17) * 1.8;
  return { x: Math.max(minX, Math.min(maxX, x)), y: boundedY };
}
const cue = (
  x: number,
  y: number,
  facingRight: boolean,
  pose: CompanionPose,
  duration = 0,
  delay = 0,
): CompanionCue => ({ ...clampCompanionPosition(x, y), facingRight, pose, duration, delay });

export const COMPANION_MOMENTS: CompanionMoment[] = [
  { duration: 5200, max: cue(57, 21, true, 'idle'), abi: cue(65, 18, false, 'idle') },
  {
    duration: 4400,
    max: cue(58, 20, true, 'walk', 3600),
    abi: cue(64, 18.5, false, 'walk', 2900, 500),
  },
  { duration: 3300, max: cue(58, 20, true, 'idle'), abi: cue(64, 18.5, false, 'idle') },
  { duration: 2000, max: cue(58, 20, true, 'play'), abi: cue(64, 18.5, false, 'idle') },
  { duration: 2300, max: cue(58, 20, true, 'idle'), abi: cue(64, 18.5, false, 'play') },
  {
    duration: 4700,
    max: cue(55.5, 21.5, false, 'walk', 4000),
    abi: cue(61, 20, false, 'walk', 3500, 600),
  },
  {
    duration: 5100,
    max: cue(58, 19, true, 'walk', 4400),
    abi: cue(66, 17.5, true, 'walk', 3700, 650),
  },
  { duration: 7200, max: cue(58, 19, true, 'idle'), abi: cue(66, 17.5, false, 'idle') },
  {
    duration: 4900,
    max: cue(57, 21, false, 'walk', 4200),
    abi: cue(65, 18, false, 'walk', 3500, 500),
  },
];
