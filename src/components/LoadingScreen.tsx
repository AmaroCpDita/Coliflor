// ============================================================
// Coliflor — Subtle Romantic Loading & Toast Screen Component
// ============================================================

function IconGoldHeart({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#e5c573" stroke="#e5c573" strokeWidth="2" className="pulse-heart">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

const LOADING_PHRASES = [
  'Cargando su espacio...',
  'Buscando sintonía...',
  'Preparando recuerdos...',
  'Conectando a la pareja...',
];

export default function LoadingScreen({ message }: { message?: string }) {
  const randomPhrase = message || LOADING_PHRASES[Math.floor(Math.random() * LOADING_PHRASES.length)];

  return (
    <div className="page page--centered">
      <div className="glass-card text-center stack stack--md animate-fade-in" style={{ padding: 'var(--space-xl) var(--space-lg)', minWidth: '240px' }}>
        <div className="row row--center">
          <IconGoldHeart size={36} />
        </div>
        <p className="text-secondary" style={{ fontSize: 'var(--font-size-xs)', letterSpacing: '0.05em', fontWeight: 500 }}>
          {randomPhrase}
        </p>
      </div>
    </div>
  );
}
