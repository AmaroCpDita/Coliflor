// ============================================================
// Coliflor — Native (Android/iOS) & Web Notifications Engine
// ============================================================

import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export const CHANNEL_STREAK = 'streak_reminders';
export const CHANNEL_MESSAGES = 'coliflor_messages';
export const CHANNEL_ACTIVITY = 'coliflor_activity';

const NOTIF_ID_AFTERNOON = 101;
const NOTIF_ID_NIGHT = 102;
const NOTIF_ID_LAST_CALL = 103;

let channelsInitialized = false;
let rollingNotifId = 1000;

function nextNotificationId(): number {
  rollingNotifId = rollingNotifId >= 990000 ? 1000 : rollingNotifId + 1;
  return rollingNotifId;
}

/**
 * Initialize Android high-priority notification channels (API 26+).
 */
async function ensureChannels(): Promise<void> {
  if (channelsInitialized) return;
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
    try {
      await Promise.all([
        LocalNotifications.createChannel({
          id: CHANNEL_STREAK,
          name: 'Recordatorios de Racha',
          description: 'Alertas para mantener tu racha diaria activa en Coliflor',
          importance: 5,
          visibility: 1,
          vibration: true,
        }),
        LocalNotifications.createChannel({
          id: CHANNEL_MESSAGES,
          name: 'Mensajes y Notitas',
          description: 'Mensajes directos y notitas de amor de tu pareja',
          importance: 5,
          visibility: 1,
          vibration: true,
        }),
        LocalNotifications.createChannel({
          id: CHANNEL_ACTIVITY,
          name: 'Actividad de Pareja',
          description: 'Fotos nuevas, eventos del calendario y quizzes',
          importance: 4,
          visibility: 1,
          vibration: true,
        }),
      ]);
      channelsInitialized = true;
    } catch (e) {
      console.warn('[LocalNotif] Failed to create Android channels:', e);
    }
  }
}

/**
 * Request notification permissions across Native (Capacitor) and Web browsers.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      await ensureChannels();
      const status = await LocalNotifications.requestPermissions();
      return status.display === 'granted';
    } catch (e) {
      console.warn('[LocalNotif] Error requesting native permissions:', e);
      return false;
    }
  }

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
 * Fire an immediate REAL native OS notification (Android status bar / iOS banner).
 */
export async function sendNativeInstantNotification({
  title,
  body,
  route = '/messages',
  channel = CHANNEL_MESSAGES,
}: {
  title: string;
  body: string;
  route?: string;
  channel?: string;
}): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;

  try {
    const hasPermission = await checkNotificationPermission();
    if (!hasPermission) return false;

    await ensureChannels();

    await LocalNotifications.schedule({
      notifications: [
        {
          id: nextNotificationId(),
          title,
          body,
          channelId: channel,
          schedule: { at: new Date(Date.now() + 150) },
          extra: { route },
        },
      ],
    });
    return true;
  } catch (e) {
    console.warn('[LocalNotif] Failed to fire instant native notification:', e);
    return false;
  }
}

/**
 * Trigger a test notification so the user can verify real delivery on their device.
 */
export async function sendTestNotification(): Promise<boolean> {
  const granted = (await checkNotificationPermission()) || (await requestNotificationPermission());
  if (!granted) return false;

  if (Capacitor.isNativePlatform()) {
    return sendNativeInstantNotification({
      title: 'Coliflor',
      body: '¡Notificaciones activas! Así recibirás los avisos reales de tu pareja.',
      route: '/streak',
      channel: CHANNEL_MESSAGES,
    });
  }

  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      new Notification('Coliflor', {
        body: '¡Notificaciones activas! Así recibirás los avisos de tu pareja.',
        icon: '/logo.png',
      });
      return true;
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Listen for taps on native OS notifications and navigate to the target route.
 */
export function registerNotificationTapListener(onNavigate: (route: string) => void): () => void {
  if (!Capacitor.isNativePlatform()) return () => {};

  const listenerPromise = LocalNotifications.addListener(
    'localNotificationActionPerformed',
    (action) => {
      const route = action?.notification?.extra?.route;
      if (typeof route === 'string' && route.startsWith('/')) {
        onNavigate(route);
      }
    },
  );

  return () => {
    listenerPromise.then((handle) => handle.remove()).catch(() => {});
  };
}

/**
 * Schedule automated daily countdown reminders if today's streak is not yet completed.
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

    await ensureChannels();
    await cancelStreakDangerReminders();

    const now = new Date();
    const notificationsToSchedule: any[] = [];

    const makeTodayTime = (hours: number, minutes = 0) => {
      const target = new Date();
      target.setHours(hours, minutes, 0, 0);
      return target;
    };

    const countLabel = `${streakCount} ${streakCount === 1 ? 'día' : 'días'}`;
    const missingWho = myPhotoUploaded
      ? `Tú ya subiste tu foto, ¡pero falta la de ${partnerName}!`
      : `¡Aún falta tu foto de hoy!`;

    const t18 = makeTodayTime(18, 0);
    if (t18.getTime() > now.getTime() + 60000) {
      notificationsToSchedule.push({
        id: NOTIF_ID_AFTERNOON,
        title: 'Tu racha de Coliflor te espera',
        body: `Llevan ${countLabel} de racha. ${missingWho}`,
        channelId: CHANNEL_STREAK,
        schedule: { at: t18 },
        extra: { route: '/streak' },
      });
    }

    const t21 = makeTodayTime(21, 0);
    if (t21.getTime() > now.getTime() + 60000) {
      notificationsToSchedule.push({
        id: NOTIF_ID_NIGHT,
        title: 'Quedan 3 horas para salvar su racha',
        body: `¡No pierdan su racha de ${countLabel}! Suban la foto antes de medianoche.`,
        channelId: CHANNEL_STREAK,
        schedule: { at: t21 },
        extra: { route: '/streak' },
      });
    }

    const t23 = makeTodayTime(23, 0);
    if (t23.getTime() > now.getTime() + 60000) {
      notificationsToSchedule.push({
        id: NOTIF_ID_LAST_CALL,
        title: 'Última hora para tu racha',
        body: `Queda 1 hora antes de medianoche para mantener sus ${countLabel} juntos.`,
        channelId: CHANNEL_STREAK,
        schedule: { at: t23 },
        extra: { route: '/streak' },
      });
    }

    if (notificationsToSchedule.length > 0) {
      await LocalNotifications.schedule({ notifications: notificationsToSchedule });
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

    await ensureChannels();
    await cancelStreakDangerReminders();

    await LocalNotifications.schedule({
      notifications: [
        {
          id: 200,
          title: '¡Racha activada hoy!',
          body: `Han protegido su racha por hoy. Llevan ${streakCount} ${streakCount === 1 ? 'día' : 'días'} juntos.`,
          channelId: CHANNEL_STREAK,
          schedule: { at: new Date(Date.now() + 300) },
          extra: { route: '/streak' },
        },
      ],
    });
  } catch (e) {
    console.warn('[LocalNotif] Failed to trigger celebration notification:', e);
  }
}
