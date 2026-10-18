import type { ProfileGateway } from '@/services/ProfileGateway'

export const createFakeProfileGateway = (
  overrides: Partial<ProfileGateway> = {},
): ProfileGateway => ({
  fetchPublicProfile: () => Promise.resolve(null),
  fetchUserReviews: () => Promise.resolve([]),
  fetchUserProducts: () => Promise.resolve([]),
  updateProfile: () => Promise.resolve(),
  deleteReview: () => Promise.resolve(),
  deleteProduct: () => Promise.resolve(),
  ...overrides,
})
