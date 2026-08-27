// ============================================================
// Coliflor — Settings / Configuración Page
// ============================================================

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { formatDate } from '../lib/utils';

function IconUser() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e07a7a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconHeart() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#e07a7a" stroke="#e07a7a" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconLogOut() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export default function Settings() {
  const { user, profile, couple, partner, refreshProfile, signOut } = useAuth();
  
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [relationshipStart, setRelationshipStart] = useState(couple?.relationship_start || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingCouple, setSavingCouple] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [coupleSuccess, setCoupleSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !displayName.trim() || savingProfile) return;

    setSavingProfile(true);
    setError('');
    setProfileSuccess(false);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ display_name: displayName.trim() })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.message || 'Error al guardar nombre');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveRelationshipDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couple || !relationshipStart || savingCouple) return;

    setSavingCouple(true);
    setError('');
    setCoupleSuccess(false);

    try {
      const { error: updateError } = await supabase
        .from('couples')
        .update({ relationship_start: relationshipStart })
        .eq('id', couple.id);

      if (updateError) throw updateError;

      await refreshProfile();
      setCoupleSuccess(true);
      setTimeout(() => setCoupleSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.message || 'Error al guardar fecha de aniversario');
    } finally {
      setSavingCouple(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="page">
      <div className="stack stack--xl stagger-children">
        {/* Title */}
        <div>
          <h2>Configuración</h2>
          <p className="text-secondary" style={{ marginTop: 'var(--space-xs)', fontSize: 'var(--font-size-sm)' }}>
            Administra tu perfil y los datos de la pareja
          </p>
        </div>

        {/* Edit My Profile */}
        <div className="glass-card">
          <div className="row row--gap-sm" style={{ marginBottom: 'var(--space-md)' }}>
            <IconUser />
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600 }}>Mi Perfil</h3>
          </div>

          <form onSubmit={handleSaveProfile} className="stack stack--md">
            <div className="input-group">
              <label htmlFor="nameInput">Nombre visible para tu pareja</label>
              <input
                id="nameInput"
                type="text"
                className="input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Tu nombre"
                required
              />
            </div>

            <div className="row row--between" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
              <span>Correo:</span>
              <span>{user?.email || 'Sin correo'}</span>
            </div>

            <div className="row row--gap-sm">
              <button
                type="submit"
                className="btn btn--primary btn--full"
                disabled={savingProfile || !displayName.trim() || displayName === profile.display_name}
              >
                {savingProfile ? 'Guardando...' : 'Guardar nombre'}
              </button>
            </div>

            {profileSuccess && (
              <div className="row row--center row--gap-xs" style={{ color: 'var(--color-success)', fontSize: 'var(--font-size-xs)' }}>
                <IconCheck />
                <span>Nombre actualizado con éxito</span>
              </div>
            )}
          </form>
        </div>

        {/* Edit Relationship Date */}
        {couple && (
          <div className="glass-card">
            <div className="row row--gap-sm" style={{ marginBottom: 'var(--space-md)' }}>
              <IconHeart />
              <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600 }}>Nuestra Relación</h3>
            </div>

            <form onSubmit={handleSaveRelationshipDate} className="stack stack--md">
              <div className="input-group">
                <label htmlFor="relStart">¿Cuándo comenzaron a salir?</label>
                <input
                  id="relStart"
                  type="date"
                  className="input"
                  value={relationshipStart}
                  onChange={(e) => setRelationshipStart(e.target.value)}
                  required
                />
              </div>

              {relationshipStart && (
                <p className="text-secondary" style={{ fontSize: 'var(--font-size-xs)', textTransform: 'capitalize' }}>
                  Aniversario: {formatDate(relationshipStart, 'long')}
                </p>
              )}

              <button
                type="submit"
                className="btn btn--primary btn--full"
                disabled={savingCouple || relationshipStart === couple.relationship_start}
              >
                {savingCouple ? 'Guardando...' : 'Guardar fecha de aniversario'}
              </button>

              {coupleSuccess && (
                <div className="row row--center row--gap-xs" style={{ color: 'var(--color-success)', fontSize: 'var(--font-size-xs)' }}>
                  <IconCheck />
                  <span>Fecha de aniversario actualizada</span>
                </div>
              )}
            </form>
          </div>
        )}

        {/* Couple Status Card */}
        <div className="glass-card">
          <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>
            Estado de la Pareja
          </h3>
          <div className="stack stack--sm" style={{ fontSize: 'var(--font-size-xs)' }}>
            <div className="row row--between">
              <span className="text-secondary">Pareja:</span>
              <span style={{ fontWeight: 600 }}>{partner ? partner.display_name : 'Esperando vinculación'}</span>
            </div>
            {couple && (
              <div className="row row--between">
                <span className="text-secondary">Racha actual:</span>
                <span style={{ fontWeight: 600, color: 'var(--color-accent-light)' }}>{couple.current_streak} días</span>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="toast toast--error" style={{ position: 'relative', top: 0, left: 0, transform: 'none' }}>
            {error}
          </div>
        )}

        {/* Sign Out */}
        <button className="btn btn--secondary btn--full btn--lg" onClick={signOut}>
          <IconLogOut />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  );
}
