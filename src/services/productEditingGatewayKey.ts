import type { InjectionKey } from 'vue'
import type { ProductEditingGateway } from '@/services/ProductEditingGateway'

export const productEditingGatewayKey: InjectionKey<ProductEditingGateway> =
  Symbol('productEditingGateway')
