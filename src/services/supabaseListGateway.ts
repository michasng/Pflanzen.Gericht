import {
  addProductToList,
  createList,
  deleteList,
  fetchAllUserLists,
  fetchList,
  fetchListIdsContainingProduct,
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
  fetchListIdsContainingProduct,
  createList,
  updateList,
  deleteList,
}
