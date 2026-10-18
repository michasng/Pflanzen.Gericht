import { fetchProduct, fetchProductImages } from '@/services/products'
import {
  copyProductImageToReview,
  createReview,
  deleteReviewImage,
  fetchReviewForEdit,
  updateReview,
  uploadReviewImage,
} from '@/services/reviews'
import type { ReviewEditingGateway } from '@/services/ReviewEditingGateway'

export const supabaseReviewEditingGateway: ReviewEditingGateway = {
  fetchProduct,
  fetchProductImages,
  fetchReviewForEdit,
  createReview,
  updateReview,
  uploadReviewImage,
  deleteReviewImage,
  copyProductImageToReview,
}
