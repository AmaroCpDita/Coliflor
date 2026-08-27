import { supabase } from './supabase';

export const ONESIGNAL_APP_ID = 'c8182906-bc83-480e-8a97-c60611034162';

export async function sendOneSignalPush(partnerId: string, title: string, text: string) {
  if (!partnerId) return;

  try {
    // 1. Opcional: Intentar mostrar una notificación en la misma app si OneSignal está cargado localmente
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

    // 2. Enviar el Push de manera segura usando Supabase Edge Functions (Para iPhone cerrado / Background)
    const { data, error } = await supabase.functions.invoke('super-action', {
      body: {
        partnerId,
        title,
        text
      }
    });

    if (error) {
      console.warn('Edge Function Push Error:', error);
    }
  } catch (e) {
    console.warn('OneSignal Push Send Warning:', e);
  }
}
