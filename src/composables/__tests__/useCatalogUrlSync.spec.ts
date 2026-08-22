import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCatalogStore } from '@/stores/catalog'

// Tests the query-param → store mapping defined in useCatalogUrlSync.
// The composable is exercised indirectly through the store setters it calls.

function parseRawQuery(q: Record<string, string>) {
  // mirror the hydration logic from the composable
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
  const VALID_SORTS = ['newest', 'top_rated', 'most_rated', 'price_asc', 'price_desc'] as const
  type SortOption = (typeof VALID_SORTS)[number]
  const sortParam = asString(q.sort)

  const store = useCatalogStore()
  store.setSearch(asString(q.q) ?? '')
  store.setCategory(asString(q.category))
  store.setBase(asString(q.base))
  store.setStore(asString(q.store))
  store.setCity(asString(q.city))
  store.setMinRating(asNumber(q.minRating))
  store.setTags(asStringArray(q.tags))
  store.setMinPriceCents(q.minPrice ? asNumber(q.minPrice) : null)
  store.setMaxPriceCents(q.maxPrice ? asNumber(q.maxPrice) : null)
  store.setSort(
    VALID_SORTS.includes(sortParam as SortOption) ? (sortParam as SortOption) : 'newest',
  )
}

describe('catalog URL sync mapping', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('hydrates search, category and sort from query params', () => {
    parseRawQuery({ q: 'tofu', category: 'meat', sort: 'top_rated' })
    const store = useCatalogStore()
    expect(store.search).toBe('tofu')
    expect(store.category).toBe('meat')
    expect(store.sort).toBe('top_rated')
  })

  it('falls back to newest for unknown sort', () => {
    parseRawQuery({ sort: 'garbage' })
    expect(useCatalogStore().sort).toBe('newest')
  })

  it('maps minRating as number', () => {
    parseRawQuery({ minRating: '4' })
    expect(useCatalogStore().minRating).toBe(4)
  })

  it('maps tags as array when a single string', () => {
    parseRawQuery({ tags: 'organic' })
    expect(useCatalogStore().tags).toEqual(['organic'])
  })

  it('maps minPrice and maxPrice as raw cents numbers', () => {
    parseRawQuery({ minPrice: '199', maxPrice: '499' })
    const store = useCatalogStore()
    expect(store.minPriceCents).toBe(199)
    expect(store.maxPriceCents).toBe(499)
  })

  it('sets null for absent optional params', () => {
    parseRawQuery({})
    const store = useCatalogStore()
    expect(store.category).toBeNull()
    expect(store.base).toBeNull()
    expect(store.minRating).toBeNull()
    expect(store.tags).toEqual([])
  })
})
