// ============================================================
// Coliflor — Interactive Android Home Screen Widget Previewer
// ============================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import './WidgetPreview.css';

type WidgetSize = 'square' | 'large';
type WidgetState = 'active' | 'pending' | 'urgent';

const ARTWORK_MAP: Record<WidgetState, string> = {
  active: '/assets/widget/coliflor-active.webp',
  pending: '/assets/widget/coliflor-pending.webp',
  urgent: '/assets/widget/coliflor-urgent.webp',
};

export default function WidgetPreview() {
  const [size, setSize] = useState<WidgetSize>('square');
  const [widgetState, setWidgetState] = useState<WidgetState>('active');
  const [streakDays, setStreakDays] = useState<number>(34);
  const [clickedFeedback, setClickedFeedback] = useState<string | null>(null);

  const handleWidgetClick = () => {
    setClickedFeedback('🚀 ¡Abriendo Coliflor directo en tu Racha!');
    setTimeout(() => setClickedFeedback(null), 2200);
  };

  const pillText =
    widgetState === 'active' ? '✓ ACTIVA' : widgetState === 'urgent' ? '🚨 45m' : '⏳ 5h 45m';

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
        <h1>Widget Nativo de Coliflor</h1>
        <p>
          Así se ve el nuevo widget ilustrado en 3D con la mascota Coliflor en la pantalla de inicio
          de tu celular (fuera de la app), cambiando de emoción igual que Duolingo.
        </p>
      </div>

      <div className="widget-preview-layout">
        {/* PHONE DESKTOP SIMULATOR */}
        <div className="phone-mockup">
          <div className="phone-wallpaper" />
          <div className="phone-wallpaper-overlay" />

          <div className="phone-status-bar">
            <span>22:15</span>
            <div className="phone-punchhole" />
            <span>📶 5G 🔋 88%</span>
          </div>

          <div className="phone-desktop">
            <div className="phone-clock-widget">
              <div className="phone-clock-time">22:15</div>
              <div className="phone-clock-date">Lunes, 23 de Noviembre</div>
            </div>

            {/* WIDGET ON HOME SCREEN */}
            <div className="widget-desktop-row">
              <div
                className={`coliflor-native-widget coliflor-native-widget--${size}`}
                onClick={handleWidgetClick}
              >
                <img
                  src={ARTWORK_MAP[widgetState]}
                  alt="Mascota Coliflor"
                  className="coliflor-native-widget__art"
                />
                <div className="coliflor-native-widget__scrim" />

                <div className="coliflor-native-widget__top">
                  <div className="coliflor-native-widget__count-wrap">
                    <span className="coliflor-native-widget__number">{streakDays}</span>
                    <span className="coliflor-native-widget__unit">
                      {streakDays === 1 ? 'DÍA' : 'DÍAS'}
                    </span>
                  </div>

                  <span
                    className={`coliflor-native-widget__pill coliflor-native-widget__pill--${widgetState}`}
                  >
                    {pillText}
                  </span>
                </div>
              </div>

              {size === 'square' && (
                <div className="phone-side-icons">
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
              )}
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
                  margin: '0 auto 8px',
                  border: '1px solid rgba(229,197,115,0.35)',
                }}
              >
                {clickedFeedback}
              </div>
            )}

            <div className="phone-app-grid">
              <div className="phone-app-icon">
                <div className="phone-app-badge" style={{ background: '#3b82f6' }}>
                  🌤️
                </div>
                <span className="phone-app-label">Clima</span>
              </div>
              <div className="phone-app-icon">
                <div className="phone-app-badge" style={{ background: '#8b5cf6' }}>
                  📅
                </div>
                <span className="phone-app-label">Calendario</span>
              </div>
              <div className="phone-app-icon">
                <div className="phone-app-badge" style={{ background: '#f97316' }}>
                  📝
                </div>
                <span className="phone-app-label">Notas</span>
              </div>
              <div className="phone-app-icon">
                <div className="phone-app-badge" style={{ background: '#475569' }}>
                  ⚙️
                </div>
                <span className="phone-app-label">Ajustes</span>
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
            <span className="controls-label">1. Estados de la Mascota Coliflor</span>
            <div className="states-gallery">
              <div
                className={`state-thumb ${widgetState === 'active' ? 'state-thumb--active' : ''}`}
                onClick={() => setWidgetState('active')}
              >
                <img src={ARTWORK_MAP.active} alt="Racha Activada" />
                <span>✓ Activada</span>
              </div>
              <div
                className={`state-thumb ${widgetState === 'pending' ? 'state-thumb--active' : ''}`}
                onClick={() => setWidgetState('pending')}
              >
                <img src={ARTWORK_MAP.pending} alt="Esperando Foto" />
                <span>⏳ Pendiente</span>
              </div>
              <div
                className={`state-thumb ${widgetState === 'urgent' ? 'state-thumb--active' : ''}`}
                onClick={() => setWidgetState('urgent')}
              >
                <img src={ARTWORK_MAP.urgent} alt="Últimas Horas" />
                <span>🚨 Urgente</span>
              </div>
            </div>
          </div>

          <div className="controls-section">
            <span className="controls-label">2. Tamaño en el Escritorio</span>
            <div className="controls-btn-group">
              <button
                className={`controls-btn ${size === 'square' ? 'controls-btn--active' : ''}`}
                onClick={() => setSize('square')}
              >
                Cuadrado (2×2)
              </button>
              <button
                className={`controls-btn ${size === 'large' ? 'controls-btn--active' : ''}`}
                onClick={() => setSize('large')}
              >
                Grande (3×3)
              </button>
            </div>
          </div>

          <div className="controls-section">
            <span className="controls-label">3. Días de Racha ({streakDays} días)</span>
            <div className="controls-slider-row">
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

          <div
            style={{
              marginTop: '16px',
              padding: '14px',
              borderRadius: '14px',
              background: 'rgba(229, 197, 115, 0.08)',
              border: '1px solid rgba(229, 197, 115, 0.2)',
              fontSize: '12px',
              color: '#d4d4d8',
              lineHeight: 1.5,
            }}
          >
            ✨ <strong>Ya integrado en el APK nativo de Android:</strong>
            <br />
            Las 3 ilustraciones ya están compiladas dentro de{' '}
            <code style={{ color: '#e5c573' }}>drawable-nodpi/</code> con esquinas redondeadas
            suaves para que se vea exactamente igual en tu teléfono.
          </div>
        </div>
      </div>
    </div>
  );
}
