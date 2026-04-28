// ══════════════════════════════════════════════════════════════
// PeakPack — Supabase Server Client
// ══════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  logger.warn(
    'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing. ' +
    'Supabase admin client will not be available.'
  );
}

/**
 * Supabase admin client — uses the service_role key.
 * Has full access to auth admin operations (create users, verify tokens, etc.).
 * NEVER expose this client or the service_role key to the browser.
 */
export const supabaseAdmin = createClient(
  SUPABASE_URL || '',
  SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Verify a Supabase access token and return the user.
 * Used by auth middleware and Socket.IO authentication.
 */
export async function getUserFromToken(
  accessToken: string
): Promise<{ id: string; email: string } | null> {
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(accessToken);

    if (error || !data.user) {
      return null;
    }

    return {
      id: data.user.id,
      email: data.user.email || '',
    };
  } catch (err) {
    logger.warn('Supabase token verification failed', { error: err });
    return null;
  }
}
