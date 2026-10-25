import { ref, shallowRef } from 'vue'
import { toErrorMessage } from '@/lib/error'

interface PaginatedListOptions<T> {
  fetchPage: (page: number) => Promise<T[]>
  pageSize: number
  reportError: (message: string) => void
}

export const usePaginatedList = <T>({
  fetchPage,
  pageSize,
  reportError,
}: PaginatedListOptions<T>) => {
  const items = shallowRef<T[]>([])
  const loading = ref(false)
  const loadError = ref<string | null>(null)
  const page = ref(0)
  const hasMore = ref(true)
  const loadingMore = ref(false)
  let listGeneration = 0
  const isStale = (generation: number): boolean => generation !== listGeneration

  const loadFirstPage = async (): Promise<void> => {
    const generation = ++listGeneration
    loading.value = true
    loadingMore.value = false
    loadError.value = null
    try {
      const firstPage = await fetchPage(0)
      if (isStale(generation)) return
      page.value = 0
      items.value = firstPage
      hasMore.value = firstPage.length === pageSize
    } catch (err) {
      if (isStale(generation)) return
      loadError.value = toErrorMessage(err)
    } finally {
      if (!isStale(generation)) loading.value = false
    }
  }

  const loadMore = async (): Promise<void> => {
    const generation = listGeneration
    loadingMore.value = true
    try {
      const nextPage = page.value + 1
      const more = await fetchPage(nextPage)
      if (isStale(generation)) return
      page.value = nextPage
      items.value = [...items.value, ...more]
      hasMore.value = more.length === pageSize
    } catch (err) {
      if (isStale(generation)) return
      reportError(toErrorMessage(err))
    } finally {
      if (!isStale(generation)) loadingMore.value = false
    }
  }

  return {
    items,
    loading,
    loadError,
    hasMore,
    loadingMore,
    loadFirstPage,
    loadMore,
  }
}
