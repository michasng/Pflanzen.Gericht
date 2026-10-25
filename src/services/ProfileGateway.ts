import type { InjectionKey } from 'vue'
import type {
  PublicProfile,
  ReviewWithMeta,
  UserListsPageRequest,
  UserReviewsPageRequest,
} from '@/services/profile'
import type { ListSummary } from '@/lib/ListSummary'
import type { PageRequest } from '@/lib/PageRequest'
import type { ProductWithImages } from '@/lib/ProductWithImages'

export const profileGatewayKey: InjectionKey<ProfileGateway> = Symbol('profileGateway')

export interface ProfileUpdates {
  displayName: string | null
  bio: string | null
}

export interface ProfileGateway {
  fetchPublicProfile: (userId: string) => Promise<PublicProfile | null>
  fetchUserReviews: (userId: string, request: UserReviewsPageRequest) => Promise<ReviewWithMeta[]>
  fetchUserProducts: (userId: string, request: PageRequest) => Promise<ProductWithImages[]>
  fetchUserLists: (userId: string, request: UserListsPageRequest) => Promise<ListSummary[]>
  countCurrentUserReviews: (userId: string) => Promise<number>
  countUserProducts: (userId: string) => Promise<number>
  countUserLists: (userId: string, onlyPublic: boolean) => Promise<number>
  updateProfile: (userId: string, updates: ProfileUpdates) => Promise<void>
  deleteReview: (reviewId: string) => Promise<void>
  deleteProduct: (productId: string) => Promise<void>
}
