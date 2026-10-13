import PageTransition from '../components/PageTransition';
import PhotoFilmRoll from '../components/PhotoFilmRoll';
// ============================================================
// Coliflor — Settings / Configuración Page
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import {
  formatDate,
  compressImage,
  parseHeroAlbumPaths,
  serializeHeroAlbumPaths,
} from '../lib/utils';

function IconUser() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: 'var(--color-accent)' }}
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconHeart() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="2"
      style={{ color: 'var(--color-accent)' }}
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#4ade80"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconCamera() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: 'var(--color-accent)' }}
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function IconLogOut() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export default function Settings() {
  const { user, profile, couple, partner, refreshProfile, signOut, isMockMode } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [birthday, setBirthday] = useState(profile?.birthday || '');
  const [relationshipStart, setRelationshipStart] = useState(couple?.relationship_start || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingCouple, setSavingCouple] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [coupleSuccess, setCoupleSuccess] = useState(false);
  const [error, setError] = useState('');

  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [albumItems, setAlbumItems] = useState<{ path: string; url: string }[]>([]);
  const [loadingAlbum, setLoadingAlbum] = useState(false);
  const [albumError, setAlbumError] = useState('');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !displayName.trim() || savingProfile) return;

    setSavingProfile(true);
    setError('');
    setProfileSuccess(false);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim(),
          birthday: birthday || null,
        })
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

  // Load Hero Album Photos and auto-purge legacy single photo
  useEffect(() => {
    if (!couple || isMockMode) {
      setAlbumItems([]);
      return;
    }

    // Auto-purge legacy single photo if present (user explicitly requested to delete existing photo)
    if (couple.hero_image_path && !couple.hero_image_path.trim().startsWith('[')) {
      const legacyPath = couple.hero_image_path.trim();
      (async () => {
        try {
          await supabase.storage.from('photos').remove([legacyPath]);
        } catch {
          // Ignore removal error
        }
        await supabase.from('couples').update({ hero_image_path: '[]' }).eq('id', couple.id);
        refreshProfile();
      })();
      setAlbumItems([]);
      return;
    }

    const paths = parseHeroAlbumPaths(couple.hero_image_path);
    if (paths.length === 0) {
      setAlbumItems([]);
      return;
    }

    setLoadingAlbum(true);
    supabase.storage
      .from('photos')
      .createSignedUrls(paths, 3600)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const items = data
            .map((d, idx) => ({ path: paths[idx] || d.path || '', url: d.signedUrl || '' }))
            .filter((item) => item.path && item.url);
          setAlbumItems(items);
        } else {
          // Fallback to individual calls
          Promise.all(
            paths.map((p) =>
              supabase.storage
                .from('photos')
                .createSignedUrl(p, 3600)
                .then(({ data: d }) => (d?.signedUrl ? { path: p, url: d.signedUrl } : null))
                .catch(() => null),
            ),
          ).then((results) => {
            setAlbumItems(results.filter((r): r is { path: string; url: string } => r !== null));
          });
        }
      })
      .catch(() => setAlbumItems([]))
      .finally(() => setLoadingAlbum(false));
  }, [couple?.hero_image_path, couple?.id, isMockMode, refreshProfile]);

  const handleUploadHeroImagesList = async (files: File[]) => {
    if (files.length === 0 || !couple || !profile) return;

    setAlbumError('');
    setUploadingHero(true);

    const currentPaths = parseHeroAlbumPaths(couple.hero_image_path);
    const availableSlots = 20 - currentPaths.length;
    const filesToUpload = files.slice(0, availableSlots);

    const newPaths: string[] = [];
    const newItems: { path: string; url: string }[] = [];

    try {
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        setUploadProgress(`Fotograma ${i + 1} de ${filesToUpload.length}...`);

        const compressed = await compressImage(file, 1600, 0.8, false);
        const storagePath = `${couple.id}/hero_${Date.now()}_${i}.jpg`;

        const uploadPromise = supabase.storage.from('photos').upload(storagePath, compressed, {
          contentType: 'image/jpeg',
          upsert: true,
        });

        const uploadTimeout = new Promise<never>((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  'La subida tardó demasiado tiempo. Verifica tu conexión a internet o intenta nuevamente.',
                ),
              ),
            25000,
          ),
        );

        const { error: uploadError } = (await Promise.race([uploadPromise, uploadTimeout])) as {
          data: any;
          error: any;
        };

        if (uploadError) throw uploadError;
        newPaths.push(storagePath);
      }

      const updatedPaths = [...currentPaths, ...newPaths].slice(0, 20);
      const { error: updateError } = await supabase
        .from('couples')
        .update({ hero_image_path: serializeHeroAlbumPaths(updatedPaths) })
        .eq('id', couple.id);

      if (updateError) throw updateError;

      // Obtain signed URLs for newly uploaded paths
      const { data: urlsData } = await supabase.storage
        .from('photos')
        .createSignedUrls(newPaths, 3600);
      if (urlsData) {
        urlsData.forEach((d, idx) => {
          if (d?.signedUrl) {
            newItems.push({ path: newPaths[idx] || d.path || '', url: d.signedUrl });
          }
        });
      }

      // Optimistically append new items so user sees them immediately in film roll
      setAlbumItems((prev) => [...prev, ...newItems].slice(0, 20));

      await refreshProfile();
      setCoupleSuccess(true);
      setTimeout(() => setCoupleSuccess(false), 3000);
    } catch (err: any) {
      setAlbumError(err?.message || 'Error al subir fotos al rollo');
      throw err;
    } finally {
      setUploadingHero(false);
      setUploadProgress('');
    }
  };

  const handleReorderAlbumPhoto = async (fromIndex: number, toIndex: number) => {
    if (!couple || toIndex < 0 || toIndex >= albumItems.length || fromIndex === toIndex) return;

    setAlbumError('');
    const newItems = [...albumItems];
    const [moved] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, moved);
    setAlbumItems(newItems);

    try {
      const newPaths = newItems.map((item) => item.path);
      const { error: updateError } = await supabase
        .from('couples')
        .update({ hero_image_path: serializeHeroAlbumPaths(newPaths) })
        .eq('id', couple.id);

      if (updateError) throw updateError;
      await refreshProfile();
    } catch (err: any) {
      setAlbumError(err?.message || 'Error al reordenar los fotogramas');
      refreshProfile();
    }
  };

  const handleDeleteAlbumPhoto = async (pathToDelete: string) => {
    if (!couple || !profile) return;
    setAlbumError('');

    const prevItems = albumItems;
    setAlbumItems((prev) => prev.filter((it) => it.path !== pathToDelete));

    try {
      try {
        await supabase.storage.from('photos').remove([pathToDelete]);
      } catch {
        // Ignore storage removal errors
      }

      const currentPaths = parseHeroAlbumPaths(couple.hero_image_path);
      const updatedPaths = currentPaths.filter((p) => p !== pathToDelete);

      const { error: updateError } = await supabase
        .from('couples')
        .update({ hero_image_path: serializeHeroAlbumPaths(updatedPaths) })
        .eq('id', couple.id);

      if (updateError) throw updateError;
      await refreshProfile();
    } catch (err: any) {
      setAlbumItems(prevItems);
      setAlbumError(err?.message || 'Error al eliminar la foto');
    }
  };

  const handleClearAllAlbumPhotos = async () => {
    if (!couple || !profile) return;
    if (
      !window.confirm(
        '¿Seguro que deseas vaciar el rollo y eliminar todas las fotos de la portada?',
      )
    )
      return;

    setAlbumError('');
    const prevItems = albumItems;
    setAlbumItems([]);

    try {
      const currentPaths = parseHeroAlbumPaths(couple.hero_image_path);
      if (currentPaths.length > 0) {
        try {
          await supabase.storage.from('photos').remove(currentPaths);
        } catch {}
      }

      const { error: updateError } = await supabase
        .from('couples')
        .update({ hero_image_path: '[]' })
        .eq('id', couple.id);

      if (updateError) throw updateError;
      await refreshProfile();
      setCoupleSuccess(true);
      setTimeout(() => setCoupleSuccess(false), 3000);
    } catch (err: any) {
      setAlbumItems(prevItems);
      setAlbumError(err?.message || 'Error al vaciar el rollo');
    }
  };

  if (!profile) return null;

  return (
    <PageTransition className="page">
      <div className="stack stack--xl stagger-children">
        {/* Title */}
        <div>
          <h2>Configuración</h2>
          <p
            className="text-secondary"
            style={{ marginTop: 'var(--space-xs)', fontSize: 'var(--font-size-sm)' }}
          >
            Administra tu perfil, los datos de la pareja y la apariencia.
          </p>
        </div>

        {/* Theme Toggle */}
        <div className="glass-card row row--between">
          <div>
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600 }}>Tema Visual</h3>
            <p className="text-secondary" style={{ fontSize: 'var(--font-size-xs)' }}>
              {theme === 'dark' ? 'Modo Oscuro activado' : 'Modo Claro activado'}
            </p>
          </div>
          <button
            className="btn btn--secondary"
            onClick={toggleTheme}
            style={{ borderRadius: 'var(--radius-full)', padding: '10px' }}
          >
            {theme === 'dark' ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
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

            <div
              className="row row--between"
              style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}
            >
              <span>Correo:</span>
              <span>{user?.email || 'Sin correo'}</span>
            </div>

            <div className="input-group">
              <label htmlFor="bdayInput">Tu Cumpleaños</label>
              <input
                id="bdayInput"
                type="date"
                className="input"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
              />
              <span className="text-secondary" style={{ fontSize: 'var(--font-size-xs)' }}>
                Para celebrarlo en la app 🎉
              </span>
            </div>

            <div className="row row--gap-sm">
              <button
                type="submit"
                className="btn btn--primary btn--full"
                disabled={
                  savingProfile ||
                  !displayName.trim() ||
                  (displayName === profile.display_name && birthday === (profile.birthday || ''))
                }
              >
                {savingProfile ? 'Guardando...' : 'Guardar perfil'}
              </button>
            </div>

            {profileSuccess && (
              <div
                className="row row--center row--gap-xs"
                style={{ color: 'var(--color-success)', fontSize: 'var(--font-size-xs)' }}
              >
                <IconCheck />
                <span>Perfil actualizado con éxito</span>
              </div>
            )}
          </form>
        </div>

        {/* Edit Relationship Date */}
        {couple && (
          <div className="glass-card">
            <div className="row row--gap-sm" style={{ marginBottom: 'var(--space-md)' }}>
              <IconHeart />
              <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600 }}>
                Nuestra Relación
              </h3>
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
                <p
                  className="text-secondary"
                  style={{ fontSize: 'var(--font-size-xs)', textTransform: 'capitalize' }}
                >
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
                <div
                  className="row row--center row--gap-xs"
                  style={{ color: 'var(--color-success)', fontSize: 'var(--font-size-xs)' }}
                >
                  <IconCheck />
                  <span>Fecha de aniversario actualizada</span>
                </div>
              )}
            </form>

            <div
              style={{
                marginTop: 'var(--space-xl)',
                paddingTop: 'var(--space-md)',
                borderTop: '1px solid var(--color-border)',
              }}
            >
              <PhotoFilmRoll
                items={albumItems}
                loading={loadingAlbum}
                uploading={uploadingHero}
                uploadProgress={uploadProgress}
                error={albumError}
                onClearError={() => setAlbumError('')}
                onAddPhotos={handleUploadHeroImagesList}
                onDelete={handleDeleteAlbumPhoto}
                onReorder={handleReorderAlbumPhoto}
                onClearAll={handleClearAllAlbumPhotos}
              />
            </div>
          </div>
        )}

        {/* Couple Status Card */}
        <div className="glass-card">
          <h3
            style={{
              fontSize: 'var(--font-size-base)',
              fontWeight: 600,
              marginBottom: 'var(--space-sm)',
            }}
          >
            Estado de la Pareja
          </h3>
          <div className="stack stack--sm" style={{ fontSize: 'var(--font-size-xs)' }}>
            <div className="row row--between">
              <span className="text-secondary">Pareja:</span>
              <span style={{ fontWeight: 600 }}>
                {partner ? partner.display_name : 'Esperando vinculación'}
              </span>
            </div>
            {couple && (
              <div className="row row--between">
                <span className="text-secondary">Racha actual:</span>
                <span style={{ fontWeight: 600, color: 'var(--color-accent-light)' }}>
                  {couple.current_streak} días
                </span>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div
            className="toast toast--error"
            style={{ position: 'relative', top: 0, left: 0, transform: 'none' }}
          >
            {error}
          </div>
        )}

        {/* Sign Out */}
        <button className="btn btn--secondary btn--full btn--lg" onClick={signOut}>
          <IconLogOut />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </PageTransition>
  );
}
