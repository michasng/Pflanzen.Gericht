import { computed, ref } from 'vue'
import { toErrorMessage } from '@/lib/error'
import type { ListSummary } from '@/lib/ListSummary'
import type { ListGateway, ListInput } from '@/services/ListGateway'

interface ProductBookmarkOptions {
  gateway: ListGateway
  ownerId: string
  productId: string
}

export const useProductBookmark = ({ gateway, ownerId, productId }: ProductBookmarkOptions) => {
  const lists = ref<ListSummary[]>([])
  const listIdsWithProduct = ref<string[]>([])
  const loading = ref(false)
  const loadError = ref<string | null>(null)
  const actionError = ref<string | null>(null)
  const togglingListId = ref<string | null>(null)

  const isBookmarked = computed(() => listIdsWithProduct.value.length > 0)

  const load = async (): Promise<void> => {
    loading.value = true
    loadError.value = null
    try {
      const [userLists, containingListIds] = await Promise.all([
        gateway.fetchAllUserLists(ownerId),
        gateway.fetchListIdsContainingProduct(ownerId, productId),
      ])
      lists.value = userLists
      listIdsWithProduct.value = containingListIds
    } catch (err) {
      loadError.value = toErrorMessage(err)
    } finally {
      loading.value = false
    }
  }

  const toggle = async (listId: string): Promise<void> => {
    actionError.value = null
    togglingListId.value = listId
    const isOnList = listIdsWithProduct.value.includes(listId)
    try {
      if (isOnList) {
        await gateway.removeProductFromList(listId, productId)
        listIdsWithProduct.value = listIdsWithProduct.value.filter((id) => id !== listId)
      } else {
        await gateway.addProductToList(listId, productId)
        listIdsWithProduct.value = [...listIdsWithProduct.value, listId]
      }
    } catch (err) {
      actionError.value = toErrorMessage(err)
    } finally {
      togglingListId.value = null
    }
  }

  const createListWithProduct = async (input: ListInput): Promise<void> => {
    const listId = await gateway.createList(ownerId, input)
    try {
      await gateway.addProductToList(listId, productId)
    } finally {
      await load()
    }
  }

  return {
    lists,
    listIdsWithProduct,
    loading,
    loadError,
    actionError,
    togglingListId,
    isBookmarked,
    load,
    toggle,
    createListWithProduct,
  }
}
