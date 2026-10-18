import { afterEach, describe, expect, it, vi } from 'vitest'
import type { CatalogGateway } from '@/services/CatalogGateway'
import { createFakeCatalogGateway } from '@/__tests__/createFakeCatalogGateway'
import { createProductListItem } from '@/__tests__/createProductListItem'
import { EmptyRouteComponent, mountView } from '@/__tests__/mountView'
import { CATALOG_PAGE_SIZE } from '@/config/catalogPageSize'
import { SEARCH_DEBOUNCE_MILLISECONDS } from '@/config/catalogSearch'
import HomeView from '@/views/HomeView.vue'

type FetchProducts = CatalogGateway['fetchProducts']

const createFetchProducts = (productIds: string[] = []) =>
  vi
    .fn<FetchProducts>()
    .mockResolvedValue({ items: productIds.map(createProductListItem), total: productIds.length })

const mountHomeView = async (fetchProducts: FetchProducts, initialPath = '/') => {
  const mounted = await mountView({
    view: HomeView,
    routes: [
      { path: '/', name: 'home', component: EmptyRouteComponent },
      { path: '/product/new', name: 'product-new', component: EmptyRouteComponent },
      { path: '/product/:id', name: 'product-detail', component: EmptyRouteComponent },
    ],
    initialPath,
    gateways: { catalog: createFakeCatalogGateway({ fetchProducts }) },
    stubs: { CatalogFilterSheet: true },
  })
  await vi.waitFor(() => expect(mounted.wrapper.text()).not.toContain('Wird geladen'))
  return mounted
}

const lastFilter = (fetchProducts: ReturnType<typeof createFetchProducts>) =>
  fetchProducts.mock.lastCall?.[0]

