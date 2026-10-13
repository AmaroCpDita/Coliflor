import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
import type { Message } from '../lib/types';
import {
  formatNotificationTime,
  groupNotificationsByDate,
  parseNotification,
} from '../lib/notifications';
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

function Bell() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
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
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const closeCallbackRef = useRef(onClose);
  closeCallbackRef.current = onClose;
  const reducedMotion = useReducedMotion();
  const filtered = filter === 'unread' ? logs.filter((log) => unreadIds.has(log.id)) : logs;
  const groups = groupNotificationsByDate(filtered);

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
      if (event.key !== 'Tab') return;
      const controls = panelRef.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), a[href], [tabindex="0"]',
      );
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (!panelRef.current?.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
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
        <header className="notification-header">
          <div className="notification-header__icon">
            <Bell />
            <span />
          </div>
          <button
            ref={closeRef}
            type="button"
            className="notification-icon-button"
            onClick={onClose}
            aria-label="Cerrar notificaciones"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              aria-hidden="true"
            >
              <path d="m6 6 12 12M6 18 18 6" />
            </svg>
          </button>
          <span className="notification-eyebrow">Su pequeño mundo</span>
          <h2 id="notification-title">Notificaciones</h2>
          <p>Los detalles que los acercan, en un solo lugar.</p>
          <div className="notification-summary">
            <span className={unreadIds.size ? 'notification-summary__new' : ''}>
              <span className="notification-status-dot" />
              {unreadIds.size
                ? `${unreadIds.size} ${unreadIds.size === 1 ? 'aviso sin leer' : 'avisos sin leer'}`
                : 'Estás al día'}
            </span>
            {unreadIds.size > 0 && (
              <button type="button" onClick={onReadAll}>
                Marcar como leídas <span aria-hidden="true">✓</span>
              </button>
            )}
          </div>
        </header>

        <div className="notification-toolbar">
          <div className="notification-filters" role="group" aria-label="Filtrar notificaciones">
            <button type="button" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
              Todas <span>{logs.length}</span>
            </button>
            <button
              type="button"
              aria-pressed={filter === 'unread'}
              onClick={() => setFilter('unread')}
            >
              Sin leer <span>{unreadIds.size}</span>
            </button>
          </div>
          {logs.length > 0 && (
            <button
              type="button"
              className="notification-clear"
              onClick={onClear}
              title="Limpiar la bandeja en este dispositivo"
            >
              Limpiar
            </button>
          )}
        </div>

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
                <span aria-hidden="true">✦</span>
              </div>
              <span className="notification-eyebrow">Un espacio para sus detalles</span>
              <h3>{filter === 'unread' ? 'Todo al día' : 'Lo bonito está por venir'}</h3>
              <p>
                {filter === 'unread'
                  ? 'Ya viste todas las novedades. Sigue creando recuerdos juntos.'
                  : `Aquí aparecerán las notitas, fotos y novedades que compartan tú y ${partnerName}.`}
              </p>
              {filter === 'unread' && logs.length > 0 && (
                <button
                  type="button"
                  className="notification-text-button"
                  onClick={() => setFilter('all')}
                >
                  Ver todas las notificaciones <span aria-hidden="true">→</span>
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
                            {unread && (
                              <span className="notification-unread-dot" aria-hidden="true" />
                            )}
                          </span>
                          <span className="notification-item__text">{notification.text}</span>
                          <span className="notification-item__details">
                            <span>{log.sender_id === viewerId ? 'Tú' : partnerName}</span>
                            <span aria-hidden="true">·</span>
                            <time dateTime={log.created_at}>
                              {formatNotificationTime(log.created_at)}
                            </time>
                          </span>
                        </span>
                        <span className="notification-item__arrow" aria-hidden="true">
                          ↗
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
        <footer className="notification-footer">
          <span aria-hidden="true">♡</span> Hecho de pequeños momentos juntos
        </footer>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
