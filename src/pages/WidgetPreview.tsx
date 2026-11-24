// ============================================================
// Coliflor — Interactive 4x2 Cozy Picaflor Widget Previewer
// ============================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import './WidgetPreview.css';

type WidgetState = 'active' | 'pending' | 'urgent';

const STATE_CONFIG: Record<
  WidgetState,
  {
    art: string;
    pill: string;
    tagline: string;
    progress: number;
    label: string;
  }
> = {
  active: {
    art: '/assets/widget/coliflor-active.webp',
    pill: '✓ Activa',
    tagline: '¡Otro día juntos! 💚',
    progress: 100,
    label: '✓ Activa',
  },
  pending: {
    art: '/assets/widget/coliflor-pending.webp',
    pill: '🕒 Pendiente · 5h 45m',
    tagline: '¿Volvemos a volar? 💜',
    progress: 62,
    label: '🕒 Pendiente',
  },
  urgent: {
    art: '/assets/widget/coliflor-urgent.webp',
    pill: '! Urgente · 45m',
    tagline: '¡Todavía estamos a tiempo! ❤️',
    progress: 18,
    label: '! Urgente',
  },
};

export default function WidgetPreview() {
  const [widgetState, setWidgetState] = useState<WidgetState>('active');
  const [streakDays, setStreakDays] = useState<number>(37);
  const [clickedFeedback, setClickedFeedback] = useState<string | null>(null);

  const cfg = STATE_CONFIG[widgetState];

  const handleCardClick = () => {
    setClickedFeedback('🔥 Abriendo tu Racha en Coliflor...');
    setTimeout(() => setClickedFeedback(null), 2000);
  };

  const handleWorldClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setClickedFeedback('🏠 Abriendo Nuestro Mundo...');
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
          Tarjetas horizontales funcionales estilo Pokémon/cozy con el picaflor y corazón amarillo
          en su pañoleta, contador real, botón a Nuestro Mundo y barra de próximo día.
        </p>
      </div>

      <div className="widget-preview-layout">
        {/* PHONE DESKTOP SIMULATOR */}
        <div className="phone-mockup">
          <div className="phone-wallpaper" />

          <div className="phone-status-bar">
            <span>22:55</span>
            <div className="phone-punchhole" />
            <span>📶 5G 🔋 88%</span>
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
                  <span>🌸</span>
                  <span>Coliflor</span>
                </div>
                <button type="button" className="cozy-widget-world-btn" onClick={handleWorldClick}>
                  <span>🏠</span>
                  <span>Nuestro mundo</span>
                </button>
              </div>

              <div className="cozy-widget-middle">
                <div className="cozy-widget-art-wrap">
                  <img src={cfg.art} alt="Picaflor Coliflor" className="cozy-widget-art" />
                </div>

                <div className="cozy-widget-info">
                  <span className="cozy-widget-eyebrow">NUESTRA RACHA</span>
                  <div className="cozy-widget-count">
                    🔥 {streakDays} {streakDays === 1 ? 'día' : 'días'}
                  </div>
                  <span className="cozy-widget-pill">{cfg.pill}</span>
                  <span className="cozy-widget-tagline">{cfg.tagline}</span>
                </div>
              </div>

              <div className="cozy-widget-footer">
                <span className="cozy-widget-next">📅 Próximo día: Día {streakDays + 1}</span>
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
            <span className="controls-label">1. Prueba los 3 Estados del Widget</span>
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

          <div
            style={{
              padding: '14px',
              borderRadius: '14px',
              background: 'rgba(74, 222, 128, 0.08)',
              border: '1px solid rgba(74, 222, 128, 0.25)',
              fontSize: '12px',
              color: '#d4d4d8',
              lineHeight: 1.5,
            }}
          >
            ✨ <strong>100% Funcional en Android Nativo:</strong>
            <br />
            • Muestra tus días reales, el próximo día y el tiempo restante en vivo.
            <br />• Tocar <strong>🏠 Nuestro mundo</strong> abre directo el mundo; tocar la tarjeta
            abre la racha.
            <br />• El pañuelo del picaflor ya lleva el corazón amarillo sutil 💛.
          </div>
        </div>
      </div>
    </div>
  );
}
