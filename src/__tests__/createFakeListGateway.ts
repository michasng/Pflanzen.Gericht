import type { ListGateway } from '@/services/ListGateway'

export const createFakeListGateway = (overrides: Partial<ListGateway> = {}): ListGateway => ({
  fetchList: () => Promise.resolve(null),
  fetchListProducts: () => Promise.resolve([]),
  fetchProductIdsOnList: () => Promise.resolve([]),
  addProductToList: () => Promise.resolve(),
  removeProductFromList: () => Promise.resolve(),
  createList: () => Promise.resolve(),
  updateList: () => Promise.resolve(),
  deleteList: () => Promise.resolve(),
  ...overrides,
})
