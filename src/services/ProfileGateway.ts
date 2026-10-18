import type { InjectionKey } from 'vue'
import type { Product } from '@/types'
import type { PublicProfile, ReviewWithMeta } from '@/services/profile'

export const profileGatewayKey: InjectionKey<ProfileGateway> = Symbol('profileGateway')

export interface ProfileUpdates {
  displayName: string | null
  bio: string | null
}

export interface ProfileGateway {
  fetchPublicProfile: (userId: string) => Promise<PublicProfile | null>
  fetchUserReviews: (userId: string, onlyCurrent?: boolean) => Promise<ReviewWithMeta[]>
  fetchUserProducts: (userId: string) => Promise<Product[]>
  updateProfile: (userId: string, updates: ProfileUpdates) => Promise<void>
  deleteReview: (reviewId: string) => Promise<void>
  deleteProduct: (productId: string) => Promise<void>
}
