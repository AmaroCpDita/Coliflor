// ============================================================
// Coliflor — Interactive 4x2 Pokémon-Style Cozy Picaflor Widget Previewer
// ============================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import './WidgetPreview.css';

type WidgetState = 'active' | 'pending' | 'urgent';

// Crisp Custom Vector Icons (Zero System Emojis!)
function SvgFlower({ color = '#E6FFF4' }: { color?: string }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="5.8" r="3.1" fill={color} />
      <circle cx="17.9" cy="10.1" r="3.1" fill={color} />
      <circle cx="15.6" cy="17" r="3.1" fill={color} />
      <circle cx="8.4" cy="17" r="3.1" fill={color} />
      <circle cx="6.1" cy="10.1" r="3.1" fill={color} />
      <circle cx="12" cy="12" r="2.3" fill="#0E342A" />
    </svg>
  );
}

function SvgHome() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3L3 10.5V20c0 .55.45 1 1 1h5.5v-6h5v6H20c.55 0 1-.45 1-1v-9.5L12 3z" />
    </svg>
  );
}

function SvgFlame() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M12.5 2C12.5 2 17 6.2 17 11.2c0 .9-.2 1.8-.6 2.6.9-.7 1.4-1.9 1.5-3.2 1.3 1.4 2.1 3.3 2.1 5.2 0 4-3.4 6.2-7.8 6.2C7.8 22 4.5 19.1 4.5 14.8c0-3.7 2.7-6.4 5-8.6 1.4-1.3 2.6-2.7 3-4.2z"
        fill="#FF8A2B"
      />
      <path
        d="M12.2 11.5s2.8 2.3 2.8 5c0 2.2-1.3 3.7-3 3.7s-3-1.4-3-3.4c0-1.9 1.6-3.5 3.2-5.3z"
        fill="#FFD86B"
      />
    </svg>
  );
}

function SvgStatusIcon({ state }: { state: WidgetState }) {
  if (state === 'active') {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="#86EFAC">
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm-1.8 14.6-4-4 1.4-1.4 2.6 2.6 6.2-6.2 1.4 1.4z" />
      </svg>
    );
  }
  if (state === 'pending') {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="#DDD6FE">
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm3.5 13.2L11 12.5V7h1.5v4.7l3.8 2.3z" />
      </svg>
    );
  }
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="#FCA5A5">
      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 15h-2v-2h2zm0-4h-2V7h2z" />
    </svg>
  );
}

function SvgHeart({ color }: { color: string }) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill={color}>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

function SvgCalendar() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="#D4D4D8">
      <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14zm0-12H5V6h14z" />
    </svg>
  );
}

const STATE_CONFIG: Record<
  WidgetState,
  {
    art: string;
    pill: string;
    tagline: string;
    heartColor: string;
    flowerColor: string;
    progress: number;
    label: string;
  }
> = {
  active: {
    art: '/assets/widget/picaflor-active-v2.webp',
    pill: 'Activa',
    tagline: '¡Otro día juntos!',
    heartColor: '#86EFAC',
    flowerColor: '#D1FAE5',
    progress: 100,
    label: 'Activa',
  },
  pending: {
    art: '/assets/widget/picaflor-pending-v2.webp',
    pill: 'Pendiente · 5h 45m',
    tagline: '¿Volvemos a volar?',
    heartColor: '#C4B5FD',
    flowerColor: '#EDE9FE',
    progress: 62,
    label: 'Pendiente',
  },
  urgent: {
    art: '/assets/widget/picaflor-urgent-v2.webp',
    pill: 'Urgente · 45m',
    tagline: '¡Todavía estamos a tiempo!',
    heartColor: '#FCA5A5',
    flowerColor: '#FECACA',
    progress: 18,
    label: 'Urgente',
  },
};

