import type { InjectionKey } from 'vue'
import type { ListVisibility } from '@/config/ListVisibility'
import type { ListSummary } from '@/lib/ListSummary'

export const listGatewayKey: InjectionKey<ListGateway> = Symbol('listGateway')

export interface ListInput {
  name: string
  visibility: ListVisibility
}

export interface ListGateway {
  fetchList: (listId: string) => Promise<ListSummary | null>
  createList: (ownerId: string, input: ListInput) => Promise<void>
  updateList: (listId: string, input: ListInput) => Promise<void>
  deleteList: (listId: string) => Promise<void>
}
