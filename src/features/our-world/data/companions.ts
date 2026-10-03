export interface WorldCompanionDef {
  id: string;
  name: string;
  renderKey: string;
  x: number;
  y: number;
}

// These companions belong to Amaro and Javiera, not to the global reward catalog.
const COMPANION_COUPLE_ID = '7b8edae0-65da-44b7-a9b9-8073ecdd607e';
const COMPANIONS: WorldCompanionDef[] = [
  { id: 'max', name: 'Max', renderKey: 'max', x: 57, y: 21 },
  { id: 'abi', name: 'Abi', renderKey: 'abi', x: 65, y: 18 },
];
const BIOMES = new Set(['forest', 'garden', 'beach', 'magical', 'mountain']);

export function getWorldCompanions(coupleId: string | undefined, biomeId: string): WorldCompanionDef[] {
  return coupleId === COMPANION_COUPLE_ID && BIOMES.has(biomeId) ? COMPANIONS : [];
}
