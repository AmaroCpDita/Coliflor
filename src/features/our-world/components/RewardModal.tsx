// ============================================================
// Nuestro Mundo — Reward Modal
// ============================================================

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RewardResult } from '../types';
import { getObjectDef } from '../data/objects';
import ObjectPreview from './ObjectPreview';
import WorldModalPortal from './WorldModalPortal';

interface RewardModalProps {
  reward: RewardResult | null;
  onDismiss: () => void;
}

export default function RewardModal({ reward, onDismiss }: RewardModalProps) {
  if (!reward || reward.already_claimed) return null;

  return (
    <WorldModalPortal><AnimatePresence>
      {reward && (
        <motion.div
          className="world-reward-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onDismiss}
        >
          <motion.div
            className="world-reward"
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 15, stiffness: 150 }}
            onClick={e => e.stopPropagation()}
          >
            {reward.completed_biome === 'forest' ? (
              <>
                <div className="world-reward__icon">💚</div>
                <h3 className="world-reward__title">¡Completaron el bosque!</h3>
                <p className="world-inventory__hint">Este lugar cuenta su historia. El jardín ya los espera, y siempre podrán volver aquí.</p>
              </>
            ) : reward.leveled_up ? (
              <>
                <div className="world-reward__icon">🎉</div>
                <h3 className="world-reward__title">¡Subiste de nivel!</h3>
                <div className="world-reward__level">Nivel {reward.level}</div>
              </>
            ) : (
              <>
                <div className="world-reward__icon">🎁</div>
                <h3 className="world-reward__title">¡Recompensa!</h3>
              </>
            )}

            {reward.xp_granted && reward.xp_granted > 0 && (
              <div className="world-reward__xp">+{reward.xp_granted} XP</div>
            )}

            {reward.items_granted && reward.items_granted.length > 0 && (
              <div className="world-reward__items">
                {reward.items_granted.map((item, i) => {
                  const def = getObjectDef(item.item_id);
                  return (
                    <div key={i} className="world-reward__item">
                      <ObjectPreview itemId={item.item_id} />
                      <span>{def?.name || item.item_id}</span>
                      <span className="world-reward__item-qty">×{item.quantity}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <button className="world-reward__btn" onClick={onDismiss}>
              ¡Genial!
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence></WorldModalPortal>
  );
}
