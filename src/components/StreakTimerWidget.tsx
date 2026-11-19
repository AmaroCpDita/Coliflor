// ============================================================
// Coliflor — Duolingo-style Streak Timer Widget
// ============================================================

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getTodayInTimezone, getTimeUntilMidnightInTimezone } from '../lib/utils';
import {
  requestNotificationPermission,
  checkNotificationPermission,
  scheduleStreakDangerReminders,
  cancelStreakDangerReminders,
} from '../lib/localNotifications';
import './StreakTimerWidget.css';

interface StreakTimerWidgetProps {
  streakCount?: number;
  myPhotoUploaded?: boolean;
  partnerPhotoUploaded?: boolean;
  partnerName?: string;
  onUploadClick?: () => void;
  compact?: boolean;
}

export const StreakTimerWidget: React.FC<StreakTimerWidgetProps> = ({
  streakCount: propStreakCount,
  myPhotoUploaded: propMyPhoto,
  partnerPhotoUploaded: propPartnerPhoto,
  partnerName: propPartnerName,
  onUploadClick,
  compact = false,
}) => {
  const { couple, profile, partner } = useAuth();

  // Internal state for standalone usage (e.g., Home page)
  const [internalMyPhoto, setInternalMyPhoto] = useState<boolean | null>(null);
  const [internalPartnerPhoto, setInternalPartnerPhoto] = useState<boolean | null>(null);
  const [hasNotifPermission, setHasNotifPermission] = useState<boolean>(true);
  const [notifJustEnabled, setNotifJustEnabled] = useState(false);

  // Live countdown state
  const [timeLeft, setTimeLeft] = useState(getTimeUntilMidnightInTimezone());

  const today = getTodayInTimezone();
  const partnerDisplayName = propPartnerName || partner?.display_name || 'Tu pareja';
  const myDisplayName = profile?.display_name || 'Tú';
  const effectiveStreakCount = propStreakCount ?? couple?.current_streak ?? 0;

  // Resolve whether photos are uploaded
  const myUploaded = propMyPhoto !== undefined ? propMyPhoto : (internalMyPhoto ?? false);
  const partnerUploaded =
    propPartnerPhoto !== undefined ? propPartnerPhoto : (internalPartnerPhoto ?? false);
  const dayComplete = myUploaded && partnerUploaded;

  // Update timer every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeUntilMidnightInTimezone());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch today's photos if props not provided
  const fetchTodayStatus = useCallback(async () => {
    if (!couple || !profile) return;
    try {
      const { data, error } = await supabase
        .from('streak_photos')
        .select('user_id')
        .eq('couple_id', couple.id)
        .eq('photo_date', today);

      if (error) throw error;

      const userIds = new Set((data || []).map((p: { user_id: string }) => p.user_id));
      setInternalMyPhoto(userIds.has(profile.id));
      if (partner?.id) {
        setInternalPartnerPhoto(userIds.has(partner.id));
      } else {
        // Fallback: any other user in the couple
        const otherUploaded = (data || []).some(
          (p: { user_id: string }) => p.user_id !== profile.id,
        );
        setInternalPartnerPhoto(otherUploaded);
      }
    } catch (e) {
      console.warn('[StreakWidget] Error fetching photos:', e);
    }
  }, [couple?.id, profile?.id, partner?.id, today]);

  useEffect(() => {
    if (propMyPhoto === undefined || propPartnerPhoto === undefined) {
      fetchTodayStatus();
    }
  }, [fetchTodayStatus, propMyPhoto, propPartnerPhoto]);

  // Realtime listener for streak_photos
  useEffect(() => {
    if (!couple?.id) return;
    const channel = supabase
      .channel(`streak_widget_${couple.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'streak_photos',
          filter: `couple_id=eq.${couple.id}`,
        },
        () => {
          fetchTodayStatus();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [couple?.id, fetchTodayStatus]);

  // Check notification permission on mount
  useEffect(() => {
    checkNotificationPermission().then(setHasNotifPermission);
  }, []);

  // Handle scheduling or cancelling notifications based on dayComplete
  useEffect(() => {
    if (dayComplete) {
      cancelStreakDangerReminders();
    } else if (effectiveStreakCount > 0) {
      scheduleStreakDangerReminders({
        streakCount: effectiveStreakCount,
        myPhotoUploaded: myUploaded,
        partnerName: partnerDisplayName,
      });
    }
  }, [dayComplete, effectiveStreakCount, myUploaded, partnerDisplayName]);

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setHasNotifPermission(granted);
    if (granted) {
      setNotifJustEnabled(true);
      setTimeout(() => setNotifJustEnabled(false), 3000);
      if (!dayComplete) {
        scheduleStreakDangerReminders({
          streakCount: effectiveStreakCount,
          myPhotoUploaded: myUploaded,
          partnerName: partnerDisplayName,
        });
      }
    }
  };

  const pad = (n: number) => String(n).padStart(2, '0');

  // Widget visual theme class
  const widgetClass = useMemo(() => {
    if (dayComplete) return 'duo-streak-widget duo-streak-widget--active';
    if (timeLeft.isUrgent)
      return 'duo-streak-widget duo-streak-widget--pending duo-streak-widget--urgent';
    return 'duo-streak-widget duo-streak-widget--pending';
  }, [dayComplete, timeLeft.isUrgent]);

  return (
    <div className={widgetClass}>
      {/* Header Badge */}
      <div className="duo-streak-widget__header">
        {dayComplete ? (
          <span className="duo-streak-badge duo-streak-badge--active">✓ RACHA ACTIVADA HOY</span>
        ) : timeLeft.isUrgent ? (
          <span className="duo-streak-badge duo-streak-badge--urgent">🚨 ¡ÚLTIMAS HORAS!</span>
        ) : (
          <span className="duo-streak-badge duo-streak-badge--pending">⏳ RACHA EN ESPERA</span>
        )}

        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-tertiary)' }}>
          {dayComplete ? '¡A salvo hasta mañana!' : 'Termina a medianoche'}
        </div>
      </div>

      {/* Main Streak Counter + Flame Display */}
      <div className="duo-streak-main-display">
        <div className="duo-streak-flame-container">
          <span className="duo-streak-flame-icon">🔥</span>
        </div>

        <div className="duo-streak-info">
          <div className="duo-streak-title">
            {dayComplete ? '¡Racha Asegurada!' : 'Racha de la Pareja'}
          </div>
          <div className="duo-streak-count">
            {effectiveStreakCount}{' '}
            <span className="days-label">{effectiveStreakCount === 1 ? 'DÍA' : 'DÍAS'} JUNTOS</span>
          </div>
        </div>
      </div>

      {/* Countdown Timer Display (When not completed yet) */}
      {!dayComplete && (
        <>
          <div className="duo-countdown-grid">
            <div className="duo-timer-box">
              <div className="duo-timer-digits">{pad(timeLeft.hours)}</div>
              <div className="duo-timer-label">HORAS</div>
            </div>
            <div className="duo-timer-sep">:</div>
            <div className="duo-timer-box">
              <div className="duo-timer-digits">{pad(timeLeft.minutes)}</div>
              <div className="duo-timer-label">MINUTOS</div>
            </div>
            <div className="duo-timer-sep">:</div>
            <div className="duo-timer-box">
              <div className="duo-timer-digits">{pad(timeLeft.seconds)}</div>
              <div className="duo-timer-label">SEGUNDOS</div>
            </div>
          </div>
        </>
      )}

      {/* Checklist Status of both partners */}
      <div className="duo-partner-status-row">
        <div
          className={`duo-status-pill ${myUploaded ? 'duo-status-pill--done' : 'duo-status-pill--waiting'}`}
        >
          <div className="duo-status-icon">{myUploaded ? '✓' : '!'}</div>
          <span>{myUploaded ? `${myDisplayName}: Lista` : `${myDisplayName}: Falta foto`}</span>
        </div>

        <div
          className={`duo-status-pill ${partnerUploaded ? 'duo-status-pill--done' : 'duo-status-pill--waiting'}`}
        >
          <div className="duo-status-icon">{partnerUploaded ? '✓' : '!'}</div>
          <span>
            {partnerUploaded ? `${partnerDisplayName}: Lista` : `${partnerDisplayName}: Pendiente`}
          </span>
        </div>
      </div>

      {/* Action CTA Button */}
      {dayComplete ? (
        <Link to="/streak" className="duo-action-btn duo-action-btn--success">
          <span>✨ VER RECUERDO DE HOY</span>
        </Link>
      ) : !myUploaded ? (
        onUploadClick ? (
          <button
            type="button"
            onClick={onUploadClick}
            className={`duo-action-btn ${timeLeft.isUrgent ? 'duo-action-btn--urgent' : 'duo-action-btn--primary'}`}
          >
            <span>📸 SUBIR MI FOTO AHORA</span>
          </button>
        ) : (
          <Link
            to="/streak"
            className={`duo-action-btn ${timeLeft.isUrgent ? 'duo-action-btn--urgent' : 'duo-action-btn--primary'}`}
          >
            <span>📸 SUBIR MI FOTO AHORA</span>
          </Link>
        )
      ) : (
        <Link to="/messages" className="duo-action-btn duo-action-btn--primary">
          <span>💬 RECORDARLE A {partnerDisplayName.toUpperCase()}</span>
        </Link>
      )}

      {/* Notification prompt if not granted */}
      {!hasNotifPermission && !dayComplete && (
        <div className="duo-notif-bar">
          <span>
            {notifJustEnabled
              ? '✅ Recordatorios activados'
              : '¿Quieres avisos antes de que se apague?'}
          </span>
          {!notifJustEnabled && (
            <button type="button" onClick={handleEnableNotifications} className="duo-notif-btn">
              🔔 Activar recordatorios
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default StreakTimerWidget;
