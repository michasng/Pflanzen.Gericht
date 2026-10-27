import type { InjectionKey } from 'vue'
import type { PriceReportWithProfile } from '@/services/prices'
import type { ProductDetail } from '@/services/catalog'
import type { ReviewReaction } from '@/types/ReviewReaction'

export const productDetailGatewayKey: InjectionKey<ProductDetailGateway> =
  Symbol('productDetailGateway')

export interface ProductDetailGateway {
  fetchProductDetail: (productId: string) => Promise<ProductDetail | null>
  upsertPriceReport: (
    productId: string,
    userId: string,
    store: string,
    cityName: string,
    priceEuroCents: number,
    salePriceEuroCents: number | null,
    observedAt: string,
  ) => Promise<PriceReportWithProfile>
  deletePriceReport: (priceReportId: string) => Promise<void>
  deleteProduct: (productId: string) => Promise<void>
  deleteReview: (reviewId: string) => Promise<void>
  addReaction: (reviewId: string, userId: string, emoji: string) => Promise<ReviewReaction>
  removeReaction: (reviewId: string, userId: string, emoji: string) => Promise<void>
}
