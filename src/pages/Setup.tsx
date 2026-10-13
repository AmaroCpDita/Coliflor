// ============================================================
// Coliflor — Setup Page (Create/Join Couple)
// ============================================================

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { generateInviteCode } from '../lib/utils';

export default function Setup() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [step, setStep] = useState<'choose' | 'create' | 'join'>('choose');
  const [inviteCode, setInviteCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [relationshipDate, setRelationshipDate] = useState('');
  const [birthday, setBirthday] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateCouple = async () => {
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      if (profile?.invite_code) {
        setInviteCode(profile.invite_code);
        setLoading(false);
        return;
      }

      const code = generateInviteCode();

      // Try RPC first (bypasses any RLS edge-cases)
      const { error: rpcError } = await supabase.rpc('generate_my_invite_code', {
        p_code: code,
      });

      if (birthday) {
        await supabase.from('profiles').update({ birthday: birthday }).eq('id', user.id);
      }

      if (rpcError) {
        // Fallback: direct upsert
        const displayName = profile?.display_name || user.user_metadata?.display_name || 'Usuario';
        const { error: updateError } = await supabase.from('profiles').upsert({
          id: user.id,
          display_name: displayName,
          invite_code: code,
        });
        if (updateError) throw updateError;
      }

      setInviteCode(code);
      await refreshProfile();
    } catch (err: any) {
      console.error('Error creating couple code:', err);
      const msg =
        err?.message || err?.details || (typeof err === 'string' ? err : 'Error al crear código');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCouple = async () => {
    if (!user || !inputCode.trim()) return;
    setLoading(true);
    setError('');

    try {
      const normalizedCode = inputCode.trim().toUpperCase();

      const { error: rpcError } = await supabase.rpc('create_couple', {
        p_invite_code: normalizedCode,
        p_relationship_start: relationshipDate || null,
      });

      if (rpcError) throw rpcError;

      if (birthday) {
        await supabase.from('profiles').update({ birthday: birthday }).eq('id', user.id);
      }

      await refreshProfile();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al unirse';
      if (msg.includes('Invalid invite code')) {
        setError('Código inválido o ya utilizado');
      } else if (msg.includes('already in a couple')) {
        setError('Ya estás en una pareja');
      } else if (msg.includes('Cannot join your own')) {
        setError('No puedes unirte a tu propio código');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = inviteCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="page page--centered">
      <div className="stack stack--xl" style={{ width: '100%', maxWidth: '360px' }}>
        {/* Header */}
        <div className="animate-fade-in-up">
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>
            <span className="heart-pulse">💜</span>
          </div>
          <h2>
            Hola, <span className="text-gradient">{profile?.display_name}</span>
          </h2>
          <p className="text-secondary" style={{ marginTop: 'var(--space-sm)' }}>
            Vincula tu cuenta con tu pareja
          </p>
        </div>

        {/* Step: Choose */}
        {step === 'choose' && (
          <div className="stack stack--md animate-fade-in-up stagger-children">
            <button
              className="glass-card glass-card--interactive glass-card--accent"
              onClick={() => setStep('create')}
              style={{ textAlign: 'left' }}
            >
              <div className="row row--gap-md">
                <span style={{ fontSize: '2rem' }}>🔗</span>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>Crear pareja</div>
                  <div className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>
                    Genera un código para enviar
                  </div>
                </div>
              </div>
            </button>

            <button
              className="glass-card glass-card--interactive"
              onClick={() => setStep('join')}
              style={{ textAlign: 'left' }}
            >
              <div className="row row--gap-md">
                <span style={{ fontSize: '2rem' }}>🎟️</span>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>Tengo un código</div>
                  <div className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>
                    Mi pareja me envió un código
                  </div>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Step: Create (show code) */}
        {step === 'create' && !inviteCode && (
          <div className="stack stack--lg animate-fade-in-up">
            <div className="input-group">
              <label htmlFor="relDate">¿Cuándo empezaron a salir?</label>
              <input
                id="relDate"
                type="date"
                className="input"
                value={relationshipDate}
                onChange={(e) => setRelationshipDate(e.target.value)}
              />
              <span className="text-secondary" style={{ fontSize: 'var(--font-size-xs)' }}>
                Opcional — se puede cambiar después
              </span>
            </div>

            <div className="input-group">
              <label htmlFor="bday1">Tu cumpleaños</label>
              <input
                id="bday1"
                type="date"
                className="input"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
              />
              <span className="text-secondary" style={{ fontSize: 'var(--font-size-xs)' }}>
                Opcional — para celebrarlo juntos 🎉
              </span>
            </div>

            {error && (
              <div
                className="toast toast--error"
                style={{ position: 'relative', top: 0, left: 0, transform: 'none' }}
              >
                {error}
              </div>
            )}

            <button
              className="btn btn--primary btn--full btn--lg"
              onClick={handleCreateCouple}
              disabled={loading}
            >
              {loading ? (
                <div
                  className="spinner"
                  style={{ width: '20px', height: '20px', borderWidth: '2px' }}
                />
              ) : (
                'Generar código'
              )}
            </button>

            <button
              className="btn btn--ghost btn--full"
              onClick={() => {
                setStep('choose');
                setError('');
              }}
            >
              ← Volver
            </button>
          </div>
        )}

        {step === 'create' && inviteCode && (
          <div className="stack stack--lg animate-scale-in">
            <p className="text-secondary">Envía este código a tu pareja:</p>

            <div className="invite-code-display">{inviteCode}</div>

            <button className="btn btn--primary btn--full" onClick={handleCopyCode}>
              📋 Copiar código
            </button>

            <button
              className="btn btn--secondary btn--full btn--lg"
              onClick={() => refreshProfile()}
            >
              ✨ Entrar a la app ahora
            </button>

            <div className="glass-card" style={{ textAlign: 'left' }}>
              <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>
                💡 Puedes entrar y explorar la app desde ya. Cuando tu pareja ingrese tu código en
                su teléfono, sus cuentas se vincularán automáticamente en tiempo real.
              </p>
            </div>
          </div>
        )}

        {/* Step: Join */}
        {step === 'join' && (
          <div className="stack stack--lg animate-fade-in-up">
            <div className="input-group">
              <label htmlFor="joinCode">Código de pareja</label>
              <input
                id="joinCode"
                type="text"
                className="input input--code"
                placeholder="XXXX-XXXX"
                value={inputCode}
                onChange={(e) => {
                  let val = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
                  // Auto-insert dash
                  if (val.length === 4 && !val.includes('-')) {
                    val = val + '-';
                  }
                  if (val.length <= 9) {
                    setInputCode(val);
                  }
                }}
                maxLength={9}
              />
            </div>

            <div className="input-group">
              <label htmlFor="relDate2">¿Cuándo empezaron a salir?</label>
              <input
                id="relDate2"
                type="date"
                className="input"
                value={relationshipDate}
                onChange={(e) => setRelationshipDate(e.target.value)}
              />
              <span className="text-secondary" style={{ fontSize: 'var(--font-size-xs)' }}>
                Opcional
              </span>
            </div>

            <div className="input-group">
              <label htmlFor="bday2">Tu cumpleaños</label>
              <input
                id="bday2"
                type="date"
                className="input"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
              />
              <span className="text-secondary" style={{ fontSize: 'var(--font-size-xs)' }}>
                Opcional — para celebrarlo juntos 🎉
              </span>
            </div>

            {error && (
              <div
                className="toast toast--error"
                style={{ position: 'relative', top: 0, left: 0, transform: 'none' }}
              >
                {error}
              </div>
            )}

            <button
              className="btn btn--primary btn--full btn--lg"
              onClick={handleJoinCouple}
              disabled={loading || inputCode.length < 9}
            >
              {loading ? (
                <div
                  className="spinner"
                  style={{ width: '20px', height: '20px', borderWidth: '2px' }}
                />
              ) : (
                'Vincular pareja'
              )}
            </button>

            <button
              className="btn btn--ghost btn--full"
              onClick={() => {
                setStep('choose');
                setError('');
              }}
            >
              ← Volver
            </button>
          </div>
        )}

        {/* Sign out */}
        <button
          className="btn btn--ghost"
          onClick={signOut}
          style={{ marginTop: 'var(--space-lg)', fontSize: 'var(--font-size-sm)' }}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
