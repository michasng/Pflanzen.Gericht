import type { InjectionKey } from 'vue'
import type { ListVisibility } from '@/config/ListVisibility'
import type { ListProduct } from '@/lib/ListProduct'
import type { ListSummary } from '@/lib/ListSummary'
import type { UserPageRequest } from '@/services/profile'

export const listGatewayKey: InjectionKey<ListGateway> = Symbol('listGateway')

export interface ListInput {
  name: string
  visibility: ListVisibility
}

export interface ListGateway {
  fetchList: (listId: string) => Promise<ListSummary | null>
  /** Newest additions first */
  fetchListProducts: (listId: string, request: UserPageRequest) => Promise<ListProduct[]>
  fetchProductIdsOnList: (listId: string, productIds: string[]) => Promise<string[]>
  addProductToList: (listId: string, productId: string) => Promise<void>
  removeProductFromList: (listId: string, productId: string) => Promise<void>
  createList: (ownerId: string, input: ListInput) => Promise<void>
  updateList: (listId: string, input: ListInput) => Promise<void>
  deleteList: (listId: string) => Promise<void>
}
