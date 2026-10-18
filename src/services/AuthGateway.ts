import type { InjectionKey } from 'vue'
import type { Session } from '@supabase/supabase-js'
import type { Profile } from '@/types'

export const authGatewayKey: InjectionKey<AuthGateway> = Symbol('authGateway')

export interface AuthResult {
  session: Session | null
}

export interface AuthSubscription {
  unsubscribe: () => void
}

export interface AuthGateway {
  getSession: () => Promise<Session | null>
  onSessionChange: (listener: (session: Session | null) => void) => AuthSubscription
  fetchProfile: (userId: string) => Promise<Profile | null>
  signIn: (email: string, password: string) => Promise<AuthResult>
  signUp: (
    email: string,
    password: string,
    username: string,
    displayName: string,
  ) => Promise<AuthResult>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
  isUsernameAvailable: (username: string) => Promise<boolean>
}
