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


function IconReplyAction() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 17 4 12 9 7" />
      <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

const MessageRow = ({
  msg,
  isMe,
  displayPartnerName,
  profile,
  repliedMsg,
  selectionMode,
  isSelected,
  onToggleSelection,
  onStartSelection,
  onReply
}: any) => {
  const startXRef = useRef<number | null>(null);
  const startYRef = useRef<number | null>(null);
  const currentDragXRef = useRef<number>(0);
  const rowRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<any>(null);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    
    const handleNativeTouchMove = (e: TouchEvent) => {
      if (selectionMode || startXRef.current === null || startYRef.current === null) return;
      
      const deltaX = Math.abs(e.touches[0].clientX - startXRef.current);
      const deltaY = Math.abs(e.touches[0].clientY - startYRef.current);
      
      // If moving horizontally more than vertically, prevent browser navigation
      if (deltaX > deltaY && deltaX > 5) {
        e.preventDefault();
      }
    };

    el.addEventListener('touchmove', handleNativeTouchMove, { passive: false });
    return () => el.removeEventListener('touchmove', handleNativeTouchMove);
  }, [selectionMode]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (selectionMode) return;
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    
    longPressTimerRef.current = setTimeout(() => {
      onStartSelection(msg.id);
      startXRef.current = null;
    }, 500);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (selectionMode) return;
    
    if (startXRef.current !== null && startYRef.current !== null) {
      const deltaX = e.touches[0].clientX - startXRef.current;
      const deltaY = Math.abs(e.touches[0].clientY - startYRef.current);
      
      if (deltaY > 20) {
         if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
         startXRef.current = null;
         
         // Reset DOM manually
         currentDragXRef.current = 0;
         if (bubbleRef.current) {
           bubbleRef.current.style.transition = 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
           bubbleRef.current.style.transform = 'translateX(0px)';
         }
         if (iconRef.current) {
           iconRef.current.style.opacity = '0';
         }
         return;
      }
      
      if (Math.abs(deltaX) > 10 && longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      if (deltaX > 0 && deltaX < 80) {
        currentDragXRef.current = deltaX;
        if (bubbleRef.current) {
          bubbleRef.current.style.transform = `translateX(${deltaX}px)`;
          bubbleRef.current.style.transition = 'none';
        }
        if (iconRef.current) {
          iconRef.current.style.opacity = Math.min(deltaX / 50, 1).toString();
        }
      }
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (startXRef.current !== null) {
      if (currentDragXRef.current > 50) {
        onReply(msg);
      }
      
      // Reset DOM manually
      currentDragXRef.current = 0;
      if (bubbleRef.current) {
        bubbleRef.current.style.transition = 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        bubbleRef.current.style.transform = 'translateX(0px)';
      }
      if (iconRef.current) {
        iconRef.current.style.opacity = '0';
      }
      
      startXRef.current = null;
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (selectionMode || e.button !== 0) return;
    longPressTimerRef.current = setTimeout(() => {
      onStartSelection(msg.id);
    }, 500);
  };

  const handleMouseUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  return (
    <div 
      ref={rowRef}
      className={`message-row ${isMe ? 'message-row--me' : 'message-row--partner'}`} 
      style={{ 
        position: 'relative',
        background: isSelected ? 'rgba(255,255,255,0.1)' : 'transparent',
        borderRadius: '8px',
        padding: isSelected ? '4px 8px' : '0',
        transition: 'background 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        touchAction: 'pan-y'
      }}
      onClick={() => {
        if (selectionMode) onToggleSelection(msg.id);
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={(e) => {
        if (!selectionMode) e.preventDefault();
      }}
    >
      <div 
        ref={iconRef}
        style={{
        position: 'absolute',
        left: '20px',
        top: '50%',
        transform: 'translateY(-50%)',
        opacity: 0,
        color: 'var(--color-primary)',
        pointerEvents: 'none'
      }}>
        <IconReplyAction />
      </div>

      {selectionMode && (
        <div style={{
          width: '20px', height: '20px', borderRadius: '50%', 
          border: `2px solid ${isSelected ? 'var(--color-primary)' : 'rgba(255,255,255,0.3)'}`,
          background: isSelected ? 'var(--color-primary)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0
        }}>
          {isSelected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
        </div>
      )}

      <div 
        ref={bubbleRef}
        className={`message-bubble ${isMe ? 'message-bubble--me' : 'message-bubble--partner'}`}
        style={{ 
          transform: 'translateX(0px)',
          transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          flex: 1,
          pointerEvents: selectionMode ? 'none' : 'auto',
          maxWidth: selectionMode ? 'calc(80% - 32px)' : '80%'
        }}
      >
        {!isMe && (
          <div className="message-sender-label">
            {displayPartnerName}
          </div>
        )}
        
        {repliedMsg && !repliedMsg.is_deleted && (
          <div style={{ 
            background: 'rgba(0,0,0,0.15)', 
            padding: '6px 8px', 
            borderRadius: '6px', 
            marginBottom: '4px',
            borderLeft: `3px solid ${isMe ? 'rgba(255,255,255,0.5)' : 'var(--color-primary)'}`,
            fontSize: '11px',
            opacity: 0.8
          }}>
            <div style={{ fontWeight: 600, marginBottom: '2px' }}>
              {repliedMsg.sender_id === profile?.id ? 'Tú' : displayPartnerName}
            </div>
            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {repliedMsg.content}
            </div>
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
};

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

    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
    try {
      const win = window as any;
      if (win.OneSignal) {
        await win.OneSignal.Slidedown.promptPush();
      } else if (typeof Notification !== 'undefined') {
        const perm = await Notification.requestPermission();
        setNotifPermission(perm);
        if (perm === 'granted') {
          triggerLockscreenNotification('Coliflor', '¡Notificaciones activadas!');
        }
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
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `couple_id=eq.${couple.id}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          setMessages(prev => prev.map(m => m.id === msg.id ? msg : m));
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
      const payload: any = {
        couple_id: couple.id,
        sender_id: profile.id,
        content,
      };
      
      if (replyingTo) {
        payload.reply_to_id = replyingTo.id;
      }

      const { data, error } = await supabase
        .from('messages')
        .insert(payload)
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
      setReplyingTo(null);
      inputRef.current?.focus();
    }
  };

  
  const handleToggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      if (next.size === 0) setSelectionMode(false);
      return next;
    });
  };

  const handleStartSelection = (id: string) => {
    setSelectionMode(true);
    setSelectedIds(new Set([id]));
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`¿Estás seguro de que quieres eliminar ${selectedIds.size} ${selectedIds.size === 1 ? 'mensaje' : 'mensajes'}?`)) return;

    const ids = Array.from(selectedIds);
    setSelectionMode(false);
    setSelectedIds(new Set());
    
    setMessages(prev => prev.map(m => ids.includes(m.id) ? { ...m, is_deleted: true } : m));

    try {
      await supabase.from('messages').update({ is_deleted: true }).in('id', ids);
    } catch (e) {
      console.warn('Error deleting messages:', e);
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

  // Lock body scroll to prevent rubber-banding and whole-page scroll
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalOverscroll = document.body.style.overscrollBehaviorY;
    
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehaviorY = 'none'; // Prevent pull-to-refresh bounce
    
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.overscrollBehaviorY = originalOverscroll;
    };
  }, []);

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

  // Filter out system activity notifications and deleted messages
  const chatMessages = messages.filter(msg => {
    if (msg.is_deleted) return false;
    const isSystem = msg.content.startsWith('💌') || 
                     msg.content.startsWith('📅') || 
                     msg.content.startsWith('📸') || 
                     msg.content.startsWith('🩹') ||
                     msg.content.startsWith('🔥') ||
                     msg.content.startsWith('📊');
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
        background: selectionMode ? 'var(--color-primary)' : 'var(--color-bg-card)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        transition: 'background 0.3s'
      }}>
        {selectionMode ? (
          <div className="row row--between">
            <div className="row row--gap-md">
              <button className="btn btn--ghost btn--xs" onClick={() => { setSelectionMode(false); setSelectedIds(new Set()); }} style={{ color: '#fff', padding: 0 }}>
                ✕ Cancelar
              </button>
              <span style={{ fontWeight: 700, fontSize: 'var(--font-size-base)', color: '#fff' }}>
                {selectedIds.size} {selectedIds.size === 1 ? 'seleccionado' : 'seleccionados'}
              </span>
            </div>
            <button className="btn btn--ghost btn--xs" onClick={handleBatchDelete} style={{ color: '#fff', padding: 0 }}>
              <IconTrash />
            </button>
          </div>
        ) : (
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
        )}
      </div>



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
              const repliedMsg = msg.reply_to_id ? messages.find(m => m.id === msg.reply_to_id) : null;
              
              return (
                <MessageRow
                  key={msg.id}
                  msg={msg}
                  isMe={isMe}
                  displayPartnerName={displayPartnerName}
                  profile={profile}
                  repliedMsg={repliedMsg}
                  selectionMode={selectionMode}
                  isSelected={selectedIds.has(msg.id)}
                  onToggleSelection={handleToggleSelection}
                  onStartSelection={handleStartSelection}
                  onReply={(m: Message) => setReplyingTo(m)}
                />
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="chat-input-bar">
        {replyingTo && (
          <div className="row row--between" style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md) var(--radius-md) 0 0', marginBottom: '8px', borderLeft: '3px solid var(--color-primary)' }}>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-primary)' }}>
                Respondiendo a {replyingTo.sender_id === profile?.id ? 'ti mismo' : displayPartnerName}
              </div>
              <div style={{ fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--color-text-secondary)' }}>
                {replyingTo.content}
              </div>
            </div>
            <button className="btn btn--ghost" style={{ padding: '4px', minWidth: 'auto' }} onClick={() => setReplyingTo(null)}>
              ✕
            </button>
          </div>
        )}
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
        {notifPermission === 'default' && !isMockMode && (
          <div style={{ background: 'var(--color-primary)', padding: 'var(--space-xs) var(--space-md)', textAlign: 'center', cursor: 'pointer', borderTop: '1px solid var(--color-border)', marginTop: 'var(--space-sm)', borderRadius: 'var(--radius-md)' }} onClick={requestNotificationPermission}>
            <span style={{ fontSize: '11px', marginRight: '8px' }}>🔔 Activa las notificaciones push para saber cuándo te escribe</span>
            <span style={{ fontSize: '11px', color: '#fff', textDecoration: 'underline', fontWeight: 'bold' }}>Activar</span>
          </div>
        )}
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
