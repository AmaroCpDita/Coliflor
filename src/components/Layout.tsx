// ============================================================
// Coliflor — Layout Component (Clean 5-Tab Navigation & Triple Realtime Push Notification Engine)
// ============================================================

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import NotificationCenter from './NotificationCenter';
import { useNotificationInbox } from '../hooks/useNotificationInbox';
import { isActivityNotification } from '../lib/notifications';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Message } from '../lib/types';
import {
  requestNotificationPermission,
  checkNotificationPermission,
} from '../lib/localNotifications';
import { UpdateNotifier } from './common/UpdateNotifier';

function IconHome({ active }: { active: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? '2.2' : '1.8'}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function IconStreak({ active }: { active: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? '2.2' : '1.8'}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

function IconQuiz({ active }: { active: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? '2.2' : '1.8'}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

function IconCalendar({ active }: { active: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? '2.2' : '1.8'}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconMessages({ active }: { active: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? '2.2' : '1.8'}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function IconBellHeader() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--color-accent)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function IconMenu() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
  );
}

function IconClose() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}

function IconMapNav({ active }: { active?: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? '2.2' : '1.8'}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  );
}

function IconBucketList({ active }: { active?: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? '2.2' : '1.8'}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="10.61,2.10 13.39,2.10 13.88,4.74 15.81,5.54 18.02,4.01 19.99,5.98 18.46,8.19 19.26,10.12 21.90,10.61 21.90,13.39 19.26,13.88 18.46,15.81 19.99,18.02 18.02,19.99 15.81,18.46 13.88,19.26 13.39,21.90 10.61,21.90 10.12,19.26 8.19,18.46 5.98,19.99 4.01,18.02 5.54,15.81 4.74,13.88 2.10,13.39 2.10,10.61 4.74,10.12 5.54,8.19 4.01,5.98 5.98,4.01 8.19,5.54 10.12,4.74" />
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  );
}

function IconWorld({ active }: { active?: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? '2.2' : '1.8'}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      <path d="M2 12h20" />
    </svg>
  );
}

const NAV_ITEMS = [
  { path: '/', label: 'Inicio', icon: IconHome },
  { path: '/streak', label: 'Racha', icon: IconStreak },
  { path: '/quiz', label: 'Quiz', icon: IconQuiz },
  { path: '/calendar', label: 'Calendario', icon: IconCalendar },
  { path: '/world', label: 'Mundo', icon: IconWorld },
  { path: '/bucket-list', label: 'Metas', icon: IconBucketList },
  { path: '/map', label: 'Mapa', icon: IconMapNav },
  { path: '/messages', label: 'Chat', icon: IconMessages },
];

