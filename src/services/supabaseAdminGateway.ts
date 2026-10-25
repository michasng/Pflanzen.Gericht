import { deleteReview } from '@/services/profile'
import { deleteProduct } from '@/services/products'
import { fetchAdminProductsPage } from '@/services/fetchAdminProductsPage'
import { ADMIN_REVIEW_PAGE_SIZE, fetchAllReviewsForAdmin } from '@/services/reviews'
import type { AdminGateway } from '@/services/AdminGateway'

const ADMIN_PRODUCT_PAGE_SIZE = 20

export const supabaseAdminGateway: AdminGateway = {
  productPageSize: ADMIN_PRODUCT_PAGE_SIZE,
  reviewPageSize: ADMIN_REVIEW_PAGE_SIZE,
  fetchProductsPage: fetchAdminProductsPage,
  fetchReviewsPage: fetchAllReviewsForAdmin,
  deleteProduct,
  deleteReview,
}
