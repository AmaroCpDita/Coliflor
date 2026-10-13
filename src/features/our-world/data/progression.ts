import type { LevelReward } from '../types';
import { ALL_OBJECTS } from './objects';
import { BIOMES } from './biomes';
import { CREATURES } from './creatures';
import { OBJECT_UNLOCKS } from './pacing';

/** Server migration 016 uses this same curve. Version 1 supports pending rollout. */
export function xpToNextLevel(level: number, version = 2): number {
  // Correct binary rounding (100 * 1.15 can be 114.99999999999999).
  const legacy = Math.floor(100 * Math.pow(1.15, Math.max(1, level) - 1) + 1e-8);
  return version >= 2 ? Math.min(220, legacy) : legacy;
}

export function totalXpForLevel(targetLevel: number): number {
  let total = 0;
  for (let level = 1; level < targetLevel; level++) total += xpToNextLevel(level);
  return total;
}

export function levelFromTotalXp(totalXp: number): { level: number; xp: number } {
  let level = 1;
  let xp = Math.max(0, totalXp);
  while (level < 100 && xp >= xpToNextLevel(level)) {
    xp -= xpToNextLevel(level);
    level++;
  }
  return { level, xp };
}

const rewards = new Map<number, LevelReward>();
function add(level: number, unlock: LevelReward['unlocks'][number]) {
  const reward = rewards.get(level) || {
    level,
    description: level === 1 ? '¡Bienvenidos a su mundo!' : 'Su mundo sigue creciendo',
    unlocks: [],
  };
  reward.unlocks.push(unlock);
  if (unlock.type === 'biome' && level > 1) reward.description = '¡Una nueva zona para explorar!';
  else if (unlock.type === 'item' && level > 1) reward.description = unlock.name;
  rewards.set(level, reward);
}
for (const object of ALL_OBJECTS.filter((object) => !object.unlockCondition))
  add(object.requiredLevel, {
    type: 'item',
    id: object.id,
    quantity: OBJECT_UNLOCKS[object.id].quantity,
    name: object.name,
  });
for (const creature of CREATURES)
  add(creature.requiredLevel, { type: 'creature', id: creature.id, name: creature.name });
for (const biome of BIOMES)
  add(biome.requiredLevel, { type: 'biome', id: biome.id, name: biome.name });
export const LEVEL_REWARDS: LevelReward[] = [...rewards.values()].sort((a, b) => a.level - b.level);
export function getRewardsForLevel(level: number) {
  return LEVEL_REWARDS.find((reward) => reward.level === level);
}
export function getUnlockedRewards(level: number) {
  return LEVEL_REWARDS.filter((reward) => reward.level <= level);
}
export function isUnlockedAtLevel(id: string, level: number) {
  return LEVEL_REWARDS.some(
    (reward) => reward.level <= level && reward.unlocks.some((unlock) => unlock.id === id),
  );
}

export const XP_SOURCES = {
  daily_login: 15,
  place_object: 5,
  interact_object: 5,
  complete_goal: 50,
  complete_memory: 30,
  first_interaction_day: 15,
} as const;
