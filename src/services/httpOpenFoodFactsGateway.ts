import { fetchOpenFoodFactsProduct, fetchOpenFoodFactsProductImage } from '@/services/openFoodFacts'
import type { OpenFoodFactsGateway } from '@/services/OpenFoodFactsGateway'

export const httpOpenFoodFactsGateway: OpenFoodFactsGateway = {
  fetchProduct: fetchOpenFoodFactsProduct,
  fetchProductImage: fetchOpenFoodFactsProductImage,
}
