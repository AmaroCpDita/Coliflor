// ============================================================
// Coliflor — Home Page (Mockup Re-design)
// ============================================================

import { useState, useEffect, useMemo } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { daysSince, generateInviteCode, formatDate } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { sendPushNotification } from '../lib/push';
import { getCelebration, Celebration, CelebrationType } from '../lib/celebrations';
import Fireworks from '../components/Fireworks';
import CelebrationBanner from '../components/CelebrationBanner';
import CelebrationModal from '../components/CelebrationModal';

function IconFlame() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

function IconCamera() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconHeartCard() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function IconQuizCard() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
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

function IconGoldHeart({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-accent)' }}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

const DEFAULT_DEDICATION = '¡Escribe aquí tu primera notita! Ámame mucho y dime cosas bonitas 💛';

export default function Home() {
  const { user, profile, couple, partner, refreshProfile, isMockMode } = useAuth();
  const { theme } = useTheme();
  const { openNotifCenter, hasUnread } = useOutletContext<{ openNotifCenter?: () => void; hasUnread?: boolean }>() || {};
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showEditNoteForm, setShowEditNoteForm] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [debugCelebrationType, setDebugCelebrationType] = useState<CelebrationType | 'none' | null>(null);

  const daysCount = couple ? daysSince(couple.relationship_start) : 0;

  // Celebration detection
  const celebration = useMemo(() => {
    if (debugCelebrationType === 'none') return null;
    if (debugCelebrationType) {
      const mock: Celebration = {
        type: debugCelebrationType,
        intensity: 'medium',
        title: `Prueba: ${debugCelebrationType}`,
        subtitle: 'Simulación local',
        emoji: '🧪',
        colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#FFFFFF', '#FF69B4'],
        months: 1,
        days: 30,
        years: 1,
      };

      if (debugCelebrationType === 'cumplemes') {
        mock.emoji = '💌';
        mock.title = '¡Feliz cumplemes!';
        mock.subtitle = '+ 1 mes de infinitos';
        mock.intensity = 'medium';
        mock.colors = ['#e5c573', '#edd693', '#f3e29f', '#FFD700', '#FFFFFF'];
        mock.effect = 'snowfall';
        mock.particleShape = 'emoji:💌,✨,💛';
      } else if (debugCelebrationType === 'aniversario') {
        mock.emoji = '🎊';
        mock.title = '💛 ¡Feliz primer aniversario!';
        mock.subtitle = '¡Un año increíble de amor!';
        mock.intensity = 'high';
        mock.colors = ['#FFD700', '#FF69B4', '#FF6B6B', '#FFFFFF', '#e5c573', '#f472b6', '#4ECDC4'];
        mock.effect = 'fireworks';
        mock.particleShape = 'heart';
      } else if (debugCelebrationType === 'hito100') {
        mock.emoji = '🎉';
        mock.title = '🎉 ¡Otros 100 días juntos!';
        mock.subtitle = '¡100 días de amor y complicidad!';
        mock.intensity = 'medium';
        mock.colors = ['#e5c573', '#FF69B4', '#4ECDC4', '#FFD700', '#FFFFFF', '#FF6B6B'];
        mock.effect = 'fireworks';
        mock.particleShape = 'star';
      } else if (debugCelebrationType === 'fiestas_patrias') {
        mock.emoji = '🇨🇱';
        mock.title = '¡Felices Fiestas Patrias!';
        mock.subtitle = '¡Viva Chile! 🇨🇱🎉';
        mock.intensity = 'high';
        mock.colors = ['#D52B1E', '#FFFFFF', '#0039A6', '#FFD700'];
        mock.effect = 'fireworks';
        mock.particleShape = 'circle';
      } else if (debugCelebrationType === 'navidad') {
        mock.emoji = '🎄';
        mock.title = '¡Feliz Navidad!';
        mock.subtitle = '¡Que tengas unas felices fiestas! 🎄';
        mock.intensity = 'high';
        mock.colors = ['#FF0000', '#00FF00', '#FFD700', '#FFFFFF', '#FF6B6B'];
        mock.effect = 'snowfall';
        mock.particleShape = 'emoji:🎄,❄️,⛄';
      } else if (debugCelebrationType === 'ano_nuevo') {
        mock.emoji = '🎆';
        mock.title = '¡Feliz Año Nuevo!';
        mock.subtitle = '¡Con todo este nuevo año! 🥂';
        mock.intensity = 'high';
        mock.colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#FFFFFF', '#FF69B4'];
        mock.effect = 'fireworks';
        mock.particleShape = 'star';
      } else if (debugCelebrationType === 'san_valentin') {
        mock.emoji = '💝';
        mock.title = '¡Feliz Día del Amor!';
        mock.subtitle = 'El día del amor y la amistad 💕';
        mock.intensity = 'medium';
        mock.colors = ['#FF69B4', '#FF1493', '#FF6B9D', '#FFB6C1', '#FFFFFF'];
        mock.effect = 'snowfall';
        mock.particleShape = 'emoji:❤️';
      } else if (debugCelebrationType === 'halloween') {
        mock.emoji = '🎃';
        mock.title = '¡Feliz Halloween!';
        mock.subtitle = 'Noche de brujas 🎃👻';
        mock.intensity = 'low';
        mock.colors = ['#FF6600', '#8B00FF', '#39FF14', '#FFD700'];
        mock.effect = 'snowfall';
        mock.particleShape = 'emoji:🎃,👻,🦇';
      } else if (debugCelebrationType === 'cumpleanos_mio') {
        mock.emoji = '🎂';
        mock.title = '¡Feliz Cumpleaños a ti! 🎂';
        mock.subtitle = 'Hoy celebramos tu vida 🥳';
        mock.intensity = 'high';
        mock.colors = ['#FF69B4', '#FFD700', '#4ECDC4', '#FFFFFF', '#FF6B6B'];
        mock.effect = 'snowfall';
        mock.particleShape = 'emoji:🎈,🎁,🎉';
      } else if (debugCelebrationType === 'cumpleanos_pareja') {
        mock.emoji = '🎂';
        mock.title = '¡Feliz Cumpleaños mi amor! 🎂';
        mock.subtitle = 'Hoy celebramos un año más de tu persona favorita 🥳';
        mock.intensity = 'high';
        mock.colors = ['#FF69B4', '#FFD700', '#4ECDC4', '#FFFFFF', '#FF6B6B'];
        mock.effect = 'snowfall';
        mock.particleShape = 'emoji:🎈,🎁,🎉';
      }
      return mock;
    }
    
    if (!couple?.relationship_start) return null;
    return getCelebration(couple.relationship_start, profile?.birthday, partner?.birthday);
  }, [couple?.relationship_start, debugCelebrationType, profile?.birthday, partner?.birthday]);
  const isCelebrating = celebration !== null;
  const showConfetti = celebration ? celebration.intensity !== 'low' : false;
  const myName = profile?.display_name || user?.user_metadata?.display_name || 'Tú';
  const partnerName = partner ? partner.display_name : 'Tu pareja';
  const currentCode = generatedCode || profile?.invite_code;

  // Determine user1 vs user2 roles
  const isUser1 = couple ? couple.user1_id === profile?.id : true;

  // Partner note written FOR ME
  const partnerNoteInDb = isUser1 ? couple?.user2_note : couple?.user1_note;
  const partnerNoteUpdatedAt = isUser1 ? couple?.user2_note_updated_at : couple?.user1_note_updated_at;
  const isDailyNoteFromPartner = Boolean(couple?.daily_note_updated_by && couple.daily_note_updated_by !== profile?.id);
  const legacyNoteInDb = isDailyNoteFromPartner ? couple?.daily_note : null;
  const rawReceivedNote = partnerNoteInDb || legacyNoteInDb;

  const receivedNoteDisplay = (rawReceivedNote && rawReceivedNote.trim())
    ? rawReceivedNote.trim()
    : `${partnerName} aún no ha escrito su notita para ti.`;

  // Helper for absolute time
  const getAbsoluteTime = (isoString?: string) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    const dateStr = d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
    return `el ${dateStr} a las ${timeStr}`;
  };

  // My Note FOR MY PARTNER
  const myNoteInDb = isUser1 ? couple?.user1_note : couple?.user2_note;
  const isDailyNoteFromMe = Boolean(couple?.daily_note_updated_by && couple.daily_note_updated_by === profile?.id);
  const legacyMyNote = isDailyNoteFromMe ? couple?.daily_note : null;
  const rawMySentNote = myNoteInDb || legacyMyNote;

  const [mySentNote, setMySentNote] = useState<string>(
    rawMySentNote && rawMySentNote.trim() ? rawMySentNote.trim() : DEFAULT_DEDICATION
  );

  const [noteInput, setNoteInput] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Realtime updates state for quick actions
  const [quizStatus, setQuizStatus] = useState('Nuevo');

  // Sync mySentNote when couple changes
  useEffect(() => {
    if (rawMySentNote && rawMySentNote.trim()) {
      setMySentNote(rawMySentNote.trim());
    }
  }, [rawMySentNote]);

  const handleCopyCode = async () => {
    if (currentCode) {
      try {
        await navigator.clipboard.writeText(currentCode);
      } catch {
        // Fallback
      }
    }
  };

  const handleGenerateCode = async () => {
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      const code = generateInviteCode();
      const { data: returnedCode, error: rpcError } = await supabase.rpc('generate_my_invite_code', { p_code: code });
      if (rpcError) throw rpcError;

      setGeneratedCode(returnedCode || code);
      await refreshProfile();
    } catch (err: any) {
      console.error('Error generating code:', err);
      setError(err?.message || 'Error al generar código');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCouple = async () => {
    if (!user || !joinCode.trim()) return;
    setLoading(true);
    setError('');

    try {
      const normalized = joinCode.trim().toUpperCase();
      const { error: rpcError } = await supabase.rpc('create_couple', { p_invite_code: normalized });
      if (rpcError) throw rpcError;
      setShowJoinModal(false);
      await refreshProfile();
    } catch (err: any) {
      setError(err?.message || 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditNote = () => {
    setNoteInput(mySentNote);
    setShowEditNoteForm(true);
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedText = noteInput.trim();
    if (!updatedText || savingNote) return;

    setSavingNote(true);
    setMySentNote(updatedText);
    setShowEditNoteForm(false);

    if (couple && !isMockMode) {
      try {
        const payload: any = {
          daily_note: updatedText,
          daily_note_updated_by: profile?.id,
        };
        const nowIso = new Date().toISOString();
        if (isUser1) {
          payload.user1_note = updatedText;
          payload.user1_note_updated_at = nowIso;
        } else {
          payload.user2_note = updatedText;
          payload.user2_note_updated_at = nowIso;
        }

        const { error: updErr } = await supabase
          .from('couples')
          .update(payload)
          .eq('id', couple.id);

        if (updErr) {
          console.warn('Primary update warning, executing fallback update:', updErr);
          await supabase
            .from('couples')
            .update({
              daily_note: updatedText,
              daily_note_updated_by: profile?.id,
            })
            .eq('id', couple.id);
        }

        if (profile) {
          try {
            await supabase.from('messages').insert({
              couple_id: couple.id,
              sender_id: profile.id,
              content: `💌 ¡${myName} te envió una notita nueva en el inicio!`,
            });
          } catch {
            // Non-fatal fallback
          }

          if (partner?.id) {
            sendPushNotification(partner.id, myName, `💌 ¡${myName} te envió una notita nueva en el inicio!`);
          }
        }

        await refreshProfile();
      } catch (err: any) {
        console.warn('Note update warning:', err);
      }
    }
    setSavingNote(false);
  };

  return (
    <div className="page" style={{ paddingBottom: '120px', position: 'relative' }}>
      
      {/* Spectacular Dynamic Backgrounds */}
      {celebration?.type === 'aniversario' && (
        <div 
          className="heart-pulse" 
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'radial-gradient(circle at 50% 30%, rgba(255,215,0,0.15) 0%, rgba(255,107,107,0.05) 50%, transparent 100%)',
            zIndex: -1,
            pointerEvents: 'none',
          }} 
        />
      )}
      {celebration?.type === 'san_valentin' && (
        <div 
          className="heart-pulse" 
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'radial-gradient(circle at 50% 30%, rgba(255,105,180,0.15) 0%, rgba(255,20,147,0.05) 50%, transparent 100%)',
            zIndex: -1,
            pointerEvents: 'none',
          }} 
        />
      )}

      <div className="stack stack--md stagger-children" style={{ position: 'relative', zIndex: 1 }}>
        {/* Link Partner Banner */}
        {!partner && (
          <div className="glass-card text-center animate-fade-in">
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600 }}>Vincular Pareja</h3>
            <p className="text-secondary" style={{ fontSize: 'var(--font-size-xs)', margin: 'var(--space-xs) 0 var(--space-md)' }}>
              Conéctate con tu pareja para compartir el espacio.
            </p>
            {currentCode ? (
              <div className="stack stack--sm">
                <div className="invite-code-display" style={{ fontSize: 'var(--font-size-xl)', padding: 'var(--space-sm) var(--space-md)' }}>
                  {currentCode}
                </div>
                <div className="row row--gap-sm">
                  <button className="btn btn--primary btn--sm" style={{ flex: 1 }} onClick={handleCopyCode}>Copiar código</button>
                  <button className="btn btn--secondary btn--sm" style={{ flex: 1 }} onClick={() => setShowJoinModal(true)}>Tengo código</button>
                </div>
              </div>
            ) : (
              <div className="row row--gap-sm">
                <button className="btn btn--primary btn--sm" style={{ flex: 1 }} onClick={handleGenerateCode} disabled={loading}>
                  Generar código
                </button>
                <button className="btn btn--secondary btn--sm" style={{ flex: 1 }} onClick={() => setShowJoinModal(true)}>
                  Tengo un código
                </button>
              </div>
            )}
          </div>
        )}

        {/* Celebration Effects Overlay */}
        {isCelebrating && celebration && (
          <Fireworks 
            intensity={celebration.intensity} 
            colors={celebration.colors} 
            confetti={showConfetti}
            effect={celebration.effect}
            particleShape={celebration.particleShape}
            interactive={celebration.type === 'aniversario' || celebration.type === 'san_valentin'}
          />
        )}

        {/* Celebration Banner */}
        {celebration && (
          <CelebrationBanner celebration={celebration} />
        )}

        {/* Celebration Full Screen Modal */}
        {celebration && (
          <CelebrationModal celebration={celebration} partnerName={partnerName} />
        )}

        {/* Hero Card with Custom Background Image */}
        <div className={`glass-card text-center animate-fade-in ${isCelebrating ? 'hero-card--celebrating' : ''}`} style={{
          padding: 'var(--space-2xl) var(--space-md)',
          background: `
            linear-gradient(to bottom, rgba(13, 14, 18, 0.2) 0%, rgba(13, 14, 18, 0.9) 100%),
            url('/hero-bg.jpg') center/cover no-repeat
          `,
          borderRadius: '32px',
          boxShadow: celebration?.type === 'aniversario' 
            ? '0 0 40px rgba(255, 215, 0, 0.3), inset 0 0 20px rgba(255, 215, 0, 0.1)' 
            : (isCelebrating ? undefined : '0 12px 40px rgba(0,0,0,0.3)'),
          border: celebration?.type === 'aniversario' 
            ? '2px solid rgba(255, 215, 0, 0.4)' 
            : (isCelebrating ? 'none' : 'none'),
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Avatar Row */}
          <div className="row row--center" style={{ gap: '12px', marginBottom: '16px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
              backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 600, fontSize: '18px', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}>
              {myName.charAt(0)}
            </div>
            <IconGoldHeart size={24} />
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
              backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 600, fontSize: '18px', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}>
              {partnerName.charAt(0)}
            </div>
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px', color: '#ffffff', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
            {myName} & {partnerName}
          </h2>

          <div style={{ textTransform: 'uppercase', fontSize: '12px', letterSpacing: '2px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '8px', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
            Llevan juntos
          </div>
          
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '24px' }}>
            <span
              className={isCelebrating ? 'days-counter--celebrating' : ''}
              style={{ fontSize: '64px', fontWeight: 700, color: '#ffffff', textShadow: isCelebrating ? 'none' : '0 4px 16px rgba(0,0,0,0.6)', lineHeight: 1 }}
            >
              {daysCount}
            </span>
            <span style={{ fontSize: '20px', fontWeight: 600, color: 'rgba(255,255,255,0.9)', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
              días
            </span>
          </div>

          {couple && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '12px', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
              <IconCalendar />
              <span>Desde el {formatDate(couple.relationship_start, 'long')}</span>
            </div>
          )}
        </div>

        {/* Section: HOY */}
        <div className="stack stack--sm" style={{ marginTop: '16px' }}>
          <div className="row row--between">
            <h4 style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--color-text-secondary)', paddingLeft: '8px' }}>
              HOY
            </h4>
            <button className="btn btn--ghost" style={{ padding: '4px', height: 'auto', minHeight: 0 }} onClick={handleOpenEditNote} title="Editar mi notita">
              <IconEdit />
            </button>
          </div>
          
          <div className="glass-card" style={{
            padding: '16px 20px',
            background: 'var(--gradient-accent-soft)',
            borderColor: 'var(--color-border-accent)',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div className="row row--gap-md" style={{ flex: 1, alignItems: 'center' }}>
              <div style={{ background: '#fff', borderRadius: '12px', width: '48px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', position: 'relative' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <div style={{ position: 'absolute', bottom: '-4px', right: '-4px' }}>
                   <IconGoldHeart size={14} />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  Notita de {partnerName} para ti
                </div>
                <div style={{ fontSize: '20px', fontStyle: 'italic', fontWeight: 700, color: 'var(--color-accent)' }}>
                  "{receivedNoteDisplay}"
                </div>
                {partnerNoteUpdatedAt && rawReceivedNote && rawReceivedNote.trim() && (
                  <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '6px', fontWeight: 500 }}>
                    Subido {getAbsoluteTime(partnerNoteUpdatedAt)}
                  </div>
                )}
              </div>
            </div>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-tertiary)' }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>

        {/* Section: PARA USTEDES */}
        <div className="stack stack--sm" style={{ marginTop: '8px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--color-text-secondary)', paddingLeft: '8px' }}>
            PARA USTEDES
          </h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            
            {/* Quick Card 1: Racha */}
            <Link to="/streak" style={{ textDecoration: 'none' }}>
              <div className="glass-card text-center" style={{ padding: '20px 8px', borderRadius: '24px', background: 'var(--color-bg-secondary)', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ color: 'var(--color-text-primary)', marginBottom: '16px' }}>
                  <IconCamera />
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px', lineHeight: 1.2 }}>
                  Racha de fotos
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  {couple?.current_streak || 0} día
                </div>
              </div>
            </Link>

            {/* Quick Card 2: Sintonía */}
            <Link to="/quiz" style={{ textDecoration: 'none' }}>
              <div className="glass-card text-center" style={{ padding: '20px 8px', borderRadius: '24px', background: 'var(--color-bg-secondary)', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ color: 'var(--color-accent)', marginBottom: '16px' }}>
                  <IconHeartCard />
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px', lineHeight: 1.2 }}>
                  Sintonía
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  {quizStatus}
                </div>
              </div>
            </Link>

            {/* Quick Card 3: Calendario */}
            <Link to="/calendar" style={{ textDecoration: 'none' }}>
              <div className="glass-card text-center" style={{ padding: '20px 8px', borderRadius: '24px', background: 'var(--color-bg-secondary)', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ color: 'var(--color-text-primary)', marginBottom: '16px' }}>
                  <IconCalendar />
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>
                  Calendario
                </div>
              </div>
            </Link>

          </div>
        </div>

      </div>

      {/* Edit Note Modal */}
      {showEditNoteForm && (
        <div className="modal-backdrop" onClick={() => setShowEditNoteForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__handle" />
            <div className="stack stack--lg">
              <div className="text-center">
                <h3>Editar notita para {partnerName}</h3>
                <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)', marginTop: '4px' }}>
                  Esta notita aparecerá en su página de inicio.
                </p>
              </div>

              <form onSubmit={handleSaveNote} className="stack stack--md">
                <textarea
                  className="input"
                  rows={4}
                  placeholder={`Escribe algo lindo para ${partnerName}...`}
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  style={{ resize: 'none' }}
                  autoFocus
                  required
                />
                
                {error && <div className="toast toast--error" style={{ position: 'relative', top: 0, left: 0, transform: 'none' }}>{error}</div>}

                <button type="submit" className="btn btn--primary btn--full btn--lg" disabled={savingNote || !noteInput.trim()}>
                  {savingNote ? 'Guardando...' : 'Guardar y enviar'}
                </button>
                <button type="button" className="btn btn--ghost btn--full" onClick={() => setShowEditNoteForm(false)}>
                  Cancelar
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Join Code Modal (same as before) */}
      {showJoinModal && (
        <div className="modal-backdrop" onClick={() => setShowJoinModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__handle" />
            <div className="stack stack--lg">
              <div className="text-center">
                <h3>Vincular con Código</h3>
                <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)', marginTop: '4px' }}>
                  Ingresa el código que te envió tu pareja
                </p>
              </div>

              <div className="input-group">
                <input
                  type="text"
                  className="input input--code"
                  placeholder="XXXX-XXXX"
                  value={joinCode}
                  onChange={(e) => {
                    let val = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
                    if (val.length === 4 && !val.includes('-')) val += '-';
                    if (val.length <= 9) setJoinCode(val);
                  }}
                  maxLength={9}
                />
              </div>

              {error && <div className="toast toast--error" style={{ position: 'relative', top: 0, left: 0, transform: 'none' }}>{error}</div>}

              <button className="btn btn--primary btn--full btn--lg" onClick={handleJoinCouple} disabled={loading || joinCode.length < 9}>
                {loading ? 'Vinculando...' : 'Vincular pareja'}
              </button>
              <button className="btn btn--ghost btn--full" onClick={() => { setShowJoinModal(false); setError(''); }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dev Only: Debug Celebrations Panel */}
      {import.meta.env.DEV && (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          right: '20px',
          background: 'rgba(0,0,0,0.8)',
          padding: '12px',
          borderRadius: '12px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          color: '#fff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          maxWidth: '200px'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '4px' }}>
            🧪 Simular Celebración
          </div>
          <select 
            value={debugCelebrationType || ''} 
            onChange={(e) => setDebugCelebrationType(e.target.value ? (e.target.value as any) : null)}
            style={{
              background: '#333',
              color: '#fff',
              border: '1px solid #555',
              borderRadius: '6px',
              padding: '6px'
            }}
          >
            <option value="">(Normal - Real)</option>
            <option value="none">Sin celebración</option>
            <option value="cumplemes">Cumplemes</option>
            <option value="aniversario">Aniversario</option>
            <option value="cumpleanos_mio">Tu Cumpleaños</option>
            <option value="cumpleanos_pareja">Cumpleaños Pareja</option>
            <option value="hito100">Hito 100 Días</option>
            <option value="fiestas_patrias">Fiestas Patrias</option>
            <option value="navidad">Navidad</option>
            <option value="ano_nuevo">Año Nuevo</option>
            <option value="san_valentin">San Valentín</option>
            <option value="halloween">Halloween</option>
          </select>
        </div>
      )}
    </div>
  );
}
