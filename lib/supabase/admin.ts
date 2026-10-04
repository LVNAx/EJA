import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Klien peran service: MELEWATI RLS. Hanya untuk pekerjaan server tanpa sesi pengguna (cron email).
 * Jangan pernah diimpor dari komponen klien, dan jangan menaruh kuncinya di variabel NEXT_PUBLIC_*.
 */
export function createAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
