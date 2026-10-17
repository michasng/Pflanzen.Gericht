import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import type { Session } from '@supabase/supabase-js'
import { useAuthStore } from '@/stores/auth'
import { authGatewayKey } from '@/services/authGatewayKey'
import type { AuthGateway } from '@/services/AuthGateway'
import { createFakeAuthGateway } from '@/__tests__/createFakeAuthGateway'
import { createProfile } from '@/__tests__/createProfile'
import { createSession } from '@/__tests__/createSession'

const createStore = (gateway: AuthGateway) => {
  const app = createApp({})
  const pinia = createPinia()
  app.use(pinia)
  app.provide(authGatewayKey, gateway)
  return app.runWithContext(() => useAuthStore(pinia))
}

describe('useAuthStore', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('when initializing with an existing session', () => {
    it('loads the profile and exposes the login state', async () => {
      const store = createStore(
        createFakeAuthGateway({
          getSession: () => Promise.resolve(createSession('user-1')),
          fetchProfile: () => Promise.resolve(createProfile({ isAdmin: true })),
        }),
      )

      await store.init()

      expect(store.isLoggedIn).toBe(true)
      expect(store.isAdmin).toBe(true)
      expect(store.loading).toBe(false)
    })
  })

  describe('when initializing while the gateway is unreachable', () => {
    it('stops loading and stays logged out', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {})
      const store = createStore(
        createFakeAuthGateway({ getSession: () => Promise.reject(new Error('offline')) }),
      )

      await store.init()

      expect(store.isLoggedIn).toBe(false)
      expect(store.loading).toBe(false)
    })
  })

  describe('when the session changes after initializing', () => {
    it('loads the profile for a new session and clears it on sign out', async () => {
      let notifySessionChange: (session: Session | null) => void = () => {}
      const store = createStore(
        createFakeAuthGateway({
          onSessionChange: (listener) => {
            notifySessionChange = listener
            return { unsubscribe: () => {} }
          },
          fetchProfile: () => Promise.resolve(createProfile({ username: 'new-user' })),
        }),
      )
      await store.init()

      notifySessionChange(createSession('user-2'))
      await vi.waitFor(() => expect(store.profile?.username).toBe('new-user'))
      notifySessionChange(null)

      expect(store.profile).toBeNull()
      expect(store.isLoggedIn).toBe(false)
    })
  })

  describe('when signing in', () => {
    it('stores the returned session', async () => {
      const session = createSession('user-1')
      const store = createStore(
        createFakeAuthGateway({ signIn: () => Promise.resolve({ session }) }),
      )

      await store.signIn('a@b.de', 'secret')

      expect(store.session).toStrictEqual(session)
    })
  })

  describe('when signing out', () => {
    it('clears session and profile', async () => {
      const store = createStore(
        createFakeAuthGateway({
          getSession: () => Promise.resolve(createSession('user-1')),
          fetchProfile: () => Promise.resolve(createProfile()),
        }),
      )
      await store.init()

      await store.signOut()

      expect(store.session).toBeNull()
      expect(store.profile).toBeNull()
    })
  })

  describe('when cleaning up', () => {
    it('unsubscribes from session changes', async () => {
      const unsubscribe = vi.fn<() => void>()
      const store = createStore(createFakeAuthGateway({ onSessionChange: () => ({ unsubscribe }) }))
      await store.init()

      store.cleanup()

      expect(unsubscribe).toHaveBeenCalledOnce()
    })
  })
})
