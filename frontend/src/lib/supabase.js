import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

/** Reject placeholders and partial .env so we never call createClient with junk. */
function isValidSupabaseBrowserConfig(url, key) {
  if (!url || !key) return false;
  if (/your-project|your-anon|placeholder|example\.com|xxxxx/i.test(`${url} ${key}`)) {
    return false;
  }
  if (!/^https:\/\/.+\.supabase\.co\/?$/i.test(url)) return false;
  // Accept both legacy JWT anon keys (eyJ...) and new publishable keys (sb_publishable_...)
  const isLegacyKey = key.startsWith('eyJ') && key.length >= 80;
  const isNewKey = key.startsWith('sb_publishable_') && key.length >= 20;
  if (!isLegacyKey && !isNewKey) return false;
  return true;
}

export const isSupabaseConfigured = isValidSupabaseBrowserConfig(
  supabaseUrl,
  supabaseAnonKey
);

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase browser client disabled: set real VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env (Dashboard → Project Settings → API → anon public key).'
  );
}

/** Real client when configured; otherwise `null` — always check before use. */
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
