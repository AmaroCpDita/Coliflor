// ============================================================
// Coliflor — Interactive Android Home Screen Widget Previewer
// ============================================================

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './WidgetPreview.css';

type WidgetStyle = 'bar' | 'card';
type WidgetState = 'completed' | 'pending' | 'urgent';

export default function WidgetPreview() {
  const [style, setStyle] = useState<WidgetStyle>('bar');
  const [widgetState, setWidgetState] = useState<WidgetState>('pending');
  const [streakDays, setStreakDays] = useState<number>(34);
  const [partnerName, setPartnerName] = useState<string>('Dita');
  const [accentColor, setAccentColor] = useState<string>('#E5C573');
  const [clickedFeedback, setClickedFeedback] = useState<string | null>(null);

  const isCompleted = widgetState === 'completed';
  const isUrgent = widgetState === 'urgent';

  const handleWidgetClick = () => {
    setClickedFeedback('🚀 ¡Abriendo Coliflor en la sección de Racha!');
    setTimeout(() => setClickedFeedback(null), 2500);
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
        <h1>Simulador del Widget de Pantalla de Inicio</h1>
        <p>
          Así es exactamente como se ve el widget nativo en el escritorio de tu celular (fuera de la
          app). Modifica los controles para probar diferentes estados y diseños.
        </p>
      </div>

      <div className="widget-preview-layout">
        {/* PHONE DESKTOP SIMULATOR */}
        <div className="phone-mockup">
          <div className="phone-wallpaper" />
          <div className="phone-wallpaper-overlay" />

          {/* Android Status Bar */}
          <div className="phone-status-bar">
            <span>22:15</span>
            <div className="phone-punchhole" />
            <span>📶 5G 🔋 88%</span>
          </div>

          {/* Home Screen Area */}
          <div className="phone-desktop">
            {/* Clock Widget */}
            <div className="phone-clock-widget">
              <div className="phone-clock-time">22:15</div>
              <div className="phone-clock-date">Lunes, 23 de Noviembre</div>
            </div>

            {/* THE WIDGET SLOT */}
            <div className="widget-slot" onClick={handleWidgetClick}>
              {style === 'bar' ? (
                // Style 1: Horizontal Bar
                <div
                  className="android-widget-bar"
                  style={{
                    borderColor: isCompleted ? '#4ade80' : isUrgent ? '#ef4444' : accentColor,
                  }}
                >
                  <div className="android-widget-left">
                    <div className="android-widget-icon">🔥</div>
                    <div className="android-widget-titles">
                      <div className="android-widget-title">{streakDays} días de racha</div>
                      <div
                        className="android-widget-subtitle"
                        style={{
                          color: isCompleted ? '#4ade80' : isUrgent ? '#ef4444' : accentColor,
                        }}
                      >
                        {isCompleted
                          ? '✓ ¡Racha activada hoy!'
                          : isUrgent
                            ? '🚨 ¡Quedan 45m para salvarla!'
                            : '⏳ Quedan 5h 45m hoy'}
                      </div>
                    </div>
                  </div>

                  <button
                    className={`android-widget-btn ${
                      isCompleted ? 'android-widget-btn--done' : 'android-widget-btn--action'
                    }`}
                  >
                    {isCompleted ? 'VER' : 'SUBIR'}
                  </button>
                </div>
              ) : (
                // Style 2: Duolingo Square Card
                <div
                  className={`android-widget-card ${
                    isCompleted ? 'android-widget-card--done' : ''
                  }`}
                  style={{
                    borderColor: isCompleted ? '#4ade80' : isUrgent ? '#ef4444' : accentColor,
                  }}
                >
                  <div className="android-widget-card-flame">🔥</div>
                  <div className="android-widget-card-count">{streakDays}</div>
                  <div
                    style={{
                      fontSize: '10px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: '#a1a1aa',
                      fontWeight: 800,
                    }}
                  >
                    Días Juntos
                  </div>

                  <div
                    className="android-widget-card-status"
                    style={{
                      color: isCompleted ? '#4ade80' : isUrgent ? '#ef4444' : accentColor,
                    }}
                  >
                    {isCompleted
                      ? '✓ Racha activada hoy'
                      : isUrgent
                        ? '🚨 Quedan 45m'
                        : '⏳ Falta tu foto'}
                  </div>

                  <button
                    className={`android-widget-btn ${
                      isCompleted ? 'android-widget-btn--done' : 'android-widget-btn--action'
                    }`}
                    style={{ width: '100%' }}
                  >
                    {isCompleted ? 'VER FOTOS' : 'SUBIR AHORA'}
                  </button>
                </div>
              )}
            </div>

            {/* Click Toast Simulator */}
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
                  margin: '0 auto',
                  border: '1px solid rgba(255,255,255,0.2)',
                  animation: 'slideUpNotifier 0.2s ease',
                }}
              >
                {clickedFeedback}
              </div>
            )}

            {/* Desktop Icons */}
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

            {/* Bottom Dock */}
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
            <span className="controls-label">1. Estilo del Widget</span>
            <div className="controls-btn-group">
              <button
                className={`controls-btn ${style === 'bar' ? 'controls-btn--active' : ''}`}
                onClick={() => setStyle('bar')}
              >
                Barra Clásica (3x1)
              </button>
              <button
                className={`controls-btn ${style === 'card' ? 'controls-btn--active' : ''}`}
                onClick={() => setStyle('card')}
              >
                Tarjeta Duolingo (2x2)
              </button>
            </div>
          </div>

          <div className="controls-section">
            <span className="controls-label">2. Estado de la Racha</span>
            <div className="controls-btn-group" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <button
                className={`controls-btn ${widgetState === 'completed' ? 'controls-btn--active' : ''}`}
                onClick={() => setWidgetState('completed')}
              >
                ✓ Activada
              </button>
              <button
                className={`controls-btn ${widgetState === 'pending' ? 'controls-btn--active' : ''}`}
                onClick={() => setWidgetState('pending')}
              >
                ⏳ Pendiente
              </button>
              <button
                className={`controls-btn ${widgetState === 'urgent' ? 'controls-btn--active' : ''}`}
                onClick={() => setWidgetState('urgent')}
              >
                🚨 Urgente
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

          <div className="controls-section">
            <span className="controls-label">4. Color de Acento</span>
            <div className="controls-btn-group" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              <button
                className="controls-btn"
                style={{ background: '#E5C573', color: '#000' }}
                onClick={() => setAccentColor('#E5C573')}
              >
                Oro
              </button>
              <button
                className="controls-btn"
                style={{ background: '#FB923C', color: '#000' }}
                onClick={() => setAccentColor('#FB923C')}
              >
                Fuego
              </button>
              <button
                className="controls-btn"
                style={{ background: '#F43F5E', color: '#fff' }}
                onClick={() => setAccentColor('#F43F5E')}
              >
                Amor
              </button>
              <button
                className="controls-btn"
                style={{ background: '#A855F7', color: '#fff' }}
                onClick={() => setAccentColor('#A855F7')}
              >
                Místico
              </button>
            </div>
          </div>

          <div
            style={{
              marginTop: '24px',
              padding: '14px',
              borderRadius: '14px',
              background: 'rgba(255,255,255,0.04)',
              fontSize: '12px',
              color: '#a1a1aa',
              lineHeight: 1.5,
            }}
          >
            💡 <strong>¿Cómo funciona?</strong>
            <br />
            Este simulador refleja exactamente los componentes del layout XML nativo de Android (
            <code style={{ color: '#e5c573' }}>widget_streak.xml</code>). Cualquier detalle que
            quieras cambiar (texto, tamaño del fuego, bordes, colores, etc.), solo dime y lo
            ajustamos de inmediato.
          </div>
        </div>
      </div>
    </div>
  );
}
