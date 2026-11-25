// ============================================================
// Coliflor — Native Home Screen Widget Bridge
// ============================================================

import { registerPlugin, Capacitor } from '@capacitor/core';

interface StreakWidgetPluginInterface {
  updateWidgetData(options: {
    streakCount: number;
    completedToday: boolean;
    partnerName: string;
  }): Promise<{ success: boolean }>;
  requestPinWidget(): Promise<{ supported: boolean; requested: boolean }>;
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

/**
 * Request the Android OS to pin the 4x2 Home Screen Widget automatically.
 * Opens the system dialog: "¿Añadir a la pantalla de inicio? [Añadir automáticamente]"
 */
export async function requestPinHomeScreenWidget(): Promise<boolean> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    return false;
  }

  try {
    const res = await StreakWidget.requestPinWidget();
    return Boolean(res && res.requested);
  } catch (err) {
    console.warn('[WidgetBridge] Failed to request pin widget:', err);
    return false;
  }
}
