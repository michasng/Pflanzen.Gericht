import type { InjectionKey } from 'vue'
import type {
  SimilarityCandidate,
  SimilarityCandidateSource,
  SimilarityVoteHistory,
  SimilarProduct,
} from '@/services/similarProducts'

export const similarProductsGatewayKey: InjectionKey<SimilarProductsGateway> =
  Symbol('similarProductsGateway')

export interface SimilarProductsGateway {
  fetchSimilarProducts: (productId: string) => Promise<SimilarProduct[]>
  searchProductCandidates: (search: string) => Promise<SimilarityCandidate[]>
  searchSimilarityCandidates: (
    product: SimilarityCandidateSource,
    search: string,
  ) => Promise<SimilarityCandidate[]>
  voteSimilarity: (
    productId: string,
    otherProductId: string,
    agreed: boolean,
    userId: string,
    history?: SimilarityVoteHistory,
  ) => Promise<void>
  removeSimilarityVote: (productId: string, otherProductId: string, userId: string) => Promise<void>
  adminRemoveSimilarity: (productId: string, otherProductId: string) => Promise<void>
}
