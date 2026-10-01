// ============================================================
// Coliflor — Layout Component (Clean 5-Tab Navigation & Triple Realtime Push Notification Engine)
// ============================================================

import { useEffect, useRef, useCallback, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
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
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function IconMenu() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
  );
}

function IconClose() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}

function IconMapNav({ active }: { active?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.2" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  );
}

function IconBucketList({ active }: { active?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.2" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
  );
}

export default function Layout() {
  const { couple, profile, partner, isMockMode } = useAuth();
  const partnerName = partner ? partner.display_name : 'Tu pareja';

  const [showNotifCenter, setShowNotifCenter] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activityLogs, setActivityLogs] = useState<Message[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  const location = useLocation();
  const isMapPage = location.pathname === '/map';

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
  }, [couple?.id, getPartnerNickname, processIncomingMessage, triggerGlobalNotification]);

  // Polling ONLY updates activity logs state (No Push Notifications to prevent loops)
  useEffect(() => {
    if (!couple?.id) return;

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
  }, [couple?.id]);

  const openNotifCenter = useCallback(() => {
    setShowNotifCenter(true);
    setHasUnread(false);
  }, []);

  return (
    <>
      {/* Top Header */}
      <header className="top-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button className="hamburger-btn" onClick={() => setIsSidebarOpen(true)} title="Menú lateral">
          <IconMenu />
        </button>
        <h1 className="top-header__title">Coliflor</h1>
        <button className="hamburger-btn" onClick={openNotifCenter} style={{ position: 'relative' }}>
          <IconBellHeader />
          {hasUnread && (
            <span style={{ position: 'absolute', top: '10px', right: '10px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-error)' }} />
          )}
        </button>
      </header>

      {/* Sidebar Drawer */}
      {isSidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)}>
          <div className="sidebar-drawer" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
              <h2 className="top-header__title" style={{ fontSize: '20px' }}>Coliflor</h2>
              <button className="hamburger-btn" onClick={() => setIsSidebarOpen(false)}>
                <IconClose />
              </button>
            </div>
            
            <nav style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '2px', overflowY: 'auto' }}>
              <NavLink to="/" end className={({ isActive }) => `sidebar-item ${isActive ? 'sidebar-item--active' : ''}`} onClick={() => setIsSidebarOpen(false)}>
                <div className="sidebar-item__icon"><IconHome active={false} /></div>
                <span>Inicio</span>
              </NavLink>
              <NavLink to="/streak" className={({ isActive }) => `sidebar-item ${isActive ? 'sidebar-item--active' : ''}`} onClick={() => setIsSidebarOpen(false)}>
                <div className="sidebar-item__icon"><IconStreak active={false} /></div>
                <span>Racha de Fotos</span>
              </NavLink>
              <NavLink to="/quiz" className={({ isActive }) => `sidebar-item ${isActive ? 'sidebar-item--active' : ''}`} onClick={() => setIsSidebarOpen(false)}>
                <div className="sidebar-item__icon"><IconQuiz active={false} /></div>
                <span>Quiz de Sintonía</span>
              </NavLink>
              <NavLink to="/calendar" className={({ isActive }) => `sidebar-item ${isActive ? 'sidebar-item--active' : ''}`} onClick={() => setIsSidebarOpen(false)}>
                <div className="sidebar-item__icon"><IconCalendar active={false} /></div>
                <span>Agenda & Recuerdos</span>
              </NavLink>
              <NavLink to="/bucket-list" className={({ isActive }) => `sidebar-item ${isActive ? 'sidebar-item--active' : ''}`} onClick={() => setIsSidebarOpen(false)}>
                <div className="sidebar-item__icon"><IconBucketList /></div>
                <span>Metas / Bucket List</span>
              </NavLink>
              <NavLink to="/map" className={({ isActive }) => `sidebar-item ${isActive ? 'sidebar-item--active' : ''}`} onClick={() => setIsSidebarOpen(false)}>
                <div className="sidebar-item__icon"><IconMapNav /></div>
                <span>Nuestro Mapa</span>
              </NavLink>
              <NavLink to="/messages" className={({ isActive }) => `sidebar-item ${isActive ? 'sidebar-item--active' : ''}`} onClick={() => setIsSidebarOpen(false)}>
                <div className="sidebar-item__icon"><IconMessages active={false} /></div>
                <span>Chat Secreto</span>
              </NavLink>
              
              <div style={{ marginTop: 'auto', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--color-border)' }}>
                <NavLink to="/settings" className={({ isActive }) => `sidebar-item ${isActive ? 'sidebar-item--active' : ''}`} onClick={() => setIsSidebarOpen(false)}>
                  <div className="sidebar-item__icon"><IconSettings /></div>
                  <span>Ajustes</span>
                </NavLink>
              </div>
            </nav>
          </div>
        </div>
      )}

      <Outlet context={{ openNotifCenter, hasUnread }} />

      {/* 5-Tab Floating Dock Nav */}
      {(!isKeyboardOpen && !isMapPage) && (
        <nav className="floating-dock">
          <NavLink to="/" end className={({ isActive }) => `dock-item ${isActive ? 'dock-item--active' : ''}`}>
            {({ isActive }) => (
              <>
                <div className="dock-item__icon"><IconHome active={isActive} /></div>
                <span>Inicio</span>
              </>
            )}
          </NavLink>
          <NavLink to="/calendar" className={({ isActive }) => `dock-item ${isActive ? 'dock-item--active' : ''}`}>
            {({ isActive }) => (
              <>
                <div className="dock-item__icon"><IconCalendar active={isActive} /></div>
                <span>Agenda</span>
              </>
            )}
          </NavLink>
          <NavLink to="/bucket-list" className={({ isActive }) => `dock-item ${isActive ? 'dock-item--active' : ''}`}>
            {({ isActive }) => (
              <>
                <div className="dock-item__icon"><IconBucketList active={isActive} /></div>
                <span>Metas</span>
              </>
            )}
          </NavLink>
          <NavLink to="/map" className={({ isActive }) => `dock-item ${isActive ? 'dock-item--active' : ''}`}>
            {({ isActive }) => (
              <>
                <div className="dock-item__icon"><IconMapNav active={isActive} /></div>
                <span>Mapa</span>
              </>
            )}
          </NavLink>
          <NavLink to="/messages" className={({ isActive }) => `dock-item ${isActive ? 'dock-item--active' : ''}`}>
            {({ isActive }) => (
              <>
                <div className="dock-item__icon"><IconMessages active={isActive} /></div>
                <span>Chat</span>
              </>
            )}
          </NavLink>
        </nav>
      )}
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
                      background: 'var(--color-bg-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-lg)',
                    }}
                  >
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)', lineHeight: 1.4 }}>
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
