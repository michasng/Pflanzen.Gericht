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
  const totalCount = ref(0)

  const search = ref('')
  const category = ref<string | null>(null)
  const base = ref<string | null>(null)
  const sort = ref<SortOption>('newest')
  const store = ref<string | null>(null)
  const city = ref<string | null>(null)
  const minPriceCents = ref<number | null>(null)
  const maxPriceCents = ref<number | null>(null)
  const minRating = ref<number | null>(null)
  const tags = ref<string[]>([])
  const includeIngredients = ref<string[]>([])
  const excludeIngredients = ref<string[]>([])

  const filter = computed<CatalogFilter>(() => ({
    search: search.value,
    category: category.value,
    base: base.value,
    sort: sort.value,
    store: store.value,
    city: city.value,
    minPriceCents: minPriceCents.value,
    maxPriceCents: maxPriceCents.value,
    minRating: minRating.value,
    tags: tags.value,
    includeIngredients: includeIngredients.value,
    excludeIngredients: excludeIngredients.value,
  }))

  const load = async (reset = false): Promise<void> => {
    if (loading.value) return
    if (reset) {
      page.value = 0
      hasMore.value = true
    }
    loading.value = true
    error.value = null
    try {
      const result = await fetchProducts(filter.value, page.value)
      products.value = reset ? result.items : [...products.value, ...result.items]
      totalCount.value = result.total
      hasMore.value = result.items.length === PAGE_SIZE
      page.value++
    } catch (err) {
      error.value = toErrorMessage(err)
    } finally {
      loading.value = false
    }
  }

  const setSearch = (value: string): void => {
    search.value = value
  }

  const setCategory = (value: string | null): void => {
    category.value = value
  }

  const setBase = (value: string | null): void => {
    base.value = value
  }

  const setSort = (value: SortOption): void => {
    sort.value = value
  }

  const setStore = (value: string | null): void => {
    store.value = value
  }

  const setCity = (value: string | null): void => {
    city.value = value
  }

  const setMinPriceCents = (value: number | null): void => {
    minPriceCents.value = value
  }

  const setMaxPriceCents = (value: number | null): void => {
    maxPriceCents.value = value
  }

  const setMinRating = (value: number | null): void => {
    minRating.value = value
  }

  const setTags = (value: string[]): void => {
    tags.value = value
  }

  const setIncludeIngredients = (value: string[]): void => {
    includeIngredients.value = value
  }

  const setExcludeIngredients = (value: string[]): void => {
    excludeIngredients.value = value
  }

  // counts how many non-default filters are active for the badge
  const activeFilterCount = computed(() => {
    let n = 0
    if (base.value) n++
    if (store.value) n++
    if (city.value) n++
    if (minPriceCents.value != null) n++
    if (maxPriceCents.value != null) n++
    if (minRating.value != null) n++
    n += tags.value.length
    n += includeIngredients.value.length
    n += excludeIngredients.value.length
    return n
  })

  const resetFilters = (): void => {
    base.value = null
    store.value = null
    city.value = null
    minPriceCents.value = null
    maxPriceCents.value = null
    minRating.value = null
    tags.value = []
    includeIngredients.value = []
    excludeIngredients.value = []
  }

  return {
    products,
    loading,
    error,
    hasMore,
    totalCount,
    search,
    category,
    base,
    sort,
    store,
    city,
    minPriceCents,
    maxPriceCents,
    minRating,
    tags,
    includeIngredients,
    excludeIngredients,
    activeFilterCount,
    load,
    setSearch,
    setCategory,
    setBase,
    setSort,
    setStore,
    setCity,
    setMinPriceCents,
    setMaxPriceCents,
    setMinRating,
    setTags,
    setIncludeIngredients,
    setExcludeIngredients,
    resetFilters,
  }
})
