import { fetchProductDetail } from '@/services/catalog'
import { deletePriceReport, upsertPriceReport } from '@/services/prices'
import { deleteReview } from '@/services/profile'
import { deleteProduct } from '@/services/products'
import type { ProductDetailGateway } from '@/services/ProductDetailGateway'

export const supabaseProductDetailGateway: ProductDetailGateway = {
  fetchProductDetail,
  upsertPriceReport,
  deletePriceReport,
  deleteProduct,
  deleteReview,
}
