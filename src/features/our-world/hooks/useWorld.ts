// ============================================================
// Nuestro Mundo — Main World Hook
// ============================================================
// Central hook managing all world state, loading, and actions.
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import type { WorldState, InventoryItem, PlacedObject, WorldAchievement, RewardResult, WorldActionResult } from '../types';
import * as worldService from '../services/worldService';
import { getBiomeDef } from '../data/biomes';
import { getDayNightState } from '../engine/DayNightEngine';
import { findInventorySource } from '../data/catalog';
import { getTodayInTimezone } from '../../../lib/utils';
import type { ForestProgress } from '../data/forest';
import type { DayNightState } from '../types';

export function useWorld() {
  const { couple, user } = useAuth();
  const coupleId = couple?.id;

  const [worldState, setWorldState] = useState<WorldState | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [placedObjects, setPlacedObjects] = useState<PlacedObject[]>([]);
  const [achievements, setAchievements] = useState<WorldAchievement[]>([]);
  const [dayNight, setDayNight] = useState<DayNightState>(() => {
    const biome = getBiomeDef('forest')!;
    return getDayNightState(biome);
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingReward, setPendingReward] = useState<RewardResult | null>(null);
  const [welcome, setWelcome] = useState<worldService.WorldWelcome | null>(null);
  const welcomeRequestRef = useRef(0);
  const worldEpochRef = useRef<string | null | undefined>(undefined);
  const welcomePending = !welcome || welcome.status === 'error' || (welcome.status === 'ready' && welcome.pending);
  const refreshWelcome = useCallback(async () => {
    if (!coupleId) return;
    const request = ++welcomeRequestRef.current;
    setWelcome(null);
    const result = await worldService.loadWorldWelcome(coupleId);
    if (request === welcomeRequestRef.current && activeCoupleRef.current === coupleId) setWelcome(result);
  }, [coupleId, user?.id]);
  const acknowledgeWelcome = useCallback(async () => {
    if (!coupleId || welcome?.status !== 'ready' || !welcome.epoch) return false;
    const request = welcomeRequestRef.current;
    const success = await worldService.acknowledgeWorldWelcome(coupleId, welcome.epoch);
    if (request !== welcomeRequestRef.current || activeCoupleRef.current !== coupleId) return false;
    if (success) setWelcome({ ...welcome, pending: false });
    else await refreshWelcome();
    return success;
  }, [coupleId, welcome, refreshWelcome]);
  const [rewardsStatus, setRewardsStatus] = useState<'loading' | 'ready' | 'unavailable' | 'error'>('loading');
  const [rewardsRetry, setRewardsRetry] = useState(0);
  const [forestProgress, setForestProgress] = useState<ForestProgress | null>(null);
  const [forestUnavailable, setForestUnavailable] = useState(false);
  const [forestLoading, setForestLoading] = useState(false);
  const forestRequestRef = useRef(0);
  const recordedForestVisitsRef = useRef(new Set<string>());
  const activeCoupleRef = useRef(coupleId);
  activeCoupleRef.current = coupleId;
  const forestDay = getTodayInTimezone();
  const [boostDay, setBoostDay] = useState<string | null>(null);
  const refreshBoost = useCallback(async () => {
    if (!coupleId) return;
    const today = getTodayInTimezone();
    const { data, error } = await supabase.from('streak_photos').select('user_id')
      .eq('couple_id', coupleId).eq('photo_date', today);
    if (activeCoupleRef.current !== coupleId) return;
    setBoostDay(!error && data?.some(photo => photo.user_id === couple?.user1_id)
      && data.some(photo => photo.user_id === couple?.user2_id) ? today : null);
  }, [coupleId, couple?.user1_id, couple?.user2_id]);
  useEffect(() => { setBoostDay(null); refreshBoost(); }, [refreshBoost, forestDay]);
  useEffect(() => { forestRequestRef.current++; setForestProgress(null); setForestUnavailable(false); }, [coupleId]);

  const refreshForest = useCallback(async () => {
    if (!coupleId || welcomePending) return;
    const request = ++forestRequestRef.current;
    setForestLoading(true);
    const visitKey = `${coupleId}:${user?.id}:${forestDay}:${worldState?.onboarding_epoch}`;
    const recordVisit = worldState?.current_biome === 'forest' && !recordedForestVisitsRef.current.has(visitKey);
    const response = await worldService.loadForestProgress(coupleId, recordVisit);
    if (recordVisit && response.status === 'ready') recordedForestVisitsRef.current.add(visitKey);
    if (request !== forestRequestRef.current || activeCoupleRef.current !== coupleId) return;
    setForestLoading(false);
    setForestUnavailable(response.status === 'unavailable');
    setForestProgress(response.status === 'ready' ? response.progress : null);
  }, [coupleId, user?.id, forestDay, worldState?.current_biome, worldState?.onboarding_epoch, welcomePending]);
  useEffect(() => {
    if (!worldState || worldState.couple_id !== coupleId) return;
    // Inventory, placements and realtime updates often arrive together.
    const timer = window.setTimeout(() => { refreshForest(); }, 250);
    return () => window.clearTimeout(timer);
  }, [coupleId, user?.id, worldState?.current_biome, worldState?.level, placedObjects, inventory, forestDay, refreshForest]);

  const dayNightTimerRef = useRef<number>(0);
  const realtimeChannelsRef = useRef<any[]>([]);

  // --- Initialize World ---
  const initializeWorld = useCallback(async () => {
    if (!coupleId) return;
    setIsLoading(true);
    setError(null);
    setPendingReward(null);
    setWelcome(null);
    const request = ++welcomeRequestRef.current;
    try {
      // New worlds begin empty; initializing never refills an existing inventory.
      if (!await worldService.getWorldState(coupleId)) await worldService.initWorld(coupleId);

      const [state, inv, placed, achv, intro] = await Promise.all([
        worldService.getWorldState(coupleId),
        worldService.getInventory(coupleId),
        worldService.getPlacedObjects(coupleId),
        worldService.getAchievements(coupleId),
        worldService.loadWorldWelcome(coupleId),
      ]);
      if (request !== welcomeRequestRef.current || activeCoupleRef.current !== coupleId) return;
      worldEpochRef.current = state?.onboarding_epoch;
      setWelcome(intro);
      if (state) setWorldState(state);
      setInventory(inv);
      setPlacedObjects(placed);
      setAchievements(achv);
    } catch (err: any) {
      console.error('World init error:', err);
      setError(err.message || 'Error al cargar el mundo');
    } finally {
      if (request === welcomeRequestRef.current) setIsLoading(false);
    }
  }, [coupleId, user?.id]);

  useEffect(() => {
    initializeWorld();
  }, [initializeWorld]);

  // The server grants each eligible level once, including previously reached levels.
  useEffect(() => {
    if (!coupleId || !worldState || isLoading || welcomePending || worldState.couple_id !== coupleId) return;
    let cancelled = false;
    setRewardsStatus('loading');
    worldService.claimCatalogRewards(coupleId).then(async response => {
      if (cancelled) return;
      setRewardsStatus(response.status);
      if (response.status !== 'ready' || !response.reward.claimed_any) return;
      const result = response.reward;
      const inv = await worldService.getInventory(coupleId);
      if (cancelled) return;
      setInventory(inv);
      setPendingReward(previous => previous ? {
        ...previous,
        items_granted: [...(previous.items_granted || []), ...(result.items_granted || [])],
      } : result);
    });
    return () => { cancelled = true; };
  }, [coupleId, worldState?.level, worldState?.forest_completed_at, isLoading, rewardsRetry, welcomePending]);

  // --- Day/Night Timer ---
  useEffect(() => {
    const biomeId = worldState?.current_biome || 'forest';
    const biome = getBiomeDef(biomeId);
    if (!biome) return;

    const updateDayNight = () => {
      setDayNight(getDayNightState(biome));
    };
    updateDayNight();

    // Update every 60 seconds
    dayNightTimerRef.current = window.setInterval(updateDayNight, 60000);

    return () => {
      if (dayNightTimerRef.current) clearInterval(dayNightTimerRef.current);
    };
  }, [worldState?.current_biome]);

  // --- Realtime Subscriptions ---
  useEffect(() => {
    if (!coupleId) return;

    // World state changes
    const stateChannel = supabase
      .channel(`world-state-${coupleId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'world_states',
        filter: `couple_id=eq.${coupleId}`,
      }, (payload) => {
        if (payload.new) {
          const next = payload.new as WorldState;
          if (next.onboarding_epoch !== worldEpochRef.current) {
            worldEpochRef.current = next.onboarding_epoch;
            setPendingReward(null); setInventory([]); setPlacedObjects([]); setAchievements([]);
            forestRequestRef.current++; setForestProgress(null);
            refreshWelcome();
            worldService.getInventory(coupleId).then(setInventory);
            worldService.getPlacedObjects(coupleId).then(setPlacedObjects);
          }
          setWorldState(next);
        }
      })
      .subscribe();

    // Placed objects
    const objChannel = supabase
      .channel(`world-objects-${coupleId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'world_placed_objects',
        filter: `couple_id=eq.${coupleId}`,
      }, () => {
        // Refetch all placed objects on any change
        worldService.getPlacedObjects(coupleId).then(setPlacedObjects);
      })
      .subscribe();

    // Inventory changes
    const invChannel = supabase
      .channel(`world-inventory-${coupleId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'world_inventory',
        filter: `couple_id=eq.${coupleId}`,
      }, () => {
        worldService.getInventory(coupleId).then(setInventory);
      })
      .subscribe();

    const forestChannel = supabase
      .channel(`forest-visits-${coupleId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'world_forest_visits', filter: `couple_id=eq.${coupleId}` }, () => { refreshForest(); })
      .subscribe();

    const boostChannel = supabase.channel(`world-streak-today-${coupleId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'streak_photos', filter: `couple_id=eq.${coupleId}` }, refreshBoost)
      .subscribe();
    const onFocus = () => { refreshBoost(); };
    window.addEventListener('focus', onFocus);
    realtimeChannelsRef.current = [stateChannel, objChannel, invChannel, forestChannel, boostChannel];

    return () => {
      window.removeEventListener('focus', onFocus);
      realtimeChannelsRef.current.forEach(ch => supabase.removeChannel(ch));
      realtimeChannelsRef.current = [];
    };
  }, [coupleId, refreshForest, refreshBoost, refreshWelcome]);

  // --- Actions ---

  const claimDaily = useCallback(async (): Promise<RewardResult | null> => {
    if (!coupleId) return null;
    const result = await worldService.claimDailyReward(coupleId);
    if (result && result.success) {
      setPendingReward(result);
      // Refresh state
      const state = await worldService.getWorldState(coupleId);
      if (state) setWorldState(state);
      const inv = await worldService.getInventory(coupleId);
      setInventory(inv);
    }
    return result;
  }, [coupleId]);

  const placeItem = useCallback(async (
    biomeId: string, _itemType: string, itemId: string,
    x: number, y: number, scale?: number, rotation?: number
  ) => {
    if (!coupleId) return null;
    const source = findInventorySource(inventory, itemId);
    if (!source) return { success: false, error: 'Este objeto ya no está en el inventario.' };
    const result = await worldService.placeObject(coupleId, biomeId, source.item_type, source.item_id, x, y, scale, rotation);
    if (result.success) {
      // Refresh
      const [placed, inv, state] = await Promise.all([
        worldService.getPlacedObjects(coupleId),
        worldService.getInventory(coupleId),
        worldService.getWorldState(coupleId),
      ]);
      setPlacedObjects(placed);
      setInventory(inv);
      if (state) setWorldState(state);
    }
    return result;
  }, [coupleId, inventory]);

  const removeItem = useCallback(async (objectId: string) => {
    if (!coupleId) return null;
    const result = await worldService.removeObject(objectId);
    if (result.success) {
      const [placed, inv] = await Promise.all([
        worldService.getPlacedObjects(coupleId),
        worldService.getInventory(coupleId),
      ]);
      setPlacedObjects(placed);
      setInventory(inv);
    }
    return result;
  }, [coupleId]);

  const moveItem = useCallback(async (objectId: string, x: number, y: number) => {
    if (!coupleId) return null;
    const result = await worldService.moveObject(coupleId, objectId, x, y);
    if (result.success) setPlacedObjects(objects => objects.map(object => object.id === objectId ? { ...object, position_x: x, position_y: y } : object));
    return result;
  }, [coupleId]);

  const resizeItem = useCallback(async (objectId: string, scale: number) => {
    if (!coupleId) return null;
    const result = await worldService.resizeObject(coupleId, objectId, scale);
    if (result.success && result.object) {
      setPlacedObjects(objects => objects.map(object => object.id === objectId ? { ...object, ...result.object } : object));
    }
    return result;
  }, [coupleId]);

  const flipItem = useCallback(async (objectId: string, flipped: boolean) => {
    if (!coupleId) return null;
    const result = await worldService.flipObject(coupleId, objectId, flipped);
    if (result.success && result.object) {
      setPlacedObjects(objects => objects.map(object => object.id === objectId ? { ...object, ...result.object } : object));
    }
    return result;
  }, [coupleId]);

  const grantInteractionXP = useCallback(async (objectId: string, _xp: number) => {
    if (!coupleId) return;
    await worldService.grantInteractionXP(coupleId, objectId);
    const state = await worldService.getWorldState(coupleId);
    if (state) setWorldState(state);
  }, [coupleId]);

  const dismissReward = useCallback(() => {
    setPendingReward(null);
  }, []);

  const runForestAction = useCallback(async (action: () => Promise<Partial<RewardResult> & WorldActionResult>) => {
    const result = await action();
    if (result.success) {
      const [state, inv] = await Promise.all([worldService.getWorldState(coupleId!), worldService.getInventory(coupleId!)]);
      if (state) setWorldState(state);
      setInventory(inv);
      if (!result.already_claimed && result.items_granted?.length) setPendingReward({ ...result, level: result.level ?? state?.level ?? 1, xp: result.xp ?? state?.xp ?? 0 });
      await refreshForest();
    }
    return result;
  }, [coupleId, refreshForest]);
  const claimForestGoal = useCallback((id: string) => coupleId ? runForestAction(() => worldService.claimForestGoal(coupleId, id)) : Promise.resolve({ success: false, error: 'No se encontró su mundo.' }), [coupleId, runForestAction]);
  const completeForest = useCallback(() => coupleId ? runForestAction(() => worldService.completeForest(coupleId)) : Promise.resolve({ success: false, error: 'No se encontró su mundo.' }), [coupleId, runForestAction]);
  const switchBiome = useCallback((id: string) => coupleId ? runForestAction(() => worldService.switchBiome(coupleId, id)) : Promise.resolve({ success: false, error: 'No se encontró su mundo.' }), [coupleId, runForestAction]);

  return {
    welcomePending, welcome, refreshWelcome, acknowledgeWelcome,
    worldState,
    forestProgress, forestUnavailable, forestLoading, refreshForest, claimForestGoal, completeForest, switchBiome,
    inventory,
    placedObjects,
    achievements,
    dayNight,
    xpBoostActive: (worldState?.progression_version || 1) >= 4 && boostDay === forestDay,
    isLoading,
    error,
    pendingReward,
    rewardsError: rewardsStatus === 'error',
    catalogUnavailable: rewardsStatus === 'unavailable',
    retryRewards: () => setRewardsRetry(retry => retry + 1),
    claimDaily,
    placeItem,
    removeItem,
    moveItem,
    resizeItem,
    flipItem,
    grantInteractionXP,
    dismissReward,
    refreshWorld: initializeWorld,
  };
}
