import type { InjectionKey } from 'vue'
import type { ListVisibility } from '@/config/ListVisibility'
import type { ListProduct } from '@/lib/ListProduct'
import type { ListSummary } from '@/lib/ListSummary'
import type { PageRequest } from '@/lib/PageRequest'

export const listGatewayKey: InjectionKey<ListGateway> = Symbol('listGateway')

export interface ListInput {
  name: string
  visibility: ListVisibility
}

export interface ListGateway {
  fetchList: (listId: string) => Promise<ListSummary | null>
  /** Newest additions first */
  fetchListProducts: (listId: string, request: PageRequest) => Promise<ListProduct[]>
  fetchProductIdsOnList: (listId: string, productIds: string[]) => Promise<string[]>
  addProductToList: (listId: string, productId: string) => Promise<void>
  removeProductFromList: (listId: string, productId: string) => Promise<void>
  /** Sorted alphabetically using German rules, ignoring case */
  fetchAllUserLists: (ownerId: string) => Promise<ListSummary[]>
  /** Maps each requested product id to the ids of the owner's lists containing it */
  fetchListIdsByProductId: (
    ownerId: string,
    productIds: string[],
  ) => Promise<Record<string, string[]>>
  /** Resolves with the id of the new List */
  createList: (ownerId: string, input: ListInput) => Promise<string>
  updateList: (listId: string, input: ListInput) => Promise<void>
  deleteList: (listId: string) => Promise<void>
}
