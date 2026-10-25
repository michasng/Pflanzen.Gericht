import type { SimilarityCandidate } from '@/services/similarProducts'

export interface ProductSearchSuggestion extends SimilarityCandidate {
  unavailableReason?: string
}
