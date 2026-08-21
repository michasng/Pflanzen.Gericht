import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { toErrorMessage } from '@/lib/error'
import {
  fetchProducts,
  PAGE_SIZE,
  type ProductListItem,
  type CatalogFilter,
  type SortOption,
} from '@/services/catalog'

export const useCatalogStore = defineStore('catalog', () => {
  const products = ref<ProductListItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const hasMore = ref(true)
  const page = ref(0)

  const search = ref('')
  const category = ref<string | null>(null)
  const base = ref<string | null>(null)
  const sort = ref<SortOption>('newest')

  const filter = computed<CatalogFilter>(() => ({
    search: search.value,
    category: category.value,
    base: base.value,
    sort: sort.value,
  }))

  async function load(reset = false): Promise<void> {
    if (loading.value) return
    if (reset) {
      page.value = 0
      hasMore.value = true
      products.value = []
    }
    loading.value = true
    error.value = null
    try {
      const result = await fetchProducts(filter.value, page.value)
      products.value = reset ? result : [...products.value, ...result]
      hasMore.value = result.length === PAGE_SIZE
      page.value++
    } catch (err) {
      error.value = toErrorMessage(err)
    } finally {
      loading.value = false
    }
  }

  function setSearch(value: string): void {
    search.value = value
  }

  function setCategory(value: string | null): void {
    category.value = value
  }

  function setBase(value: string | null): void {
    base.value = value
  }

  function setSort(value: SortOption): void {
    sort.value = value
  }

  return {
    products,
    loading,
    error,
    hasMore,
    search,
    category,
    base,
    sort,
    load,
    setSearch,
    setCategory,
    setBase,
    setSort,
  }
})
