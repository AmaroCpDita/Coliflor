import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { partnerId, title, text } = await req.json();

    if (!partnerId || !text) {
      throw new Error('Missing required parameters');
    }

    const ONESIGNAL_APP_ID = "c8182906-bc83-480e-8a97-c60611034162";
    const REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY");

    if (!REST_API_KEY) {
      throw new Error("ONESIGNAL_REST_API_KEY no está configurada en los secretos de Supabase");
    }

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${REST_API_KEY}`
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_external_user_ids: [partnerId],
        headings: { es: `💛 ${title}`, en: `💛 ${title}` },
        contents: { es: text, en: text },
        url: 'https://coliflor.vercel.app/messages'
      })
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
