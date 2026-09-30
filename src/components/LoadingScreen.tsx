import { useState, useEffect } from 'react';

// ============================================================
// Coliflor — Subtle Romantic Loading & Toast Screen Component
// ============================================================

function IconGoldHeart({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="var(--color-accent)" stroke="var(--color-accent)" strokeWidth="2" style={{ animation: 'heartPulse 2s infinite' }}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

const LOADING_PHRASES = [
  'Preparando nuestro rinconcito de amor...',
  'Buscando la sintonía perfecta...',
  'Recordando la primera vez que nos vimos...',
  'Pensando en nuestro futuro juntos...',
  'Desempolvando nuestros mejores recuerdos...',
  'Afinando los latidos de este espacio...',
  'Buscando esa foto donde sales hermoso...',
  'Conectando nuestros corazones a la red...',
  'Preparando el terreno para amarnos más...',
  'Extrañándote mientras carga la página...',
  'Diseñando un espacio solo para nosotros...'
];

export default function LoadingScreen({ message }: { message?: string }) {
  const [phraseIndex, setPhraseIndex] = useState(() => Math.floor(Math.random() * LOADING_PHRASES.length));

  // Rotate phrases every 2.5 seconds if there is no hardcoded message
  useEffect(() => {
    if (message) return;
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % LOADING_PHRASES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [message]);

  const displayMessage = message || LOADING_PHRASES[phraseIndex];

  return (
    <div className="page page--centered">
      <div className="glass-card text-center stack stack--md animate-fade-in" style={{ padding: 'var(--space-xl) var(--space-lg)', minWidth: '280px' }}>
        <div className="row row--center">
          <IconGoldHeart size={36} />
        </div>
        <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)', letterSpacing: '0.02em', fontWeight: 500, minHeight: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity 0.3s' }}>
          {displayMessage}
        </p>
      </div>
    </div>
  );
}
