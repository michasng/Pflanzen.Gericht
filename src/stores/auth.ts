import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const session = ref<Session | null>(null)
  const profile = ref<Profile | null>(null)
  const loading = ref(true)
  let subscription: { unsubscribe(): void } | null = null

  const user = computed(() => session.value?.user ?? null)
  const isLoggedIn = computed(() => session.value !== null)
  const isAdmin = computed(() => profile.value?.is_admin ?? false)

  async function fetchProfile(userId: string): Promise<void> {
    const { data } = await supabase.from('profile').select('*').eq('id', userId).single()
    profile.value = data
  }

  async function init(): Promise<void> {
    loading.value = true
    try {
      const { data } = await supabase.auth.getSession()
      session.value = data.session
      if (data.session) await fetchProfile(data.session.user.id)

      const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
        session.value = newSession
        if (newSession) fetchProfile(newSession.user.id)
        else profile.value = null
      })
      subscription = listener.subscription
    } catch (err) {
      console.warn('[Auth] Supabase nicht erreichbar:', err)
    } finally {
      loading.value = false
    }
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    session.value = data.session
    return data
  }

  async function signUp(email: string, password: string, username: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username }, emailRedirectTo: window.location.origin },
    })
    if (error) throw error
    return data
  }

  async function signOut(): Promise<void> {
    await supabase.auth.signOut()
    session.value = null
    profile.value = null
  }

  async function resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/password-new`,
    })
    if (error) throw error
  }

  async function updatePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  }

  function cleanup(): void {
    subscription?.unsubscribe()
    subscription = null
  }

  return {
    session,
    profile,
    loading,
    user,
    isLoggedIn,
    isAdmin,
    fetchProfile,
    init,
    cleanup,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  }
})
