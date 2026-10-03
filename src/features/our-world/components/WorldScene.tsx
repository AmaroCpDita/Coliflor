// ============================================================
// Nuestro Mundo — World Scene (Main Orchestrator)
// ============================================================
// Composites sky, ground, objects, creatures, particles, HUD.
// ============================================================

import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { getBiomeDef } from '../data/biomes';
import { getActiveCreatures } from '../data/creatures';
import { getPlacementDef } from '../data/objects';
import { getInventoryObjects } from '../data/catalog';
import WorldCanvas from './WorldCanvas';
import WorldObject from './WorldObject';
import Creature from './Creature';
import WorldCompanions from './WorldCompanions';
import { getWorldCompanions } from '../data/companions';
import type { WorldCompanionDef } from '../data/companions';
import WorldHUD from './WorldHUD';
import WorldWelcome from './WorldWelcome';
import Inventory from './Inventory';
import WorldMap from './WorldMap';
import RewardModal from './RewardModal';
import WorldBuildControls from './WorldBuildControls';
import WorldLighting from './WorldLighting';
import { clampObjectScale, clampWorldPosition } from '../engine/placement';
import type { WorldPosition } from '../engine/placement';
import { isObjectFlipped } from '../engine/orientation';
import type { PlacedObject, InventoryItem, ParticleType, DayNightState, WorldState, WorldAchievement, RewardResult, WorldActionResult } from '../types';
import { getTodayInTimezone } from '../../../lib/utils';
import { WORLD_FRAME, fitWorldFrame, getNightLandscapeOpacity } from '../data/dioramas';
import ForestJournal from './ForestJournal';
import type { ForestProgress } from '../data/forest';
import { useObjectPinch } from '../hooks/useObjectPinch';

interface WorldSceneProps {
  isWelcomePreview?: boolean;
  worldState: WorldState | null;
  inventory: InventoryItem[];
  placedObjects: PlacedObject[];
  achievements: WorldAchievement[];
  dayNight: DayNightState;
  pendingReward: RewardResult | null;
  onClaimDaily: () => void;
  xpBoostActive?: boolean;
  onPlaceItem: (biomeId: string, itemType: string, itemId: string, x: number, y: number) => Promise<WorldActionResult | null>;
  onRemoveItem: (objId: string) => Promise<WorldActionResult | null>;
  onMoveItem: (objId: string, x: number, y: number) => Promise<WorldActionResult | null>;
  onFlipItem: (objId: string, flipped: boolean) => Promise<WorldActionResult | null>;
  onResizeItem?: (objId: string, scale: number) => Promise<WorldActionResult | null>;
  onInteractXP: (objectId: string, xp: number) => void;
  onDismissReward: () => void;
  rewardsError?: boolean;
  catalogUnavailable?: boolean;
  onRetryRewards?: () => void;
  forestProgress?: ForestProgress | null;
  forestUnavailable?: boolean;
  forestLoading?: boolean;
  onRetryForest?: () => void;
  onClaimForestGoal?: (id: string) => Promise<WorldActionResult>;
  onCompleteForest?: () => Promise<WorldActionResult>;
  onSwitchBiome?: (id: string) => Promise<WorldActionResult>;
}

