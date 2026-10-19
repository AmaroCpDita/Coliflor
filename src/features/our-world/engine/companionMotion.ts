export type CompanionPose = 'idle' | 'walk' | 'play' | 'rest' | 'sniff' | 'watch' | 'stretch';

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

const home = (duration: number): CompanionMoment => ({
  duration,
  max: cue(57, 21, true, 'idle'),
  abi: cue(65, 18, false, 'idle'),
});

export const COMPANION_HOME = home(2400);

// Each little story starts and ends at home so changing stories never teleports a dog.
export const COMPANION_ROUTINES: CompanionMoment[][] = [
  [
    home(2400),
    {
      duration: 4100,
      max: cue(56, 21.5, false, 'walk', 3200),
      abi: cue(64, 18.5, false, 'walk', 2900, 350),
    },
    { duration: 3300, max: cue(56, 21.5, false, 'sniff'), abi: cue(64, 18.5, true, 'watch') },
    {
      duration: 4200,
      max: cue(59, 20, true, 'walk', 3400),
      abi: cue(65.5, 17.5, true, 'walk', 3000, 250),
    },
    { duration: 3000, max: cue(59, 20, true, 'watch'), abi: cue(65.5, 17.5, false, 'sniff') },
    {
      duration: 4000,
      max: cue(57, 21, false, 'walk', 3300),
      abi: cue(65, 18, false, 'walk', 3000, 200),
    },
    home(2600),
  ],
  [
    home(1800),
    {
      duration: 3900,
      max: cue(58.5, 20.5, true, 'walk', 3000),
      abi: cue(64, 19, false, 'walk', 3000, 200),
    },
    { duration: 3000, max: cue(58.5, 20.5, true, 'play'), abi: cue(64, 19, false, 'play') },
    {
      duration: 3700,
      max: cue(56, 21.5, false, 'walk', 2900, 150),
      abi: cue(62.5, 19.5, false, 'walk', 2800),
    },
    { duration: 2500, max: cue(56, 21.5, true, 'play'), abi: cue(62.5, 19.5, false, 'watch') },
    {
      duration: 3900,
      max: cue(57, 21, true, 'walk', 2900),
      abi: cue(65, 18, true, 'walk', 3200, 150),
    },
    home(2300),
  ],
  [
    home(1900),
    { duration: 2700, max: cue(57, 21, true, 'stretch'), abi: cue(65, 18, false, 'idle') },
    {
      duration: 4000,
      max: cue(58, 19.5, true, 'walk', 3100),
      abi: cue(66, 17.5, true, 'walk', 3300, 200),
    },
    { duration: 4600, max: cue(58, 19.5, true, 'watch'), abi: cue(66, 17.5, false, 'watch') },
    { duration: 4200, max: cue(58, 19.5, true, 'rest'), abi: cue(66, 17.5, false, 'sniff') },
    {
      duration: 4000,
      max: cue(57, 21, false, 'walk', 3200),
      abi: cue(65, 18, false, 'walk', 3100, 200),
    },
    home(2200),
  ],
  [
    home(1700),
    {
      duration: 3800,
      max: cue(55.5, 21.5, false, 'walk', 3000),
      abi: cue(63, 19, false, 'walk', 3000, 300),
    },
    { duration: 3000, max: cue(55.5, 21.5, true, 'sniff'), abi: cue(63, 19, false, 'sniff') },
    { duration: 2600, max: cue(55.5, 21.5, true, 'watch'), abi: cue(63, 19, false, 'stretch') },
    {
      duration: 4200,
      max: cue(57, 21, true, 'walk', 3200),
      abi: cue(65, 18, true, 'walk', 3300, 150),
    },
    home(2600),
  ],
];

export const COMPANION_MOMENTS = COMPANION_ROUTINES.flat();

export function pickNextCompanionRoutine(current: number, random = Math.random()): number {
  const count = COMPANION_ROUTINES.length;
  if (count < 2) return 0;
  const choice = Math.min(count - 2, Math.floor(Math.max(0, random) * (count - 1)));
  return choice >= current ? choice + 1 : choice;
}
