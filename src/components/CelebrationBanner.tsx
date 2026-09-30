// ============================================================
// Coliflor — Celebration Banner Component
// ============================================================

import { useState } from 'react';
import type { Celebration } from '../lib/celebrations';

interface CelebrationBannerProps {
  celebration: Celebration;
}

export default function CelebrationBanner({ celebration }: CelebrationBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const isAniversario = celebration.type === 'aniversario';
  const isHito = celebration.type === 'hito100';
  const isFiesta = celebration.type === 'fiestas_patrias';
  const isNavidad = celebration.type === 'navidad';
  const isSanValentin = celebration.type === 'san_valentin';
  const isAnoNuevo = celebration.type === 'ano_nuevo';
  const isHighIntensity = celebration.intensity === 'high';

  // Dynamic gradient based on celebration type
  const getGradient = (): string => {
    if (isAniversario) {
      return 'linear-gradient(135deg, rgba(255, 105, 180, 0.25) 0%, rgba(255, 215, 0, 0.2) 50%, rgba(255, 107, 107, 0.2) 100%)';
    }
    if (isHito) {
      return 'linear-gradient(135deg, rgba(212, 165, 106, 0.25) 0%, rgba(78, 205, 196, 0.15) 100%)';
    }
    if (isFiesta) {
      return 'linear-gradient(135deg, rgba(213, 43, 30, 0.2) 0%, rgba(255, 255, 255, 0.1) 50%, rgba(0, 57, 166, 0.2) 100%)';
    }
    if (isNavidad) {
      return 'linear-gradient(135deg, rgba(255, 0, 0, 0.15) 0%, rgba(0, 128, 0, 0.15) 50%, rgba(255, 215, 0, 0.2) 100%)';
    }
    if (isSanValentin) {
      return 'linear-gradient(135deg, rgba(255, 105, 180, 0.25) 0%, rgba(255, 20, 147, 0.15) 50%, rgba(255, 182, 193, 0.2) 100%)';
    }
    if (isAnoNuevo) {
      return 'linear-gradient(135deg, rgba(255, 215, 0, 0.25) 0%, rgba(78, 205, 196, 0.15) 50%, rgba(255, 105, 180, 0.2) 100%)';
    }
    // Default cumplemes
    return 'linear-gradient(135deg, rgba(212, 165, 106, 0.2) 0%, rgba(212, 165, 106, 0.08) 100%)';
  };

  const getBorderColor = (): string => {
    if (isAniversario) return 'rgba(255, 105, 180, 0.5)';
    if (isHito) return 'rgba(212, 165, 106, 0.5)';
    if (isFiesta) return 'rgba(213, 43, 30, 0.4)';
    if (isNavidad) return 'rgba(255, 0, 0, 0.35)';
    if (isSanValentin) return 'rgba(255, 105, 180, 0.5)';
    if (isAnoNuevo) return 'rgba(255, 215, 0, 0.5)';
    return 'rgba(212, 165, 106, 0.3)';
  };

  return (
    <div
      className={`celebration-banner ${isHighIntensity ? 'celebration-banner--epic' : ''}`}
      style={{
        background: getGradient(),
        border: `1px solid ${getBorderColor()}`,
        borderRadius: '20px',
        padding: '16px 20px',
        position: 'relative',
        overflow: 'hidden',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* Animated shimmer overlay for high intensity */}
      {isHighIntensity && (
        <div
          className="celebration-shimmer"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            borderRadius: '20px',
          }}
        />
      )}

      {/* Dismiss button */}
      <button
        onClick={() => setDismissed(true)}
        style={{
          position: 'absolute',
          top: '8px',
          right: '12px',
          background: 'none',
          border: 'none',
          color: 'var(--color-text-tertiary)',
          fontSize: '16px',
          cursor: 'pointer',
          padding: '4px',
          lineHeight: 1,
          zIndex: 2,
        }}
        aria-label="Cerrar"
      >
        ✕
      </button>

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Emoji */}
        <div
          className={isAniversario ? 'celebration-heart-pulse' : ''}
          style={{
            fontSize: isHighIntensity ? '36px' : '28px',
            textAlign: 'center',
            marginBottom: '8px',
            filter: isHighIntensity ? 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.5))' : 'none',
          }}
        >
          {celebration.emoji}
        </div>

        {/* Title */}
        <h3
          className={isHighIntensity ? 'celebration-text-glow' : ''}
          style={{
            fontSize: isHighIntensity ? '18px' : '15px',
            fontWeight: 800,
            textAlign: 'center',
            color: 'var(--color-text-primary)',
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          {celebration.title}
        </h3>

        {/* Subtitle */}
        <p
          style={{
            fontSize: '12px',
            textAlign: 'center',
            color: 'var(--color-text-secondary)',
            margin: '4px 0 0',
            fontWeight: 500,
          }}
        >
          {celebration.subtitle}
        </p>
      </div>
    </div>
  );
}
