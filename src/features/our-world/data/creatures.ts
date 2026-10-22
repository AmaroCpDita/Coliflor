// ============================================================
// Nuestro Mundo — Creature Definitions (Data-Driven)
// ============================================================

import type { CreatureDef } from '../types';

export const CREATURES: CreatureDef[] = [
  {
    id: 'butterfly',
    type: 'butterfly',
    name: 'Mariposa',
    emoji: '🦋',
    rarity: 'common',
    requiredLevel: 14,
    renderKey: 'butterfly',
    width: 3,
    height: 3,
    activeTime: ['morning', 'day'],
    speed: 2,
    behaviors: {
      idle: 10,
      walking: 50,
      looking: 5,
      eating: 0,
      sleeping: 0,
      running: 0,
      hiding: 5,
      appearing: 15,
      disappearing: 15,
    },
    biomes: ['forest', 'garden'],
  },
  {
    id: 'bird',
    type: 'bird',
    name: 'Pájaro Cantor',
    emoji: '🐦',
    rarity: 'uncommon',
    requiredLevel: 12,
    renderKey: 'bird',
    width: 3,
    height: 3,
    activeTime: ['morning', 'day', 'evening'],
    speed: 3,
    behaviors: {
      idle: 25,
      walking: 35,
      looking: 15,
      eating: 10,
      sleeping: 0,
      running: 5,
      hiding: 5,
      appearing: 5,
      disappearing: 0,
    },
    biomes: ['forest', 'garden', 'mountain'],
  },
  {
    id: 'fox',
    type: 'fox',
    name: 'Zorro Amistoso',
    emoji: '🦊',
    rarity: 'rare',
    requiredLevel: 17,
    renderKey: 'fox',
    width: 6,
    height: 5,
    activeTime: ['evening', 'night'],
    speed: 2,
    behaviors: {
      idle: 30,
      walking: 30,
      looking: 20,
      eating: 5,
      sleeping: 5,
      running: 5,
      hiding: 5,
      appearing: 0,
      disappearing: 0,
    },
    biomes: ['forest'],
  },
  {
    id: 'deer',
    type: 'deer',
    name: 'Ciervo Luminoso',
    emoji: '🦌',
    rarity: 'epic',
    requiredLevel: 41,
    renderKey: 'deer',
    width: 8,
    height: 8,
    activeTime: ['morning', 'evening'],
    speed: 1,
    behaviors: {
      idle: 35,
      walking: 25,
      looking: 25,
      eating: 10,
      sleeping: 0,
      running: 3,
      hiding: 2,
      appearing: 0,
      disappearing: 0,
    },
    biomes: ['forest', 'magical'],
  },
  {
    id: 'owl',
    type: 'owl',
    name: 'Búho Sabio',
    emoji: '🦉',
    rarity: 'epic',
    requiredLevel: 19,
    renderKey: 'owl',
    width: 4,
    height: 5,
    activeTime: ['night'],
    speed: 0.5,
    behaviors: {
      idle: 50,
      walking: 5,
      looking: 30,
      eating: 0,
      sleeping: 10,
      running: 0,
      hiding: 5,
      appearing: 0,
      disappearing: 0,
    },
    biomes: ['forest'],
  },
  {
    id: 'squirrel',
    type: 'squirrel',
    name: 'Ardilla Traviesa',
    emoji: '🐿️',
    rarity: 'common',
    requiredLevel: 9,
    renderKey: 'squirrel',
    width: 3,
    height: 3,
    activeTime: ['morning', 'day'],
    speed: 3,
    behaviors: {
      idle: 15,
      walking: 25,
      looking: 10,
      eating: 15,
      sleeping: 0,
      running: 25,
      hiding: 10,
      appearing: 0,
      disappearing: 0,
    },
    biomes: ['forest', 'garden'],
  },
];

/** Look up creature by ID */
export function getCreatureDef(id: string): CreatureDef | undefined {
  return CREATURES.find((c) => c.id === id);
}

/** Get all creatures available at a given level for a biome and time of day */
export function getActiveCreatures(
  biomeId: string,
  level: number,
  timeOfDay: string,
): CreatureDef[] {
  return CREATURES.filter(
    (c) =>
      c.requiredLevel <= level &&
      c.biomes.includes(biomeId) &&
      c.activeTime.includes(timeOfDay as any),
  );
}
