export const FOREST_TARGET_LEVEL = 21;
export const FOREST_TARGET_DAYS = 0;
export const FOREST_GOALS = [
  { id: 'first_corner', title: 'Su primer rincón', description: 'Coloquen 3 tipos distintos de objetos en el bosque.', reward: '2 flores silvestres' },
  { id: 'living_forest', title: 'Un bosque vivo', description: 'Tengan 3 árboles y 4 plantas colocados en el bosque.', reward: '1 roble' },
  { id: 'cozy_corner', title: 'Un lugar para quedarse', description: 'Coloquen una banca, una luz y un detalle para aves o flores: casita, fuente o tronco florido.', reward: '2 flores silvestres' },
  { id: 'shared_care', title: 'Lo cuidamos juntos', description: 'Cada uno visita el bosque en 3 días distintos.', reward: '1 roble' },
  { id: 'forest_collection', title: 'Los tesoros del bosque', description: 'Obtengan los 23 tipos de objetos del bosque. Cuentan también los que guardan en el inventario.', reward: '2 flores silvestres' },
] as const;

export interface ForestProgress {
  visits: number;
  member_visits: [number, number];
  level: number;
  target_level: number;
  target_days: number;
  completed: boolean;
  can_complete: boolean;
  goals: Array<{ id: string; current: number; target: number; claimed: boolean }>;
}

export function forestCompletionPercent(progress: ForestProgress) {
  if (progress.completed) return 100;
  const pieces = [...(progress.target_days > 0 ? [Math.min(1, progress.visits / progress.target_days)] : []), Math.min(1, Math.max(0, progress.level - 1) / (progress.target_level - 1)),
    ...progress.goals.map(goal => goal.claimed ? 1 : Math.min(1, goal.current / goal.target))];
  return Math.min(99, Math.floor(pieces.reduce((sum, value) => sum + value, 0) / pieces.length * 100));
}
