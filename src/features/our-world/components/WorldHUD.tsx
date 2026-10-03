// ============================================================
// Nuestro Mundo — World HUD (Heads-Up Display)
// ============================================================

import React from 'react';
import { xpToNextLevel } from '../data/progression';
import type { WorldState, DayNightState } from '../types';

interface WorldHUDProps {
  worldState: WorldState | null;
  dayNight: DayNightState;
  onOpenInventory: () => void;
  onOpenMap: () => void;
  onOpenForest?: () => void;
  xpBoostActive?: boolean;
  onToggleBuild: () => void;
  onClaimDaily: () => void;
  buildMode: boolean;
  canClaimDaily: boolean;
}

function IconBackpack() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10V20a2 2 0 002 2h12a2 2 0 002-2V10" />
      <rect x="2" y="7" width="20" height="5" rx="1" />
      <path d="M8 7V5a4 4 0 018 0v2" />
    </svg>
  );
}

function IconHammer() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 12l-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 010-3L12 9" />
      <path d="M17.64 15L22 10.64" />
      <path d="M20.91 11.7l-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 00-3.94-1.64H9l.92.82A6.18 6.18 0 0112 8.4v1.56l2 2h2.47l2.26 1.91" />
    </svg>
  );
}

function IconMap() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  );
}

function IconGift() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
    </svg>
  );
}

const TIME_EMOJI: Record<string, string> = {
  morning: '🌅',
  day: '☀️',
  evening: '🌇',
  night: '🌙',
};

export default function WorldHUD({
  worldState, dayNight, onOpenInventory, onOpenMap,
  onToggleBuild, onClaimDaily, buildMode, canClaimDaily, onOpenForest, xpBoostActive,
}: WorldHUDProps) {
  if (!worldState) return null;

  const xpNeeded = xpToNextLevel(worldState.level, worldState.progression_version || 1);
  const xpProgress = xpNeeded > 0 ? (worldState.xp / xpNeeded) * 100 : 0;

  return (
    <div className="world-hud">
      {/* Level & XP bar */}
      <div className="world-hud__level-bar">
        <div className="world-hud__level-info">
          <span className="world-hud__level-badge">Nv. {worldState.level}</span>
          <span className="world-hud__xp-text">{worldState.xp} / {xpNeeded} XP</span>
          {xpBoostActive && <span className="world-hud__xp-boost" title="Ambos subieron su foto hoy. XP doble hasta medianoche en Santiago.">×2 hoy</span>}
          <span className="world-hud__time">{TIME_EMOJI[dayNight.phase] || '☀️'}</span>
        </div>
        <div className="world-hud__xp-bar">
          <div className="world-hud__xp-fill" style={{ width: `${Math.min(100, xpProgress)}%` }} />
        </div>
      </div>

      {/* Action buttons */}
      <div className="world-hud__actions">
        {onOpenForest && <button className="world-hud__btn" onClick={onOpenForest} title="Diario del bosque" aria-label="Abrir diario del bosque">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v16M12 5C8 2 4 3 2 4v15c3-1 6-1 10 2 4-3 7-3 10-2V4c-2-1-6-2-10 1Z" /></svg>
        </button>}
        <button className={`world-hud__btn ${canClaimDaily ? 'world-hud__btn--daily' : 'world-hud__btn--claimed'}`} onClick={onClaimDaily}
          aria-label={canClaimDaily ? 'Reclamar recompensa diaria' : 'Recompensa diaria reclamada hoy'}
          title={canClaimDaily ? 'Recompensa diaria disponible' : 'Reclamada hoy. La próxima recompensa llega mañana.'}>
          <IconGift />
          {!canClaimDaily && <span className="world-hud__daily-check" aria-hidden="true">✓</span>}
        </button>
        <button className={`world-hud__btn ${buildMode ? 'world-hud__btn--active' : ''}`} onClick={onToggleBuild} title="Construir">
          <IconHammer />
        </button>
        <button className="world-hud__btn" onClick={onOpenInventory} title="Inventario">
          <IconBackpack />
        </button>
        <button className="world-hud__btn" onClick={onOpenMap} title="Mapa">
          <IconMap />
        </button>
      </div>
    </div>
  );
}
