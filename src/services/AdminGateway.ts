import type { InjectionKey } from 'vue'
import type { ProductListItem } from '@/services/catalog'
import type { AdminReviewItem } from '@/services/reviews'

export const adminGatewayKey: InjectionKey<AdminGateway> = Symbol('adminGateway')

export interface AdminGateway {
  productPageSize: number
  reviewPageSize: number
  fetchProductsPage: (page: number) => Promise<ProductListItem[]>
  fetchReviewsPage: (page: number) => Promise<AdminReviewItem[]>
  deleteProduct: (productId: string) => Promise<void>
  deleteReview: (reviewId: string) => Promise<void>
}
