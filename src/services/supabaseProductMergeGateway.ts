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
  fetchReviews: fetchProductReviews,
  fetchPriceReports,
  upsertPriceReport,
  fetchSimilarityVotes: fetchProductSimilarityVotes,
  voteSimilarity,
}
