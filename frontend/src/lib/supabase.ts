// ══════════════════════════════════════════════════════════════
// PeakPack — Supabase Browser Client
// ══════════════════════════════════════════════════════════════

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

/**
 * Browser-side Supabase client (lazy-initialized).
 * Uses the anon key — safe to expose to the browser.
 * Handles auth sessions, token refresh, and OAuth flows automatically.
 *
 * Lazy init prevents build-time crashes when env vars aren't available
 * during Next.js static page generation.
 */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_supabase) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!url || !key) {
        throw new Error(
          'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables'
        );
      }

      _supabase = createClient(url, key, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true, // needed for OAuth redirect handling
        },
      });
    }

    const value = (_supabase as any)[prop];
    return typeof value === 'function' ? value.bind(_supabase) : value;
  },
});
