import { describe, expect, it, vi } from 'vitest'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { useCatalogStore } from '@/stores/catalog'
import { catalogGatewayKey, type CatalogGateway } from '@/services/CatalogGateway'
import { createFakeCatalogGateway } from '@/__tests__/createFakeCatalogGateway'
import { createProductListItem } from '@/__tests__/createProductListItem'
import { CatalogListFilter } from '@/config/CatalogListFilter'
import { CatalogSingleFilter } from '@/config/CatalogSingleFilter'

const createStore = (gateway: CatalogGateway) => {
  const app = createApp({})
  const pinia = createPinia()
  app.use(pinia)
  app.provide(catalogGatewayKey, gateway)
  return app.runWithContext(() => useCatalogStore(pinia))
}

const createSpiedStore = () => {
  const fetchProducts = vi
    .fn<CatalogGateway['fetchProducts']>()
    .mockResolvedValue({ items: [createProductListItem('a')], total: 1 })
  const store = createStore(createFakeCatalogGateway({ fetchProducts }))
  return { store, fetchProducts }
}

describe('useCatalogStore', () => {
  describe('when a filter changes', () => {
    it.each([
      ['search', (store: ReturnType<typeof createStore>) => store.setSearch('tofu')],
      ['category', (store: ReturnType<typeof createStore>) => store.setCategory('meat')],
      ['sort', (store: ReturnType<typeof createStore>) => store.setSort('newest')],
      ['tags', (store: ReturnType<typeof createStore>) => store.setTags(['sweet'])],
      ['organic', (store: ReturnType<typeof createStore>) => store.setOrganic(true)],
    ])('reloads from the first page after the %s changed', async (_name, change) => {
      const { store, fetchProducts } = createSpiedStore()

      change(store)

      await vi.waitFor(() => expect(fetchProducts).toHaveBeenCalledTimes(1))
      expect(fetchProducts).toHaveBeenCalledWith(expect.anything(), 0)
      await vi.waitFor(() => expect(store.products).toHaveLength(1))
    })

    it('reloads once for several changes at the same time', async () => {
      const { store, fetchProducts } = createSpiedStore()

      store.setSearch('tofu')
      store.setCategory('meat')
      store.setOrganic(true)

      await vi.waitFor(() => expect(store.products).toHaveLength(1))
      expect(fetchProducts).toHaveBeenCalledTimes(1)
      expect(fetchProducts).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'tofu', category: 'meat', organic: true }),
        0,
      )
    })
  })

  describe('when removing one value of a list filter', () => {
    it('keeps the other values and reloads', async () => {
      const { store, fetchProducts } = createSpiedStore()
      store.setTags(['sweet', 'salty'])
      await vi.waitFor(() => expect(store.products).toHaveLength(1))
      fetchProducts.mockClear()

      store.removeFilterValue(CatalogListFilter.Tags, 'sweet')

      expect(store.tags).toEqual(['salty'])
      await vi.waitFor(() =>
        expect(fetchProducts).toHaveBeenCalledWith(expect.objectContaining({ tags: ['salty'] }), 0),
      )
    })

    it.each([
      [CatalogListFilter.IncludeIngredients, 'includeIngredients'],
      [CatalogListFilter.ExcludeIngredients, 'excludeIngredients'],
      [CatalogListFilter.ExcludeAllergens, 'excludeAllergens'],
    ] as const)('removes a value from %s', (filter, storeKey) => {
      const { store } = createSpiedStore()
      store.setIncludeIngredients(['a', 'b'])
      store.setExcludeIngredients(['a', 'b'])
      store.setExcludeAllergens(['a', 'b'])

      store.removeFilterValue(filter, 'a')

      expect(store[storeKey]).toEqual(['b'])
    })
  })

  describe('when clearing a filter', () => {
    it('clears the minimum rating, organic and base', () => {
      const { store } = createSpiedStore()
      store.setMinRating(4)
      store.setOrganic(true)
      store.setBase('oat')

      store.clearFilter(CatalogSingleFilter.MinRating)
      store.clearFilter(CatalogSingleFilter.Organic)
      store.clearFilter(CatalogSingleFilter.Base)

      expect(store.minRating).toBeNull()
      expect(store.organic).toBe(false)
      expect(store.base).toBeNull()
    })

    it('clears the store together with its city', () => {
      const { store } = createSpiedStore()
      store.setStore('Rewe')
      store.setCity('Berlin')

      store.clearFilter(CatalogSingleFilter.Store)

      expect(store.store).toBeNull()
      expect(store.city).toBeNull()
    })

    it('clears both ends of the price range', () => {
      const { store } = createSpiedStore()
      store.setMinPriceCents(100)
      store.setMaxPriceCents(300)

      store.clearFilter(CatalogSingleFilter.Price)

      expect(store.minPriceCents).toBeNull()
      expect(store.maxPriceCents).toBeNull()
    })

    it('reloads without the cleared filter', async () => {
      const { store, fetchProducts } = createSpiedStore()
      store.setOrganic(true)
      await vi.waitFor(() => expect(store.products).toHaveLength(1))
      fetchProducts.mockClear()

      store.clearFilter(CatalogSingleFilter.Organic)

      await vi.waitFor(() =>
        expect(fetchProducts).toHaveBeenCalledWith(expect.objectContaining({ organic: false }), 0),
      )
    })
  })
})
