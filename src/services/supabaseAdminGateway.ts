import { deleteReview } from '@/services/profile'
import {
  ADMIN_PAGE_SIZE as PRODUCT_PAGE_SIZE,
  deleteProduct,
  fetchAllProductsForAdmin,
} from '@/services/products'
import { ADMIN_PAGE_SIZE as REVIEW_PAGE_SIZE, fetchAllReviewsForAdmin } from '@/services/reviews'
import type { AdminGateway } from '@/services/AdminGateway'

export const supabaseAdminGateway: AdminGateway = {
  productPageSize: PRODUCT_PAGE_SIZE,
  reviewPageSize: REVIEW_PAGE_SIZE,
  fetchProductsPage: fetchAllProductsForAdmin,
  fetchReviewsPage: fetchAllReviewsForAdmin,
  deleteProduct,
  deleteReview,
}
