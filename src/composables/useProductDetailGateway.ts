import { injectGateway } from '@/composables/injectGateway'
import { productDetailGatewayKey } from '@/services/productDetailGatewayKey'
import type { ProductDetailGateway } from '@/services/ProductDetailGateway'

export const useProductDetailGateway = (): ProductDetailGateway =>
  injectGateway(productDetailGatewayKey)
