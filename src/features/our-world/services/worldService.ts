// ============================================================
// Nuestro Mundo — Supabase World Service
// ============================================================

import { supabase } from '../../../lib/supabase';
import type {
  WorldState,
  InventoryItem,
  PlacedObject,
  WorldAchievement,
  RewardResult,
  WorldActionResult,
} from '../types';
import { clampObjectScale, clampWorldPosition } from '../engine/placement';
import { isObjectFlipped } from '../engine/orientation';
import type { ForestProgress } from '../data/forest';

export type WorldWelcome =
  { status: 'ready'; epoch: string | null; pending: boolean } | { status: 'unavailable' | 'error' };
export async function loadWorldWelcome(coupleId: string): Promise<WorldWelcome> {
  try {
    const { data, error } = await supabase.rpc('get_world_welcome', { p_couple_id: coupleId });
    if (error?.code === 'PGRST202' || error?.code === '42883') return { status: 'unavailable' };
    if (error || typeof data?.pending !== 'boolean') return { status: 'error' };
    return { status: 'ready', epoch: data.epoch, pending: data.pending };
  } catch {
    return { status: 'error' };
  }
}
export async function acknowledgeWorldWelcome(coupleId: string, epoch: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('acknowledge_world_welcome', {
      p_couple_id: coupleId,
      p_epoch: epoch,
    });
    return !error && data?.success === true;
  } catch {
    return false;
  }
}

export async function loadForestProgress(
  coupleId: string,
  recordVisit = true,
): Promise<{ status: 'ready'; progress: ForestProgress } | { status: 'unavailable' | 'error' }> {
  try {
    const { data, error } = await supabase.rpc(
      recordVisit ? 'record_forest_visit' : 'get_forest_progress',
      { p_couple_id: coupleId },
    );
    if (error?.code === 'PGRST202' || error?.code === '42883') return { status: 'unavailable' };
    if (error || !data?.goals) return { status: 'error' };
    return { status: 'ready', progress: data as ForestProgress };
  } catch {
    return { status: 'error' };
  }
}

async function forestAction(
  name: string,
  args: Record<string, string>,
): Promise<Partial<RewardResult> & WorldActionResult> {
  try {
    const { data, error } = await supabase.rpc(name, args);
    if (error?.code === 'PGRST202' || error?.code === '42883')
      return {
        success: false,
        error: 'Esta función está pendiente de activación. Tus objetos siguen guardados.',
      };
    if (error) return { success: false, error: error.message };
    return data
      ? { ...data, success: data.success === true }
      : { success: false, error: 'No se pudo guardar el cambio.' };
  } catch {
    return { success: false, error: 'No se pudo conectar. Inténtalo de nuevo.' };
  }
}
export const claimForestGoal = (coupleId: string, goalId: string) =>
  forestAction('claim_forest_goal', { p_couple_id: coupleId, p_goal_id: goalId });
export const completeForest = (coupleId: string) =>
  forestAction('complete_forest', { p_couple_id: coupleId });
export const switchBiome = (coupleId: string, biomeId: string) =>
  forestAction('switch_world_biome', { p_couple_id: coupleId, p_biome_id: biomeId });

// --- World State ---

export async function syncCalendarXP(coupleId: string): Promise<void> {
  const { error } = await supabase.rpc('sync_world_date_xp', { p_couple_id: coupleId });
  if (error && error.code !== 'PGRST202' && error.code !== '42883') throw new Error(error.message);
}

export async function initWorld(coupleId: string): Promise<RewardResult | null> {
  const { data, error } = await supabase.rpc('init_world', { p_couple_id: coupleId });
  if (error) {
    console.error('initWorld error:', error);
    return null;
  }
  return data as RewardResult;
}

export async function getWorldState(coupleId: string): Promise<WorldState | null> {
  const { data, error } = await supabase
    .from('world_states')
    .select('*')
    .eq('couple_id', coupleId)
    .maybeSingle();
  if (error) {
    console.error('getWorldState error:', error);
    return null;
  }
  return data as WorldState | null;
}

// --- Inventory ---

export async function getInventory(coupleId: string): Promise<InventoryItem[]> {
  const { data, error } = await supabase
    .from('world_inventory')
    .select('*')
    .eq('couple_id', coupleId)
    .order('acquired_at', { ascending: false });
  if (error) {
    console.error('getInventory error:', error);
    return [];
  }
  return (data as InventoryItem[]) || [];
}

