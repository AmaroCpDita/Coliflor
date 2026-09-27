// ============================================================
// Coliflor — Streak Page (Enhanced with Broken Streak Visual,
// Recovery Photo Upload, and 7-Day Timeline)
// ============================================================

import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getTodayInTimezone, compressImage, formatDate, formatTime } from '../lib/utils';
import { MAX_RECOVERIES_PER_MONTH } from '../lib/types';
import type { StreakPhoto, StreakRecovery } from '../lib/types';
import Lightbox from '../components/Lightbox';

// --- SVG Icons ---
function IconFlameLarge({ active = false, broken = false, size = 48, streakCount = 0 }: { active?: boolean; broken?: boolean; size?: number; streakCount?: number }) {
  let fill = broken ? 'rgba(248, 113, 113, 0.15)' : active ? "var(--color-accent-glow)" : "transparent";
  let stroke = broken ? '#f87171' : active ? "var(--color-accent)" : "var(--color-text-tertiary)";
  let animation = broken ? 'streakCrack 0.6s ease-out' : active ? "heartPulse 2s infinite" : "none";
  let scale = broken ? 0.95 : active ? 1.1 : 1;
  const opacity = broken ? 0.6 : 1;
  let filter = "none";

  if (active && !broken) {
    if (streakCount >= 30) {
      // Legendary blue/purple fire
      stroke = "#a855f7";
      fill = "rgba(168, 85, 247, 0.25)";
      animation = "heartPulse 1.2s infinite";
      filter = "drop-shadow(0 0 16px rgba(168,85,247,0.8))";
    } else if (streakCount >= 7) {
      // Hot pink/red fire
      stroke = "#f43f5e";
      fill = "rgba(244, 63, 94, 0.25)";
      animation = "heartPulse 1.5s infinite";
      filter = "drop-shadow(0 0 12px rgba(244,63,94,0.6))";
    } else {
      // Normal golden fire
      filter = "drop-shadow(0 0 8px rgba(229,197,115,0.4))";
    }
  }

  return (
    <svg 
      width={size} height={size} viewBox="0 0 24 24" 
      fill={fill} 
      stroke={stroke} 
      strokeWidth="1.75" 
      strokeLinecap="round" strokeLinejoin="round"
      style={{ animation, transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)', transform: `scale(${scale})`, opacity, filter }}
    >
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
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconBrokenHeart() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      <line x1="12" y1="8" x2="12" y2="16" />
    </svg>
  );
}

function IconX() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
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
  const [yesterdayPhotos, setYesterdayPhotos] = useState<DayPhotos>({ date: '', myPhoto: null, partnerPhoto: null });
  const [myPhotoUrl, setMyPhotoUrl] = useState<string | null>(null);
  const [partnerPhotoUrl, setPartnerPhotoUrl] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<'confirm' | 'photo' | 'uploading'>('confirm');
  const [recoveryPreviewFile, setRecoveryPreviewFile] = useState<File | null>(null);
  const [recoveryPreviewUrl, setRecoveryPreviewUrl] = useState<string | null>(null);
  const [usingRecovery, setUsingRecovery] = useState(false);
  const [flipHorizontal, setFlipHorizontal] = useState(false);
  const [recoveryFlip, setRecoveryFlip] = useState(false);
  const [history, setHistory] = useState<HistoryDay[]>([]);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [yesterdayRecovered, setYesterdayRecovered] = useState(false);
  const [pastDayUpload, setPastDayUpload] = useState<{ date: string } | null>(null);
  const [pastDayPreviewFile, setPastDayPreviewFile] = useState<File | null>(null);
  const [pastDayPreviewUrl, setPastDayPreviewUrl] = useState<string | null>(null);
  const [pastDayFlip, setPastDayFlip] = useState(false);
  const [pastDayUploading, setPastDayUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const recoveryFileInputRef = useRef<HTMLInputElement>(null);
  const pastDayFileInputRef = useRef<HTMLInputElement>(null);
  const lastUploadRef = useRef<{ file: File; flip: boolean } | null>(null);

  const today = getTodayInTimezone();
  const yesterday = (() => {
    const d = new Date(today + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  })();

  const recoveriesRemaining = couple ? MAX_RECOVERIES_PER_MONTH - couple.recoveries_used : 0;
  const dayComplete = todayPhotos.myPhoto !== null && todayPhotos.partnerPhoto !== null;

  // Detect broken streak: trust backend current_streak as source of truth.
  // The backend tracks streak correctly even after cleanup_old_photos runs.
  const streakBroken = couple !== null && couple.current_streak === 0 && !yesterdayRecovered;
  
  // Detect who is missing photo for yesterday (for recovery).
  // Note: If cleanup already ran, both will be null — but if streak is broken
  // and we have partial data, use it to determine who missed.
  const iMissedYesterday = yesterdayPhotos.myPhoto === null;
  const partnerMissedYesterday = yesterdayPhotos.partnerPhoto === null;
  // If both are null (cleanup ran), we can't tell who missed — both get the option
  const bothMissedOrUnknown = iMissedYesterday && partnerMissedYesterday;
  // Yesterday is complete only if BOTH photos exist
  const yesterdayComplete = yesterdayPhotos.myPhoto !== null && yesterdayPhotos.partnerPhoto !== null;

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

  // Fetch yesterday's photos to detect broken streak
  const fetchYesterdayPhotos = useCallback(async () => {
    if (!couple || !profile || isMockMode) return;

    const [{ data: photos }, { data: recoveries }] = await Promise.all([
      supabase
        .from('streak_photos')
        .select('*')
        .eq('couple_id', couple.id)
        .eq('photo_date', yesterday),
      supabase
        .from('streak_recoveries')
        .select('*')
        .eq('couple_id', couple.id)
        .eq('recovered_date', yesterday),
    ]);

    if (photos) {
      const myPhoto = photos.find((p: StreakPhoto) => p.user_id === profile.id) || null;
      const partnerPhoto = photos.find((p: StreakPhoto) => p.user_id !== profile.id) || null;
      setYesterdayPhotos({ date: yesterday, myPhoto, partnerPhoto });
    }

    setYesterdayRecovered(Boolean(recoveries && recoveries.length > 0));
  }, [couple?.id, profile?.id, yesterday, isMockMode]);

  const fetchHistory = useCallback(async () => {
    if (!couple || !profile) return;

    if (isMockMode) {
      const mockHist: HistoryDay[] = [
        {
          date: '2026-08-25',
          myPhoto: { id: 'h1', couple_id: 'mock', user_id: 'amaro', photo_date: '2026-08-25', storage_path: '', uploaded_at: '2026-08-25T19:00:00Z' },
          partnerPhoto: { id: 'h2', couple_id: 'mock', user_id: 'javiera', photo_date: '2026-08-25', storage_path: '', uploaded_at: '2026-08-25T19:05:00Z' },
          isRecovered: false,
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
        },
      ];
      setHistory(mockHist);
      return;
    }

    // Fetch last 7 days of photos & recoveries
    const sevenDaysAgo = new Date(today + 'T12:00:00');
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const [{ data: photos }, { data: recoveries }] = await Promise.all([
      supabase
        .from('streak_photos')
        .select('*')
        .eq('couple_id', couple.id)
        .gte('photo_date', sevenDaysAgoStr)
        .lt('photo_date', today)
        .order('photo_date', { ascending: false }),
      supabase
        .from('streak_recoveries')
        .select('*')
        .eq('couple_id', couple.id)
        .order('recovered_date', { ascending: false }),
    ]);

    const recoveryDates = new Set((recoveries || []).map((r: StreakRecovery) => r.recovered_date));
    const dayMap = new Map<string, { myPhoto: StreakPhoto | null; partnerPhoto: StreakPhoto | null }>();

    // Build map from photos
    (photos || []).forEach((p: StreakPhoto) => {
      const existing = dayMap.get(p.photo_date) || { myPhoto: null, partnerPhoto: null };
      if (p.user_id === profile.id) existing.myPhoto = p;
      else existing.partnerPhoto = p;
      dayMap.set(p.photo_date, existing);
    });

    // Build 7-day timeline (7 days ago forward to yesterday)
    const historyList: HistoryDay[] = [];
    for (let i = 7; i >= 1; i--) {
      const d = new Date(today + 'T12:00:00');
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const val = dayMap.get(dateStr) || { myPhoto: null, partnerPhoto: null };
      historyList.push({
        date: dateStr,
        myPhoto: val.myPhoto,
        partnerPhoto: val.partnerPhoto,
        isRecovered: recoveryDates.has(dateStr),
      });
    }

    setHistory(historyList);
  }, [couple?.id, profile?.id, today, isMockMode]);

  useEffect(() => {
    fetchTodayPhotos();
    fetchYesterdayPhotos();
    fetchHistory();
  }, [fetchTodayPhotos, fetchYesterdayPhotos, fetchHistory]);

  // Prevent accidental close during upload
  useEffect(() => {
    if (!uploading) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Tu foto se está subiendo. ¿Seguro que quieres salir?';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [uploading]);

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
          fetchYesterdayPhotos();
          fetchHistory();
          refreshProfile();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [couple?.id, fetchTodayPhotos, fetchYesterdayPhotos, fetchHistory, refreshProfile]);

  const handleOpenCamera = () => {
    fileInputRef.current?.click();
  };

  const handleOpenUpload = () => {
    uploadInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setFlipHorizontal(false);
  };

  const handleConfirmUpload = async () => {
    if (!previewFile || !couple || !profile) return;

    setUploading(true);
    setError('');
    setSuccessMessage('');
    lastUploadRef.current = { file: previewFile, flip: flipHorizontal };

    try {
      const compressed = await compressImage(previewFile, 1200, 0.7, flipHorizontal);
      const storagePath = `${couple.id}/${today}/${profile.id}.jpg`;

      // Step 1: Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(storagePath, compressed, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Step 2: Register in DB with retry (up to 3 attempts)
      let rpcSuccess = false;
      let lastRpcError: any = null;
      for (let attempt = 0; attempt < 3 && !rpcSuccess; attempt++) {
        if (attempt > 0) {
          // Wait before retry (500ms, then 1500ms)
          await new Promise(r => setTimeout(r, attempt * 1000 + 500));
        }
        const { error: rpcError } = await supabase.rpc('register_streak_photo', {
          p_couple_id: couple.id,
          p_storage_path: storagePath,
        });
        if (!rpcError) {
          rpcSuccess = true;
        } else if (rpcError.message?.includes('Already uploaded')) {
          // Already registered — that's fine, count as success
          rpcSuccess = true;
        } else {
          lastRpcError = rpcError;
        }
      }

      if (!rpcSuccess) throw lastRpcError;

      // Step 3: Verify the photo exists in DB
      const { data: verifyData } = await supabase
        .from('streak_photos')
        .select('id')
        .eq('couple_id', couple.id)
        .eq('user_id', profile.id)
        .eq('photo_date', today)
        .single();

      if (!verifyData) {
        throw new Error('La foto se subió pero no se registró correctamente. Intenta de nuevo.');
      }

      // Step 4: Send push notification (non-critical)
      try {
        const myName = profile.display_name || 'Tú';
        const hasPartnerPhoto = Boolean(todayPhotos.partnerPhoto);
        const pushContent = hasPartnerPhoto
          ? `🔥 ¡Racha del día completada! Ya pueden ver las fotos de hoy y llevar la racha activa.`
          : `📸 ¡${myName} subió la foto de la racha de hoy! Sube la tuya para desbloquearlas.`;

        await supabase.from('messages').insert({
          couple_id: couple.id,
          sender_id: profile.id,
          content: pushContent,
        });
      } catch {
        // Ignore notification fallback
      }

      // Step 5: Success! Clean up preview
      setPreviewFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      lastUploadRef.current = null;

      setSuccessMessage('✅ ¡Foto subida correctamente!');
      setTimeout(() => setSuccessMessage(''), 4000);

      await fetchTodayPhotos();
      await refreshProfile();
    } catch (err: any) {
      setError(err?.message || 'Error al subir fotografía. Intenta de nuevo.');
      // DON'T clear the preview — keep it so user can retry
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (uploadInputRef.current) uploadInputRef.current.value = '';
    }
  };

  const handleCancelPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (uploadInputRef.current) uploadInputRef.current.value = '';
  };

  // --- Recovery Flow ---
  const handleStartRecovery = () => {
    setShowRecovery(true);
    // If I'm the one who missed, go to photo step; otherwise just confirm
    setRecoveryStep(iMissedYesterday ? 'confirm' : 'confirm');
    setRecoveryPreviewFile(null);
    setRecoveryPreviewUrl(null);
    setRecoveryFlip(false);
    setError('');
  };

  const handleRecoveryFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRecoveryPreviewFile(file);
    setRecoveryPreviewUrl(URL.createObjectURL(file));
    setRecoveryFlip(false);
  };

  const handleUseRecovery = async () => {
    if (!couple || !profile || usingRecovery) return;
    
    // If I missed yesterday's photo, require photo upload first
    if (iMissedYesterday && recoveryStep === 'confirm') {
      setRecoveryStep('photo');
      return;
    }

    setUsingRecovery(true);
    setRecoveryStep('uploading');
    setError('');

    try {
      // Step 1: Apply recovery
      const { error: rpcError } = await supabase.rpc('use_streak_recovery', {
        p_couple_id: couple.id,
        p_date: yesterday,
      });

      if (rpcError) throw rpcError;

      // Step 2: Upload recovery photo if I missed it
      if (iMissedYesterday && recoveryPreviewFile) {
        const compressed = await compressImage(recoveryPreviewFile, 1200, 0.7, recoveryFlip);
        const storagePath = `${couple.id}/${yesterday}/${profile.id}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(storagePath, compressed, {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { error: photoError } = await supabase.rpc('register_recovery_photo', {
          p_couple_id: couple.id,
          p_storage_path: storagePath,
          p_photo_date: yesterday,
        });

        if (photoError) console.warn('Recovery photo registration warning:', photoError);
      }

      // Send notification
      try {
        const myName = profile.display_name || 'Tú';
        await supabase.from('messages').insert({
          couple_id: couple.id,
          sender_id: profile.id,
          content: `🩹 ¡${myName} usó un comodín de recuperación! La racha volvió a estar activa.`,
        });
      } catch {
        // Ignore
      }

      // Cleanup
      if (recoveryPreviewUrl) URL.revokeObjectURL(recoveryPreviewUrl);
      setRecoveryPreviewFile(null);
      setRecoveryPreviewUrl(null);
      setShowRecovery(false);
      setRecoveryStep('confirm');

      await refreshProfile();
      await fetchYesterdayPhotos();
      await fetchHistory();
    } catch (err: any) {
      setError(err?.message || 'Error al aplicar recuperación');
      setRecoveryStep('confirm');
    } finally {
      setUsingRecovery(false);
      if (recoveryFileInputRef.current) recoveryFileInputRef.current.value = '';
    }
  };

  const handleCancelRecovery = () => {
    if (recoveryPreviewUrl) URL.revokeObjectURL(recoveryPreviewUrl);
    setRecoveryPreviewFile(null);
    setRecoveryPreviewUrl(null);
    setShowRecovery(false);
    setRecoveryStep('confirm');
    setError('');
  };

  // --- Past Day Photo Upload (for recovered days missing photos) ---
  const handleTimelineDayClick = (h: HistoryDay) => {
    const status = getDayStatus(h);
    if (status === 'recovered' && !h.myPhoto) {
      setPastDayUpload({ date: h.date });
      setPastDayPreviewFile(null);
      setPastDayPreviewUrl(null);
      setPastDayFlip(false);
      setError('');
    }
  };

  const handlePastDayFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPastDayPreviewFile(file);
    setPastDayPreviewUrl(URL.createObjectURL(file));
    setPastDayFlip(false);
  };

  const handlePastDayUpload = async () => {
    if (!pastDayPreviewFile || !pastDayUpload || !couple || !profile) return;

    setPastDayUploading(true);
    setError('');

    try {
      const compressed = await compressImage(pastDayPreviewFile, 1200, 0.7, pastDayFlip);
      const storagePath = `${couple.id}/${pastDayUpload.date}/${profile.id}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(storagePath, compressed, { contentType: 'image/jpeg', upsert: true });

      if (uploadError) throw uploadError;

      const { error: rpcError } = await supabase.rpc('register_recovery_photo', {
        p_couple_id: couple.id,
        p_storage_path: storagePath,
        p_photo_date: pastDayUpload.date,
      });

      if (rpcError) throw rpcError;

      // Clean up
      if (pastDayPreviewUrl) URL.revokeObjectURL(pastDayPreviewUrl);
      setPastDayUpload(null);
      setPastDayPreviewFile(null);
      setPastDayPreviewUrl(null);

      setSuccessMessage(`✅ ¡Foto subida para el ${formatDate(pastDayUpload.date, 'medium')}!`);
      setTimeout(() => setSuccessMessage(''), 4000);

      await fetchHistory();
    } catch (err: any) {
      setError(err?.message || 'Error al subir la foto');
    } finally {
      setPastDayUploading(false);
      if (pastDayFileInputRef.current) pastDayFileInputRef.current.value = '';
    }
  };

  const handleCancelPastDay = () => {
    if (pastDayPreviewUrl) URL.revokeObjectURL(pastDayPreviewUrl);
    setPastDayUpload(null);
    setPastDayPreviewFile(null);
    setPastDayPreviewUrl(null);
    setError('');
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

  // Timeline day status helper
  const getDayStatus = (h: HistoryDay): 'complete' | 'recovered' | 'broken' | 'partial' => {
    if (h.myPhoto && h.partnerPhoto) return 'complete';
    if (h.isRecovered) return 'recovered';
    if (h.myPhoto || h.partnerPhoto) return 'partial';
    return 'broken';
  };

  return (
    <div className="page">
      <div className="stack stack--xl stagger-children">
        {/* Header Hero */}
        <div className="text-center" style={{ paddingTop: 'var(--space-md)' }}>
          <div style={{ 
            display: 'inline-flex', 
            padding: 'var(--space-md)', 
            background: streakBroken
              ? 'rgba(248, 113, 113, 0.08)'
              : dayComplete ? 'var(--gradient-accent-soft)' : 'var(--color-bg-secondary)', 
            borderRadius: 'var(--radius-full)', 
            border: streakBroken
              ? '1px solid rgba(248, 113, 113, 0.3)'
              : dayComplete ? '1px solid var(--color-border-accent)' : '1px solid var(--color-border)', 
            marginBottom: 'var(--space-md)',
            transition: 'all 0.4s ease'
          }}>
            <IconFlameLarge active={dayComplete} broken={streakBroken} streakCount={couple.current_streak} />
          </div>
          <div>
            <div 
              className="stat-value" 
              style={{ 
                fontSize: '5rem', 
                fontWeight: 900,
                letterSpacing: '-2px',
                background: streakBroken
                  ? 'linear-gradient(135deg, #f87171 0%, #991b1b 100%)'
                  : dayComplete ? 'var(--gradient-accent)' : 'linear-gradient(135deg, #a39b90 0%, #736d65 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: 1,
                transition: 'all 0.4s ease',
              }}
            >
              {couple.current_streak}
            </div>
            <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-sm)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Días consecutivos
            </p>
          </div>
          {couple.max_streak > 0 && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--color-bg-secondary)', padding: '4px 12px', borderRadius: 'var(--radius-full)', marginTop: 'var(--space-md)' }}>
              <IconFlameLarge active={false} size={16} />
              <span className="text-secondary" style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600 }}>
                Récord máximo: {couple.max_streak}
              </span>
            </div>
          )}
        </div>

        {/* BROKEN STREAK BANNER */}
        {streakBroken && (
          <div className="streak-broken-banner animate-fade-in">
            <div className="row row--center row--gap-sm" style={{ marginBottom: '8px' }}>
              <IconBrokenHeart />
              <span style={{ fontWeight: 700, color: '#f87171', fontSize: 'var(--font-size-base)' }}>
                La racha se perdió
              </span>
            </div>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', textAlign: 'center', marginBottom: '12px' }}>
              {bothMissedOrUnknown
                ? 'Faltó completar la racha de ayer.'
                : iMissedYesterday
                  ? `Solo ${partnerName} subió foto ayer. Te faltó la tuya.`
                  : `Solo tú subiste foto ayer. ${partnerName} no subió la suya.`
              }
            </p>
            {recoveriesRemaining > 0 && (
              <button
                className="btn btn--full"
                onClick={handleStartRecovery}
                style={{
                  background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(251, 191, 36, 0.1))',
                  border: '1px solid rgba(251, 191, 36, 0.4)',
                  color: '#fbbf24',
                  fontWeight: 700,
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                🛡️ Usar comodín de recuperación ({recoveriesRemaining} restantes)
              </button>
            )}
          </div>
        )}

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
            <div style={{ position: 'relative' }}>
              <img 
                src={previewUrl} 
                alt="Preview" 
                style={{ 
                  width: '100%', 
                  aspectRatio: '3/4', 
                  objectFit: 'cover', 
                  borderRadius: 'var(--radius-md)', 
                  transform: flipHorizontal ? 'scaleX(-1)' : 'none',
                  transition: 'transform 0.2s ease',
                  display: 'block'
                }} 
              />
              <button 
                className="btn btn--secondary" 
                onClick={() => setFlipHorizontal(!flipHorizontal)} 
                disabled={uploading}
                style={{ 
                  position: 'absolute', 
                  bottom: '12px', 
                  right: '12px', 
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-full)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                  fontSize: '11px',
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                  <polyline points="17 1 21 5 17 9" />
                  <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                  <polyline points="7 23 3 19 7 15" />
                  <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                </svg>
                Voltear (Espejo)
              </button>
            </div>

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
              <div className="photo-card" style={{ transform: 'rotate(-3deg)', overflow: 'visible' }}>
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%) rotate(-4deg)',
                  width: '60px',
                  height: '24px',
                  background: 'rgba(255, 255, 255, 0.4)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  borderRadius: '2px',
                  backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%)',
                  backdropFilter: 'blur(2px)',
                  zIndex: 10,
                  pointerEvents: 'none'
                }} />
                {todayPhotos.myPhoto && myPhotoUrl ? (
                  <>
                    <img src={myPhotoUrl} alt="Mi foto" className="photo-card__image" onClick={() => setLightboxUrl(myPhotoUrl)} style={{ cursor: 'pointer' }} />
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
              <div className="photo-card" style={{ transform: 'rotate(3deg)', overflow: 'visible' }}>
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%) rotate(4deg)',
                  width: '60px',
                  height: '24px',
                  background: 'rgba(255, 255, 255, 0.4)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  borderRadius: '2px',
                  backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%)',
                  backdropFilter: 'blur(2px)',
                  zIndex: 10,
                  pointerEvents: 'none'
                }} />
                {todayPhotos.partnerPhoto ? (
                  todayPhotos.myPhoto && partnerPhotoUrl ? (
                    <>
                      <img src={partnerPhotoUrl} alt={`Foto de ${partnerName}`} className="photo-card__image" onClick={() => setLightboxUrl(partnerPhotoUrl)} style={{ cursor: 'pointer' }} />
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
          <div className="row row--gap-sm">
            <button className="btn btn--primary btn--lg" onClick={handleOpenCamera} style={{ flex: 1, padding: '0 12px' }}>
              <IconCamera />
              <span>Cámara</span>
            </button>
            <button className="btn btn--secondary btn--lg" onClick={handleOpenUpload} style={{ flex: 1, padding: '0 12px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <span>Subir</span>
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelected}
          style={{ display: 'none' }}
        />

        <input
          ref={uploadInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelected}
          style={{ display: 'none' }}
        />

        {/* Recovery file input */}
        <input
          ref={recoveryFileInputRef}
          type="file"
          accept="image/*"
          onChange={handleRecoveryFileSelected}
          style={{ display: 'none' }}
        />

        {/* Past day file input */}
        <input
          ref={pastDayFileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePastDayFileSelected}
          style={{ display: 'none' }}
        />

        {/* Monthly Recoveries Box (only show if streak is NOT broken — otherwise the banner above handles it) */}
        {!streakBroken && (
          <div className="glass-card" style={{ padding: 'var(--space-sm) var(--space-md)' }}>
            <div className="row row--between">
              <div className="row row--gap-sm">
                <span style={{ color: 'var(--color-warning)' }}><IconShield /></span>
                <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
                  Comodines disponibles
                </span>
              </div>
              <span style={{ fontWeight: 700, color: 'var(--color-warning)', fontSize: 'var(--font-size-sm)' }}>
                {recoveriesRemaining}/{MAX_RECOVERIES_PER_MONTH}
              </span>
            </div>

            {recoveriesRemaining > 0 && !showRecovery && !yesterdayComplete && !yesterdayRecovered && (
              <button
                className="btn btn--ghost btn--sm btn--full"
                onClick={handleStartRecovery}
                style={{ marginTop: 'var(--space-sm)', fontSize: 'var(--font-size-xs)' }}
              >
                Usar comodín para el día de ayer
              </button>
            )}
          </div>
        )}

        {/* 7-Day Timeline */}
        {history.length > 0 && (
          <div className="stack stack--sm">
            <h4 style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--color-text-secondary)', paddingLeft: '8px' }}>
              ÚLTIMOS 7 DÍAS
            </h4>
            <div className="streak-timeline">
              {history.map((h) => {
                const status = getDayStatus(h);
                const dayNum = new Date(h.date + 'T12:00:00').getDate();
                const dayName = new Date(h.date + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'short' });

                const canUpload = status === 'recovered' && !h.myPhoto;

                return (
                  <div 
                    key={h.date} 
                    className={`streak-timeline__day streak-timeline__day--${status}`}
                    title={formatDate(h.date, 'long')}
                    onClick={() => canUpload && handleTimelineDayClick(h)}
                    style={{ cursor: canUpload ? 'pointer' : 'default' }}
                  >
                    <div className="streak-timeline__label">{dayName}</div>
                    <div className="streak-timeline__circle">
                      {status === 'complete' && <IconCheck />}
                      {status === 'recovered' && <IconShield />}
                      {status === 'broken' && <IconX />}
                      {status === 'partial' && (
                        <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>½</span>
                      )}
                    </div>
                    <div className="streak-timeline__num">{dayNum}</div>
                    {canUpload && (
                      <div style={{ fontSize: '8px', color: 'var(--color-warning)', fontWeight: 700, marginTop: '2px' }}>📸</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {successMessage && (
          <div className="toast toast--success animate-fade-in" style={{ 
            position: 'relative', top: 0, left: 0, transform: 'none',
            background: 'rgba(74, 222, 128, 0.15)',
            border: '1px solid rgba(74, 222, 128, 0.4)',
            color: '#4ade80',
            fontWeight: 600,
          }}>
            {successMessage}
          </div>
        )}

        {error && (
          <div className="glass-card animate-fade-in" style={{ 
            padding: 'var(--space-md)',
            background: 'rgba(248, 113, 113, 0.1)',
            border: '1px solid rgba(248, 113, 113, 0.4)',
          }}>
            <div style={{ color: '#f87171', fontWeight: 600, fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-sm)' }}>
              ⚠️ {error}
            </div>
            {lastUploadRef.current && (
              <button 
                className="btn btn--full btn--sm"
                onClick={handleConfirmUpload}
                disabled={uploading}
                style={{ 
                  background: 'rgba(248, 113, 113, 0.2)',
                  border: '1px solid rgba(248, 113, 113, 0.5)',
                  color: '#fca5a5',
                  fontWeight: 700,
                }}
              >
                {uploading ? 'Reintentando...' : '🔄 Reintentar subida'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Recovery Modal */}
      {showRecovery && (
        <div className="modal-backdrop" onClick={handleCancelRecovery}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__handle" />
            <div className="stack stack--lg">
              {recoveryStep === 'confirm' && (
                <>
                  <div className="text-center">
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>🛡️</div>
                    <h3>Recuperar la racha</h3>
                    <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)', marginTop: '4px' }}>
                      {iMissedYesterday
                        ? bothMissedOrUnknown
                          ? 'Ambos faltaron ayer. Sube tu foto ahora para recuperar la racha.'
                          : 'Te faltó la foto de ayer. Súbela ahora para recuperar la racha.'
                        : `${partnerName} no subió foto ayer. ¿Usar un comodín para mantener la racha?`
                      }
                    </p>
                  </div>

                  <div className="row row--between" style={{ padding: '12px 16px', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                    <span className="text-secondary" style={{ fontSize: 'var(--font-size-xs)' }}>Comodines restantes</span>
                    <span style={{ fontWeight: 700, color: 'var(--color-warning)' }}>{recoveriesRemaining}/{MAX_RECOVERIES_PER_MONTH}</span>
                  </div>

                  <button 
                    className="btn btn--primary btn--full btn--lg" 
                    onClick={handleUseRecovery} 
                    disabled={usingRecovery}
                  >
                    {iMissedYesterday ? 'Siguiente: Subir foto de ayer' : (usingRecovery ? 'Recuperando...' : 'Confirmar recuperación')}
                  </button>
                  <button className="btn btn--ghost btn--full" onClick={handleCancelRecovery}>
                    Cancelar
                  </button>
                </>
              )}

              {recoveryStep === 'photo' && (
                <>
                  <div className="text-center">
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>📸</div>
                    <h3>Sube tu foto de ayer</h3>
                    <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)', marginTop: '4px' }}>
                      Sube la foto que te faltó para el {formatDate(yesterday, 'medium')}
                    </p>
                  </div>

                  {recoveryPreviewUrl ? (
                    <div style={{ position: 'relative' }}>
                      <img
                        src={recoveryPreviewUrl}
                        alt="Recovery preview"
                        style={{
                          width: '100%',
                          aspectRatio: '3/4',
                          objectFit: 'cover',
                          borderRadius: 'var(--radius-md)',
                          transform: recoveryFlip ? 'scaleX(-1)' : 'none',
                          display: 'block',
                        }}
                      />
                      <button
                        className="btn btn--secondary"
                        onClick={() => setRecoveryFlip(!recoveryFlip)}
                        style={{
                          position: 'absolute',
                          bottom: '12px',
                          right: '12px',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-full)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                          fontSize: '11px',
                          backgroundColor: 'rgba(255,255,255,0.15)',
                          backdropFilter: 'blur(10px)',
                          WebkitBackdropFilter: 'blur(10px)',
                          color: '#fff',
                          border: '1px solid rgba(255,255,255,0.2)',
                        }}
                      >
                        Voltear
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn btn--secondary btn--full btn--lg"
                      onClick={() => recoveryFileInputRef.current?.click()}
                      style={{ padding: '32px 16px' }}
                    >
                      <IconCamera />
                      <span>Tomar / elegir foto</span>
                    </button>
                  )}

                  <button
                    className="btn btn--primary btn--full btn--lg"
                    onClick={handleUseRecovery}
                    disabled={!recoveryPreviewFile || usingRecovery}
                  >
                    {usingRecovery ? 'Recuperando...' : 'Confirmar y recuperar racha'}
                  </button>

                  {recoveryPreviewUrl && (
                    <button
                      className="btn btn--ghost btn--full"
                      onClick={() => {
                        URL.revokeObjectURL(recoveryPreviewUrl);
                        setRecoveryPreviewFile(null);
                        setRecoveryPreviewUrl(null);
                        if (recoveryFileInputRef.current) recoveryFileInputRef.current.value = '';
                      }}
                    >
                      Elegir otra foto
                    </button>
                  )}

                  <button className="btn btn--ghost btn--full" onClick={handleCancelRecovery}>
                    Cancelar
                  </button>
                </>
              )}

              {recoveryStep === 'uploading' && (
                <div className="text-center" style={{ padding: 'var(--space-xl) 0' }}>
                  <div className="spinner" style={{ margin: '0 auto 16px' }} />
                  <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>
                    Recuperando la racha...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Past Day Photo Upload Modal */}
      {pastDayUpload && (
        <div className="modal-backdrop" onClick={handleCancelPastDay}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__handle" />
            <div className="stack stack--lg">
              <div className="text-center">
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📸</div>
                <h3>Subir foto del {formatDate(pastDayUpload.date, 'medium')}</h3>
                <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)', marginTop: '4px' }}>
                  Sube una foto de ese día desde tu galería o toma una nueva.
                </p>
              </div>

              {pastDayPreviewUrl ? (
                <div style={{ position: 'relative' }}>
                  <img
                    src={pastDayPreviewUrl}
                    alt="Preview"
                    style={{
                      width: '100%',
                      aspectRatio: '3/4',
                      objectFit: 'cover',
                      borderRadius: 'var(--radius-md)',
                      transform: pastDayFlip ? 'scaleX(-1)' : 'none',
                      display: 'block',
                    }}
                  />
                  <button
                    className="btn btn--secondary"
                    onClick={() => setPastDayFlip(!pastDayFlip)}
                    style={{
                      position: 'absolute',
                      bottom: '12px',
                      right: '12px',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-full)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                      fontSize: '11px',
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.2)',
                    }}
                  >
                    Voltear
                  </button>
                </div>
              ) : (
                <button
                  className="btn btn--secondary btn--full btn--lg"
                  onClick={() => pastDayFileInputRef.current?.click()}
                  style={{ padding: '32px 16px' }}
                >
                  <IconCamera />
                  <span>Tomar foto o elegir de galería</span>
                </button>
              )}

              <button
                className="btn btn--primary btn--full btn--lg"
                onClick={handlePastDayUpload}
                disabled={!pastDayPreviewFile || pastDayUploading}
              >
                {pastDayUploading ? 'Subiendo...' : 'Confirmar y subir foto'}
              </button>

              {pastDayPreviewUrl && (
                <button
                  className="btn btn--ghost btn--full"
                  onClick={() => {
                    URL.revokeObjectURL(pastDayPreviewUrl);
                    setPastDayPreviewFile(null);
                    setPastDayPreviewUrl(null);
                    if (pastDayFileInputRef.current) pastDayFileInputRef.current.value = '';
                  }}
                >
                  Elegir otra foto
                </button>
              )}

              <button className="btn btn--ghost btn--full" onClick={handleCancelPastDay}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
    </div>
  );
}
