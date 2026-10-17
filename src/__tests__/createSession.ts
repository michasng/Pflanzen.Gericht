import type { Session } from '@supabase/supabase-js'

export const createSession = (userId: string): Session => ({
  access_token: 'access-token',
  refresh_token: 'refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: {
    id: userId,
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2026-09-11T00:00:00.000Z',
  },
})
