// ============================================================
// Nuestro Mundo — Day/Night Engine
// ============================================================
// Determines time of day based on local time (America/Santiago).
// Provides smooth interpolation between phases.
// ============================================================

import type { TimeOfDay, DayNightState, BiomeDef } from '../types';
import { getNowInTimezone } from '../../../lib/utils';

/** Phase boundaries (hour ranges) */
const PHASES: Array<{ phase: TimeOfDay; start: number; end: number }> = [
  { phase: 'night', start: 0, end: 6.5 },
  { phase: 'morning', start: 6.5, end: 12 },
  { phase: 'day', start: 12, end: 17 },
  { phase: 'evening', start: 17, end: 20 },
  { phase: 'night', start: 20, end: 24 },
];

/** Get current phase and progress */
export function getCurrentDayNight(): { phase: TimeOfDay; progress: number; hour: number } {
  const { hours, minutes } = getNowInTimezone();
  const hourFrac = hours + minutes / 60;

  for (const { phase, start, end } of PHASES) {
    if (hourFrac >= start && hourFrac < end) {
      const progress = (hourFrac - start) / (end - start);
      return { phase, progress, hour: hours };
    }
  }

  return { phase: 'night', progress: 0, hour: hours };
}

/** Get light intensity for a time of day */
export function getLightIntensity(phase: TimeOfDay, progress: number): number {
  switch (phase) {
    case 'morning': return 0.3 + progress * 0.7; // 0.3 → 1.0
    case 'day': return 1.0;
    case 'evening': return 1.0 - progress * 0.7; // 1.0 → 0.3
    case 'night': return 0.15 + Math.sin(progress * Math.PI) * 0.05; // dim
  }
}

/** Interpolate between two color arrays */
function lerpColors(colorsA: string[], colorsB: string[], t: number): string[] {
  const maxLen = Math.max(colorsA.length, colorsB.length);
  const result: string[] = [];
  for (let i = 0; i < maxLen; i++) {
    const a = colorsA[Math.min(i, colorsA.length - 1)];
    const b = colorsB[Math.min(i, colorsB.length - 1)];
    result.push(lerpColor(a, b, t));
  }
  return result;
}

/** Lerp between two hex/named colors */
function lerpColor(a: string, b: string, t: number): string {
  const ca = parseColor(a);
  const cb = parseColor(b);
  const r = Math.round(ca[0] + (cb[0] - ca[0]) * t);
  const g = Math.round(ca[1] + (cb[1] - ca[1]) * t);
  const bl = Math.round(ca[2] + (cb[2] - ca[2]) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

function parseColor(hex: string): [number, number, number] {
  if (hex.startsWith('rgb')) {
    const match = hex.match(/(\d+)/g);
    if (match && match.length >= 3) {
      return [parseInt(match[0]), parseInt(match[1]), parseInt(match[2])];
    }
  }
  // Hex
  const h = hex.replace('#', '');
  if (h.length === 3) {
    return [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)];
  }
  return [parseInt(h.substring(0, 2), 16), parseInt(h.substring(2, 4), 16), parseInt(h.substring(4, 6), 16)];
}

/** Get the next phase for smooth transitions */
function getNextPhase(phase: TimeOfDay): TimeOfDay {
  const order: TimeOfDay[] = ['morning', 'day', 'evening', 'night'];
  const idx = order.indexOf(phase);
  return order[(idx + 1) % order.length];
}

/** Build full day/night state for a biome */
export function getDayNightState(biome: BiomeDef): DayNightState {
  const { phase, progress, hour } = getCurrentDayNight();

  // Smooth sky transition near phase boundaries
  let skyColors: string[];
  const transitionZone = 0.15; // 15% transition overlap

  if (progress > (1 - transitionZone)) {
    // Near end of phase — blend into next
    const nextPhase = getNextPhase(phase);
    const blendT = (progress - (1 - transitionZone)) / transitionZone;
    skyColors = lerpColors(
      biome.skyGradients[phase],
      biome.skyGradients[nextPhase],
      blendT
    );
  } else if (progress < transitionZone && phase !== 'morning') {
    // Near start of phase (except morning) — blend from previous
    // Not needed since end-of-previous handles it
    skyColors = biome.skyGradients[phase];
  } else {
    skyColors = biome.skyGradients[phase];
  }

  return {
    phase,
    progress,
    hour,
    skyColors,
    ambientOverlay: biome.ambientOverlay[phase],
    lightIntensity: getLightIntensity(phase, progress),
  };
}