// --- Placed Objects ---

export async function getPlacedObjects(
  coupleId: string,
  biomeId?: string,
): Promise<PlacedObject[]> {
  let query = supabase.from('world_placed_objects').select('*').eq('couple_id', coupleId);
  if (biomeId) query = query.eq('biome_id', biomeId);
  const { data, error } = await query.order('placed_at', { ascending: true });
  if (error) {
    console.error('getPlacedObjects error:', error);
    return [];
  }
  return (data as PlacedObject[]) || [];
}

export async function placeObject(
  coupleId: string,
  biomeId: string,
  itemType: string,
  itemId: string,
  x: number,
  y: number,
  scale: number = 1,
  rotation: number = 0,
): Promise<{ success: boolean; object_id?: string; error?: string }> {
  const { data, error } = await supabase.rpc('place_world_object', {
    p_couple_id: coupleId,
    p_biome_id: biomeId,
    p_item_type: itemType,
    p_item_id: itemId,
    p_x: x,
    p_y: y,
    p_scale: scale,
    p_rotation: rotation,
  });
  if (error) return { success: false, error: error.message };
  return data as { success: boolean; object_id?: string };
}

export async function removeObject(
  objectId: string,
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('remove_world_object', { p_object_id: objectId });
  if (error) return { success: false, error: error.message };
  return data as { success: boolean };
}

export async function moveObject(
  coupleId: string,
  objectId: string,
  x: number,
  y: number,
): Promise<{ success: boolean; error?: string }> {
  // Existing couple-scoped RLS protects updates. Keep the same object and inventory.
  const { data, error } = await supabase
    .from('world_placed_objects')
    .update({ position_x: x, position_y: y })
    .eq('id', objectId)
    .eq('couple_id', coupleId)
    .select('id')
    .maybeSingle();
  if (error) return { success: false, error: error.message };
  if (!data)
    return { success: false, error: 'No se pudo mover el objeto. Puede haber sido retirado.' };
  return { success: true };
}

// --- Orientation ---

export async function resizeObject(
  coupleId: string,
  objectId: string,
  requestedScale: number,
): Promise<{
  success: boolean;
  error?: string;
  object?: Pick<PlacedObject, 'scale' | 'position_x' | 'position_y'>;
}> {
  if (!Number.isFinite(requestedScale)) return { success: false, error: 'El tamaño no es válido.' };
  const { data: current, error: readError } = await supabase
    .from('world_placed_objects')
    .select('state, item_id, position_x, position_y')
    .eq('id', objectId)
    .eq('couple_id', coupleId)
    .maybeSingle();
  if (readError) return { success: false, error: readError.message };
  if (!current)
    return { success: false, error: 'No se encontró el objeto para cambiar su tamaño.' };
  const scale = clampObjectScale(requestedScale);
  const position = clampWorldPosition(
    current.item_id,
    current.position_x,
    current.position_y,
    scale,
    isObjectFlipped(current),
  );
  const { data, error } = await supabase
    .from('world_placed_objects')
    .update({ scale, position_x: position.x, position_y: position.y })
    .eq('id', objectId)
    .eq('couple_id', coupleId)
    .select('scale, position_x, position_y')
    .maybeSingle();
  if (error) return { success: false, error: error.message };
  if (!data) return { success: false, error: 'No se pudo guardar el tamaño del objeto.' };
  return { success: true, object: data };
}

export async function flipObject(
  coupleId: string,
  objectId: string,
  flipped: boolean,
): Promise<{
  success: boolean;
  error?: string;
  object?: Pick<PlacedObject, 'state' | 'position_x' | 'position_y'>;
}> {
  // Read current metadata so changing direction preserves the object's other state.
  const { data: current, error: readError } = await supabase
    .from('world_placed_objects')
    .select('state, item_id, scale, position_x, position_y')
    .eq('id', objectId)
    .eq('couple_id', coupleId)
    .maybeSingle();
  if (readError) return { success: false, error: readError.message };
  if (!current) return { success: false, error: 'No se encontró el objeto para voltearlo.' };
  const position = clampWorldPosition(
    current.item_id,
    current.position_x,
    current.position_y,
    current.scale || 1,
    flipped,
  );
  const update: Record<string, unknown> = { state: { ...(current.state || {}), flipped } };
  // Asymmetric objects can need a small adjustment when flipped at a world edge.
  if (position.x !== current.position_x) update.position_x = position.x;
  if (position.y !== current.position_y) update.position_y = position.y;
  const { data, error } = await supabase
    .from('world_placed_objects')
    .update(update)
    .eq('id', objectId)
    .eq('couple_id', coupleId)
    .select('state, position_x, position_y')
    .maybeSingle();
  if (error) return { success: false, error: error.message };
  if (!data) return { success: false, error: 'No se pudo guardar la orientación del objeto.' };
  return { success: true, object: data };
}

