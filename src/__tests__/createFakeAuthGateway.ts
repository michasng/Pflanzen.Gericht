import type { AuthGateway } from '@/services/AuthGateway'

export const createFakeAuthGateway = (overrides: Partial<AuthGateway> = {}): AuthGateway => ({
  getSession: () => Promise.resolve(null),
  onSessionChange: () => ({ unsubscribe: () => {} }),
  fetchProfile: () => Promise.resolve(null),
  signIn: () => Promise.resolve({ session: null }),
  signUp: () => Promise.resolve({ session: null }),
  signOut: () => Promise.resolve(),
  resetPassword: () => Promise.resolve(),
  updatePassword: () => Promise.resolve(),
  isUsernameAvailable: () => Promise.resolve(true),
  ...overrides,
})
