import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { partnerId, title, text } = await req.json()

    // 1. Validate basic inputs
    if (!partnerId || !title || !text) {
      throw new Error('Missing required fields: partnerId, title, or text.')
    }

    // 2. Validate Authenticated User (Security check)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Server misconfiguration: Missing Supabase environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Unauthorized: Invalid JWT token')
    }

    // 3. Verify the relationship (Don't trust the frontend)
    // The sender (user.id) MUST be in an active couple with the recipient (partnerId)
    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .select('id')
      .or(`and(user1_id.eq.${user.id},user2_id.eq.${partnerId}),and(user1_id.eq.${partnerId},user2_id.eq.${user.id})`)
      .single()

    if (coupleError || !couple) {
      throw new Error('Unauthorized: You are not paired with this user, or the couple does not exist.')
    }

    // 4. Retrieve OneSignal Secrets safely from Edge Environment
    const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID')
    const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY')

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      throw new Error('Server misconfiguration: OneSignal secrets not set in Edge Function')
    }

    // 5. Send Web Push via OneSignal REST API
    const response = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_aliases: { external_id: [partnerId] },
        target_channel: 'push',
        headings: { es: `🌷 ${title}`, en: `🌷 ${title}` },
        contents: { es: text, en: text },
        url: 'https://coliflor.vercel.app/messages', // Or dynamic based on payload
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`OneSignal API Error: ${JSON.stringify(data)}`)
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Push notification sent securely.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    )
  } catch (error) {
    console.error('Push Function Error:', error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
    )
  }
})
