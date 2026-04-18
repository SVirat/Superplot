import { createClient } from '@supabase/supabase-js';

const config = {
  supabaseUrl: import.meta.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  googleMapsApiKey: import.meta.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
};

let _supabase = null;

export function getConfig() {
  return config;
}

export function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: { flowType: 'pkce' },
    });
  }
  return _supabase;
}
