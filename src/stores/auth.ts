import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Session } from '@supabase/supabase-js'
import { injectGateway } from '@/composables/injectGateway'
import { authGatewayKey, type AuthSubscription } from '@/services/AuthGateway'
import type { Profile } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const authGateway = injectGateway(authGatewayKey)

  const session = ref<Session | null>(null)
  const profile = ref<Profile | null>(null)
  const loading = ref(true)
  let subscription: AuthSubscription | null = null

  const user = computed(() => session.value?.user ?? null)
  const isLoggedIn = computed(() => session.value !== null)
  const isAdmin = computed(() => profile.value?.isAdmin ?? false)

  const fetchProfile = async (userId: string): Promise<void> => {
    profile.value = await authGateway.fetchProfile(userId)
  }

  const init = async (): Promise<void> => {
    loading.value = true
    try {
      session.value = await authGateway.getSession()
      if (session.value) await fetchProfile(session.value.user.id)

      subscription = authGateway.onSessionChange((newSession) => {
        session.value = newSession
        if (newSession) fetchProfile(newSession.user.id)
        else profile.value = null
      })
    } catch (err) {
      console.warn('[Auth] Supabase nicht erreichbar:', err)
    } finally {
      loading.value = false
    }
  }

  const signIn = async (email: string, password: string) => {
    const result = await authGateway.signIn(email, password)
    session.value = result.session
    return result
  }

  const signUp = (email: string, password: string, username: string, displayName: string) =>
    authGateway.signUp(email, password, username, displayName)

  const signOut = async (): Promise<void> => {
    await authGateway.signOut()
    session.value = null
    profile.value = null
  }

  const resetPassword = (email: string): Promise<void> => authGateway.resetPassword(email)

  const updatePassword = (newPassword: string): Promise<void> =>
    authGateway.updatePassword(newPassword)

  const cleanup = (): void => {
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
