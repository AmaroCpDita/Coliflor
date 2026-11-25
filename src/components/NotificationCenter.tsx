import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
import type { Message } from '../lib/types';
import {
  formatNotificationTime,
  groupNotificationsByDate,
  parseNotification,
} from '../lib/notifications';
import {
  checkNotificationPermission,
  requestNotificationPermission,
  sendTestNotification,
} from '../lib/localNotifications';
import './NotificationCenter.css';

interface NotificationCenterProps {
  logs: Message[];
  unreadIds: Set<string>;
  partnerName: string;
  viewerId?: string;
  loading?: boolean;
  error?: boolean;
  onClose: () => void;
  onReadAll: () => void;
  onClear: () => void;
  onDismiss: (id: string) => void;
  onOpen: (log: Message, route: string) => void;
  onRetry: () => void;
}

type FilterTab = 'all' | 'unread' | 'streak' | 'love' | 'calendar' | 'quiz';

function Bell() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M10 21h4" />
    </svg>
  );
}

export default function NotificationCenter({
  logs,
  unreadIds,
  partnerName,
  viewerId,
  loading,
  error,
  onClose,
  onReadAll,
  onClear,
  onDismiss,
  onOpen,
  onRetry,
}: NotificationCenterProps) {
  const [filter, setFilter] = useState<FilterTab>('all');
  const [deviceNotifEnabled, setDeviceNotifEnabled] = useState<boolean>(false);
  const [testSent, setTestSent] = useState<boolean>(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const closeCallbackRef = useRef(onClose);
  closeCallbackRef.current = onClose;
  const reducedMotion = useReducedMotion();

  // Check real device notification status when panel opens
  useEffect(() => {
    checkNotificationPermission().then(setDeviceNotifEnabled);
  }, []);

  const handleToggleOrTestDeviceNotif = async () => {
    if (!deviceNotifEnabled) {
      const granted = await requestNotificationPermission();
      setDeviceNotifEnabled(granted);
      if (granted) {
        await sendTestNotification();
        setTestSent(true);
        setTimeout(() => setTestSent(false), 3000);
      }
    } else {
      const ok = await sendTestNotification();
      if (ok) {
        setTestSent(true);
        setTimeout(() => setTestSent(false), 3000);
      }
    }
  };

  // Pre-parse categories once for snappy filtering and counts
  const parsedLogs = useMemo(
    () => logs.map((log) => ({ log, parsed: parseNotification(log.content) })),
    [logs],
  );

  const counts = useMemo(() => {
    let streak = 0;
    let love = 0;
    let calendar = 0;
    let quiz = 0;
    for (const item of parsedLogs) {
      const cat = item.parsed.category;
      if (cat === 'streak' || cat === 'photo' || cat === 'care') streak += 1;
      else if (cat === 'love') love += 1;
      else if (cat === 'calendar') calendar += 1;
      else if (cat === 'quiz') quiz += 1;
    }
    return { streak, love, calendar, quiz };
  }, [parsedLogs]);

  const filtered = useMemo(() => {
    return parsedLogs
      .filter(({ log, parsed }) => {
        if (filter === 'all') return true;
        if (filter === 'unread') return unreadIds.has(log.id);
        if (filter === 'streak') {
          return (
            parsed.category === 'streak' ||
            parsed.category === 'photo' ||
            parsed.category === 'care'
          );
        }
        return parsed.category === filter;
      })
      .map((item) => item.log);
  }, [parsedLogs, filter, unreadIds]);

  const groups = useMemo(() => groupNotificationsByDate(filtered), [filtered]);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeCallbackRef.current();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKey);
      if (previous?.isConnected) previous.focus();
    };
  }, []);

  return createPortal(
    <motion.div
      className="notification-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.2 }}
      onClick={onClose}
    >
      <motion.div
        ref={panelRef}
        className="notification-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-title"
        onClick={(event) => event.stopPropagation()}
        initial={reducedMotion ? { opacity: 0 } : { opacity: 0, x: 40, scale: 0.98 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: 24 }}
        transition={{ duration: reducedMotion ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Compact, Clean Header */}
        <header className="notification-header notification-header--compact">
          <div className="notification-header__top-row">
            <div className="notification-header__title-group">
              <div className="notification-header__icon notification-header__icon--sm">
                <Bell />
                {unreadIds.size > 0 && <span />}
              </div>
              <div>
                <h2 id="notification-title">Notificaciones</h2>
                <span className="notification-header__subtitle">
                  {unreadIds.size
                    ? `${unreadIds.size} ${unreadIds.size === 1 ? 'aviso sin leer' : 'avisos sin leer'}`
                    : 'Todo al día'}
                </span>
              </div>
            </div>

            <button
              ref={closeRef}
              type="button"
              className="notification-icon-button notification-icon-button--inline"
              onClick={onClose}
              aria-label="Cerrar notificaciones"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path d="m6 6 12 12M6 18 18 6" />
              </svg>
            </button>
          </div>

          {/* Native Phone Notification Status & 1-Tap Test Strip */}
          <div
            className={`notification-device-bar ${deviceNotifEnabled ? 'notification-device-bar--active' : 'notification-device-bar--off'}`}
          >
            <div className="notification-device-bar__info">
              <span className="notification-device-bar__dot" />
              <span>
                {testSent
                  ? 'Notificación enviada al celular'
                  : deviceNotifEnabled
                    ? 'Avisos del celular activos'
                    : 'Avisos del celular desactivados'}
              </span>
            </div>
            <button
              type="button"
              className="notification-device-bar__btn"
              onClick={handleToggleOrTestDeviceNotif}
            >
              {deviceNotifEnabled ? 'Probar' : 'Activar'}
            </button>
          </div>
        </header>

        {/* Organized Category Chips + Bulk Actions */}
        <div className="notification-toolbar notification-toolbar--stacked">
          <div
            className="notification-chips"
            role="group"
            aria-label="Filtrar notificaciones por categoría"
          >
            <button
              type="button"
              className={`notification-chip ${filter === 'all' ? 'notification-chip--active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Todas <span>{logs.length}</span>
            </button>
            <button
              type="button"
              className={`notification-chip ${filter === 'unread' ? 'notification-chip--active' : ''}`}
              onClick={() => setFilter('unread')}
            >
              Sin leer <span>{unreadIds.size}</span>
            </button>
            <button
              type="button"
              className={`notification-chip ${filter === 'streak' ? 'notification-chip--active' : ''}`}
              onClick={() => setFilter('streak')}
            >
              Racha y fotos {counts.streak > 0 && <span>{counts.streak}</span>}
            </button>
            <button
              type="button"
              className={`notification-chip ${filter === 'love' ? 'notification-chip--active' : ''}`}
              onClick={() => setFilter('love')}
            >
              Notitas {counts.love > 0 && <span>{counts.love}</span>}
            </button>
            <button
              type="button"
              className={`notification-chip ${filter === 'calendar' ? 'notification-chip--active' : ''}`}
              onClick={() => setFilter('calendar')}
            >
              Calendario {counts.calendar > 0 && <span>{counts.calendar}</span>}
            </button>
            <button
              type="button"
              className={`notification-chip ${filter === 'quiz' ? 'notification-chip--active' : ''}`}
              onClick={() => setFilter('quiz')}
            >
              Quiz {counts.quiz > 0 && <span>{counts.quiz}</span>}
            </button>
          </div>

          {(unreadIds.size > 0 || logs.length > 0) && (
            <div className="notification-actions-row">
              {unreadIds.size > 0 ? (
                <button type="button" className="notification-action-link" onClick={onReadAll}>
                  Marcar todas leídas ✓
                </button>
              ) : (
                <span />
              )}
              {logs.length > 0 && (
                <button
                  type="button"
                  className="notification-clear"
                  onClick={onClear}
                  title="Limpiar la bandeja en este dispositivo"
                >
                  Limpiar bandeja
                </button>
              )}
            </div>
          )}
        </div>

        {/* Feed Grouped by Date */}
        <div className="notification-feed" aria-busy={loading || undefined}>
          {loading && logs.length === 0 ? (
            <div
              className="notification-loading"
              role="status"
              aria-label="Cargando notificaciones"
            >
              {[0, 1, 2].map((item) => (
                <div className="notification-skeleton" key={item}>
                  <span />
                  <div>
                    <i />
                    <i />
                  </div>
                </div>
              ))}
            </div>
          ) : error && logs.length === 0 ? (
            <div className="notification-empty" role="status">
              <div className="notification-empty__icon">
                <Bell />
              </div>
              <h3>No pudimos cargar tus avisos</h3>
              <p>Vuelve a intentarlo para ver las últimas novedades.</p>
              <button type="button" className="btn btn--secondary btn--sm" onClick={onRetry}>
                Reintentar
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="notification-empty" role="status">
              <div className="notification-empty__icon">
                <Bell />
              </div>
              <h3>{filter === 'all' ? 'Sin novedades por ahora' : 'Nada en esta categoría'}</h3>
              <p>
                {filter === 'unread'
                  ? 'Ya viste todas las notificaciones.'
                  : filter === 'all'
                    ? `Aquí aparecerán las fotos, notitas y recuerdos que compartan tú y ${partnerName}.`
                    : 'No hay avisos recientes en este filtro.'}
              </p>
              {filter !== 'all' && logs.length > 0 && (
                <button
                  type="button"
                  className="notification-text-button"
                  onClick={() => setFilter('all')}
                >
                  Ver todas las notificaciones →
                </button>
              )}
            </div>
          ) : (
            groups.map(([label, items]) => (
              <section className="notification-group" key={label} aria-label={label}>
                <div className="notification-group__heading">
                  <h3>{label}</h3>
                  <span>{items.length}</span>
                  <i />
                </div>
                {items.map((log) => {
                  const notification = parseNotification(log.content);
                  const unread = unreadIds.has(log.id);
                  return (
                    <article
                      className={`notification-item notification-item--${notification.category}${unread ? ' notification-item--unread' : ''}`}
                      key={log.id}
                    >
                      <button
                        type="button"
                        className="notification-item__open"
                        onClick={() => onOpen(log, notification.route)}
                        aria-label={`${unread ? 'Sin leer. ' : ''}${notification.label}: ${notification.text}`}
                      >
                        <span className="notification-item__icon" aria-hidden="true">
                          {notification.icon}
                        </span>
                        <span className="notification-item__body">
                          <span className="notification-item__meta">
                            <strong>{notification.label}</strong>
                            <time dateTime={log.created_at}>
                              {formatNotificationTime(log.created_at)}
                            </time>
                          </span>
                          <span className="notification-item__text">{notification.text}</span>
                          <span className="notification-item__details">
                            <span>{log.sender_id === viewerId ? 'Tú' : partnerName}</span>
                            {unread && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="notification-unread-tag">Nuevo</span>
                              </>
                            )}
                          </span>
                        </span>
                      </button>
                      <button
                        type="button"
                        className="notification-item__dismiss"
                        onClick={() => onDismiss(log.id)}
                        aria-label={`Quitar aviso: ${notification.label}`}
                        title="Quitar este aviso"
                      >
                        ×
                      </button>
                    </article>
                  );
                })}
              </section>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
