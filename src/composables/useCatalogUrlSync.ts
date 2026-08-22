import { watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCatalogStore } from '@/stores/catalog'
import type { SortOption } from '@/services/catalog'

const VALID_SORTS: SortOption[] = ['newest', 'top_rated', 'most_rated', 'price_asc', 'price_desc']

function asString(v: unknown): string | null {
  return typeof v === 'string' && v ? v : null
}

function asNumber(v: unknown): number | null {
  const n = Number(v)
  return typeof v === 'string' && v && Number.isFinite(n) ? n : null
}

function asStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string')
  if (typeof v === 'string' && v) return [v]
  return []
}

export function useCatalogUrlSync(): void {
  const route = useRoute()
  const router = useRouter()
  const store = useCatalogStore()

  function hydrateFromQuery(): void {
    const q = route.query
    store.setSearch(asString(q.q) ?? '')
    store.setCategory(asString(q.category))
    store.setBase(asString(q.base))
    store.setStore(asString(q.store))
    store.setCity(asString(q.city))
    store.setMinRating(asNumber(q.minRating))
    store.setTags(asStringArray(q.tags))
    store.setMinPriceCents(q.minPrice ? asNumber(q.minPrice) : null)
    store.setMaxPriceCents(q.maxPrice ? asNumber(q.maxPrice) : null)
    const sortParam = asString(q.sort)
    store.setSort(
      VALID_SORTS.includes(sortParam as SortOption) ? (sortParam as SortOption) : 'newest',
    )
  }

  onMounted(() => {
    hydrateFromQuery()
    store.load(true)
  })

  watch(
    () => ({
      q: store.search,
      category: store.category,
      base: store.base,
      sort: store.sort === 'newest' ? undefined : store.sort,
      store: store.store,
      city: store.city,
      minRating: store.minRating,
      tags: store.tags.length ? store.tags : undefined,
      minPrice: store.minPriceCents != null ? store.minPriceCents : undefined,
      maxPrice: store.maxPriceCents != null ? store.maxPriceCents : undefined,
    }),
    (query) => {
      router.replace({
        query: Object.fromEntries(Object.entries(query).filter(([, v]) => v != null && v !== '')),
      })
    },
  )
}
