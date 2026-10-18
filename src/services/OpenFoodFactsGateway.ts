import type { InjectionKey } from 'vue'
import type { OpenFoodFactsProduct } from '@/types/openFoodFacts'

export const openFoodFactsGatewayKey: InjectionKey<OpenFoodFactsGateway> =
  Symbol('openFoodFactsGateway')

export interface OpenFoodFactsGateway {
  fetchProduct: (barcode: string) => Promise<OpenFoodFactsProduct>
  fetchProductImage: (imageUrl: string) => Promise<File>
}
