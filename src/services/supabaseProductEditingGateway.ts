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
import type { ProductEditingGateway } from '@/services/ProductEditingGateway'

export const supabaseProductEditingGateway: ProductEditingGateway = {
  fetchProduct,
  fetchProductImages,
  fetchProductIngredients,
  fetchProductNutrients,
  fetchProductSources,
  fetchProductReviewImages,
  createProduct,
  updateProduct,
  replaceProductIngredients,
  replaceProductNutrients,
  replaceProductSources,
  uploadProductImage,
  deleteProductImage,
  copyReviewImageToProduct,
}
