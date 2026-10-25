import { ref } from 'vue'
import { toErrorMessage } from '@/lib/error'
import type { ListSummary } from '@/lib/ListSummary'
import type { ListGateway, ListInput } from '@/services/ListGateway'

interface ProductBookmarksOptions {
  gateway: ListGateway
  ownerId: () => string | null
}

export const useProductBookmarks = ({ gateway, ownerId }: ProductBookmarksOptions) => {
  const lists = ref<ListSummary[]>([])
  const listIdsByProductId = ref<Record<string, string[]>>({})
  const loading = ref(false)
  const loadError = ref<string | null>(null)
  const actionError = ref<string | null>(null)
  const togglingListId = ref<string | null>(null)
  let listsRequested = false
  const requestedProductIds = new Set<string>()

  const listIdsWithProduct = (productId: string): string[] =>
    listIdsByProductId.value[productId] ?? []

  const isBookmarked = (productId: string): boolean => listIdsWithProduct(productId).length > 0

  const setListIds = (productId: string, listIds: string[]): void => {
    listIdsByProductId.value = { ...listIdsByProductId.value, [productId]: listIds }
  }

  const load = async (productIds: string[]): Promise<void> => {
    const currentOwnerId = ownerId()
    if (!currentOwnerId) return
    const productIdsToLoad = productIds.filter((productId) => !requestedProductIds.has(productId))
    if (productIdsToLoad.length === 0) return
    const shouldLoadLists = !listsRequested

    for (const productId of productIdsToLoad) requestedProductIds.add(productId)
    listsRequested = true
    loading.value = true
    loadError.value = null
    try {
      const [userLists, listIdsByLoadedProductId] = await Promise.all([
        shouldLoadLists ? gateway.fetchAllUserLists(currentOwnerId) : Promise.resolve(null),
        gateway.fetchListIdsByProductId(currentOwnerId, productIdsToLoad),
      ])
      if (userLists) lists.value = userLists
      listIdsByProductId.value = { ...listIdsByProductId.value, ...listIdsByLoadedProductId }
    } catch (err) {
      for (const productId of productIdsToLoad) requestedProductIds.delete(productId)
      if (shouldLoadLists) listsRequested = false
      loadError.value = toErrorMessage(err)
    } finally {
      loading.value = false
    }
  }

  const toggle = async (productId: string, listId: string): Promise<void> => {
    actionError.value = null
    togglingListId.value = listId
    const currentListIds = listIdsWithProduct(productId)
    try {
      if (currentListIds.includes(listId)) {
        await gateway.removeProductFromList(listId, productId)
        setListIds(
          productId,
          currentListIds.filter((id) => id !== listId),
        )
      } else {
        await gateway.addProductToList(listId, productId)
        setListIds(productId, [...currentListIds, listId])
      }
    } catch (err) {
      actionError.value = toErrorMessage(err)
    } finally {
      togglingListId.value = null
    }
  }

  const createListWithProduct = async (productId: string, input: ListInput): Promise<void> => {
    const currentOwnerId = ownerId()
    if (!currentOwnerId) throw new Error('Nicht angemeldet.')
    const listId = await gateway.createList(currentOwnerId, input)
    actionError.value = null
    try {
      await gateway.addProductToList(listId, productId)
      setListIds(productId, [...listIdsWithProduct(productId), listId])
    } catch (err) {
      actionError.value = toErrorMessage(err)
    }
    try {
      lists.value = await gateway.fetchAllUserLists(currentOwnerId)
    } catch (err) {
      actionError.value = toErrorMessage(err)
    }
  }

  return {
    lists,
    loading,
    loadError,
    actionError,
    togglingListId,
    listIdsWithProduct,
    isBookmarked,
    load,
    toggle,
    createListWithProduct,
  }
}

export type ProductBookmarks = ReturnType<typeof useProductBookmarks>
