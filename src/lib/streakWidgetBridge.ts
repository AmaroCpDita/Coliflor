// ============================================================
// Coliflor — Native Home Screen Widget Bridge
// ============================================================

import { registerPlugin, Capacitor } from '@capacitor/core';

interface StreakWidgetPluginInterface {
  updateWidgetData(options: {
    streakCount: number;
    completedToday: boolean;
    partnerName: string;
  }): Promise<void>;
}

export const StreakWidget = registerPlugin<StreakWidgetPluginInterface>('StreakWidget');

/**
 * Synchronize the current streak and completion status to the Android Home Screen Widget.
 * This runs natively on Android and fails safely (no-op) on Web/iOS.
 */
export async function syncStreakToHomeScreenWidget(
  streakCount: number,
  completedToday: boolean,
  partnerName: string,
): Promise<void> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    return;
  }

  try {
    await StreakWidget.updateWidgetData({
      streakCount,
      completedToday,
      partnerName,
    });
    console.log('[WidgetBridge] Successfully synced streak to Home Screen Widget');
  } catch (err) {
    console.warn('[WidgetBridge] Failed to update home screen widget:', err);
  }
}