export default function Layout() {
  const { couple, profile, partner, isMockMode } = useAuth();
  const partnerName = partner ? partner.display_name : 'Tu pareja';

  const [showNotifCenter, setShowNotifCenter] = useState(false);
  const [activityLogs, setActivityLogs] = useState<Message[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationsError, setNotificationsError] = useState(false);
  const inbox = useNotificationInbox(
    activityLogs,
    `coliflor_notifications:${couple?.id || 'none'}:${profile?.id || 'guest'}`,
    profile?.id,
  );
  const { hasUnread } = inbox;
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const dockRef = useRef<HTMLElement>(null);

  // 1. Center the active item whenever the route changes using a custom premium easing
  useEffect(() => {
    if (!dockRef.current) return;

    const activeItem = dockRef.current.querySelector('.dock-item--active') as HTMLElement;
    if (activeItem) {
      const targetLeft =
        activeItem.offsetLeft + activeItem.offsetWidth / 2 - dockRef.current.offsetWidth / 2;
      const startLeft = dockRef.current.scrollLeft;
      const distance = targetLeft - startLeft;
      let startTime: number | null = null;
      const duration = 700; // 700ms for a relaxed, premium glide

      const animation = (currentTime: number) => {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);

        // easeOutQuart
        const ease = 1 - Math.pow(1 - progress, 4);

        if (dockRef.current) {
          dockRef.current.scrollLeft = startLeft + distance * ease;
        }

        if (timeElapsed < duration) {
          requestAnimationFrame(animation);
        }
      };

      requestAnimationFrame(animation);
    }
  }, [location.pathname]);

  const profileIdRef = useRef(profile?.id);
  const coupleRef = useRef(couple);
  const partnerRef = useRef(partner);
  const partnerNameRef = useRef(partnerName);
  const notifiedIdsSetRef = useRef(new Set<string>());

  useEffect(() => {
    profileIdRef.current = profile?.id;
    coupleRef.current = couple;
    partnerRef.current = partner;
    partnerNameRef.current = partnerName;
  }, [profile?.id, couple, partner, partnerName]);

  // Detect input focus to hide the floating dock when virtual keyboard is open
  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') {
        setIsKeyboardOpen(true);
      }
    };

    const handleBlur = () => {
      setIsKeyboardOpen(false);
    };

    window.addEventListener('focusin', handleFocus);
    window.addEventListener('focusout', handleBlur);

    // Also use visualViewport as a fallback/enhancement for Android/iOS
    const handleResize = () => {
      if (!window.visualViewport) return;
      const isShrunk = window.visualViewport.height < window.innerHeight - 150;
      setIsKeyboardOpen(isShrunk || document.activeElement?.tagName === 'INPUT');
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }

    return () => {
      window.removeEventListener('focusin', handleFocus);
      window.removeEventListener('focusout', handleBlur);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  // OneSignal User Login & Web Push Permission Binding
  useEffect(() => {
    if (profile?.id && typeof window !== 'undefined') {
      const win = window as any;
      if (win.OneSignalDeferred) {
        win.OneSignalDeferred.push(async function (OneSignal: any) {
          try {
            await OneSignal.login(profile.id);
            if (OneSignal.Notifications && !OneSignal.Notifications.permission) {
              await OneSignal.Notifications.requestPermission();
            }
          } catch (e) {
            console.warn('OneSignal binding error:', e);
          }
        });
      }
    }
  }, [profile?.id]);

  // Native Mobile Local Notifications, Widget Deep-Link Navigation & App State Lifecycle
  useEffect(() => {
    const handleWidgetNavigate = (event: Event) => {
      const route = (event as CustomEvent<string>).detail;
      if (typeof route === 'string' && route.startsWith('/')) {
        navigate(route);
      }
    };
    window.addEventListener('coliflor:navigate', handleWidgetNavigate);

    if (Capacitor.isNativePlatform()) {
      requestNotificationPermission();

      const listenerPromise = App.addListener('appStateChange', (state) => {
        if (state.isActive) {
          checkNotificationPermission();
        }
      });

      return () => {
        window.removeEventListener('coliflor:navigate', handleWidgetNavigate);
        listenerPromise.then((handle) => handle.remove());
      };
    }

    return () => {
      window.removeEventListener('coliflor:navigate', handleWidgetNavigate);
    };
  }, [navigate]);

  // Keep the inbox in sync without altering the underlying chat history.
  const fetchActivityLogs = useCallback(async () => {
    const coupleId = couple?.id;
    if (!coupleId || isMockMode) {
      setNotificationsLoading(false);
      return;
    }
    setNotificationsLoading(true);
    setNotificationsError(false);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('couple_id', coupleId)
        .or(
          'content.like.💌%,content.like.📅%,content.like.📸%,content.like.🩹%,content.like.🔥%,content.like.📊%',
        )
        .order('created_at', { ascending: false })
        .limit(50);
      if (coupleRef.current?.id !== coupleId) return;
      if (error) throw error;
      setActivityLogs(
        (data || []).filter(
          (message) => !message.is_deleted && isActivityNotification(message.content),
        ) as Message[],
      );
    } catch (error) {
      if (coupleRef.current?.id === coupleId) setNotificationsError(true);
      console.warn('Error fetching activity logs:', error);
    } finally {
      if (coupleRef.current?.id === coupleId) setNotificationsLoading(false);
    }
  }, [couple?.id, isMockMode]);

  useEffect(() => {
    setActivityLogs([]);
    void fetchActivityLogs();
    if (!couple?.id || isMockMode) return;
    const timer = setInterval(() => void fetchActivityLogs(), 5000);
    return () => clearInterval(timer);
  }, [fetchActivityLogs, couple?.id, isMockMode]);

  const getPartnerNickname = useCallback(() => {
    const c = coupleRef.current;
    const isUser1 = c ? c.user1_id === profileIdRef.current : true;
    const dbNickname = isUser1 ? c?.user1_partner_nickname : c?.user2_partner_nickname;
    return (
      dbNickname ||
      localStorage.getItem('partner_nickname_' + (partnerRef.current?.id || 'default')) ||
      partnerNameRef.current
    );
  }, []);

  // Play distinctive romantic champagne arpeggio chime (C6 -> E6 -> G6)
  const playNotificationChime = useCallback(() => {
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.7;
      audio.play().catch(() => {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();

        const notes = [1046.5, 1318.51, 1567.98]; // C6, E6, G6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

          gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.3);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(ctx.currentTime + idx * 0.08);
          osc.stop(ctx.currentTime + idx * 0.08 + 0.3);
        });
      });
    } catch {
      // Non-fatal
    }
  }, []);

  // Global In-App Notification Trigger (Works when app is open or softly backgrounded)
  const triggerGlobalNotification = useCallback(
    (sender: string, text: string) => {
      playNotificationChime();

      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

      // Cross-tab deduplication: prevent loop if multiple tabs are open
      const notifKey = `coliflor_last_notif_${Date.now()}`;
      const recentNotif = localStorage.getItem('coliflor_last_notif_time');
      if (recentNotif && Date.now() - parseInt(recentNotif) < 2000) return; // Debounce 2 seconds across tabs
      localStorage.setItem('coliflor_last_notif_time', Date.now().toString());

      const notifOptions = {
        body: text,
        icon: '/logo.png',
        badge: '/logo.png',
        vibrate: [200, 100, 200, 100, 200],
        tag: 'coliflor-notif',
        renotify: true,
        data: { url: '/messages' },
      };

      try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
          navigator.serviceWorker.ready
            .then((reg) => {
              reg.showNotification(`💛 ${sender}`, notifOptions as any);
            })
            .catch(() => {
              new Notification(`💛 ${sender}`, notifOptions);
            });
        } else {
          new Notification(`💛 ${sender}`, notifOptions);
        }
      } catch (e) {
        console.warn('Global notification error:', e);
      }
    },
    [playNotificationChime],
  );

  const processIncomingMessage = useCallback(
    (msg: any) => {
      try {
        if (!msg || !msg.id || !profileIdRef.current) return;

        const isSystem = isActivityNotification(msg.content);

        if (isSystem) {
          setActivityLogs((prev) => [msg, ...prev.filter((p) => p.id !== msg.id)]);
        }

        if (msg.sender_id === profileIdRef.current) return;

        // STRICT DEDUPLICATION: If already notified once, return immediately
        if (notifiedIdsSetRef.current.has(msg.id)) return;
        notifiedIdsSetRef.current.add(msg.id);

        const partnerNickname = getPartnerNickname();
        triggerGlobalNotification(partnerNickname, msg.content);
      } catch (err) {
        console.warn('Error processing notification:', err);
      }
    },
    [getPartnerNickname, triggerGlobalNotification],
  );

  // Triple Realtime Listener for live incoming messages, calendar_events, and couples tables
  useEffect(() => {
    if (!couple?.id || isMockMode) return;

    // 1. Messages Realtime Channel
    const msgChannel = supabase
      .channel(`global-msg-notifs-${couple.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `couple_id=eq.${couple.id}`,
        },
        (payload) => {
          processIncomingMessage(payload.new);
        },
      )
      .subscribe();

    // 2. Calendar Events Realtime Channel
    const calChannel = supabase
      .channel(`global-cal-notifs-${couple.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'calendar_events',
          filter: `couple_id=eq.${couple.id}`,
        },
        (payload) => {
          const evt = payload.new as any;
          if (evt && evt.created_by !== profileIdRef.current) {
            const calNotifKey = `cal_evt_${evt.id}`;
            if (!notifiedIdsSetRef.current.has(calNotifKey)) {
              notifiedIdsSetRef.current.add(calNotifKey);
              const partnerNickname = getPartnerNickname();
              triggerGlobalNotification(
                partnerNickname,
                `📅 ¡Agregó un evento al calendario: "${evt.title || 'Nuevo evento'}"!`,
              );
            }
          }
        },
      )
      .subscribe();

    // 3. Couple Notes Realtime Channel
    const noteChannel = supabase
      .channel(`global-note-notifs-${couple.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'couples', filter: `id=eq.${couple.id}` },
        (payload) => {
          const updatedCouple = payload.new as any;
          if (
            updatedCouple &&
            updatedCouple.daily_note_updated_by &&
            updatedCouple.daily_note_updated_by !== profileIdRef.current
          ) {
            const noteNotifKey = `note_upd_${updatedCouple.daily_note_updated_by}_${updatedCouple.daily_note}`;
            if (!notifiedIdsSetRef.current.has(noteNotifKey)) {
              notifiedIdsSetRef.current.add(noteNotifKey);
              const partnerNickname = getPartnerNickname();
              triggerGlobalNotification(
                partnerNickname,
                `💌 ¡Te envió una notita nueva en el inicio!`,
              );
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(calChannel);
      supabase.removeChannel(noteChannel);
    };
  }, [couple?.id, getPartnerNickname, processIncomingMessage, triggerGlobalNotification]);

  const openNotifCenter = useCallback(() => {
    setShowNotifCenter(true);
  }, []);

  return (
    <>
      {/* Top Header */}
      {location.pathname !== '/world' && (
        <header className="top-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <NavLink
            to="/settings"
            className="hamburger-btn"
            style={{ textDecoration: 'none', color: 'inherit' }}
            title="Configuración"
            aria-label="Configuración"
          >
            <IconSettings />
          </NavLink>
          <h1 className="top-header__title">Coliflor</h1>
          <button
            className="hamburger-btn"
            onClick={openNotifCenter}
            aria-label={
              hasUnread ? `Notificaciones, ${inbox.unreadIds.size} sin leer` : 'Notificaciones'
            }
            aria-haspopup="dialog"
            style={{ position: 'relative' }}
          >
            <IconBellHeader />
            {hasUnread && (
              <span
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--color-error)',
                }}
              />
            )}
          </button>
        </header>
      )}

      <Outlet context={{ openNotifCenter, hasUnread }} />

      {/* Global In-App Update Notifier (Checks Vercel for new APK/IPA) */}
      <UpdateNotifier />

      {/* Floating Dock Nav */}
      {!isKeyboardOpen && (
        <nav className="floating-dock" ref={dockRef}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `dock-item ${isActive ? 'dock-item--active' : ''}`}
            >
              {({ isActive }) => {
                const Icon = item.icon;
                return (
                  <>
                    <div className="dock-item__icon">
                      <Icon active={isActive} />
                    </div>
                    <span>{item.label}</span>
                  </>
                );
              }}
            </NavLink>
          ))}
        </nav>
      )}

      <AnimatePresence>
        {showNotifCenter && (
          <NotificationCenter
            logs={inbox.visibleLogs}
            unreadIds={inbox.unreadIds}
            partnerName={partnerName}
            viewerId={profile?.id}
            loading={notificationsLoading}
            error={notificationsError}
            onClose={() => setShowNotifCenter(false)}
            onReadAll={inbox.markAllRead}
            onClear={inbox.clearAll}
            onDismiss={inbox.dismiss}
            onRetry={() => void fetchActivityLogs()}
            onOpen={(log, route) => {
              inbox.markRead(log.id);
              setShowNotifCenter(false);
              navigate(route);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
