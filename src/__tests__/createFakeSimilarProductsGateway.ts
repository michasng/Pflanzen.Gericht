import type { SimilarProductsGateway } from '@/services/SimilarProductsGateway'

export const createFakeSimilarProductsGateway = (
  overrides: Partial<SimilarProductsGateway> = {},
): SimilarProductsGateway => ({
  fetchSimilarProducts: () => Promise.resolve([]),
  searchProductCandidates: () => Promise.resolve([]),
  searchSimilarityCandidates: () => Promise.resolve([]),
  voteSimilarity: () => Promise.resolve(),
  removeSimilarityVote: () => Promise.resolve(),
  adminRemoveSimilarity: () => Promise.resolve(),
  ...overrides,
})
