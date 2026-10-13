import { supabase } from './supabase';

/**
 * Send a push notification securely via Supabase Edge Function.
 * This prevents exposing the OneSignal REST API Key in the frontend bundle.
 */
export async function sendPushNotification(
  partnerId: string,
  title: string,
  text: string,
): Promise<boolean> {
  if (!partnerId) {
    console.warn('Push: Missing partnerId');
    return false;
  }

  try {
    const { data, error } = await supabase.functions.invoke('send-push', {
      body: { partnerId, title, text },
    });

    if (error) {
      console.warn('Edge Function Push Error:', error);
      return false;
    }

    console.log('Push sent via Edge Function:', data);
    return true;
  } catch (e) {
    console.warn('Push send failed:', e);
    return false;
  }
}
