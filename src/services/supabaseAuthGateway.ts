import { supabase } from '@/lib/supabase'
import { appBaseUrl } from '@/lib/appBaseUrl'
import { camelizeKeys } from '@/lib/camelizeKeys'
import { snakeifyKeys } from '@/lib/snakeifyKeys'
import { isUsernameAvailable } from '@/services/profile'
import type { AuthGateway } from '@/services/AuthGateway'

export const supabaseAuthGateway: AuthGateway = {
  getSession: async () => {
    const { data } = await supabase.auth.getSession()
    return data.session
  },
  onSessionChange: (listener) => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => listener(session))
    return data.subscription
  },
  fetchProfile: async (userId) => {
    const { data } = await supabase.from('profile').select('*').eq('id', userId).single()
    return data && camelizeKeys(data)
  },
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return { session: data.session }
  },
  signUp: async (email, password, username, displayName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: snakeifyKeys({ username, displayName }),
        emailRedirectTo: appBaseUrl(),
      },
    })
    if (error) throw error
    return { session: data.session }
  },
  signOut: async () => {
    await supabase.auth.signOut()
  },
  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appBaseUrl()}password-new`,
    })
    if (error) throw error
  },
  updatePassword: async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  },
  isUsernameAvailable,
}
