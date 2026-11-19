// ============================================================
// Nuestro Mundo — World Map (Biome Selector)
// ============================================================

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BIOMES } from '../data/biomes';
import type { WorldState } from '../types';
import WorldModalPortal from './WorldModalPortal';

interface WorldMapProps {
  isOpen: boolean;
  onClose: () => void;
  worldState: WorldState | null;
  onSelectBiome: (biomeId: string) => void;
  currentBiomeId?: string;
  localPreviewEnabled?: boolean;
  onToggleLocalPreview?: () => void;
}

export default function WorldMap({
  isOpen,
  onClose,
  worldState,
  onSelectBiome,
  currentBiomeId,
  localPreviewEnabled = false,
  onToggleLocalPreview,
}: WorldMapProps) {
  if (!worldState) return null;
  const unlockedSet = new Set(worldState.unlocked_biomes || []);
  const isUnlocked = (biome: (typeof BIOMES)[number]) => {
    const needsForest =
      (worldState.progression_version || 1) >= 3 &&
      biome.id !== 'forest' &&
      !worldState.forest_completed_at;
    return unlockedSet.has(biome.id) || (!needsForest && biome.requiredLevel <= worldState.level);
  };
  const unlockedCount = BIOMES.filter(isUnlocked).length;
  const nextBiome = BIOMES.find((biome) => !isUnlocked(biome));

  return (
    <WorldModalPortal>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="world-map-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            <motion.div
              className="world-map"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 150 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="world-map__header">
                <h3>🗺️ Mapa del Mundo</h3>
                <button className="world-map__close" onClick={onClose}>
                  ✕
                </button>
              </div>

              <div className="world-map__progress">
                <div className="world-map__progress-label">
                  <strong>Tu progreso</strong>
                  <span>
                    {unlockedCount} de {BIOMES.length} biomas desbloqueados
                  </span>
                </div>
                <div
                  className="world-map__progress-track"
                  role="progressbar"
                  aria-label="Biomas desbloqueados"
                  aria-valuenow={unlockedCount}
                  aria-valuemin={0}
                  aria-valuemax={BIOMES.length}
                >
                  <span style={{ width: `${(unlockedCount / BIOMES.length) * 100}%` }} />
                </div>
                <p className="world-map__progress-next">
                  {nextBiome
                    ? `Siguiente: ${nextBiome.name} · ${!worldState.forest_completed_at && (worldState.progression_version || 1) >= 3 ? 'completa el bosque y llega al ' : ''}nivel ${nextBiome.requiredLevel}`
                    : '¡Todos los biomas desbloqueados!'}
                </p>
              </div>

              {import.meta.env.DEV && onToggleLocalPreview && (
                <div className="world-map__preview-controls">
                  <button className="world-map__preview-toggle" onClick={onToggleLocalPreview}>
                    {localPreviewEnabled
                      ? 'Cerrar vista previa local'
                      : 'Previsualizar todos los biomas'}
                  </button>
                  <small>Solo para revisar el diseño localmente; no cambia tu progreso.</small>
                </div>
              )}

              <div className="world-map__grid">
                {BIOMES.map((biome) => {
                  const needsForest =
                    (worldState.progression_version || 1) >= 3 &&
                    biome.id !== 'forest' &&
                    !worldState.forest_completed_at;
                  const unlocked = isUnlocked(biome);
                  const canVisit = unlocked || (import.meta.env.DEV && localPreviewEnabled);
                  const isCurrent = (currentBiomeId || worldState.current_biome) === biome.id;
                  return (
                    <button
                      key={biome.id}
                      className={`world-map__biome ${canVisit ? 'world-map__biome--unlocked' : 'world-map__biome--locked'} ${isCurrent ? 'world-map__biome--current' : ''}`}
                      onClick={() => canVisit && onSelectBiome(biome.id)}
                      disabled={!canVisit}
                    >
                      <span className="world-map__biome-emoji">{biome.emoji}</span>
                      <span className="world-map__biome-name">{biome.name}</span>
                      {!unlocked && !localPreviewEnabled && (
                        <span className="world-map__biome-lock">
                          {needsForest ? '🌲 Completa el bosque' : `🔒 Nv. ${biome.requiredLevel}`}
                        </span>
                      )}
                      {!unlocked && localPreviewEnabled && (
                        <span className="world-map__biome-lock">Vista previa</span>
                      )}
                      {isCurrent && <span className="world-map__biome-badge">Aquí</span>}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </WorldModalPortal>
  );
}
