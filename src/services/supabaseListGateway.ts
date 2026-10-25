import {
  addProductToList,
  createList,
  deleteList,
  fetchAllUserLists,
  fetchList,
  fetchListIdsByProductId,
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
  fetchAllUserLists,
  fetchListIdsByProductId,
  createList,
  updateList,
  deleteList,
}
