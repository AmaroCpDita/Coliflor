// ============================================================
// Coliflor — OneSignal Push Notification Utility
// ============================================================

export const ONESIGNAL_APP_ID = 'c8182906-bc83-480e-8a97-c60611034162';

export async function sendOneSignalPush(partnerId: string, title: string, text: string) {
  if (!partnerId) return;

  try {
    // 1. Try OneSignal Web SDK postNotification
    const win = window as any;
    if (win.OneSignalDeferred) {
      win.OneSignalDeferred.push(async function(OneSignal: any) {
        try {
          if (typeof OneSignal.postNotification === 'function') {
            OneSignal.postNotification({
              contents: { es: text, en: text },
              headings: { es: `💛 ${title}`, en: `💛 ${title}` },
              include_external_user_ids: [partnerId],
            });
          }
        } catch {
          // Fallback
        }
      });
    }

    // 2. Direct OneSignal API Push Endpoint
    await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_external_user_ids: [partnerId],
        contents: { es: text, en: text },
        headings: { es: `💛 ${title}`, en: `💛 ${title}` },
        url: 'https://coliflor.vercel.app/messages',
      }),
    });
  } catch (e) {
    console.warn('OneSignal Push Send Warning:', e);
  }
}