export default function WorldScene({
  isWelcomePreview = false,
  worldState, inventory, placedObjects, achievements, dayNight,
  pendingReward, onClaimDaily, xpBoostActive, onPlaceItem, onRemoveItem, onMoveItem, onFlipItem, onResizeItem, onInteractXP, onDismissReward, rewardsError, catalogUnavailable, onRetryRewards,
  forestProgress = null, forestUnavailable, forestLoading, onRetryForest, onClaimForestGoal, onCompleteForest, onSwitchBiome,
}: WorldSceneProps) {
  const [showInventory, setShowInventory] = useState(false);
  const [showWorldHelp, setShowWorldHelp] = useState(false);
  const [inventorySelectionError, setInventorySelectionError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [showForest, setShowForest] = useState(false);
  const [buildMode, setBuildMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [selectedPlacedObject, setSelectedPlacedObject] = useState<PlacedObject | null>(null);
  const [interactMessage, setInteractMessage] = useState<string | null>(null);
  const [cameraScale, setCameraScale] = useState(1);
  const [cameraOffset, setCameraOffset] = useState({ x: 0, y: 0 });
  const [panBounds, setPanBounds] = useState({ x: 0, y: 0 });
  const [sceneSize, setSceneSize] = useState({ width: 0, height: 0 });
  const [movePreview, setMovePreview] = useState<PlacedObject | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false);
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedItem(selected => selected ? getInventoryObjects(inventory).find(item => item.item_id === selected.item_id) || null : null);
  }, [inventory]);

  const isDraggingCamera = useRef(false);
  const hasDragged = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const lastPanPosition = useRef({ x: 0, y: 0 });

  const WORLD_WIDTH = WORLD_FRAME.width;
  const WORLD_HEIGHT = WORLD_FRAME.height;

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const resize = () => {
      const { scale, maxPanX, maxPanY } = fitWorldFrame(scene.clientWidth, scene.clientHeight);
      setCameraScale(scale);
      setSceneSize({ width: scene.clientWidth, height: scene.clientHeight });
      setPanBounds({ x: maxPanX, y: maxPanY });
      setCameraOffset({ x: 0, y: 0 });
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(scene);
    return () => observer.disconnect();
  }, []);

  const burstRef = useRef<((x: number, y: number, type: ParticleType, count: number, colors: string[]) => void) | null>(null);

  const biomeId = isWelcomePreview ? 'forest' : worldState?.current_biome || 'forest';
  const biome = useMemo(() => getBiomeDef(biomeId), [biomeId]);
  const level = worldState?.level || 1;
  const companions = isWelcomePreview ? [] : getWorldCompanions(worldState?.couple_id, biomeId);

  // Determine if daily reward is claimable
  const today = getTodayInTimezone();
  const canClaimDaily = !worldState?.last_daily_date || worldState.last_daily_date !== today;

  // Get active creatures for current biome and time
  const creatures = useMemo(() => {
    if (!biome || isWelcomePreview) return [];
    return getActiveCreatures(biomeId, level, dayNight.phase);
  }, [biomeId, level, dayNight.phase, biome, isWelcomePreview]);

  // Filter placed objects for current biome
  const currentPlacedObjects = useMemo(() => {
    return placedObjects.filter(o => o.biome_id === biomeId).map(object => {
      const position = clampWorldPosition(object.item_id, object.position_x, object.position_y, object.scale || 1, isObjectFlipped(object));
      return position.x === object.position_x && position.y === object.position_y ? object : { ...object, position_x: position.x, position_y: position.y };
    });
  }, [placedObjects, biomeId]);

  // Only persisted placements are visible. Rewards stay in inventory until placed.
  const displayedObjects = isWelcomePreview ? [] : currentPlacedObjects.map(obj => movePreview?.id === obj.id ? movePreview : obj);
  const activeObject = displayedObjects.find(obj => obj.id === selectedPlacedObject?.id) || null;
  const handleSelectPlacedObject = useCallback((object: PlacedObject) => {
    if (savingRef.current) return;
    setSelectedItem(null);
    setMovePreview(null);
    setSelectedPlacedObject(object);
  }, []);
  const cameraView = { ...sceneSize, scale: cameraScale, offsetX: cameraOffset.x, offsetY: cameraOffset.y };

  const messageTimerRef = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(messageTimerRef.current), []);
  const showMessage = useCallback((message: string) => {
    window.clearTimeout(messageTimerRef.current);
    setInteractMessage(message);
    messageTimerRef.current = window.setTimeout(() => setInteractMessage(null), 2800);
  }, []);

  const previewMove = useCallback((position: WorldPosition | null) => {
    if (savingRef.current) return;
    const object = currentPlacedObjects.find(obj => obj.id === selectedPlacedObject?.id);
    setMovePreview(position && object ? { ...object, position_x: position.x, position_y: position.y } : null);
  }, [currentPlacedObjects, selectedPlacedObject?.id]);

  const commitMove = async (position: WorldPosition) => {
    if (!activeObject || savingRef.current) return;
    savingRef.current = true;
    setIsSaving(true);
    try {
      const result = await onMoveItem(activeObject.id, position.x, position.y);
      if (!result?.success) showMessage(result?.error || 'No se pudo guardar la posición. Inténtalo de nuevo.');
    } catch {
      showMessage('No se pudo guardar la posición. Inténtalo de nuevo.');
    } finally {
      setMovePreview(null);
      setIsSaving(false);
      savingRef.current = false;
    }
  };

  const resizeSelected = async (requestedScale: number, original = activeObject) => {
    if (!original || !onResizeItem || savingRef.current) return;
    const scale = clampObjectScale(requestedScale);
    if (scale === original.scale) { setMovePreview(null); return; }
    const position = clampWorldPosition(original.item_id, original.position_x, original.position_y, scale, isObjectFlipped(original));
    savingRef.current = true;
    setIsSaving(true);
    setMovePreview({ ...original, scale, position_x: position.x, position_y: position.y });
    try {
      const result = await onResizeItem(original.id, scale);
      if (!result?.success) showMessage(result?.error || 'No se pudo guardar el tamaño. Inténtalo de nuevo.');
    } catch {
      showMessage('No se pudo guardar el tamaño. Inténtalo de nuevo.');
    } finally {
      setMovePreview(null);
      setIsSaving(false);
      savingRef.current = false;
    }
  };

  const pinchHandlers = useObjectPinch(currentPlacedObjects.find(obj => obj.id === selectedPlacedObject?.id) || null,
    buildMode && !isSaving && !!onResizeItem, setMovePreview, resizeSelected, cameraScale, commitMove);

  const flipSelected = async () => {
    if (!activeObject || savingRef.current) return;
    const flipped = !isObjectFlipped(activeObject);
    const position = clampWorldPosition(activeObject.item_id, activeObject.position_x, activeObject.position_y, activeObject.scale, flipped);
    savingRef.current = true;
    setIsSaving(true);
    setMovePreview({ ...activeObject, position_x: position.x, position_y: position.y, state: { ...activeObject.state, flipped } });
    try {
      const result = await onFlipItem(activeObject.id, flipped);
      if (!result?.success) showMessage(result?.error || 'No se pudo guardar la orientación. Inténtalo de nuevo.');
    } catch {
      showMessage('No se pudo guardar la orientación. Inténtalo de nuevo.');
    } finally {
      setMovePreview(null);
      setIsSaving(false);
      savingRef.current = false;
    }
  };

  const removeSelected = async () => {
    if (!activeObject || savingRef.current) return;
    savingRef.current = true;
    setIsSaving(true);
    try {
      const result = await onRemoveItem(activeObject.id);
      if (result?.success) {
        setSelectedPlacedObject(null);
        setMovePreview(null);
        showMessage('Objeto devuelto al inventario');
      } else showMessage(result?.error || 'No se pudo retirar el objeto. Inténtalo de nuevo.');
    } catch {
      showMessage('No se pudo retirar el objeto. Inténtalo de nuevo.');
    } finally {
      setIsSaving(false);
      savingRef.current = false;
    }
  };

  // Sky gradient
  const skyGradient = useMemo(() => {
    if (!dayNight.skyColors || dayNight.skyColors.length === 0) return 'linear-gradient(180deg, #87CEEB, #E0F0FF)';
    const stops = dayNight.skyColors.map((c, i) => `${c} ${(i / (dayNight.skyColors.length - 1)) * 100}%`).join(', ');
    return `linear-gradient(180deg, ${stops})`;
  }, [dayNight.skyColors]);

  // Particle configs for current biome/time
  const particleConfigs = useMemo(() => {
    if (!biome) return [];
    // Flowers belong to player placements; omit decorative petals drifting in the sky.
    return (biome.particles[dayNight.phase] || []).filter(config => config.type !== 'petal').map(config =>
      config.type === 'firefly' ? { ...config, count: dayNight.phase === 'night' ? 12 : 7,
        area: [15, 85, 50, 88] as [number, number, number, number], size: [1.5, 3] as [number, number],
        glow: 5, opacity: [.25, .7] as [number, number] }
        : config.type === 'star' ? { ...config, count: 10, glow: 1 } : config);
  }, [biome, dayNight.phase]);

  // Performance factor (reduce on mobile)
  const perfFactor = useMemo(() => {
    if (typeof window === 'undefined') return 1;
    const isMobile = window.innerWidth < 768;
    return isMobile ? 0.6 : 1;
  }, []);

  // Handle scene click (place object in build mode)
  const handleSceneClick = async (e: React.MouseEvent) => {
    if (!buildMode || !sceneRef.current || savingRef.current || hasDragged.current) return;
    if ((e.target as HTMLElement).closest('button, .world-hud, .world-build-controls, .world-inventory-backdrop, .world-map-backdrop, .world-reward-backdrop, .world-scene__build-indicator')) return;

    // If clicking empty space while having an object selected on the map, deselect it
    if (selectedPlacedObject) {
      setSelectedPlacedObject(null);
      setMovePreview(null);
      return;
    }

    if (!selectedItem) return;

    // Use the camera container for coordinate mapping
    const cameraEl = sceneRef.current.querySelector('.world-camera') as HTMLElement;
    if (!cameraEl) return;

    const rect = cameraEl.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((rect.bottom - e.clientY) / rect.height) * 100;

    // Clamp
    const position = clampWorldPosition(selectedItem.item_id, x, y);
    savingRef.current = true;
    setIsSaving(true);
    try {
      const result = await onPlaceItem(biomeId, selectedItem.item_type, selectedItem.item_id, position.x, position.y);
      if (!result?.success) showMessage(result?.error || 'No se pudo colocar el objeto. Inténtalo de nuevo.');
    } catch {
      showMessage('No se pudo colocar el objeto. Inténtalo de nuevo.');
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  // Camera panning
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    hasDragged.current = false;
    if (buildMode) return;
    if ((e.target as HTMLElement).closest('button, .world-hud, .world-scene__build-menu, .world-inventory-backdrop, .world-map-backdrop, .world-reward-backdrop')) return;

    isDraggingCamera.current = true;
    hasDragged.current = false;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    lastPanPosition.current = { x: e.clientX, y: e.clientY };
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch (err) {}
  }, [buildMode]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingCamera.current) return;

    const dist = Math.abs(e.clientX - dragStartPos.current.x) + Math.abs(e.clientY - dragStartPos.current.y);
    if (dist > 10) {
      hasDragged.current = true;
    }

    const dx = e.clientX - lastPanPosition.current.x;
    const dy = e.clientY - lastPanPosition.current.y;
    lastPanPosition.current = { x: e.clientX, y: e.clientY };

    setCameraOffset(prev => {
      // Clamp panning strictly to the Diorama bounds
      return {
        x: Math.max(-panBounds.x, Math.min(panBounds.x, prev.x + dx)),
        y: Math.max(-panBounds.y, Math.min(panBounds.y, prev.y + dy)),
      };
    });
  }, [panBounds]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    isDraggingCamera.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (err) {}
  }, []);

  // Handle object interaction
  const handleObjectInteract = useCallback((obj: PlacedObject, screenX: number, screenY: number) => {
    if (hasDragged.current) return; // If the user was swiping/panning, do NOT interact

    const def = getPlacementDef(obj.item_id);
    if (!def?.interaction) return;

    // Particle burst
    if (def.interaction.particleType && burstRef.current && sceneRef.current) {
      const rect = sceneRef.current.getBoundingClientRect();
      const canvasX = screenX - rect.left;
      const canvasY = screenY - rect.top;
      const colors = def.interaction.particleType === 'petal' ? ['#FFB6C1', '#FF69B4', '#FFC0CB', '#FFFFFF'] :
                     def.interaction.particleType === 'leaf' ? ['#228B22', '#32CD32', '#90EE90'] :
                     def.interaction.particleType === 'magic' ? ['#DA70D6', '#FFD700', '#7FFF00'] :
                     def.interaction.particleType === 'spark' ? ['#FFD700', '#FFA500', '#FFFFFF'] :
                     def.interaction.particleType === 'bubble' ? ['#87CEEB', '#B0E0E6', '#FFFFFF'] :
                     ['#FFD700', '#FFFFFF'];
      burstRef.current(canvasX, canvasY, def.interaction.particleType, def.interaction.particleCount || 5, colors);
    }

    // Message
    if (def.interaction.message) {
      showMessage(def.interaction.message);
    }

    // XP
    if (def.interaction.dailyXP) {
      onInteractXP(obj.id, def.interaction.dailyXP);
    }
  }, [onInteractXP, showMessage]);

  // Handle creature interaction
  const handleCreatureInteract = useCallback((creature: any, x: number, y: number) => {
    if (burstRef.current && sceneRef.current) {
      const rect = sceneRef.current.getBoundingClientRect();
      burstRef.current(x - rect.left, y - rect.top, 'spark', 8, ['#FFD700', '#FFA500', '#FFFFFF']);
    }
    showMessage(`${creature.emoji} ¡${creature.name}!`);
  }, [showMessage]);

  // Personal companion greeting, independent of progression rewards.
  const handleCompanionInteract = useCallback((pet: WorldCompanionDef, x: number, y: number) => {
    if (burstRef.current && sceneRef.current) {
      const rect = sceneRef.current.getBoundingClientRect();
      burstRef.current(x - rect.left, y - rect.top, 'spark', 4, ['#e7b8bd', '#f6e2c0', '#ffffff']);
    }
    showMessage(pet.name);
  }, [showMessage]);

  // Handle biome switch
  const handleSelectBiome = async (newBiomeId: string) => {
    if (savingRef.current) return;
    savingRef.current = true; setIsSaving(true);
    try {
      const result = await onSwitchBiome?.(newBiomeId);
      if (result?.success) { setShowMap(false); setBuildMode(false); setSelectedItem(null); setSelectedPlacedObject(null); setMovePreview(null); }
      else showMessage(result?.error || 'No se pudo abrir este bioma.');
    } catch { showMessage('No se pudo cambiar de bioma. Inténtalo de nuevo.'); }
    finally { savingRef.current = false; setIsSaving(false); }
  };

  // Handle item selection from inventory
  const handleSelectItemInBiome = async (item: InventoryItem, destination: string) => {
    if (savingRef.current || !getPlacementDef(item.item_id)?.biomes?.includes(destination)) return;
    setInventorySelectionError(null);
    savingRef.current = true;
    setIsSaving(true);
    try {
      const result = await onSwitchBiome?.(destination);
      if (!result?.success) { setInventorySelectionError(result?.error || 'No se pudo abrir este bioma.'); return; }
      setSelectedItem(item);
      setSelectedPlacedObject(null);
      setMovePreview(null);
      setShowInventory(false);
      setBuildMode(true);
    } catch { setInventorySelectionError('No se pudo abrir este bioma. Inténtalo de nuevo.'); }
    finally { savingRef.current = false; setIsSaving(false); }
  };

  const handleSelectItem = useCallback((item: InventoryItem) => {
    if (savingRef.current) return;
    const def = getPlacementDef(item.item_id);
    if (def?.biomes && !def.biomes.includes(biomeId)) { showMessage('Este objeto pertenece a otro bioma.'); return; }
    if (def?.placeable && item.quantity > 0) {
      setSelectedItem(item);
      setSelectedPlacedObject(null);
      setMovePreview(null);
      setShowInventory(false);
      setBuildMode(true);
    }
  }, [biomeId, showMessage]);

  if (!biome) return null;

  const nightLandscapeOpacity = getNightLandscapeOpacity(dayNight.phase, dayNight.progress);

  return (
    <div
      className="world-scene"
      aria-hidden={isWelcomePreview || undefined}
      inert={isWelcomePreview || undefined}
      ref={sceneRef}
      {...pinchHandlers}
      onClick={handleSceneClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        background: skyGradient,
      }}
    >
      {/* Moon */}
      <div className="world-scene__celestial" style={{ zIndex: 11 }}>
        {dayNight.phase === 'night' && (
          <div className="world-scene__moon">🌙</div>
        )}
      </div>

      {/* Fog/Ambient lighting overlay */}
      <div
        className="world-scene__ambient"
        style={{
          background: dayNight.ambientOverlay,
          transition: 'background 3s ease',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      />

      {/* LAYER 3+ — World Camera Container (terrain, objects, creatures) */}
      <div
        className="world-camera"
        style={{
          position: 'absolute',
          top: `calc(50% + ${cameraOffset.y}px)`,
          left: `calc(50% + ${cameraOffset.x}px)`,
          width: `${WORLD_WIDTH}px`,
          height: `${WORLD_HEIGHT}px`,
          transform: `translate(-50%, -50%) scale(${cameraScale})`,
          transformOrigin: 'center',
          zIndex: 2,
        }}
      >
        {/* One continuous landscape, registered to the same coordinates as objects. */}
        {biomeId === 'garden' || biomeId === 'forest' ? (
          <div className="world-scene__terrain" aria-hidden="true">
            {nightLandscapeOpacity < 1 && <div className="world-scene__landscape world-scene__landscape--day" />}
            {nightLandscapeOpacity > 0 && <div className="world-scene__landscape world-scene__landscape--night" style={{ opacity: nightLandscapeOpacity }} />}
          </div>
        ) : (
          <div
            className="world-scene__ground"
            style={{ background: biome.groundGradient, height: '80%' }}
          >
            <div className="world-scene__grass" />
          </div>
        )}

        {/* Placed Objects */}
        {displayedObjects.map(obj => (
          <WorldObject
            key={obj.id}
            placedObject={obj}
            onInteract={handleObjectInteract}
            buildMode={buildMode}
            selected={selectedPlacedObject?.id === obj.id}
            onSelect={handleSelectPlacedObject}
            lightIntensity={dayNight.lightIntensity}
          />
        ))}

        {/* Creatures */}
        <WorldCompanions key={biomeId} companions={companions} timeOfDay={dayNight.phase}
          lightIntensity={dayNight.lightIntensity} isEditing={buildMode} onInteract={handleCompanionInteract} />
        {creatures.map(creature => (
          <Creature
            key={creature.id}
            def={creature}
            timeOfDay={dayNight.phase}
            areaWidth={100}
            lightIntensity={dayNight.lightIntensity}
            onInteract={handleCreatureInteract}
            habitat={biomeId === 'forest' || biomeId === 'garden' ? { x: [30, 59], y: [32, 39] } : undefined}
          />
        ))}

      </div>

      <WorldLighting objects={displayedObjects} camera={cameraView} lightIntensity={dayNight.lightIntensity} />

      {buildMode && activeObject && (
        <WorldBuildControls key={activeObject.id} object={activeObject} camera={cameraView} isSaving={isSaving}
          onPreview={previewMove} onMove={commitMove} onRemove={removeSelected} onFlip={flipSelected}
          onClose={() => { setSelectedPlacedObject(null); setMovePreview(null); }} />
      )}

      {/* Screen coordinates keep interaction bursts aligned after camera scaling. */}
      <WorldCanvas configs={particleConfigs} performanceFactor={perfFactor} onBurstRef={burstRef} />

      {/* Interaction message */}
      {interactMessage && (
        <div className={`world-scene__message${buildMode ? ' world-scene__message--editing' : ''}`} role="status">
          {interactMessage}
        </div>
      )}

      {/* Build mode indicator */}
      {buildMode && !activeObject && selectedItem && (
        <div className="world-scene__build-indicator">
          <span>🔨 {isSaving ? 'Guardando…' : selectedItem ? `Colocando: ${getPlacementDef(selectedItem.item_id)?.name || selectedItem.item_id}` : activeObject ? 'Ajusta el tamaño, mueve o cambia de lado el objeto' : 'Selecciona un objeto para editarlo o devolverlo al inventario'}</span>
          <button disabled={isSaving} onClick={() => { setBuildMode(false); setSelectedItem(null); setSelectedPlacedObject(null); setMovePreview(null); }}>Salir</button>
        </div>
      )}

      {/* HUD */}
      {!isWelcomePreview && <WorldHUD
        worldState={worldState}
        dayNight={dayNight}
        xpBoostActive={xpBoostActive}
        onOpenHelp={() => setShowWorldHelp(true)}
        onOpenForest={biomeId === 'forest' && !buildMode ? () => { if (!savingRef.current) { onRetryForest?.(); setShowForest(true); } } : undefined}
        onOpenInventory={() => { if (!savingRef.current) { setInventorySelectionError(null); setShowInventory(true); } }}
        onOpenMap={() => { if (!savingRef.current) setShowMap(true); }}
        onToggleBuild={() => { if (!savingRef.current) { setBuildMode(!buildMode); setSelectedItem(null); setSelectedPlacedObject(null); setMovePreview(null); } }}
        onClaimDaily={() => {
          if (canClaimDaily) onClaimDaily();
          else showMessage('La recompensa de hoy ya fue reclamada. Vuelve mañana.');
        }}
        buildMode={buildMode}
        canClaimDaily={canClaimDaily}
      />}

      {/* Panels */}
      {showWorldHelp && <WorldWelcome checking={false} failed={false} onRetry={() => {}} onEnter={async () => { setShowWorldHelp(false); return true; }} />}
      <Inventory
        isOpen={showInventory}
        onClose={() => setShowInventory(false)}
        items={inventory}
        onSelectItem={handleSelectItem}
        selectedItemId={selectedItem?.item_id}
        level={level}
        placedObjects={placedObjects}
        rewardsError={rewardsError}
        catalogUnavailable={catalogUnavailable}
        onRetryRewards={onRetryRewards}
        biomeId={biomeId}
        unlockedBiomes={worldState?.unlocked_biomes || []}
        onSelectItemInBiome={onSwitchBiome ? handleSelectItemInBiome : undefined}
        isSaving={isSaving}
        selectionError={inventorySelectionError}
        forestCompleted={forestProgress?.completed || !!worldState?.forest_completed_at}
        forestChapterRequired={(worldState?.progression_version || 1) >= 3 && !worldState?.forest_completed_at && !worldState?.unlocked_biomes.includes('garden')}
      />

      <ForestJournal isOpen={showForest} onClose={() => setShowForest(false)} progress={forestProgress} unavailable={forestUnavailable} loading={forestLoading}
        onRetry={() => onRetryForest?.()} onClaim={id => onClaimForestGoal ? onClaimForestGoal(id) : Promise.resolve({ success: false, error: 'El diario todavía no está disponible.' })}
        onComplete={() => onCompleteForest ? onCompleteForest() : Promise.resolve({ success: false, error: 'El diario todavía no está disponible.' })}
        onExplore={async () => {
          const result = await onSwitchBiome?.('garden') || { success: false, error: 'No se pudo abrir el jardín.' };
          if (result.success) { setShowForest(false); setBuildMode(false); setSelectedItem(null); setSelectedPlacedObject(null); setMovePreview(null); }
          return result;
        }} />

      <WorldMap
        isOpen={showMap}
        onClose={() => setShowMap(false)}
        worldState={worldState}
        onSelectBiome={handleSelectBiome}
      />

      {/* Reward Modal */}
      <RewardModal reward={isWelcomePreview ? null : pendingReward} onDismiss={onDismissReward} />
    </div>
  );
}
