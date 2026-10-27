import { fetchProductSimilarityVotes } from '@/services/fetchProductSimilarityVotes'
import { fetchPriceReports, upsertPriceReport } from '@/services/prices'
import {
  copyProductImageToProduct,
  createProduct,
  deleteProduct,
  replaceProductIngredients,
  replaceProductNutrients,
  replaceProductSources,
  updateProduct,
} from '@/services/products'
import { copyReviewImageToReview, createReview, fetchProductReviews } from '@/services/reviews'
import { moveListEntries } from '@/services/moveListEntries'
import { createReviewReaction } from '@/services/reviewReactions'
import { voteSimilarity } from '@/services/similarProducts'
import type { ProductMergeGateway } from '@/services/ProductMergeGateway'

export const supabaseProductMergeGateway: ProductMergeGateway = {
  createProduct,
  updateProduct,
  deleteProduct,
  replaceIngredients: replaceProductIngredients,
  replaceNutrients: replaceProductNutrients,
  replaceSources: replaceProductSources,
  copyImage: copyProductImageToProduct,
  copyReviewImage: copyReviewImageToReview,
  createReview,
  createReaction: createReviewReaction,
  fetchReviews: fetchProductReviews,
  fetchPriceReports,
  upsertPriceReport,
  fetchSimilarityVotes: fetchProductSimilarityVotes,
  voteSimilarity,
  moveListEntries,
}
