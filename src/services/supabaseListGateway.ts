import {
  addProductToList,
  createList,
  deleteList,
  fetchList,
  fetchListProducts,
  fetchProductIdsOnList,
  removeProductFromList,
  updateList,
} from '@/services/lists'
import type { ListGateway } from '@/services/ListGateway'

export const supabaseListGateway: ListGateway = {
  fetchList,
  fetchListProducts,
  fetchProductIdsOnList,
  addProductToList,
  removeProductFromList,
  createList,
  updateList,
  deleteList,
}
