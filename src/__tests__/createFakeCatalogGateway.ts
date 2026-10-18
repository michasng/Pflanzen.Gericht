import type { CatalogGateway } from '@/services/CatalogGateway'

export const createFakeCatalogGateway = (
  overrides: Partial<CatalogGateway> = {},
): CatalogGateway => ({
  fetchProducts: () => Promise.resolve({ items: [], total: 0 }),
  ...overrides,
})
