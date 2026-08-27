// ============================================================
// Coliflor — Supabase Client
// ============================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gamwmifvgfedgfizcxoz.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhbXdtaWZ2Z2ZlZGdmaXpjeG96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3ODgxODYsImV4cCI6MjEwMzM2NDE4Nn0.7Pc0AGrKNMz6FoWJHQ_CzDV24HMH0aiE0lUP1nrhFnc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
