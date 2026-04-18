import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || SUPABASE_URL.includes('your-project')) {
  console.warn('⚠️ Supabase not configured. Copy .env.example → .env.local and fill credentials from https://supabase.com/dashboard');
}

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true, // Required for Google OAuth redirect
    },
  }
);

// Returns true only when real credentials are set — used to show localStorage fallback
export const isSupabaseConfigured = () =>
  !!SUPABASE_URL &&
  !SUPABASE_URL.includes('your-project') &&
  !!SUPABASE_ANON_KEY &&
  SUPABASE_ANON_KEY !== 'placeholder';
