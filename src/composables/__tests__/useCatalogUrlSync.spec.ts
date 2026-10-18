import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { useCatalogUrlSync } from '@/composables/useCatalogUrlSync'
import { useCatalogStore } from '@/stores/catalog'
import type { CatalogGateway } from '@/services/CatalogGateway'
import { createFakeCatalogGateway } from '@/__tests__/createFakeCatalogGateway'
import { EmptyRouteComponent, mountView } from '@/__tests__/mountView'

const mountUrlSync = async (initialPath = '/') => {
  const fetchProducts = vi
    .fn<CatalogGateway['fetchProducts']>()
    .mockResolvedValue({ items: [], total: 0 })
  let store: ReturnType<typeof useCatalogStore> | undefined
  const Host = defineComponent({
    setup: () => {
      store = useCatalogStore()
      useCatalogUrlSync()
      return () => null
    },
  })
  const { router } = await mountView({
    view: Host,
    routes: [{ path: '/', name: 'home', component: EmptyRouteComponent }],
    initialPath,
    gateways: { catalog: createFakeCatalogGateway({ fetchProducts }) },
  })
  if (!store) throw new Error('The host did not set up the store.')
  return { store, router, fetchProducts }
}

describe('useCatalogUrlSync', () => {
  describe('given the query contains search, category and sort', () => {
    it('hydrates them into the store', async () => {
      const { store } = await mountUrlSync('/?q=tofu&category=meat&sort=top_rated')

      expect(store.search).toBe('tofu')
      expect(store.category).toBe('meat')
      expect(store.sort).toBe('top_rated')
    })
  })

  describe('given the query has an unknown sort', () => {
    it('falls back to the latest review', async () => {
      const { store } = await mountUrlSync('/?sort=garbage')

      expect(store.sort).toBe('latest_review')
    })
  })

  describe('given the query has no sort', () => {
    it('uses the latest review', async () => {
      const { store } = await mountUrlSync()

      expect(store.sort).toBe('latest_review')
    })
  })

  describe.each(['newest', 'few_ingredients'])('given the query sorts by %s', (sort) => {
    it('hydrates that sort', async () => {
      const { store } = await mountUrlSync(`/?sort=${sort}`)

      expect(store.sort).toBe(sort)
    })
  })

  describe('given the query contains numeric filters', () => {
    it('maps the minimum rating and the price range', async () => {
      const { store } = await mountUrlSync('/?minRating=4&minPrice=199&maxPrice=499')

      expect(store.minRating).toBe(4)
      expect(store.minPriceCents).toBe(199)
      expect(store.maxPriceCents).toBe(499)
    })
  })

  describe('given the query contains list filters', () => {
    it('maps a single value to an array', async () => {
      const { store } = await mountUrlSync('/?tags=organic&excludeIngredients=Milch')

      expect(store.tags).toEqual(['organic'])
      expect(store.excludeIngredients).toEqual(['Milch'])
    })

    it('maps repeated values to an array', async () => {
      const { store } = await mountUrlSync('/?includeIngredients=Hafer&includeIngredients=Soja')

      expect(store.includeIngredients).toEqual(['Hafer', 'Soja'])
    })

    it('maps allergens and the organic flag', async () => {
      const { store } = await mountUrlSync('/?excludeAllergens=gluten&organic=1')

      expect(store.excludeAllergens).toEqual(['gluten'])
      expect(store.organic).toBe(true)
    })
  })

  describe('given the query is empty', () => {
    it('leaves all optional filters unset', async () => {
      const { store } = await mountUrlSync()

      expect(store.category).toBeNull()
      expect(store.base).toBeNull()
      expect(store.minRating).toBeNull()
      expect(store.tags).toEqual([])
      expect(store.organic).toBe(false)
    })
  })

  describe('when mounted', () => {
    it('loads the catalog with the hydrated filters', async () => {
      const { fetchProducts } = await mountUrlSync('/?q=tofu')

      await vi.waitFor(() =>
        expect(fetchProducts).toHaveBeenCalledWith(expect.objectContaining({ search: 'tofu' }), 0),
      )
    })
  })

  describe('when a filter changes', () => {
    it('writes the non-default filters into the query', async () => {
      const { store, router } = await mountUrlSync()

      store.setSearch('tofu')
      store.setSort('newest')
      store.setTags(['sweet'])
      store.setOrganic(true)

      await vi.waitFor(() =>
        expect(router.currentRoute.value.query).toEqual({
          q: 'tofu',
          sort: 'newest',
          tags: ['sweet'],
          organic: '1',
        }),
      )
    })

    it('omits the default sort from the query', async () => {
      const { store, router } = await mountUrlSync('/?sort=newest')

      store.setSort('latest_review')

      await vi.waitFor(() => expect(router.currentRoute.value.query).toEqual({}))
    })
  })
})
