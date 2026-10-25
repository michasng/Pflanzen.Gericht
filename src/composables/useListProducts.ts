import { ref } from 'vue'
import { useDeletableList } from '@/composables/useDeletableList'
import { usePaginatedList } from '@/composables/usePaginatedList'
import type { ListProduct } from '@/lib/ListProduct'
import type { ProductSearchSuggestion } from '@/lib/ProductSearchSuggestion'
import type { ListGateway } from '@/services/ListGateway'
import type { SimilarityCandidate } from '@/services/similarProducts'

export const ALREADY_ON_LIST_LABEL = 'bereits auf der Liste'

export interface ListProductsOptions {
  gateway: ListGateway
  listId: string
  pageSize: number
  searchProducts: (term: string) => Promise<SimilarityCandidate[]>
}

export const useListProducts = ({
  gateway,
  listId,
  pageSize,
  searchProducts,
}: ListProductsOptions) => {
  const actionError = ref<string | null>(null)

  const {
    items: products,
    loading,
    loadError,
    hasMore,
    loadingMore,
    loadFirstPage,
    loadMore,
  } = usePaginatedList<ListProduct>({
    fetchPage: (page) => gateway.fetchListProducts(listId, { page, pageSize }),
    pageSize,
    reportError: (message) => {
      actionError.value = message
    },
  })

  const { deletingId: removingId, remove: removeFromList } = useDeletableList({
    items: products,
    deleteItem: (productId) => gateway.removeProductFromList(listId, productId),
    reportError: (message) => {
      actionError.value = message
    },
  })

  const add = async (productId: string): Promise<void> => {
    await gateway.addProductToList(listId, productId)
    await loadFirstPage()
  }

  const remove = async (productId: string): Promise<void> => {
    actionError.value = null
    await removeFromList(productId)
  }

  const searchAddableProducts = async (term: string): Promise<ProductSearchSuggestion[]> => {
    const candidates = await searchProducts(term)
    const productIdsOnList = new Set(
      await gateway.fetchProductIdsOnList(
        listId,
        candidates.map((candidate) => candidate.id),
      ),
    )
    return candidates.map((candidate) =>
      productIdsOnList.has(candidate.id)
        ? { ...candidate, unavailableReason: ALREADY_ON_LIST_LABEL }
        : candidate,
    )
  }

  return {
    products,
    loading,
    loadError,
    hasMore,
    loadingMore,
    removingId,
    actionError,
    loadFirstPage,
    loadMore,
    add,
    remove,
    searchAddableProducts,
  }
}