// --- Rewards ---

export type CatalogRewardsResult =
  { status: 'ready'; reward: RewardResult } | { status: 'unavailable' } | { status: 'error' };

export type LevelRewardsStatus =
  { status: 'ready'; levels: number[] } | { status: 'unavailable' | 'error' };
export async function getLevelRewards(coupleId: string): Promise<LevelRewardsStatus> {
  const { data, error } = await supabase.rpc('get_world_level_rewards', { p_couple_id: coupleId });
  if (error?.code === 'PGRST202' || error?.code === '42883') return { status: 'unavailable' };
  if (error || !data?.success || !Array.isArray(data.levels)) return { status: 'error' };
  return { status: 'ready', levels: data.levels };
}
export async function claimLevelRewards(coupleId: string): Promise<CatalogRewardsResult> {
  const { data, error } = await supabase.rpc('claim_world_level_rewards', {
    p_couple_id: coupleId,
  });
  if (error?.code === 'PGRST202' || error?.code === '42883') return { status: 'unavailable' };
  if (error || !data?.success) return { status: 'error' };
  return { status: 'ready', reward: data as RewardResult };
}

export async function claimCatalogRewards(coupleId: string): Promise<CatalogRewardsResult> {
  try {
    const { data, error } = await supabase.rpc('claim_world_catalog', { p_couple_id: coupleId });
    if (error?.code === 'PGRST202' || error?.code === '42883') {
      console.info('World catalog rewards require migration 015.');
      return { status: 'unavailable' };
    }
    if (error || !data?.success) {
      console.error('claimCatalogRewards error:', error || data);
      return { status: 'error' };
    }
    return { status: 'ready', reward: data as RewardResult };
  } catch (error) {
    console.error('claimCatalogRewards error:', error);
    return { status: 'error' };
  }
}

export async function claimDailyReward(coupleId: string): Promise<RewardResult | null> {
  const { data, error } = await supabase.rpc('claim_world_daily', { p_couple_id: coupleId });
  if (error) {
    console.error('claimDailyReward error:', error);
    return null;
  }
  return data as RewardResult;
}

export async function claimStreakMilestones(coupleId: string): Promise<RewardResult | null> {
  const { data, error } = await supabase.rpc('claim_streak_milestones', { p_couple_id: coupleId });
  if (error) {
    console.error('claimStreakMilestones error:', error);
    return null;
  }
  return data as RewardResult;
}

export async function grantInteractionXP(
  coupleId: string,
  objectId: string,
): Promise<RewardResult | null> {
  const { data, error } = await supabase.rpc('interact_world_object', {
    p_couple_id: coupleId,
    p_object_id: objectId,
  });
  if (error) {
    console.error('grantInteractionXP error:', error);
    return null;
  }
  return data as RewardResult;
}

// --- Achievements ---

export async function getAchievements(coupleId: string): Promise<WorldAchievement[]> {
  const { data, error } = await supabase
    .from('world_achievements')
    .select('*')
    .eq('couple_id', coupleId);
  if (error) {
    console.error('getAchievements error:', error);
    return [];
  }
  return (data as WorldAchievement[]) || [];
}

export async function unlockAchievement(coupleId: string, achievementId: string): Promise<boolean> {
  const { error } = await supabase.from('world_achievements').insert({
    couple_id: coupleId,
    achievement_id: achievementId,
    unlocked_by: (await supabase.auth.getUser()).data.user?.id!,
  });
  if (error) {
    if (error.code === '23505') return false; // duplicate, already unlocked
    console.error('unlockAchievement error:', error);
    return false;
  }
  return true;
}

// --- Activity Log ---

export async function getActivityCount(coupleId: string, activityType: string): Promise<number> {
  const { count, error } = await supabase
    .from('world_activity_log')
    .select('*', { count: 'exact', head: true })
    .eq('couple_id', coupleId)
    .eq('activity_type', activityType);
  if (error) return 0;
  return count || 0;
}
