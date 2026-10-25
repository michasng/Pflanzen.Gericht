import type { ListGateway } from '@/services/ListGateway'

export const createFakeListGateway = (overrides: Partial<ListGateway> = {}): ListGateway => ({
  fetchList: () => Promise.resolve(null),
  fetchListProducts: () => Promise.resolve([]),
  fetchProductIdsOnList: () => Promise.resolve([]),
  addProductToList: () => Promise.resolve(),
  removeProductFromList: () => Promise.resolve(),
  fetchAllUserLists: () => Promise.resolve([]),
  fetchListIdsContainingProduct: () => Promise.resolve([]),
  createList: () => Promise.resolve('new-list'),
  updateList: () => Promise.resolve(),
  deleteList: () => Promise.resolve(),
  ...overrides,
})
