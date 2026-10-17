import type { Profile } from '@/types'

export const createProfile = (overrides: Partial<Profile> = {}): Profile => ({
  id: 'user-1',
  username: 'tester',
  displayName: null,
  bio: null,
  isAdmin: false,
  createdAt: '2026-09-11T00:00:00.000Z',
  ...overrides,
})
