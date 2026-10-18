import { deleteReview } from '@/services/profile'
import { CATALOG_PAGE_SIZE } from '@/config/catalogPageSize'
import { deleteProduct } from '@/services/products'
import { fetchAdminProductsPage } from '@/services/fetchAdminProductsPage'
import { ADMIN_PAGE_SIZE as REVIEW_PAGE_SIZE, fetchAllReviewsForAdmin } from '@/services/reviews'
import type { AdminGateway } from '@/services/AdminGateway'

export const supabaseAdminGateway: AdminGateway = {
  productPageSize: CATALOG_PAGE_SIZE,
  reviewPageSize: REVIEW_PAGE_SIZE,
  fetchProductsPage: fetchAdminProductsPage,
  fetchReviewsPage: fetchAllReviewsForAdmin,
  deleteProduct,
  deleteReview,
}
