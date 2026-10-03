import type {
  Product,
  ProductImage,
  ProductInsert,
  ProductSimilarityVote,
  Review,
  ReviewImage,
} from '@/types'
import type { PriceReportWithProfile } from '@/services/prices'
import type { ReviewFields, ReviewHistory, ReviewWithDetails } from '@/services/reviews'
import type { SimilarityVoteHistory } from '@/services/similarProducts'
import type { IngredientWrite, NutrientWrite } from '@/types/productWrites'

export type MergedProductFields = Pick<
  ProductInsert,
  | 'name'
  | 'category'
  | 'base'
  | 'brand'
  | 'description'
  | 'energyJoules'
  | 'allergens'
  | 'isOrganic'
  | 'barcode'
  | 'quantityUnit'
  | 'quantityValue'
>

export interface ProductMergeGateway {
  createProduct: (fields: MergedProductFields, ownerId: string) => Promise<Product>
  updateProduct: (productId: string, fields: MergedProductFields) => Promise<void>
  replaceIngredients: (productId: string, ingredients: IngredientWrite[]) => Promise<void>
  replaceNutrients: (productId: string, nutrients: NutrientWrite[]) => Promise<void>
  copyImage: (
    image: ProductImage,
    productId: string,
    ownerId: string,
    sortOrder: number,
  ) => Promise<unknown>
  fetchReviews: (productId: string) => Promise<ReviewWithDetails[]>
  createReview: (
    productId: string,
    userId: string,
    fields: ReviewFields,
    tags: string[],
    history?: ReviewHistory,
  ) => Promise<Review>
  copyReviewImage: (reviewImage: ReviewImage, reviewId: string, userId: string) => Promise<unknown>
  fetchPriceReports: (productId: string) => Promise<PriceReportWithProfile[]>
  upsertPriceReport: (
    productId: string,
    userId: string,
    store: string,
    cityName: string,
    priceEuroCents: number,
    salePriceEuroCents: number | null,
    observedAt: string,
    createdAt?: string,
  ) => Promise<unknown>
  fetchSimilarityVotes: (productId: string) => Promise<ProductSimilarityVote[]>
  voteSimilarity: (
    productId: string,
    otherProductId: string,
    agreed: boolean,
    userId: string,
    history?: SimilarityVoteHistory,
  ) => Promise<void>
  deleteProduct: (productId: string) => Promise<void>
}
