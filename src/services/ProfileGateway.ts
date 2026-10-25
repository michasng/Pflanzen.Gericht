import type { InjectionKey } from 'vue'
import type {
  ProductWithImages,
  PublicProfile,
  ReviewWithMeta,
  UserListsPageRequest,
  UserPageRequest,
  UserReviewsPageRequest,
} from '@/services/profile'
import type { ListSummary } from '@/lib/ListSummary'

export const profileGatewayKey: InjectionKey<ProfileGateway> = Symbol('profileGateway')

export interface ProfileUpdates {
  displayName: string | null
  bio: string | null
}

export interface ProfileGateway {
  fetchPublicProfile: (userId: string) => Promise<PublicProfile | null>
  fetchUserReviews: (userId: string, request: UserReviewsPageRequest) => Promise<ReviewWithMeta[]>
  fetchUserProducts: (userId: string, request: UserPageRequest) => Promise<ProductWithImages[]>
  fetchUserLists: (userId: string, request: UserListsPageRequest) => Promise<ListSummary[]>
  countCurrentUserReviews: (userId: string) => Promise<number>
  countUserProducts: (userId: string) => Promise<number>
  countUserLists: (userId: string, onlyPublic: boolean) => Promise<number>
  updateProfile: (userId: string, updates: ProfileUpdates) => Promise<void>
  deleteReview: (reviewId: string) => Promise<void>
  deleteProduct: (productId: string) => Promise<void>
}
