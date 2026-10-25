import {
  countCurrentUserReviews,
  countUserProducts,
  deleteReview,
  fetchPublicProfile,
  fetchUserProducts,
  fetchUserReviews,
  updateProfile,
} from '@/services/profile'
import { deleteProduct } from '@/services/products'
import { countUserLists, fetchUserLists } from '@/services/lists'
import type { ProfileGateway } from '@/services/ProfileGateway'

export const supabaseProfileGateway: ProfileGateway = {
  fetchPublicProfile,
  fetchUserReviews,
  fetchUserProducts,
  fetchUserLists,
  countCurrentUserReviews,
  countUserProducts,
  countUserLists,
  updateProfile,
  deleteReview,
  deleteProduct,
}
