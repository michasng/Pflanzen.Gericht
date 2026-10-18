import type { OpenFoodFactsGateway } from '@/services/OpenFoodFactsGateway'

export const createFakeOpenFoodFactsGateway = (
  overrides: Partial<OpenFoodFactsGateway> = {},
): OpenFoodFactsGateway => ({
  fetchProduct: () => Promise.reject(new Error('not expected')),
  fetchProductImage: () => Promise.reject(new Error('not expected')),
  ...overrides,
})
