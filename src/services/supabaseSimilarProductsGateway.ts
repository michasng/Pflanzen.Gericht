import {
  adminRemoveSimilarity,
  fetchSimilarProducts,
  removeSimilarityVote,
  searchSimilarityCandidates,
  voteSimilarity,
} from '@/services/similarProducts'
import type { SimilarProductsGateway } from '@/services/SimilarProductsGateway'

export const supabaseSimilarProductsGateway: SimilarProductsGateway = {
  fetchSimilarProducts,
  searchSimilarityCandidates,
  voteSimilarity,
  removeSimilarityVote,
  adminRemoveSimilarity,
}
