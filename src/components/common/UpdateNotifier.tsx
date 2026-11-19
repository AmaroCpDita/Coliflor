// ============================================================
// Coliflor — App Update Notifier (AntiAgg Architecture)
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { CURRENT_APP_VERSION, VERSION_MANIFEST_URL, AppVersionInfo } from '../../config/version';
import './UpdateNotifier.css';

function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// Inline SVG Icons for clean rendering without external dependencies
function IconDownload() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function IconSparkles() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconRefresh({ spinning = false }: { spinning?: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={spinning ? { animation: 'spinIcon 1s linear infinite' } : undefined}
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 21h5v-5" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#4ade80"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export const UpdateNotifier: React.FC = () => {
  const [remoteUpdate, setRemoteUpdate] = useState<AppVersionInfo | null>(null);
  const [dismissed, setDismissed] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const isIos = isIosDevice();

  const checkForUpdates = useCallback(async (isManual = false) => {
    try {
      // 1. Try Vercel public URL
      let response = await fetch(`${VERSION_MANIFEST_URL}?_t=${Date.now()}`, {
        cache: 'no-store',
      });

      // 2. Fallback to relative path if on web
      if (!response.ok) {
        response = await fetch(`/version.json?_t=${Date.now()}`, { cache: 'no-store' });
      }

      if (!response.ok) return;

      const data: AppVersionInfo = await response.json();
      if (data && data.versionCode > CURRENT_APP_VERSION.versionCode) {
        // If manual check, clear any previous snooze
        if (isManual) {
          localStorage.removeItem('coliflor_update_snooze');
        } else {
          const snoozeTime = localStorage.getItem('coliflor_update_snooze');
          if (snoozeTime && Date.now() < parseInt(snoozeTime, 10)) {
            return;
          }
        }
        setRemoteUpdate(data);
        setDismissed(false);
      } else {
        setRemoteUpdate(null);
      }
    } catch {
      // Offline or network error: fail silently
    }
  }, []);

  useEffect(() => {
    // Initial check after 2 seconds
    const timer = setTimeout(() => {
      checkForUpdates(false);
    }, 2000);

    // Listen to manual check triggers
    const handleManualCheck = () => checkForUpdates(true);
    window.addEventListener('coliflor:check-update', handleManualCheck);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('coliflor:check-update', handleManualCheck);
    };
  }, [checkForUpdates]);

  const handleDismiss = () => {
    setDismissed(true);
    // Snooze for 12 hours
    const twelveHoursLater = Date.now() + 12 * 60 * 60 * 1000;
    localStorage.setItem('coliflor_update_snooze', twelveHoursLater.toString());
  };

  const handleInstallUpdate = () => {
    if (!remoteUpdate) return;
    setIsDownloading(true);

    const targetUrl = isIos
      ? remoteUpdate.ipaUrl ||
        remoteUpdate.fallbackIpaUrl ||
        'https://coliflor.vercel.app/Coliflor.ipa'
      : remoteUpdate.apkUrl ||
        remoteUpdate.fallbackApkUrl ||
        'https://coliflor.vercel.app/Coliflor.apk';

    const fileName = isIos ? 'Coliflor.ipa' : 'Coliflor.apk';

    // Direct download trigger
    const link = document.createElement('a');
    link.href = targetUrl;
    link.download = fileName;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setIsDownloading(false);
    }, 4000);
  };

  if (!remoteUpdate || dismissed) return null;

  return (
    <div className="update-notifier-container">
      <div className="update-notifier-card">
        {/* Glowing top line */}
        <div className="update-notifier-card__glow-line" />

        <div className="update-notifier-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                padding: '8px',
                borderRadius: '12px',
                background: 'rgba(229, 197, 115, 0.15)',
                color: 'var(--color-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconSparkles />
            </div>
            <div>
              <div className="update-notifier-badge-row">
                <span className="update-notifier-pill">Actualización Disponible</span>
                <span className="update-notifier-version">v{remoteUpdate.version}</span>
              </div>
              <p className="update-notifier-title">
                {isIos ? 'Nueva versión .IPA para iPhone' : 'Nueva versión de Coliflor lista'}
              </p>
            </div>
          </div>

          <button onClick={handleDismiss} className="update-notifier-close-btn" title="Posponer">
            <IconClose />
          </button>
        </div>

        {remoteUpdate.changelog && (
          <div className="update-notifier-changelog">
            <span className="label">Novedades en Vercel:</span>
            {remoteUpdate.changelog}
          </div>
        )}

        <div className="update-notifier-actions">
          <button
            onClick={handleInstallUpdate}
            disabled={isDownloading}
            className="update-notifier-btn-install"
          >
            <IconDownload />
            <span>
              {isDownloading
                ? 'Descargando...'
                : isIos
                  ? 'Descargar Coliflor.ipa'
                  : 'Descargar e Instalar APK'}
            </span>
          </button>

          <button onClick={handleDismiss} className="update-notifier-btn-later">
            Más tarde
          </button>
        </div>
      </div>
    </div>
  );
};

