import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../../../src/types/database.js'
import type { CrawlerEnv } from './config/env.js'

/** Server-side client using the secret key - bypasses RLS for imports. */
export const createSupabaseAdminClient = (env: CrawlerEnv) =>
  createClient<Database>(env.supabaseUrl, env.supabaseSecretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