export default function WidgetPreview() {
  const [widgetState, setWidgetState] = useState<WidgetState>('active');
  const [streakDays, setStreakDays] = useState<number>(37);
  const [clickedFeedback, setClickedFeedback] = useState<string | null>(null);

  const cfg = STATE_CONFIG[widgetState];

  const handleCardClick = () => {
    setClickedFeedback('Abriendo tu Racha en Coliflor...');
    setTimeout(() => setClickedFeedback(null), 2000);
  };

  const handleWorldClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setClickedFeedback('Abriendo Nuestro Mundo...');
    setTimeout(() => setClickedFeedback(null), 2000);
  };

  return (
    <div className="widget-preview-page">
      <div className="widget-preview-header">
        <Link
          to="/"
          style={{
            color: '#e5c573',
            fontSize: '13px',
            textDecoration: 'none',
            fontWeight: 700,
            display: 'inline-block',
            marginBottom: '8px',
          }}
        >
          ← Volver a Coliflor
        </Link>
        <h1>Widget Nativo 4×2 de Coliflor</h1>
        <p>
          Colibrí estilo Pokémon con pañoleta de corazón amarillo sutil, íconos vectoriales nítidos
          (cero emojis genéricos) y datos funcionales en tiempo real.
        </p>
      </div>

      <div className="widget-preview-layout">
        {/* PHONE DESKTOP SIMULATOR */}
        <div className="phone-mockup">
          <div className="phone-wallpaper" />

          <div className="phone-status-bar">
            <span>22:55</span>
            <div className="phone-punchhole" />
            <span>5G · 88%</span>
          </div>

          <div className="phone-desktop">
            <div className="phone-clock-widget">
              <div className="phone-clock-time">22:55</div>
              <div className="phone-clock-date">Lunes, 23 de Noviembre</div>
            </div>

            {/* 4x2 HORIZONTAL COZY CARD WIDGET */}
            <div
              className={`cozy-widget-card cozy-widget-card--${widgetState}`}
              onClick={handleCardClick}
            >
              <div className="cozy-widget-top">
                <div className="cozy-widget-brand">
                  <SvgFlower color={cfg.flowerColor} />
                  <span>Coliflor</span>
                </div>
                <button type="button" className="cozy-widget-world-btn" onClick={handleWorldClick}>
                  <SvgHome />
                  <span>Nuestro mundo</span>
                </button>
              </div>

              <div className="cozy-widget-middle">
                <div className="cozy-widget-art-wrap">
                  <img src={cfg.art} alt="Picaflor Coliflor" className="cozy-widget-art" />
                </div>

                <div className="cozy-widget-info">
                  <span className="cozy-widget-eyebrow">NUESTRA RACHA</span>
                  <div
                    className="cozy-widget-count"
                    style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                  >
                    <SvgFlame />
                    <span>
                      {streakDays} {streakDays === 1 ? 'día' : 'días'}
                    </span>
                  </div>
                  <span
                    className="cozy-widget-pill"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  >
                    <SvgStatusIcon state={widgetState} />
                    <span>{cfg.pill}</span>
                  </span>
                  <span
                    className="cozy-widget-tagline"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  >
                    <span>{cfg.tagline}</span>
                    <SvgHeart color={cfg.heartColor} />
                  </span>
                </div>
              </div>

              <div className="cozy-widget-footer">
                <span
                  className="cozy-widget-next"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                >
                  <SvgCalendar />
                  <span>Próximo día: Día {streakDays + 1}</span>
                </span>
                <div className="cozy-widget-progress-track">
                  <div
                    className="cozy-widget-progress-fill"
                    style={{ width: `${cfg.progress}%` }}
                  />
                </div>
              </div>
            </div>

            {clickedFeedback && (
              <div
                style={{
                  background: 'rgba(0,0,0,0.85)',
                  color: '#fff',
                  padding: '8px 14px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 600,
                  textAlign: 'center',
                  margin: '12px auto 0',
                  border: '1px solid rgba(229,197,115,0.35)',
                }}
              >
                {clickedFeedback}
              </div>
            )}

            <div className="phone-app-grid">
              <div className="phone-app-icon">
                <div className="phone-app-badge" style={{ background: '#25D366' }}>
                  💬
                </div>
                <span className="phone-app-label">WhatsApp</span>
              </div>
              <div className="phone-app-icon">
                <div className="phone-app-badge" style={{ background: '#1DB954' }}>
                  🎵
                </div>
                <span className="phone-app-label">Spotify</span>
              </div>
              <div className="phone-app-icon">
                <div className="phone-app-badge" style={{ background: '#FF2D55' }}>
                  📸
                </div>
                <span className="phone-app-label">Fotos</span>
              </div>
              <div className="phone-app-icon">
                <div className="phone-app-badge" style={{ background: '#E5C573' }}>
                  🌸
                </div>
                <span className="phone-app-label">Coliflor</span>
              </div>
            </div>

            <div className="phone-dock">
              <span>📞</span>
              <span>💬</span>
              <span>🌐</span>
              <span>📷</span>
            </div>
          </div>
        </div>

        {/* CONTROLS PANEL */}
        <div className="controls-panel">
          <div className="controls-section">
            <span className="controls-label">1. Los 3 Estados del Colibrí</span>
            <div className="states-gallery">
              {(['active', 'pending', 'urgent'] as WidgetState[]).map((st) => (
                <div
                  key={st}
                  className={`state-thumb ${widgetState === st ? 'state-thumb--active' : ''}`}
                  onClick={() => setWidgetState(st)}
                >
                  <img src={STATE_CONFIG[st].art} alt={STATE_CONFIG[st].label} />
                  <span>{STATE_CONFIG[st].label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="controls-section">
            <span className="controls-label">
              2. Días de Racha ({streakDays} días → Próximo: Día {streakDays + 1})
            </span>
            <input
              type="range"
              min="1"
              max="365"
              value={streakDays}
              onChange={(e) => setStreakDays(parseInt(e.target.value, 10))}
              className="controls-slider"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
