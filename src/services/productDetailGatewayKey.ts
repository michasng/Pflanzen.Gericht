import type { InjectionKey } from 'vue'
import type { ProductDetailGateway } from '@/services/ProductDetailGateway'

export const productDetailGatewayKey: InjectionKey<ProductDetailGateway> =
  Symbol('productDetailGateway')
