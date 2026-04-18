import { createClient } from '@supabase/supabase-js';

let _supabase = null;
let _config = null;
let _configPromise = null;

export async function getConfig() {
  if (_config) return _config;
  if (!_configPromise) {
    _configPromise = fetch('/api/config').then(r => r.json()).then(c => { _config = c; return c; });
  }
  return _configPromise;
}

export async function getSupabase() {
  if (_supabase) return _supabase;
  const cfg = await getConfig();
  _supabase = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
    auth: { flowType: 'pkce' },
  });
  return _supabase;
}
