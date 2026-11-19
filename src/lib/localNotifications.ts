// ============================================================
// Coliflor — Native & Web Local Notifications Service
// ============================================================

import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const CHANNEL_ID = 'streak_reminders';
const NOTIF_ID_AFTERNOON = 101;
const NOTIF_ID_NIGHT = 102;
const NOTIF_ID_LAST_CALL = 103;

let channelInitialized = false;

/**
 * Initialize Android notification channel for high-priority streak alerts.
 */
async function ensureChannel() {
  if (channelInitialized) return;
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
    try {
      await LocalNotifications.createChannel({
        id: CHANNEL_ID,
        name: 'Recordatorios de Racha 🔥',
        description: 'Notificaciones para que nunca pierdas tu racha en Coliflor',
        importance: 5, // High importance (heads-up banner + sound)
        visibility: 1,
        vibration: true,
      });
      channelInitialized = true;
    } catch (e) {
      console.warn('[LocalNotif] Failed to create channel:', e);
    }
  }
}

/**
 * Request notification permissions across Native (Capacitor) and Web browsers.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      await ensureChannel();
      const status = await LocalNotifications.requestPermissions();
      return status.display === 'granted';
    } catch (e) {
      console.warn('[LocalNotif] Error requesting native permissions:', e);
      return false;
    }
  }

  // Web Browser fallback
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (e) {
      console.warn('[LocalNotif] Error requesting web permissions:', e);
      return false;
    }
  }

  return false;
}

/**
 * Check if notifications are currently granted.
 */
export async function checkNotificationPermission(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      const status = await LocalNotifications.checkPermissions();
      return status.display === 'granted';
    } catch {
      return false;
    }
  }

  if (typeof window !== 'undefined' && 'Notification' in window) {
    return Notification.permission === 'granted';
  }

  return false;
}

/**
 * Schedule automated daily countdown reminders if today's streak is not yet completed.
 *
 * Reminders:
 * - 18:00: Aviso de la tarde ("¡No dejen apagar la llama!")
 * - 21:00: Aviso nocturno ("¡Quedan 3 horas!")
 * - 23:00: Alerta crítica ("¡ÚLTIMA HORA para salvar la racha!")
 */
export async function scheduleStreakDangerReminders({
  streakCount,
  myPhotoUploaded,
  partnerName,
}: {
  streakCount: number;
  myPhotoUploaded: boolean;
  partnerName: string;
}): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const hasPermission = await checkNotificationPermission();
    if (!hasPermission) return;

    await ensureChannel();

    // First cancel previous streak danger alerts for today
    await cancelStreakDangerReminders();

    const now = new Date();
    const notificationsToSchedule: any[] = [];

    // Helper to build a Date for today at a given hour:minute
    const makeTodayTime = (hours: number, minutes = 0) => {
      const target = new Date();
      target.setHours(hours, minutes, 0, 0);
      return target;
    };

    const countLabel = `${streakCount} ${streakCount === 1 ? 'día' : 'días'}`;
    const missingWho = myPhotoUploaded
      ? `Tú ya subiste tu foto, ¡pero falta la de ${partnerName}!`
      : `¡Aún falta tu foto de hoy!`;

    // 1. 18:00 Reminder
    const t18 = makeTodayTime(18, 0);
    if (t18.getTime() > now.getTime() + 60000) {
      notificationsToSchedule.push({
        id: NOTIF_ID_AFTERNOON,
        title: '🔥 ¡Tu racha de Coliflor te espera!',
        body: `Llevan ${countLabel} de racha. ${missingWho} Mantengan viva la llama.`,
        channelId: CHANNEL_ID,
        schedule: { at: t18 },
        sound: 'default',
        extra: { route: '/streak' },
      });
    }

    // 2. 21:00 Urgent Reminder (3 hours left)
    const t21 = makeTodayTime(21, 0);
    if (t21.getTime() > now.getTime() + 60000) {
      notificationsToSchedule.push({
        id: NOTIF_ID_NIGHT,
        title: '⏳ ¡Solo quedan 3 horas para salvar su racha!',
        body: `¡No pierdan su racha de ${countLabel}! Entren a subir la foto antes de medianoche.`,
        channelId: CHANNEL_ID,
        schedule: { at: t21 },
        sound: 'default',
        extra: { route: '/streak' },
      });
    }

    // 3. 23:00 Critical Last Call (1 hour left)
    const t23 = makeTodayTime(23, 0);
    if (t23.getTime() > now.getTime() + 60000) {
      notificationsToSchedule.push({
        id: NOTIF_ID_LAST_CALL,
        title: '🚨 ¡ÚLTIMA HORA! Racha en peligro crítico',
        body: `¡Queda 1 hora para medianoche! Si no suben su foto, la racha de ${countLabel} se perderá.`,
        channelId: CHANNEL_ID,
        schedule: { at: t23 },
        sound: 'default',
        extra: { route: '/streak' },
      });
    }

    if (notificationsToSchedule.length > 0) {
      await LocalNotifications.schedule({ notifications: notificationsToSchedule });
      console.log(`[LocalNotif] Scheduled ${notificationsToSchedule.length} streak reminders`);
    }
  } catch (e) {
    console.warn('[LocalNotif] Failed to schedule reminders:', e);
  }
}

/**
 * Cancel pending streak danger reminders once the streak is secured today.
 */
export async function cancelStreakDangerReminders(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await LocalNotifications.cancel({
      notifications: [
        { id: NOTIF_ID_AFTERNOON },
        { id: NOTIF_ID_NIGHT },
        { id: NOTIF_ID_LAST_CALL },
      ],
    });
  } catch (e) {
    console.warn('[LocalNotif] Failed to cancel reminders:', e);
  }
}

/**
 * Trigger an instant celebration notification when streak is completed today.
 */
export async function triggerStreakSecuredNotification(streakCount: number): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const hasPermission = await checkNotificationPermission();
    if (!hasPermission) return;

    await ensureChannel();
    await cancelStreakDangerReminders();

    await LocalNotifications.schedule({
      notifications: [
        {
          id: 200,
          title: '✨ ¡Racha Activada Hoy! 🔥',
          body: `¡Felicidades! Han protegido su racha por hoy. Llevan ${streakCount} ${streakCount === 1 ? 'día' : 'días'} juntos.`,
          channelId: CHANNEL_ID,
          schedule: { at: new Date(Date.now() + 500) },
          sound: 'default',
        },
      ],
    });
  } catch (e) {
    console.warn('[LocalNotif] Failed to trigger celebration notification:', e);
  }
}