describe('HomeView', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  describe('given products exist', () => {
    it('shows the products and their count', async () => {
      const { wrapper } = await mountHomeView(createFetchProducts(['a', 'b']))

      expect(wrapper.text()).toContain('Product a')
      expect(wrapper.text()).toContain('Product b')
      expect(wrapper.text()).toContain('2 Produkte')
    })

    it('uses the singular for a single product', async () => {
      const { wrapper } = await mountHomeView(createFetchProducts(['a']))

      expect(wrapper.text()).toContain('1 Produkt')
      expect(wrapper.text()).not.toContain('1 Produkte')
    })
  })

  describe('given the query contains filters', () => {
    it('loads the catalog with these filters and shows them as chips', async () => {
      const fetchProducts = createFetchProducts(['a'])

      const { wrapper } = await mountHomeView(
        fetchProducts,
        '/?q=tofu&category=meat&sort=top_rated&organic=1&minPrice=100&tags=sweet',
      )

      expect(lastFilter(fetchProducts)).toMatchObject({
        search: 'tofu',
        category: 'meat',
        sort: 'top_rated',
        organic: true,
        minPriceCents: 100,
        tags: ['sweet'],
      })
      expect(wrapper.text()).toContain('Bio')
      expect(wrapper.text()).toContain('Süß')
      expect(wrapper.text()).toContain('ab 1,00 €')
    })
  })

  describe('given no products exist and no filter is active', () => {
    it('invites to add the first product', async () => {
      const { wrapper } = await mountHomeView(createFetchProducts())

      expect(wrapper.text()).toContain('Keine Produkte gefunden')
      expect(wrapper.text()).toContain('Sei der Erste')
      expect(wrapper.get('a[href="/product/new"]').text()).toContain('Produkt hinzufügen')
    })
  })

  describe('given no products match the active filters', () => {
    it('hints to change the filters instead of inviting', async () => {
      const { wrapper } = await mountHomeView(createFetchProducts(), '/?q=nothing')

      expect(wrapper.text()).toContain('Versuche einen anderen Filter.')
      expect(wrapper.find('a[href="/product/new"]').exists()).toBe(false)
    })
  })

  describe('given loading fails', () => {
    it('shows the error', async () => {
      const fetchProducts = vi.fn<FetchProducts>().mockRejectedValue(new Error('offline'))

      const { wrapper } = await mountHomeView(fetchProducts)

      expect(wrapper.get('[role="alert"]').text()).toBe('offline')
    })
  })

  describe('given more products than one page', () => {
    it('appends the next page when loading more', async () => {
      const firstPageIds = Array.from({ length: CATALOG_PAGE_SIZE }, (_, index) => `p${index}`)
      const fetchProducts = vi
        .fn<FetchProducts>()
        .mockResolvedValueOnce({ items: firstPageIds.map(createProductListItem), total: 21 })
        .mockResolvedValueOnce({ items: [createProductListItem('last')], total: 21 })
      const { wrapper } = await mountHomeView(fetchProducts)

      await wrapper.get('button[aria-label="Mehr laden"]').trigger('click')

      await vi.waitFor(() => expect(wrapper.text()).toContain('Product last'))
      expect(wrapper.text()).toContain('Product p0')
      expect(fetchProducts).toHaveBeenLastCalledWith(expect.anything(), 1)
      expect(wrapper.find('button[aria-label="Mehr laden"]').exists()).toBe(false)
    })
  })

  describe('when typing a search', () => {
    it('searches once typing paused', async () => {
      vi.useFakeTimers()
      const fetchProducts = createFetchProducts(['a'])
      const { wrapper } = await mountHomeView(fetchProducts)

      await wrapper.get('input[type="search"]').setValue('hafer')
      await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MILLISECONDS - 1)
      expect(lastFilter(fetchProducts)?.search).toBe('')
      await vi.advanceTimersByTimeAsync(1)

      expect(lastFilter(fetchProducts)?.search).toBe('hafer')
    })
  })

  describe('when selecting a category', () => {
    it('reloads with that category and back to all', async () => {
      const fetchProducts = createFetchProducts(['a'])
      const { wrapper } = await mountHomeView(fetchProducts)

      const cheeseChip = wrapper.findAll('button').find((b) => b.text() === 'Käse-Alternative')
      await cheeseChip?.trigger('click')
      await vi.waitFor(() => expect(lastFilter(fetchProducts)?.category).toBe('cheese'))

      const allChip = wrapper.findAll('button').find((b) => b.text() === 'Alle')
      await allChip?.trigger('click')
      await vi.waitFor(() => expect(lastFilter(fetchProducts)?.category).toBeNull())
    })
  })

  describe('when selecting a sort option', () => {
    it('reloads with that sort', async () => {
      const fetchProducts = createFetchProducts(['a'])
      const { wrapper } = await mountHomeView(fetchProducts)

      await wrapper.get('select').setValue('price_asc')

      await vi.waitFor(() => expect(lastFilter(fetchProducts)?.sort).toBe('price_asc'))
    })
  })

  describe('when removing an active filter chip', () => {
    it('removes only that tag and reloads', async () => {
      const fetchProducts = createFetchProducts(['a'])
      const { wrapper } = await mountHomeView(fetchProducts, '/?tags=sweet&tags=salty')

      await wrapper.get('button[aria-label="Süß entfernen"]').trigger('click')

      await vi.waitFor(() => expect(lastFilter(fetchProducts)?.tags).toEqual(['salty']))
      expect(wrapper.find('button[aria-label="Süß entfernen"]').exists()).toBe(false)
    })

    it('removes the store together with its city', async () => {
      const fetchProducts = createFetchProducts(['a'])
      const { wrapper } = await mountHomeView(fetchProducts, '/?store=Rewe&city=Berlin')
      expect(wrapper.text()).toContain('Rewe · Berlin')

      await wrapper.get('button[aria-label="Geschäft entfernen"]').trigger('click')

      await vi.waitFor(() =>
        expect(lastFilter(fetchProducts)).toMatchObject({ store: null, city: null }),
      )
    })

    it('removes the price range', async () => {
      const fetchProducts = createFetchProducts(['a'])
      const { wrapper } = await mountHomeView(fetchProducts, '/?minPrice=100&maxPrice=300')
      expect(wrapper.text()).toContain('1,00 € – 3,00 €')

      await wrapper.get('button[aria-label="Preisfilter entfernen"]').trigger('click')

      await vi.waitFor(() =>
        expect(lastFilter(fetchProducts)).toMatchObject({
          minPriceCents: null,
          maxPriceCents: null,
        }),
      )
    })
  })
})
