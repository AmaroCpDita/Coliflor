// ============================================================
// Coliflor — Home Page (Bulletproof Reciprocal Partner Notes)
// ============================================================

import { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { daysSince, generateInviteCode, formatDate } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { sendOneSignalPush } from '../lib/onesignal';

function IconFlame() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e5c573" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

function IconQuizCard() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e5c573" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e5c573" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconMessage() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e5c573" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e5c573" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconGoldHeart({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#e5c573" stroke="#e5c573" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

const DEFAULT_DEDICATION = '¡Escribe aquí tu primera notita! Ámame mucho y dime cosas bonitas 💛';

export default function Home() {
  const { user, profile, couple, partner, refreshProfile, isMockMode } = useAuth();
  const { openNotifCenter, hasUnread } = useOutletContext<{ openNotifCenter?: () => void; hasUnread?: boolean }>() || {};
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showEditNoteForm, setShowEditNoteForm] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');

  const daysCount = couple ? daysSince(couple.relationship_start) : 0;
  const myName = profile?.display_name || user?.user_metadata?.display_name || 'Tú';
  const partnerName = partner ? partner.display_name : 'Tu pareja';
  const currentCode = generatedCode || profile?.invite_code;

  // Determine user1 vs user2 roles
  const isUser1 = couple ? couple.user1_id === profile?.id : true;

  // Partner note written FOR ME (Read-Only)
  const partnerNoteInDb = isUser1 ? couple?.user2_note : couple?.user1_note;
  const isDailyNoteFromPartner = Boolean(couple?.daily_note_updated_by && couple.daily_note_updated_by !== profile?.id);
  const legacyNoteInDb = isDailyNoteFromPartner ? couple?.daily_note : null;
  const rawReceivedNote = partnerNoteInDb || legacyNoteInDb;

  const receivedNoteDisplay = (rawReceivedNote && rawReceivedNote.trim())
    ? rawReceivedNote.trim()
    : `${partnerName} aún no ha escrito su notita para ti.`;

  // Note written BY ME FOR MY PARTNER (Editable by ME)
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
        if (isUser1) payload.user1_note = updatedText;
        else payload.user2_note = updatedText;

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

        // Insert push notification message
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
            sendOneSignalPush(partner.id, myName, `💌 ¡${myName} te envió una notita nueva en el inicio!`);
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
    <div className="page" style={{ paddingBottom: '120px' }}>
      <div className="stack stack--md stagger-children">
        {/* Top Bar Header (Lacticonecta Style Header) */}
        <div className="row row--between" style={{ padding: '0 4px' }}>
          <div className="row row--gap-sm">
            <div className="logo-badge" style={{ width: '36px', height: '36px', margin: 0, padding: '2px', borderRadius: 'var(--radius-md)' }}>
              <img src="/logo.png" alt="Coliflor" className="logo-badge__img" style={{ borderRadius: 'calc(var(--radius-md) - 2px)' }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 'var(--font-size-base)', lineHeight: 1.1 }}>
                <span className="text-gradient">Coliflor</span>
              </div>
              <div className="text-secondary" style={{ fontSize: '10px' }}>
                Tu espacio de pareja
              </div>
            </div>
          </div>

          <div className="row row--gap-xs">
            <button
              onClick={openNotifCenter}
              className="btn btn--ghost"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                padding: 0,
                background: 'rgba(24, 26, 36, 0.85)',
                border: '1px solid var(--color-border-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
              title="Historial de Notificaciones"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e5c573" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {hasUnread && (
                <span style={{
                  position: 'absolute',
                  top: '5px',
                  right: '5px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#e07a7a',
                  boxShadow: '0 0 8px #e07a7a',
                }} />
              )}
            </button>

            <Link
              to="/settings"
              className="btn btn--ghost"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                padding: 0,
                background: 'rgba(24, 26, 36, 0.85)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Ajustes"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Couple Linking Banner (if partner not connected) */}
        {!partner && (
          <div className="glass-card glass-card--accent text-center animate-fade-in">
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600 }}>Vincular Pareja</h3>
            <p className="text-secondary" style={{ fontSize: 'var(--font-size-xs)', margin: 'var(--space-xs) 0 var(--space-md)' }}>
              Conéctate con tu pareja para compartir racha, cuestionarios, calendario y mensajes.
            </p>

            {currentCode ? (
              <div className="stack stack--sm">
                <p className="text-secondary" style={{ fontSize: 'var(--font-size-xs)' }}>
                  Tu código de vinculación:
                </p>
                <div className="invite-code-display" style={{ fontSize: 'var(--font-size-xl)', padding: 'var(--space-sm) var(--space-md)' }}>
                  {currentCode}
                </div>
                <div className="row row--gap-sm">
                  <button className="btn btn--primary btn--sm" style={{ flex: 1 }} onClick={handleCopyCode}>
                    Copiar código
                  </button>
                  <button className="btn btn--secondary btn--sm" style={{ flex: 1 }} onClick={() => setShowJoinModal(true)}>
                    Tengo un código
                  </button>
                </div>
              </div>
            ) : (
              <div className="row row--gap-sm">
                <button
                  className="btn btn--primary btn--sm"
                  style={{ flex: 1 }}
                  onClick={handleGenerateCode}
                  disabled={loading}
                >
                  {loading ? 'Generando...' : 'Generar código'}
                </button>
                <button
                  className="btn btn--secondary btn--sm"
                  style={{ flex: 1 }}
                  onClick={() => setShowJoinModal(true)}
                >
                  Tengo un código
                </button>
              </div>
            )}

            {error && (
              <div className="toast toast--error" style={{ position: 'relative', top: 'var(--space-md)', left: 0, transform: 'none' }}>
                {error}
              </div>
            )}
          </div>
        )}

        {/* Couple Hero Card */}
        <div className="glass-card glass-card--accent text-center animate-fade-in" style={{
          padding: 'var(--space-md) var(--space-lg)',
          background: 'linear-gradient(180deg, rgba(229, 197, 115, 0.12) 0%, rgba(22, 23, 32, 0.85) 100%)',
          borderColor: 'rgba(229, 197, 115, 0.3)',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(229, 197, 115, 0.08)',
        }}>
          {/* Initials & Heart Badge */}
          <div className="row row--center row--gap-sm" style={{ marginBottom: 'var(--space-sm)' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-accent-light)',
            }}>
              {myName.charAt(0)}
            </div>

            <IconGoldHeart size={18} />

            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-accent-light)',
            }}>
              {partnerName.charAt(0)}
            </div>
          </div>

          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, letterSpacing: '-0.01em', marginBottom: '2px' }}>
            {myName} & {partnerName}
          </h3>

          <div style={{ margin: 'var(--space-xs) 0' }}>
            <span className="text-secondary" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, display: 'block', marginBottom: '2px' }}>
              Llevan juntos
            </span>
            <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{
                fontSize: '3.2rem',
                fontWeight: 800,
                color: 'var(--color-accent-light)',
                lineHeight: 1,
                textShadow: '0 0 16px rgba(229, 197, 115, 0.25)',
              }}>
                {daysCount}
              </span>
              <span className="text-secondary" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>
                días
              </span>
            </div>
          </div>

          {couple && (
            <div style={{
              display: 'inline-block',
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--color-border)',
              marginTop: '4px',
            }}>
              <span className="text-secondary" style={{ fontSize: '11px', textTransform: 'capitalize' }}>
                Desde el {formatDate(couple.relationship_start, 'long')}
              </span>
            </div>
          )}
        </div>

        {/* CARD 1: Note Received from Partner (READ-ONLY) */}
        <div
          className="glass-card text-center stack stack--xs animate-fade-in"
          style={{
            padding: 'var(--space-md)',
            background: 'linear-gradient(180deg, rgba(229, 197, 115, 0.08) 0%, rgba(22, 23, 32, 0.6) 100%)',
            borderColor: 'var(--color-border-accent)',
          }}
        >
          <div className="text-secondary text-center" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
            Notita de {partnerName} para ti
          </div>

          <p style={{ fontSize: 'var(--font-size-xs)', fontStyle: 'italic', color: 'var(--color-text-primary)', lineHeight: 1.5, fontWeight: 500, margin: '4px 0' }}>
            "{receivedNoteDisplay}"
          </p>
        </div>

        {/* CARD 2: My Sent Note to Partner (EDITABLE BY ME) */}
        <div
          className="glass-card text-center stack stack--xs animate-fade-in"
          style={{
            padding: 'var(--space-md)',
            background: 'var(--color-bg-card)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="text-secondary text-center" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
            Tu notita enviada a {partnerName}
          </div>

          {!showEditNoteForm ? (
            <>
              <p style={{ fontSize: 'var(--font-size-xs)', fontStyle: 'italic', color: 'var(--color-text-secondary)', lineHeight: 1.5, fontWeight: 500, margin: '4px 0 6px' }}>
                "{mySentNote}"
              </p>

              <button
                className="btn btn--secondary btn--sm btn--full row row--center row--gap-xs"
                onClick={handleOpenEditNote}
                style={{
                  fontSize: '11px',
                  padding: '6px 12px',
                  background: 'rgba(229, 197, 115, 0.12)',
                  borderColor: 'var(--color-border-accent)',
                  color: 'var(--color-accent-light)',
                  fontWeight: 600,
                }}
              >
                <IconEdit />
                <span>Enviar notita a {partnerName}</span>
              </button>
            </>
          ) : (
            <form onSubmit={handleSaveNote} className="stack stack--xs animate-fade-in" style={{ marginTop: '4px' }}>
              <textarea
                className="input"
                rows={3}
                placeholder={`Escribe una notita especial para ${partnerName}...`}
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                style={{ resize: 'none', fontSize: 'var(--font-size-xs)', padding: 'var(--space-sm)' }}
                autoFocus
                required
              />

              <div className="row row--gap-xs" style={{ marginTop: '4px' }}>
                <button
                  type="submit"
                  className="btn btn--primary btn--sm"
                  style={{ flex: 1, fontSize: '11px', padding: '6px' }}
                  disabled={savingNote || !noteInput.trim()}
                >
                  {savingNote ? 'Guardando...' : 'Guardar y enviar'}
                </button>

                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  style={{ fontSize: '11px', padding: '6px' }}
                  onClick={() => setShowEditNoteForm(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Dynamic Interactive Section Shortcut Cards */}
        <div className="stack stack--md">
          {/* Racha de Fotos Card */}
          <Link to="/streak" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="glass-card glass-card--interactive" style={{ padding: 'var(--space-md) var(--space-lg)' }}>
              <div className="row row--between">
                <div className="row row--gap-md">
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--gradient-accent-soft)',
                    border: '1px solid var(--color-border-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <IconFlame />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 'var(--font-size-base)', color: 'var(--color-text-primary)' }}>
                      Racha de Fotos
                    </div>
                    <div className="text-secondary" style={{ fontSize: 'var(--font-size-xs)' }}>
                      Foto diaria juntos y candado
                    </div>
                  </div>
                </div>

                <div className="row row--gap-xs text-secondary">
                  {couple && (
                    <span style={{
                      fontWeight: 800,
                      color: 'var(--color-accent-light)',
                      fontSize: 'var(--font-size-sm)',
                      background: 'rgba(229, 197, 115, 0.12)',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid var(--color-border-accent)',
                    }}>
                      {couple.current_streak}d
                    </span>
                  )}
                  <IconChevronRight />
                </div>
              </div>
            </div>
          </Link>

          {/* Cuestionario de Sintonía Card */}
          <Link to="/quiz" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="glass-card glass-card--interactive" style={{ padding: 'var(--space-md) var(--space-lg)' }}>
              <div className="row row--between">
                <div className="row row--gap-md">
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--gradient-accent-soft)',
                    border: '1px solid var(--color-border-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <IconQuizCard />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 'var(--font-size-base)', color: 'var(--color-text-primary)' }}>
                      Cuestionario de Sintonía
                    </div>
                    <div className="text-secondary" style={{ fontSize: 'var(--font-size-xs)' }}>
                      5 preguntas diarias para conocerse
                    </div>
                  </div>
                </div>

                <div className="row row--gap-xs text-secondary">
                  <span style={{
                    fontWeight: 700,
                    color: 'var(--color-accent-light)',
                    fontSize: '11px',
                    background: 'rgba(229, 197, 115, 0.12)',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--color-border-accent)',
                  }}>
                    Nuevo hoy
                  </span>
                  <IconChevronRight />
                </div>
              </div>
            </div>
          </Link>

          {/* Calendario Compartido Card */}
          <Link to="/calendar" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="glass-card glass-card--interactive" style={{ padding: 'var(--space-md) var(--space-lg)' }}>
              <div className="row row--between">
                <div className="row row--gap-md">
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--gradient-accent-soft)',
                    border: '1px solid var(--color-border-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <IconCalendar />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 'var(--font-size-base)', color: 'var(--color-text-primary)' }}>
                      Calendario Compartido
                    </div>
                    <div className="text-secondary" style={{ fontSize: 'var(--font-size-xs)' }}>
                      Nuestros días, citas y recuerdos
                    </div>
                  </div>
                </div>
                <span className="text-secondary">
                  <IconChevronRight />
                </span>
              </div>
            </div>
          </Link>

          {/* Mensajes Privados Card */}
          <Link to="/messages" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="glass-card glass-card--interactive" style={{ padding: 'var(--space-md) var(--space-lg)' }}>
              <div className="row row--between">
                <div className="row row--gap-md">
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--gradient-accent-soft)',
                    border: '1px solid var(--color-border-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <IconMessage />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 'var(--font-size-base)', color: 'var(--color-text-primary)' }}>
                      Mensajes Privados
                    </div>
                    <div className="text-secondary" style={{ fontSize: 'var(--font-size-xs)' }}>
                      Chat en tiempo real y notificaciones
                    </div>
                  </div>
                </div>
                <span className="text-secondary">
                  <IconChevronRight />
                </span>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Join Code Modal */}
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

              {error && (
                <div className="toast toast--error" style={{ position: 'relative', top: 0, left: 0, transform: 'none' }}>
                  {error}
                </div>
              )}

              <button
                className="btn btn--primary btn--full btn--lg"
                onClick={handleJoinCouple}
                disabled={loading || joinCode.length < 9}
              >
                {loading ? 'Vinculando...' : 'Vincular pareja'}
              </button>

              <button className="btn btn--ghost btn--full" onClick={() => { setShowJoinModal(false); setError(''); }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
