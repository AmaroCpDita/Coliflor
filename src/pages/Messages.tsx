// ============================================================
// Coliflor — Messages Page (Realtime Chat with Nickname Support)
// ============================================================

import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { formatTime } from '../lib/utils';
import { sendOneSignalPush } from '../lib/onesignal';
import type { Message } from '../lib/types';

function IconSend() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e07a7a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconMessageLarge() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(242,242,247,0.3)" strokeWidth="1.5">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

export default function Messages() {
  const { user, couple, profile, partner, refreshProfile, isMockMode } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const partnerName = partner ? partner.display_name : 'Tu pareja';

  // Determine user1 vs user2 role
  const isUser1 = couple ? couple.user1_id === profile?.id : true;
  const dbNickname = isUser1 ? couple?.user1_partner_nickname : couple?.user2_partner_nickname;

  // Nickname state
  const [partnerNickname, setPartnerNickname] = useState<string>(() => {
    return dbNickname || localStorage.getItem('partner_nickname_' + (partner?.id || 'default')) || '';
  });
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');

  useEffect(() => {
    if (dbNickname) {
      setPartnerNickname(dbNickname);
    }
  }, [dbNickname]);

  const displayPartnerName = partnerNickname.trim() || partnerName;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const profileIdRef = useRef(profile?.id);
  useEffect(() => {
    profileIdRef.current = profile?.id;
  }, [profile?.id]);

  const requestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') {
      alert('Tu navegador no soporta notificaciones push. Asegúrate de estar navegando por HTTPS.');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
      if (perm === 'granted') {
        triggerLockscreenNotification('Coliflor', '¡Notificaciones de pantalla de bloqueo activadas con éxito! 💛');
      } else if (perm === 'denied') {
        alert('Las notificaciones fueron denegadas. Ve a la configuración de tu celular o navegador para permitirlas.');
      }
    } catch (err) {
      console.error('Error requesting notification permission:', err);
    }
  };

  const triggerLockscreenNotification = useCallback((sender: string, text: string) => {
    if (typeof Notification === 'undefined') return;

    if (Notification.permission === 'granted') {
      const notifOptions = {
        body: text,
        icon: '/logo.png',
        badge: '/logo.png',
        vibrate: [200, 100, 200, 100, 200],
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
        console.warn('Direct notification fallback:', e);
      }
    }
  }, []);

  // Fetch recent messages
  useEffect(() => {
    if (!couple) return;

    if (isMockMode) {
      const mockMsgs: Message[] = [
        { id: 'm1', couple_id: 'mock', sender_id: 'mock-user-javiera', content: 'Hola amor! ❤️ No olvides tomar la foto de hoy para no perder la racha', created_at: new Date(Date.now() - 3600000 * 3).toISOString() },
        { id: 'm2', couple_id: 'mock', sender_id: 'mock-user-amaro', content: 'Siii ya la tomé! Te ves hermosa en la tuya 💖', created_at: new Date(Date.now() - 3600000 * 2.5).toISOString() },
        { id: 'm3', couple_id: 'mock', sender_id: 'mock-user-javiera', content: 'Gracias mi vida 🥰 ¿Nos vemos hoy en la noche?', created_at: new Date(Date.now() - 3600000 * 2).toISOString() },
        { id: 'm4', couple_id: 'mock', sender_id: 'mock-user-amaro', content: 'Paso por ti a las 8pm y cenamos juntos!', created_at: new Date(Date.now() - 3600000 * 1.5).toISOString() },
        { id: 'm5', couple_id: 'mock', sender_id: 'mock-user-javiera', content: 'Súper! Te espero impaciente 💛', created_at: new Date(Date.now() - 3600000 * 1).toISOString() },
      ];
      setMessages(mockMsgs);
      setTimeout(scrollToBottom, 100);
      return;
    }

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('couple_id', couple.id)
        .order('created_at', { ascending: true })
        .limit(100);

      if (data) {
        setMessages(data as Message[]);
        setTimeout(scrollToBottom, 100);
      }
    };

    fetchMessages();
  }, [couple?.id, scrollToBottom, isMockMode]);

  // Realtime messages UI sync
  useEffect(() => {
    if (!couple || isMockMode) return;

    const channel = supabase
      .channel('messages-realtime-ui')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `couple_id=eq.${couple.id}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          setTimeout(scrollToBottom, 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [couple?.id, scrollToBottom, isMockMode]);

  // Smart Polling Backup (Every 3 seconds) for 100% constant UI sync
  useEffect(() => {
    if (!couple || isMockMode) return;

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('couple_id', couple.id)
        .order('created_at', { ascending: true })
        .limit(100);

      if (data && data.length > 0) {
        setMessages(prev => {
          const hasNew = data.some(d => !prev.some(p => p.id === d.id));
          if (hasNew || data.length !== prev.length) {
            setTimeout(scrollToBottom, 100);
            return data as Message[];
          }
          return prev;
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [couple?.id, isMockMode, scrollToBottom]);

  const handleSend = async () => {
    if (!input.trim() || !couple || !profile || sending) return;
    setSending(true);

    const content = input.trim();
    setInput('');

    if (isMockMode) {
      const newMsg: Message = {
        id: 'msg-' + Date.now(),
        couple_id: 'mock',
        sender_id: profile.id,
        content,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, newMsg]);
      setSending(false);
      setTimeout(scrollToBottom, 100);
      inputRef.current?.focus();
      return;
    }

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          couple_id: couple.id,
          sender_id: profile.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setMessages(prev => {
          if (prev.some(m => m.id === data.id)) return prev;
          return [...prev, data as Message];
        });
        setTimeout(scrollToBottom, 100);
      }

      // Send push notification to partner
      if (partner?.id) {
        const myName = profile?.display_name || user?.user_metadata?.display_name || 'Tu pareja';
        sendOneSignalPush(partner.id, myName, content);
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleSaveNickname = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = nicknameInput.trim();
    setPartnerNickname(val);

    if (partner?.id) {
      localStorage.setItem('partner_nickname_' + partner.id, val);
    } else {
      localStorage.setItem('partner_nickname_default', val);
    }
    setShowNicknameModal(false);

    if (couple && !isMockMode) {
      try {
        const updatePayload = isUser1
          ? { user1_partner_nickname: val }
          : { user2_partner_nickname: val };

        await supabase
          .from('couples')
          .update(updatePayload)
          .eq('id', couple.id);

        await refreshProfile();
      } catch (err) {
        console.warn('Nickname DB sync warning:', err);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!profile) return null;

  if (!couple) {
    return (
      <div className="page page--centered">
        <div className="glass-card text-center stack stack--md">
          <IconMessageLarge />
          <h3>Mensajes Privados</h3>
          <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>
            Vincúlale a tu pareja en el Inicio para habilitar el chat privado.
          </p>
          <Link to="/" className="btn btn--primary">
            Ir al Inicio
          </Link>
        </div>
      </div>
    );
  }

  // Filter out system activity notifications (💌, 📅, 📸, 🩹) from chat bubbles so chat is 100% pure text
  const chatMessages = messages.filter(msg => {
    const isSystem = msg.content.startsWith('💌') || 
                     msg.content.startsWith('📅') || 
                     msg.content.startsWith('📸') || 
                     msg.content.startsWith('🩹');
    return !isSystem;
  });

  // Group messages by date with strict chronological sorting
  const sortedMessages = [...chatMessages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  let currentDate = '';
  
  sortedMessages.forEach(msg => {
    const msgDate = new Date(msg.created_at).toLocaleDateString('es-CL', {
      timeZone: 'America/Santiago',
      day: 'numeric',
      month: 'long',
    });
    if (msgDate !== currentDate) {
      currentDate = msgDate;
      groupedMessages.push({ date: msgDate, messages: [msg] });
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(msg);
    }
  });

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100dvh',
      maxWidth: '480px',
      margin: '0 auto',
      width: '100%',
    }}>
      {/* Header */}
      <div style={{
        padding: 'var(--space-md) var(--space-lg)',
        paddingTop: 'calc(var(--safe-top) + var(--space-md))',
        borderBottom: '1px solid var(--color-border)',
        background: 'rgba(13, 14, 18, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}>
        <div className="row row--between">
          <div>
            <div className="row row--gap-xs">
              <span style={{ fontWeight: 700, fontSize: 'var(--font-size-base)', color: 'var(--color-text-primary)' }}>
                {displayPartnerName}
              </span>
              {partnerNickname && (
                <span className="text-secondary" style={{ fontSize: '11px', opacity: 0.7 }}>
                  ({partnerName})
                </span>
              )}
            </div>
            <div className="text-secondary" style={{ fontSize: '10px' }}>
              Mensajes en vivo
            </div>
          </div>

          <button
            className="btn btn--ghost btn--xs row row--gap-xs"
            onClick={() => {
              setNicknameInput(partnerNickname);
              setShowNicknameModal(true);
            }}
            style={{ fontSize: '11px', color: 'var(--color-accent-light)', padding: '4px 8px' }}
          >
            <IconEdit />
            <span>{partnerNickname ? 'Apodo' : 'Poner apodo'}</span>
          </button>
        </div>
      </div>

      {/* Lockscreen Notification Permission Banner */}
      {notifPermission === 'default' && (
        <div className="glass-card glass-card--accent text-center animate-fade-in" style={{ margin: 'var(--space-sm) var(--space-md)', padding: 'var(--space-sm) var(--space-md)' }}>
          <div className="row row--center row--gap-xs" style={{ fontSize: 'var(--font-size-xs)', marginBottom: '4px' }}>
            <IconBell />
            <span style={{ fontWeight: 600 }}>Notificaciones de pantalla de bloqueo</span>
          </div>
          <p className="text-secondary" style={{ fontSize: '11px', marginBottom: '8px' }}>
            Activa las notificaciones para que los mensajes de {displayPartnerName} lleguen directo al bloqueo de tu celular.
          </p>
          <button className="btn btn--primary btn--sm btn--full" onClick={requestNotificationPermission}>
            Activar notificaciones en el celular
          </button>
        </div>
      )}

      {notifPermission === 'granted' && (
        <div className="row row--center" style={{ padding: '6px 0 2px' }}>
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => triggerLockscreenNotification(displayPartnerName, '¡Las notificaciones están 100% activas en tu celular! 💖')}
            style={{ fontSize: '11px', color: 'var(--color-accent-light)', opacity: 0.85 }}
          >
            🔔 Probar notificación de prueba
          </button>
        </div>
      )}

      {/* Messages area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: 'var(--space-md) var(--space-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-sm)',
      }}>
        {messages.length === 0 && (
          <div className="empty-state" style={{ flex: 1 }}>
            <IconMessageLarge />
            <div className="empty-state__title" style={{ marginTop: 'var(--space-sm)' }}>Sin mensajes aún</div>
            <div className="empty-state__text">
              Envía el primer mensaje a {displayPartnerName}
            </div>
          </div>
        )}

        {groupedMessages.map((group) => (
          <div key={group.date}>
            <div className="text-center" style={{ margin: 'var(--space-md) 0' }}>
              <span className="text-secondary" style={{ fontSize: '10px', textTransform: 'capitalize', background: 'var(--color-bg-secondary)', padding: '2px 10px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)' }}>
                {group.date}
              </span>
            </div>

            {group.messages.map((msg) => {
              const isMe = Boolean(
                (profile?.id && msg.sender_id === profile.id) ||
                (user?.id && msg.sender_id === user.id)
              );
              return (
                <div key={msg.id} className={`message-row ${isMe ? 'message-row--me' : 'message-row--partner'}`}>
                  <div className={`message-bubble ${isMe ? 'message-bubble--me' : 'message-bubble--partner'}`}>
                    {!isMe && (
                      <div className="message-sender-label">
                        {displayPartnerName}
                      </div>
                    )}
                    <div style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                      {msg.content}
                    </div>
                    <div className="message-time" style={{ textAlign: isMe ? 'right' : 'left' }}>
                      {formatTime(msg.created_at)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div style={{
        padding: 'var(--space-sm) var(--space-md)',
        paddingBottom: 'calc(var(--safe-bottom) + 70px)',
        borderTop: '1px solid var(--color-border)',
        background: 'rgba(13, 14, 18, 0.9)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}>
        <div className="row row--gap-xs" style={{ alignItems: 'flex-end' }}>
          <input
            ref={inputRef}
            type="text"
            className="input"
            placeholder={`Escribe a ${displayPartnerName}...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ borderRadius: 'var(--radius-full)', padding: '10px 16px', fontSize: 'var(--font-size-sm)' }}
          />

          <button
            className="btn btn--primary"
            onClick={handleSend}
            disabled={!input.trim() || sending}
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              padding: 0,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconSend />
          </button>
        </div>
      </div>

      {/* Edit Nickname Modal */}
      {showNicknameModal && (
        <div className="modal-backdrop" onClick={() => setShowNicknameModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__handle" />
            <form onSubmit={handleSaveNickname} className="stack stack--md">
              <div className="text-center">
                <h3>Apodo para {partnerName}</h3>
                <p className="text-secondary" style={{ fontSize: 'var(--font-size-xs)', marginTop: '4px' }}>
                  Elige un apodo cariñoso que aparecerá en tus mensajes y notificaciones.
                </p>
              </div>

              <div className="input-group">
                <input
                  type="text"
                  className="input"
                  placeholder="Ej: Mi Vida, Javi, Amor, Mi Reina"
                  value={nicknameInput}
                  onChange={(e) => setNicknameInput(e.target.value)}
                  maxLength={30}
                  autoFocus
                />
              </div>

              <div className="row row--gap-sm">
                <button type="submit" className="btn btn--primary btn--full">
                  Guardar apodo
                </button>
                {partnerNickname && (
                  <button
                    type="button"
                    className="btn btn--secondary btn--full"
                    onClick={() => {
                      setPartnerNickname('');
                      if (partner?.id) localStorage.removeItem('partner_nickname_' + partner.id);
                      setShowNicknameModal(false);
                    }}
                  >
                    Borrar apodo
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
