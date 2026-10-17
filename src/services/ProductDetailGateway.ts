import type { PriceReportWithProfile } from '@/services/prices'
import type { ProductDetail } from '@/services/catalog'

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
}
