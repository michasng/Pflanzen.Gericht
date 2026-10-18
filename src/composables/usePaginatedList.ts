import { ref, shallowRef } from 'vue'
import { toErrorMessage } from '@/lib/error'
import { useDeletableList } from '@/composables/useDeletableList'

interface PaginatedListOptions<T> {
  fetchPage: (page: number) => Promise<T[]>
  pageSize: number
  deleteItem: (id: string) => Promise<void>
  reportError: (message: string) => void
}

export const usePaginatedList = <T extends { id: string }>({
  fetchPage,
  pageSize,
  deleteItem,
  reportError,
}: PaginatedListOptions<T>) => {
  const items = shallowRef<T[]>([])
  const loading = ref(false)
  const loadError = ref<string | null>(null)
  const page = ref(0)
  const hasMore = ref(true)
  const loadingMore = ref(false)
  const { deletingId, remove } = useDeletableList({ items, deleteItem, reportError })

  const loadFirstPage = async (): Promise<void> => {
    loading.value = true
    loadError.value = null
    try {
      const firstPage = await fetchPage(0)
      page.value = 0
      items.value = firstPage
      hasMore.value = firstPage.length === pageSize
    } catch (err) {
      loadError.value = toErrorMessage(err)
    } finally {
      loading.value = false
    }
  }

  const loadMore = async (): Promise<void> => {
    loadingMore.value = true
    try {
      const nextPage = page.value + 1
      const more = await fetchPage(nextPage)
      page.value = nextPage
      items.value = [...items.value, ...more]
      hasMore.value = more.length === pageSize
    } catch (err) {
      reportError(toErrorMessage(err))
    } finally {
      loadingMore.value = false
    }
  }

  return {
    items,
    loading,
    loadError,
    hasMore,
    loadingMore,
    deletingId,
    loadFirstPage,
    loadMore,
    remove,
  }
}
