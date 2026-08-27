// ============================================================
// Coliflor — Messages Page (Realtime Chat with Push Notifications)
// ============================================================

import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { formatTime } from '../lib/utils';
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

function IconMessageLarge() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(242,242,247,0.3)" strokeWidth="1.5">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

export default function Messages() {
  const { couple, profile, partner, isMockMode } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const partnerName = partner ? partner.display_name : 'Tu pareja';

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const requestNotificationPermission = async () => {
    if (typeof Notification !== 'undefined') {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
    }
  };

  const triggerLockscreenNotification = useCallback((sender: string, text: string) => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then(reg => {
          reg.showNotification(`💜 ${sender}`, {
            body: text,
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            vibrate: [200, 100, 200],
            tag: 'coliflor-message',
            data: { url: '/messages' },
          } as any);
        }).catch(() => {
          new Notification(`💜 ${sender}`, { body: text, icon: '/pwa-192x192.png' });
        });
      } else {
        new Notification(`💜 ${sender}`, { body: text, icon: '/pwa-192x192.png' });
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
        { id: 'm5', couple_id: 'mock', sender_id: 'mock-user-javiera', content: 'Súper! Te espero impaciente 💜', created_at: new Date(Date.now() - 3600000 * 1).toISOString() },
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

  // Realtime messages + Lockscreen Push notification trigger
  useEffect(() => {
    if (!couple || isMockMode) return;

    const channel = supabase
      .channel('messages-realtime')
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
          setMessages(prev => [...prev, msg]);
          setTimeout(scrollToBottom, 100);

          // Trigger lockscreen notification if message is from partner
          if (msg.sender_id !== profile?.id) {
            triggerLockscreenNotification(partnerName, msg.content);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [couple?.id, scrollToBottom, isMockMode, profile?.id, partnerName, triggerLockscreenNotification]);

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
      const { error } = await supabase
        .from('messages')
        .insert({
          couple_id: couple.id,
          sender_id: profile.id,
          content,
        });

      if (error) throw error;
    } catch (err) {
      console.error('Error sending message:', err);
      setInput(content);
    } finally {
      setSending(false);
      inputRef.current?.focus();
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

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  let currentDate = '';
  
  messages.forEach(msg => {
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
            <div style={{ fontWeight: 600 }}>{partnerName}</div>
            <div className="text-secondary" style={{ fontSize: 'var(--font-size-xs)' }}>
              Mensajes en pantalla de bloqueo
            </div>
          </div>
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
            Activa las notificaciones para que los mensajes de {partnerName} lleguen directo al bloqueo de tu celular.
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
            onClick={() => triggerLockscreenNotification('Coliflor', '¡Las notificaciones están 100% activas en tu celular! 💖')}
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
              Envía el primer mensaje a {partnerName}
            </div>
          </div>
        )}

        {groupedMessages.map((group) => (
          <div key={group.date}>
            <div className="text-center" style={{ margin: 'var(--space-md) 0' }}>
              <span className="text-secondary" style={{
                fontSize: 'var(--font-size-xs)',
                background: 'var(--color-bg-secondary)',
                padding: 'var(--space-xs) var(--space-md)',
                borderRadius: 'var(--radius-full)',
              }}>
                {group.date}
              </span>
            </div>
            {group.messages.map((msg) => {
              const isMine = msg.sender_id === profile.id;
              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMine ? 'flex-end' : 'flex-start',
                    marginBottom: 'var(--space-xs)',
                  }}
                >
                  <div className={`message-bubble ${isMine ? 'message-bubble--sent' : 'message-bubble--received'}`}>
                    {msg.content}
                  </div>
                  <span className="message-time" style={{ textAlign: isMine ? 'right' : 'left' }}>
                    {formatTime(msg.created_at)}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div style={{
        padding: 'var(--space-md) var(--space-lg)',
        paddingBottom: 'calc(var(--safe-bottom) + 80px)',
        borderTop: '1px solid var(--color-border)',
        background: 'rgba(13, 14, 18, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}>
        <div className="row row--gap-sm">
          <input
            ref={inputRef}
            type="text"
            className="input"
            placeholder="Escribe un mensaje..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ flex: 1 }}
          />
          <button
            className="btn btn--primary"
            onClick={handleSend}
            disabled={!input.trim() || sending}
            style={{ padding: 'var(--space-md)', minWidth: '48px' }}
          >
            <IconSend />
          </button>
        </div>
      </div>
    </div>
  );
}
