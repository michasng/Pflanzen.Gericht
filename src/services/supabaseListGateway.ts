import { createList, deleteList, fetchList, updateList } from '@/services/lists'
import type { ListGateway } from '@/services/ListGateway'

export const supabaseListGateway: ListGateway = {
  fetchList,
  createList,
  updateList,
  deleteList,
}
