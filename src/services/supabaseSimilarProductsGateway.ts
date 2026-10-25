import {
  adminRemoveSimilarity,
  fetchSimilarProducts,
  removeSimilarityVote,
  searchProductCandidates,
  searchSimilarityCandidates,
  voteSimilarity,
} from '@/services/similarProducts'
import type { SimilarProductsGateway } from '@/services/SimilarProductsGateway'

export const supabaseSimilarProductsGateway: SimilarProductsGateway = {
  fetchSimilarProducts,
  searchProductCandidates,
  searchSimilarityCandidates,
  voteSimilarity,
  removeSimilarityVote,
  adminRemoveSimilarity,
}
