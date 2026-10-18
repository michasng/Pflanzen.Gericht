import { ref, computed, watch, type Ref } from 'vue'
import { defineStore } from 'pinia'
import { injectGateway } from '@/composables/injectGateway'
import { toErrorMessage } from '@/lib/error'
import type { ProductListItem, CatalogFilter, SortOption } from '@/services/catalog'
import { catalogGatewayKey } from '@/services/CatalogGateway'
import { CATALOG_PAGE_SIZE } from '@/config/catalogPageSize'
import { DEFAULT_SORT_OPTION } from '@/config/sortOptions'
import { CatalogListFilter } from '@/config/CatalogListFilter'
import { CatalogSingleFilter } from '@/config/CatalogSingleFilter'

export const useCatalogStore = defineStore('catalog', () => {
  const catalogGateway = injectGateway(catalogGatewayKey)

  const products = ref<ProductListItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const hasMore = ref(true)
  const page = ref(0)
  const totalCount = ref(0)

  const search = ref('')
  const category = ref<string | null>(null)
  const base = ref<string | null>(null)
  const sort = ref<SortOption>(DEFAULT_SORT_OPTION)
  const store = ref<string | null>(null)
  const city = ref<string | null>(null)
  const minPriceCents = ref<number | null>(null)
  const maxPriceCents = ref<number | null>(null)
  const minRating = ref<number | null>(null)
  const tags = ref<string[]>([])
  const includeIngredients = ref<string[]>([])
  const excludeIngredients = ref<string[]>([])
  const excludeAllergens = ref<string[]>([])
  const organic = ref(false)

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
    excludeAllergens: excludeAllergens.value,
    organic: organic.value,
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
      const result = await catalogGateway.fetchProducts(filter.value, page.value)
      products.value = reset ? result.items : [...products.value, ...result.items]
      totalCount.value = result.total
      hasMore.value = result.items.length === CATALOG_PAGE_SIZE
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

  const setExcludeAllergens = (value: string[]): void => {
    excludeAllergens.value = value
  }

  const setOrganic = (value: boolean): void => {
    organic.value = value
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
    n += excludeAllergens.value.length
    if (organic.value) n++
    return n
  })

  const listFilters: Record<CatalogListFilter, Ref<string[]>> = {
    [CatalogListFilter.Tags]: tags,
    [CatalogListFilter.IncludeIngredients]: includeIngredients,
    [CatalogListFilter.ExcludeIngredients]: excludeIngredients,
    [CatalogListFilter.ExcludeAllergens]: excludeAllergens,
  }

  const removeFilterValue = (filterName: CatalogListFilter, value: string): void => {
    const values = listFilters[filterName]
    values.value = values.value.filter((existing) => existing !== value)
  }

  const singleFilterClearers: Record<CatalogSingleFilter, () => void> = {
    [CatalogSingleFilter.MinRating]: () => {
      minRating.value = null
    },
    [CatalogSingleFilter.Organic]: () => {
      organic.value = false
    },
    [CatalogSingleFilter.Base]: () => {
      base.value = null
    },
    [CatalogSingleFilter.Store]: () => {
      store.value = null
      city.value = null
    },
    [CatalogSingleFilter.Price]: () => {
      minPriceCents.value = null
      maxPriceCents.value = null
    },
  }

  const clearFilter = (filterName: CatalogSingleFilter): void => {
    singleFilterClearers[filterName]()
  }

  watch(filter, () => load(true))

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
    excludeAllergens.value = []
    organic.value = false
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
    excludeAllergens,
    organic,
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
    setExcludeAllergens,
    setOrganic,
    resetFilters,
    removeFilterValue,
    clearFilter,
  }
})
