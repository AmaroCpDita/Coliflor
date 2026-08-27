// ============================================================
// Coliflor — Streak Page (Ultra-Complete Matte Design)
// ============================================================

import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getTodayInTimezone, compressImage, formatDate, formatTime } from '../lib/utils';
import { MAX_RECOVERIES_PER_MONTH } from '../lib/types';
import type { StreakPhoto, StreakRecovery } from '../lib/types';

// --- SVG Icons ---
function IconFlameLarge() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#e07a7a" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

function IconCamera() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(242,242,247,0.4)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
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

function IconShield() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(242,242,247,0.3)" strokeWidth="1.8">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

interface DayPhotos {
  date: string;
  myPhoto: StreakPhoto | null;
  partnerPhoto: StreakPhoto | null;
}

interface HistoryDay {
  date: string;
  myPhoto: StreakPhoto | null;
  partnerPhoto: StreakPhoto | null;
  isRecovered: boolean;
  myPhotoUrl?: string;
  partnerPhotoUrl?: string;
}

export default function Streak() {
  const { couple, profile, partner, refreshProfile, isMockMode } = useAuth();
  const [todayPhotos, setTodayPhotos] = useState<DayPhotos>({ date: '', myPhoto: null, partnerPhoto: null });
  const [myPhotoUrl, setMyPhotoUrl] = useState<string | null>(null);
  const [partnerPhotoUrl, setPartnerPhotoUrl] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [showRecovery, setShowRecovery] = useState(false);
  const [usingRecovery, setUsingRecovery] = useState(false);
  const [history, setHistory] = useState<HistoryDay[]>([]);
  const [selectedHistoryDay, setSelectedHistoryDay] = useState<HistoryDay | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const today = getTodayInTimezone();
  const recoveriesRemaining = couple ? MAX_RECOVERIES_PER_MONTH - couple.recoveries_used : 0;
  const dayComplete = todayPhotos.myPhoto !== null && todayPhotos.partnerPhoto !== null;

  const fetchTodayPhotos = useCallback(async () => {
    if (!couple || !profile) return;

    if (isMockMode) {
      const mockMyPhoto: StreakPhoto = {
        id: 'mock-photo-1',
        couple_id: 'mock-couple-id',
        user_id: 'mock-user-amaro',
        photo_date: today,
        storage_path: 'mock/amaro.jpg',
        uploaded_at: new Date().toISOString(),
      };
      const mockPartnerPhoto: StreakPhoto = {
        id: 'mock-photo-2',
        couple_id: 'mock-couple-id',
        user_id: 'mock-user-javiera',
        photo_date: today,
        storage_path: 'mock/javiera.jpg',
        uploaded_at: new Date().toISOString(),
      };

      setTodayPhotos({ date: today, myPhoto: mockMyPhoto, partnerPhoto: mockPartnerPhoto });
      setMyPhotoUrl('https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80');
      setPartnerPhotoUrl('https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80');
      return;
    }

    const { data } = await supabase
      .from('streak_photos')
      .select('*')
      .eq('couple_id', couple.id)
      .eq('photo_date', today);

    if (data) {
      const myPhoto = data.find((p: StreakPhoto) => p.user_id === profile.id) || null;
      const partnerPhoto = data.find((p: StreakPhoto) => p.user_id !== profile.id) || null;
      setTodayPhotos({ date: today, myPhoto, partnerPhoto });

      if (myPhoto) {
        const { data: urlData } = await supabase.storage
          .from('photos')
          .createSignedUrl(myPhoto.storage_path, 3600);
        if (urlData) setMyPhotoUrl(urlData.signedUrl);
      }

      if (partnerPhoto && myPhoto) {
        const { data: urlData } = await supabase.storage
          .from('photos')
          .createSignedUrl(partnerPhoto.storage_path, 3600);
        if (urlData) setPartnerPhotoUrl(urlData.signedUrl);
      }
    }
  }, [couple?.id, profile?.id, today, isMockMode]);

  const fetchHistory = useCallback(async () => {
    if (!couple || !profile) return;

    if (isMockMode) {
      const mockHist: HistoryDay[] = [
        {
          date: '2026-08-25',
          myPhoto: { id: 'h1', couple_id: 'mock', user_id: 'amaro', photo_date: '2026-08-25', storage_path: '', uploaded_at: '2026-08-25T19:00:00Z' },
          partnerPhoto: { id: 'h2', couple_id: 'mock', user_id: 'javiera', photo_date: '2026-08-25', storage_path: '', uploaded_at: '2026-08-25T19:05:00Z' },
          isRecovered: false,
          myPhotoUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600&auto=format&fit=crop&q=80',
          partnerPhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
        },
        {
          date: '2026-08-24',
          myPhoto: null,
          partnerPhoto: null,
          isRecovered: true,
        },
        {
          date: '2026-08-23',
          myPhoto: { id: 'h3', couple_id: 'mock', user_id: 'amaro', photo_date: '2026-08-23', storage_path: '', uploaded_at: '2026-08-23T20:00:00Z' },
          partnerPhoto: { id: 'h4', couple_id: 'mock', user_id: 'javiera', photo_date: '2026-08-23', storage_path: '', uploaded_at: '2026-08-23T20:15:00Z' },
          isRecovered: false,
          myPhotoUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&auto=format&fit=crop&q=80',
          partnerPhotoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&auto=format&fit=crop&q=80',
        },
      ];
      setHistory(mockHist);
      return;
    }

    // Fetch past photos & recoveries
    const [{ data: photos }, { data: recoveries }] = await Promise.all([
      supabase
        .from('streak_photos')
        .select('*')
        .eq('couple_id', couple.id)
        .lt('photo_date', today)
        .order('photo_date', { ascending: false })
        .limit(20),
      supabase
        .from('streak_recoveries')
        .select('*')
        .eq('couple_id', couple.id)
        .order('recovered_date', { ascending: false }),
    ]);

    if (photos) {
      const dayMap = new Map<string, { myPhoto: StreakPhoto | null; partnerPhoto: StreakPhoto | null }>();
      
      photos.forEach((p: StreakPhoto) => {
        const existing = dayMap.get(p.photo_date) || { myPhoto: null, partnerPhoto: null };
        if (p.user_id === profile.id) existing.myPhoto = p;
        else existing.partnerPhoto = p;
        dayMap.set(p.photo_date, existing);
      });

      const recoveryDates = new Set((recoveries || []).map((r: StreakRecovery) => r.recovered_date));

      const historyList: HistoryDay[] = Array.from(dayMap.entries()).map(([date, val]) => ({
        date,
        myPhoto: val.myPhoto,
        partnerPhoto: val.partnerPhoto,
        isRecovered: recoveryDates.has(date),
      }));

      setHistory(historyList);
    }
  }, [couple?.id, profile?.id, today]);

  useEffect(() => {
    fetchTodayPhotos();
    fetchHistory();
  }, [fetchTodayPhotos, fetchHistory]);

  // Realtime
  useEffect(() => {
    if (!couple) return;

    const channel = supabase
      .channel('streak-photos-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'streak_photos',
          filter: `couple_id=eq.${couple.id}`,
        },
        () => {
          fetchTodayPhotos();
          fetchHistory();
          refreshProfile();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [couple?.id, fetchTodayPhotos, fetchHistory, refreshProfile]);

  const handleOpenCamera = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreviewFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleConfirmUpload = async () => {
    if (!previewFile || !couple || !profile) return;

    setUploading(true);
    setError('');

    try {
      const compressed = await compressImage(previewFile);
      const storagePath = `${couple.id}/${today}/${profile.id}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(storagePath, compressed, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { error: rpcError } = await supabase.rpc('register_streak_photo', {
        p_couple_id: couple.id,
        p_storage_path: storagePath,
      });

      if (rpcError) throw rpcError;

      setPreviewFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);

      await fetchTodayPhotos();
      await refreshProfile();
    } catch (err: any) {
      setError(err?.message || 'Error al subir fotografía');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCancelPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUseRecovery = async () => {
    if (!couple || usingRecovery) return;
    setUsingRecovery(true);
    setError('');

    try {
      const yesterday = new Date(today + 'T12:00:00');
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const { error: rpcError } = await supabase.rpc('use_streak_recovery', {
        p_couple_id: couple.id,
        p_date: yesterdayStr,
      });

      if (rpcError) throw rpcError;

      await refreshProfile();
      await fetchHistory();
      setShowRecovery(false);
    } catch (err: any) {
      setError(err?.message || 'Error al aplicar recuperación');
    } finally {
      setUsingRecovery(false);
    }
  };

  const inspectHistoryDay = async (h: HistoryDay) => {
    let myUrl = h.myPhotoUrl;
    let partnerUrl = h.partnerPhotoUrl;

    if (h.myPhoto && !myUrl) {
      const { data } = await supabase.storage.from('photos').createSignedUrl(h.myPhoto.storage_path, 3600);
      if (data) myUrl = data.signedUrl;
    }

    if (h.partnerPhoto && !partnerUrl) {
      const { data } = await supabase.storage.from('photos').createSignedUrl(h.partnerPhoto.storage_path, 3600);
      if (data) partnerUrl = data.signedUrl;
    }

    setSelectedHistoryDay({ ...h, myPhotoUrl: myUrl, partnerPhotoUrl: partnerUrl });
  };

  if (!profile) return null;

  if (!couple) {
    return (
      <div className="page page--centered">
        <div className="glass-card text-center stack stack--md">
          <IconFlameLarge />
          <h3>Racha de Fotos</h3>
          <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>
            Vincúlale a tu pareja en la pantalla principal para iniciar su racha.
          </p>
          <Link to="/" className="btn btn--primary">
            Ir al Inicio
          </Link>
        </div>
      </div>
    );
  }

  const partnerName = partner ? partner.display_name : 'Tu pareja';

  return (
    <div className="page">
      <div className="stack stack--xl stagger-children">
        {/* Header Hero */}
        <div className="text-center" style={{ paddingTop: 'var(--space-md)' }}>
          <div style={{ display: 'inline-flex', padding: 'var(--space-md)', background: 'var(--gradient-accent-soft)', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border-accent)', marginBottom: 'var(--space-md)' }}>
            <IconFlameLarge />
          </div>
          <div>
            <div className="stat-value" style={{ fontSize: 'var(--font-size-4xl)', color: 'var(--color-accent-light)' }}>
              {couple.current_streak}
            </div>
            <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-xs)' }}>
              días consecutivos de racha
            </p>
          </div>
          {couple.max_streak > 0 && (
            <p className="text-secondary" style={{ fontSize: 'var(--font-size-xs)', marginTop: 'var(--space-sm)' }}>
              Récord máximo: {couple.max_streak} días
            </p>
          )}
        </div>

        {/* Date Display */}
        <div className="text-center">
          <span className="text-secondary" style={{ fontSize: 'var(--font-size-sm)', textTransform: 'capitalize', fontWeight: 500 }}>
            {formatDate(today, 'long')}
          </span>
        </div>

        {/* Day Completed Badge */}
        {dayComplete && (
          <div className="glass-card glass-card--accent text-center animate-scale-in">
            <div className="row row--center row--gap-sm">
              <IconCheck />
              <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>
                Día completado por ambos
              </span>
            </div>
          </div>
        )}

        {/* Image Preview Before Upload */}
        {previewUrl ? (
          <div className="glass-card stack stack--md animate-fade-in">
            <div className="text-center" style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
              Vista previa de tu fotografía
            </div>
            <img src={previewUrl} alt="Preview" style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
            <div className="row row--gap-sm">
              <button className="btn btn--primary btn--full" onClick={handleConfirmUpload} disabled={uploading}>
                {uploading ? 'Subiendo...' : 'Confirmar y subir'}
              </button>
              <button className="btn btn--secondary" onClick={handleCancelPreview} disabled={uploading}>
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          /* Side-by-side Photo Cards */
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            {/* My Photo */}
            <div>
              <div className="text-secondary text-center" style={{ fontSize: 'var(--font-size-xs)', marginBottom: 'var(--space-xs)', fontWeight: 600 }}>
                {profile.display_name}
              </div>
              <div className="photo-card">
                {todayPhotos.myPhoto && myPhotoUrl ? (
                  <>
                    <img src={myPhotoUrl} alt="Mi foto" className="photo-card__image" />
                    <div className="photo-card__label">
                      {formatTime(todayPhotos.myPhoto.uploaded_at)}
                    </div>
                  </>
                ) : (
                  <div className="photo-card__placeholder">
                    <IconClock />
                    <span style={{ fontSize: 'var(--font-size-xs)' }}>Sin foto hoy</span>
                  </div>
                )}
              </div>
            </div>

            {/* Partner Photo */}
            <div>
              <div className="text-secondary text-center" style={{ fontSize: 'var(--font-size-xs)', marginBottom: 'var(--space-xs)', fontWeight: 600 }}>
                {partnerName}
              </div>
              <div className="photo-card">
                {todayPhotos.partnerPhoto ? (
                  todayPhotos.myPhoto && partnerPhotoUrl ? (
                    <>
                      <img src={partnerPhotoUrl} alt={`Foto de ${partnerName}`} className="photo-card__image" />
                      <div className="photo-card__label">
                        {formatTime(todayPhotos.partnerPhoto.uploaded_at)}
                      </div>
                    </>
                  ) : (
                    <div className="photo-card__locked">
                      <IconLock />
                      <span style={{ fontSize: 'var(--font-size-xs)', textAlign: 'center', padding: '0 8px' }}>
                        Sube tu foto para ver la de {partnerName}
                      </span>
                    </div>
                  )
                ) : (
                  <div className="photo-card__placeholder">
                    <IconClock />
                    <span style={{ fontSize: 'var(--font-size-xs)' }}>Pendiente</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Camera Trigger */}
        {!todayPhotos.myPhoto && !previewUrl && (
          <button className="btn btn--primary btn--full btn--lg" onClick={handleOpenCamera}>
            <IconCamera />
            <span>Tomar foto de hoy</span>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelected}
          style={{ display: 'none' }}
        />

        {/* Monthly Recoveries Box */}
        <div className="glass-card">
          <div className="row row--between">
            <div className="row row--gap-sm">
              <IconShield />
              <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
                Recuperaciones del mes
              </span>
            </div>
            <span style={{ fontWeight: 700, color: 'var(--color-warning)', fontSize: 'var(--font-size-sm)' }}>
              {recoveriesRemaining}/{MAX_RECOVERIES_PER_MONTH}
            </span>
          </div>

          <p className="text-secondary" style={{ fontSize: 'var(--font-size-xs)', marginTop: 'var(--space-xs)' }}>
            Se otorgan 5 recuperaciones al mes para reparar la racha del día anterior. No son acumulables.
          </p>

          {recoveriesRemaining > 0 && !showRecovery && (
            <button
              className="btn btn--ghost btn--sm btn--full"
              onClick={() => setShowRecovery(true)}
              style={{ marginTop: 'var(--space-md)', fontSize: 'var(--font-size-xs)' }}
            >
              Usar recuperación para el día de ayer
            </button>
          )}

          {showRecovery && (
            <div className="stack stack--sm" style={{ marginTop: 'var(--space-md)', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--color-border)' }}>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                ¿Recuperar el día de ayer? Esto mantendrá la continuidad de la racha.
              </p>
              <div className="row row--gap-sm">
                <button className="btn btn--primary btn--sm" style={{ flex: 1 }} onClick={handleUseRecovery} disabled={usingRecovery}>
                  {usingRecovery ? 'Recuperando...' : 'Confirmar'}
                </button>
                <button className="btn btn--secondary btn--sm" style={{ flex: 1 }} onClick={() => setShowRecovery(false)}>
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="toast toast--error" style={{ position: 'relative', top: 0, left: 0, transform: 'none' }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