// Standalone manual check button for Settings
export const UpdateCheckButton: React.FC = () => {
  const [checking, setChecking] = useState<boolean>(false);
  const [status, setStatus] = useState<'idle' | 'up-to-date' | 'update-found' | 'error'>('idle');
  const [foundVersion, setFoundVersion] = useState<AppVersionInfo | null>(null);
  const isIos = isIosDevice();

  const check = async () => {
    setChecking(true);
    setStatus('idle');
    try {
      let res = await fetch(`${VERSION_MANIFEST_URL}?_t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) {
        res = await fetch(`/version.json?_t=${Date.now()}`, { cache: 'no-store' });
      }

      if (res.ok) {
        const data: AppVersionInfo = await res.json();
        if (data && data.versionCode > CURRENT_APP_VERSION.versionCode) {
          setStatus('update-found');
          setFoundVersion(data);
          localStorage.removeItem('coliflor_update_snooze');
          window.dispatchEvent(new CustomEvent('coliflor:check-update'));
        } else {
          setStatus('up-to-date');
          setFoundVersion(data);
        }
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    } finally {
      setChecking(false);
    }
  };

  const handleDirectDownload = () => {
    if (!foundVersion) return;
    const targetUrl = isIos
      ? foundVersion.ipaUrl ||
        foundVersion.fallbackIpaUrl ||
        'https://coliflor.vercel.app/Coliflor.ipa'
      : foundVersion.apkUrl ||
        foundVersion.fallbackApkUrl ||
        'https://coliflor.vercel.app/Coliflor.apk';

    const link = document.createElement('a');
    link.href = targetUrl;
    link.download = isIos ? 'Coliflor.ipa' : 'Coliflor.apk';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="update-settings-card">
      <div className="update-settings-info">
        <div className="update-settings-title-row">
          <span className="update-settings-title">Actualizaciones de la App</span>
          <span className="update-settings-badge">v{CURRENT_APP_VERSION.version}</span>
          {isIos && (
            <span style={{ fontSize: '10px', color: '#60a5fa', fontWeight: 700 }}>iOS .IPA</span>
          )}
        </div>
        <p className="update-settings-desc">
          Comprueba en Vercel si hay una versión más reciente con nuevas funciones.
        </p>
      </div>

      <div className="update-settings-controls">
        {status === 'up-to-date' && (
          <span className="update-settings-status-text update-settings-status-text--ok">
            <IconCheck />
            <span>Al día (v{CURRENT_APP_VERSION.version})</span>
          </span>
        )}

        {status === 'error' && (
          <span className="update-settings-status-text update-settings-status-text--error">
            <span>Sin conexión a Vercel</span>
          </span>
        )}

        {status === 'update-found' && foundVersion && (
          <button onClick={handleDirectDownload} className="update-settings-btn-action">
            <IconDownload />
            <span>Instalar v{foundVersion.version}</span>
          </button>
        )}

        <button onClick={check} disabled={checking} className="update-settings-btn-check">
          <IconRefresh spinning={checking} />
          <span>{checking ? 'Buscando...' : 'Comprobar'}</span>
        </button>
      </div>
    </div>
  );
};

export default UpdateNotifier;
