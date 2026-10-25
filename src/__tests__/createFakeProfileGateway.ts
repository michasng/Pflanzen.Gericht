import type { ProfileGateway } from '@/services/ProfileGateway'

export const createFakeProfileGateway = (
  overrides: Partial<ProfileGateway> = {},
): ProfileGateway => ({
  fetchPublicProfile: () => Promise.resolve(null),
  fetchUserReviews: () => Promise.resolve([]),
  fetchUserProducts: () => Promise.resolve([]),
  fetchUserLists: () => Promise.resolve([]),
  countCurrentUserReviews: () => Promise.resolve(0),
  countUserProducts: () => Promise.resolve(0),
  countUserLists: () => Promise.resolve(0),
  updateProfile: () => Promise.resolve(),
  deleteReview: () => Promise.resolve(),
  deleteProduct: () => Promise.resolve(),
  ...overrides,
})
