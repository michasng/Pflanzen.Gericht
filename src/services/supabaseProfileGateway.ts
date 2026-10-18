import {
  deleteReview,
  fetchPublicProfile,
  fetchUserProducts,
  fetchUserReviews,
  updateProfile,
} from '@/services/profile'
import { deleteProduct } from '@/services/products'
import type { ProfileGateway } from '@/services/ProfileGateway'

export const supabaseProfileGateway: ProfileGateway = {
  fetchPublicProfile,
  fetchUserReviews,
  fetchUserProducts,
  updateProfile,
  deleteReview,
  deleteProduct,
}
