// All garden layers use the same portrait frame, including the background.
export const WORLD_FRAME = { width: 1000, height: 1778 };

// Crossfade the painted landscapes at dawn and dusk, keeping the same camera.
export function getNightLandscapeOpacity(phase: string, progress: number) {
  const t = Math.max(0, Math.min(1, progress));
  if (phase === 'night') return 1;
  if (phase === 'morning') return Math.max(0, 1 - t * 3);
  if (phase === 'evening') return t * t * (3 - 2 * t);
  return 0;
}

export function fitWorldFrame(width: number, height: number) {
  const scale = Math.max(width / WORLD_FRAME.width, height / WORLD_FRAME.height);
  return {
    scale,
    maxPanX: Math.max(0, (WORLD_FRAME.width * scale - width) / 2),
    maxPanY: Math.max(0, (WORLD_FRAME.height * scale - height) / 2),
  };
}
