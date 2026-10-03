// ============================================================
// Nuestro Mundo — Achievement Definitions (Data-Driven)
// ============================================================

import type { AchievementDef } from '../types';

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_plant', name: 'Primer rincón', description: 'Coloca tu primer objeto en el mundo.', emoji: '🌳',
    category: 'world', condition: { type: 'objects_placed', target: 1 }, rewards: { xp: 25 },
  },
  {
    id: 'gardener', name: 'Jardinero/a', description: 'Coloca 10 objetos en el mundo.', emoji: '🧑‍🌾',
    category: 'world', condition: { type: 'objects_placed', target: 10 }, rewards: { xp: 50, items: [{ item_type: 'flower', item_id: 'rare_orchid', quantity: 1 }] },
  },
  {
    id: 'architect', name: 'Arquitecto/a', description: 'Coloca 25 objetos en el mundo.', emoji: '🏗️',
    category: 'world', condition: { type: 'objects_placed', target: 25 }, rewards: { xp: 100 },
  },
  {
    id: 'world_builder', name: 'Constructor/a del Mundo', description: 'Coloca 50 objetos.', emoji: '🌍',
    category: 'world', condition: { type: 'objects_placed', target: 50 }, rewards: { xp: 200 },
  },
  {
    id: 'level_5', name: 'Nivel 5', description: 'Alcanza el nivel 5.', emoji: '⭐',
    category: 'world', condition: { type: 'level_reached', target: 5 }, rewards: { xp: 50 },
  },
  {
    id: 'level_10', name: 'Nivel 10', description: 'Alcanza el nivel 10.', emoji: '🌟',
    category: 'world', condition: { type: 'level_reached', target: 10 }, rewards: { xp: 100 },
  },
  {
    id: 'level_25', name: 'Nivel 25', description: 'Alcanza el nivel 25.', emoji: '💫',
    category: 'world', condition: { type: 'level_reached', target: 25 }, rewards: { xp: 200 },
  },
  {
    id: 'explorer', name: 'Explorador/a', description: 'Desbloquea 3 biomas.', emoji: '🗺️',
    category: 'exploration', condition: { type: 'biomes_unlocked', target: 3 }, rewards: { xp: 150 },
  },
  {
    id: 'streak_3', name: 'Racha de 3', description: 'Mantén una racha de 3 días.', emoji: '🔥',
    category: 'streak', condition: { type: 'streak_days', target: 3 }, rewards: { xp: 30, items: [{ item_type: 'flower', item_id: 'tulip', quantity: 2 }] },
  },
  {
    id: 'streak_7', name: 'Racha de 7', description: 'Mantén una racha de 7 días.', emoji: '🔥',
    category: 'streak', condition: { type: 'streak_days', target: 7 }, rewards: { xp: 75, items: [{ item_type: 'decoration', item_id: 'lantern', quantity: 2 }] },
  },
  {
    id: 'streak_30', name: 'Racha de 30', description: 'Mantén una racha de 30 días.', emoji: '💎',
    category: 'streak', condition: { type: 'streak_days', target: 30 }, rewards: { xp: 200, items: [{ item_type: 'plant', item_id: 'firefly_bush', quantity: 1 }] },
  },
  {
    id: 'daily_5', name: 'Visitante', description: 'Reclama 5 recompensas diarias.', emoji: '📅',
    category: 'world', condition: { type: 'daily_logins', target: 5 }, rewards: { xp: 40 },
  },
  {
    id: 'daily_30', name: 'Devoto/a', description: 'Reclama 30 recompensas diarias.', emoji: '💝',
    category: 'world', condition: { type: 'daily_logins', target: 30 }, rewards: { xp: 150 },
  },
];

export function getAchievementDef(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find(a => a.id === id);
}
