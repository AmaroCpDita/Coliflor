// ============================================================
// Coliflor — Layout Component (Clean 5-Tab Navigation & Triple Realtime Push Notification Engine)
// ============================================================

import { useEffect, useRef, useCallback, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { formatTime } from '../lib/utils';
import type { Message } from '../lib/types';

function IconHome({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.2" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function IconStreak({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.2" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

function IconQuiz({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.2" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

function IconCalendar({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.2" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconMessages({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.2" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function IconBellHeader() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e5c573" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export default function Layout() {
  const { couple, profile, partner, isMockMode } = useAuth();
  const partnerName = partner ? partner.display_name : 'Tu pareja';

  const [showNotifCenter, setShowNotifCenter] = useState(false);
  const [activityLogs, setActivityLogs] = useState<Message[]>([]);
  const [hasUnread, setHasUnread] = useState(false);

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

  // Lock background scroll when notification drawer is open
  useEffect(() => {
    if (showNotifCenter) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [showNotifCenter]);

  // OneSignal User Login & Web Push Permission Binding
  useEffect(() => {
    if (profile?.id && typeof window !== 'undefined') {
      const win = window as any;
      if (win.OneSignalDeferred) {
        win.OneSignalDeferred.push(async function(OneSignal: any) {
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

  // Fetch Activity / System notifications
  const fetchActivityLogs = useCallback(async () => {
    if (!couple?.id || isMockMode) return;

    try {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('couple_id', couple.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) {
        const systemNotifs = data.filter(m => 
          m.content.startsWith('💌') || 
          m.content.startsWith('📅') || 
          m.content.startsWith('📸') || 
          m.content.startsWith('🩹') ||
          m.content.startsWith('🔥') ||
          m.content.startsWith('📊')
        );
        setActivityLogs(systemNotifs as Message[]);
      }
    } catch (e) {
      console.warn('Error fetching activity logs:', e);
    }
  }, [couple?.id, isMockMode]);

  useEffect(() => {
    fetchActivityLogs();
  }, [fetchActivityLogs]);

  const getPartnerNickname = useCallback(() => {
    const c = coupleRef.current;
    const isUser1 = c ? c.user1_id === profileIdRef.current : true;
    const dbNickname = isUser1 ? c?.user1_partner_nickname : c?.user2_partner_nickname;
    return dbNickname || localStorage.getItem('partner_nickname_' + (partnerRef.current?.id || 'default')) || partnerNameRef.current;
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

        const notes = [1046.50, 1318.51, 1567.98]; // C6, E6, G6
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
  const triggerGlobalNotification = useCallback((sender: string, text: string) => {
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
        navigator.serviceWorker.ready.then(reg => {
          reg.showNotification(`💛 ${sender}`, notifOptions as any);
        }).catch(() => {
          new Notification(`💛 ${sender}`, notifOptions);
        });
      } else {
        new Notification(`💛 ${sender}`, notifOptions);
      }
    } catch (e) {
      console.warn('Global notification error:', e);
    }
  }, [playNotificationChime]);

  const processIncomingMessage = useCallback((msg: any) => {
    try {
      if (!msg || !msg.id || !profileIdRef.current) return;
      
      const isSystem = msg.content.startsWith('💌') || 
                       msg.content.startsWith('📅') || 
                       msg.content.startsWith('📸') || 
                       msg.content.startsWith('🩹') ||
                       msg.content.startsWith('🔥') ||
                       msg.content.startsWith('📊');

      if (isSystem) {
        setActivityLogs(prev => [msg, ...prev.filter(p => p.id !== msg.id)]);
      }

      if (msg.sender_id === profileIdRef.current) return;

      if (isSystem) {
        setHasUnread(true);
      }

      // STRICT DEDUPLICATION: If already notified once, return immediately
      if (notifiedIdsSetRef.current.has(msg.id)) return;
      notifiedIdsSetRef.current.add(msg.id);

      const partnerNickname = getPartnerNickname();
      triggerGlobalNotification(partnerNickname, msg.content);
    } catch (err) {
      console.warn('Error processing notification:', err);
    }
  }, [getPartnerNickname, triggerGlobalNotification]);

  // Triple Realtime Listener for live incoming messages, calendar_events, and couples tables
  useEffect(() => {
    if (!couple?.id || isMockMode) return;

    // 1. Messages Realtime Channel
    const msgChannel = supabase
      .channel(`global-msg-notifs-${couple.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `couple_id=eq.${couple.id}` },
        (payload) => {
          processIncomingMessage(payload.new);
        }
      )
      .subscribe();

    // 2. Calendar Events Realtime Channel
    const calChannel = supabase
      .channel(`global-cal-notifs-${couple.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'calendar_events', filter: `couple_id=eq.${couple.id}` },
        (payload) => {
          const evt = payload.new as any;
          if (evt && evt.created_by !== profileIdRef.current) {
            const calNotifKey = `cal_evt_${evt.id}`;
            if (!notifiedIdsSetRef.current.has(calNotifKey)) {
              notifiedIdsSetRef.current.add(calNotifKey);
              const partnerNickname = getPartnerNickname();
              triggerGlobalNotification(partnerNickname, `📅 ¡Agregó un evento al calendario: "${evt.title || 'Nuevo evento'}"!`);
            }
          }
        }
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
          if (updatedCouple && updatedCouple.daily_note_updated_by && updatedCouple.daily_note_updated_by !== profileIdRef.current) {
            const noteNotifKey = `note_upd_${updatedCouple.daily_note_updated_by}_${updatedCouple.daily_note}`;
            if (!notifiedIdsSetRef.current.has(noteNotifKey)) {
              notifiedIdsSetRef.current.add(noteNotifKey);
              const partnerNickname = getPartnerNickname();
              triggerGlobalNotification(partnerNickname, `💌 ¡Te envió una notita nueva en el inicio!`);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(calChannel);
      supabase.removeChannel(noteChannel);
    };
  }, [couple?.id, isMockMode, getPartnerNickname, processIncomingMessage, triggerGlobalNotification]);

  // Polling ONLY updates activity logs state (No Push Notifications to prevent loops)
  useEffect(() => {
    if (!couple?.id || isMockMode) return;

    const interval = setInterval(async () => {
      try {
        const { data } = await supabase
          .from('messages')
          .select('*')
          .eq('couple_id', couple.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (data && data.length > 0) {
          const systemNotifs = data.filter(m => 
            m.content.startsWith('💌') || 
            m.content.startsWith('📅') || 
            m.content.startsWith('📸') || 
            m.content.startsWith('🩹') ||
            m.content.startsWith('🔥') ||
            m.content.startsWith('📊')
          );
          setActivityLogs(systemNotifs as Message[]);
        }
      } catch (err) {
        console.warn('Polling error:', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [couple?.id, isMockMode]);

  const openNotifCenter = useCallback(() => {
    setShowNotifCenter(true);
    setHasUnread(false);
  }, []);

  return (
    <>
      <Outlet context={{ openNotifCenter, hasUnread }} />

      {/* Clean 5-Tab Floating Navigation Dock */}
      <nav className="floating-dock">
        <NavLink
          to="/"
          end
          className={({ isActive }) => `dock-item ${isActive ? 'dock-item--active' : ''}`}
        >
          {({ isActive }) => (
            <>
              <div className="dock-item__icon">
                <IconHome active={isActive} />
              </div>
              <span className="dock-item__dot" />
            </>
          )}
        </NavLink>

        <NavLink
          to="/streak"
          className={({ isActive }) => `dock-item ${isActive ? 'dock-item--active' : ''}`}
        >
          {({ isActive }) => (
            <>
              <div className="dock-item__icon">
                <IconStreak active={isActive} />
              </div>
              <span className="dock-item__dot" />
            </>
          )}
        </NavLink>

        <NavLink
          to="/quiz"
          className={({ isActive }) => `dock-item ${isActive ? 'dock-item--active' : ''}`}
        >
          {({ isActive }) => (
            <>
              <div className="dock-item__icon">
                <IconQuiz active={isActive} />
              </div>
              <span className="dock-item__dot" />
            </>
          )}
        </NavLink>

        <NavLink
          to="/calendar"
          className={({ isActive }) => `dock-item ${isActive ? 'dock-item--active' : ''}`}
        >
          {({ isActive }) => (
            <>
              <div className="dock-item__icon">
                <IconCalendar active={isActive} />
              </div>
              <span className="dock-item__dot" />
            </>
          )}
        </NavLink>

        <NavLink
          to="/messages"
          className={({ isActive }) => `dock-item ${isActive ? 'dock-item--active' : ''}`}
        >
          {({ isActive }) => (
            <>
              <div className="dock-item__icon">
                <IconMessages active={isActive} />
              </div>
              <span className="dock-item__dot" />
            </>
          )}
        </NavLink>
      </nav>

      {/* Bell Notification Center Drawer (Sliding from Right Edge) */}
      {showNotifCenter && (
        <div
          className="side-drawer-backdrop"
          onClick={() => setShowNotifCenter(false)}
        >
          <div
            className="side-drawer animate-slide-in-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="row row--between" style={{ paddingBottom: 'var(--space-xs)', borderBottom: '1px solid var(--color-border)' }}>
              <div className="row row--gap-xs">
                <IconBellHeader />
                <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700 }}>Historial de Actividad</h3>
              </div>
              <button
                className="btn btn--ghost btn--xs"
                onClick={() => setShowNotifCenter(false)}
                style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}
              >
                Esconder ✕
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {activityLogs.length === 0 ? (
                <div className="empty-state" style={{ padding: 'var(--space-xl) 0' }}>
                  <IconBellHeader />
                  <div className="empty-state__title" style={{ marginTop: 'var(--space-sm)' }}>Sin actividad reciente</div>
                  <div className="empty-state__text">
                    Aquí aparecerán los avisos cuando tu pareja agregue notitas, eventos al calendario o fotos de la racha.
                  </div>
                </div>
              ) : (
                activityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="glass-card"
                    style={{
                      padding: 'var(--space-sm) var(--space-md)',
                      background: 'rgba(28, 30, 42, 0.6)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-lg)',
                    }}
                  >
                    <div style={{ fontSize: 'var(--font-size-sm)', color: '#f2f2f7', lineHeight: 1.4 }}>
                      {log.content}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', marginTop: '4px', textAlign: 'right' }}>
                      {formatTime(log.created_at)}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ marginTop: 'auto', paddingTop: 'var(--space-sm)', borderTop: '1px solid var(--color-border)' }}>
              <button
                className="btn btn--secondary btn--full btn--sm"
                onClick={() => setShowNotifCenter(false)}
              >
                Esconder panel ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
