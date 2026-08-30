import { ONESIGNAL_APP_ID } from './onesignal';

const REST_API_KEY = import.meta.env.VITE_ONESIGNAL_REST_API_KEY;

/**
 * Send a push notification directly via OneSignal REST API.
 * This bypasses the Supabase Edge Function for maximum reliability.
 */
export async function sendPushNotification(
  partnerId: string,
  title: string,
  text: string
): Promise<boolean> {
  if (!partnerId || !REST_API_KEY) {
    console.warn('Push: Missing partnerId or REST API key');
    return false;
  }

  try {
    const response = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_aliases: { external_id: [partnerId] },
        target_channel: 'push',
        headings: { es: `🌷 ${title}`, en: `🌷 ${title}` },
        contents: { es: text, en: text },
        url: 'https://coliflor.vercel.app/messages',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.warn('Push API error:', data);
      return false;
    }

    console.log('Push sent successfully:', data);
    return true;
  } catch (e) {
    console.warn('Push send failed:', e);
    return false;
  }
}
