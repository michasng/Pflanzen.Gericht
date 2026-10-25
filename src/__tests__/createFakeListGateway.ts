import type { ListGateway } from '@/services/ListGateway'

export const createFakeListGateway = (overrides: Partial<ListGateway> = {}): ListGateway => ({
  fetchList: () => Promise.resolve(null),
  createList: () => Promise.resolve(),
  updateList: () => Promise.resolve(),
  deleteList: () => Promise.resolve(),
  ...overrides,
})
