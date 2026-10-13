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
}

export default function WorldMap({ isOpen, onClose, worldState, onSelectBiome }: WorldMapProps) {
  if (!worldState) return null;
  const unlockedSet = new Set(worldState.unlocked_biomes || []);

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

              <div className="world-map__grid">
                {BIOMES.map((biome) => {
                  const needsForest =
                    (worldState.progression_version || 1) >= 3 &&
                    biome.id !== 'forest' &&
                    !worldState.forest_completed_at;
                  const isUnlocked =
                    unlockedSet.has(biome.id) ||
                    (!needsForest && biome.requiredLevel <= worldState.level);
                  const isCurrent = worldState.current_biome === biome.id;
                  return (
                    <button
                      key={biome.id}
                      className={`world-map__biome ${isUnlocked ? 'world-map__biome--unlocked' : 'world-map__biome--locked'} ${isCurrent ? 'world-map__biome--current' : ''}`}
                      onClick={() => isUnlocked && onSelectBiome(biome.id)}
                      disabled={!isUnlocked}
                    >
                      <span className="world-map__biome-emoji">{biome.emoji}</span>
                      <span className="world-map__biome-name">{biome.name}</span>
                      {!isUnlocked && (
                        <span className="world-map__biome-lock">
                          {needsForest ? '🌲 Completa el bosque' : `🔒 Nv. ${biome.requiredLevel}`}
                        </span>
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
