import {
  copyReviewImageToProduct,
  createProduct,
  deleteProductImage,
  fetchProduct,
  fetchProductImages,
  fetchProductIngredients,
  fetchProductNutrients,
  fetchProductSources,
  replaceProductIngredients,
  replaceProductNutrients,
  replaceProductSources,
  updateProduct,
  uploadProductImage,
} from '@/services/products'
import { fetchProductReviewImages } from '@/services/reviews'
import { fetchProductActivityCounts } from '@/services/fetchProductActivityCounts'
import { fetchPublicProfile } from '@/services/profile'
import { mergeProducts } from '@/services/mergeProducts'
import { supabaseProductMergeGateway } from '@/services/supabaseProductMergeGateway'
import type { ProductEditingGateway } from '@/services/ProductEditingGateway'

export const supabaseProductEditingGateway: ProductEditingGateway = {
  fetchProduct,
  fetchProductImages,
  fetchProductIngredients,
  fetchProductNutrients,
  fetchProductSources,
  fetchProductReviewImages,
  fetchProductActivityCounts,
  fetchPublicProfile,
  mergeProducts: (input) => mergeProducts(supabaseProductMergeGateway, input),
  createProduct,
  updateProduct,
  replaceProductIngredients,
  replaceProductNutrients,
  replaceProductSources,
  uploadProductImage,
  deleteProductImage,
  copyReviewImageToProduct,
}
