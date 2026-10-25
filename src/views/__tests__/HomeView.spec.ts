import { afterEach, describe, expect, it, vi } from 'vitest'
import type { CatalogGateway } from '@/services/CatalogGateway'
import type { ListGateway } from '@/services/ListGateway'
import { createFakeCatalogGateway } from '@/__tests__/createFakeCatalogGateway'
import { createFakeAuthGateway } from '@/__tests__/createFakeAuthGateway'
import { createFakeListGateway } from '@/__tests__/createFakeListGateway'
import { createProfile } from '@/__tests__/createProfile'
import { createSession } from '@/__tests__/createSession'
import { createProductListItem } from '@/__tests__/createProductListItem'
import { EmptyRouteComponent, mountView } from '@/__tests__/mountView'
import { CATALOG_PAGE_SIZE } from '@/config/catalogPageSize'
import { SEARCH_DEBOUNCE_MILLISECONDS } from '@/config/catalogSearch'
import HomeView from '@/views/HomeView.vue'
import { useAuthStore } from '@/stores/auth'

type FetchProducts = CatalogGateway['fetchProducts']

const createFetchProducts = (productIds: string[] = []) =>
  vi
    .fn<FetchProducts>()
    .mockResolvedValue({ items: productIds.map(createProductListItem), total: productIds.length })

const mountHomeView = async (
  fetchProducts: FetchProducts,
  initialPath = '/',
  viewerId: string | null = null,
  list: Partial<ListGateway> = {},
) => {
  const mounted = await mountView({
    view: HomeView,
    routes: [
      { path: '/', name: 'home', component: EmptyRouteComponent },
      { path: '/login', name: 'login', component: EmptyRouteComponent },
      { path: '/product/new', name: 'product-new', component: EmptyRouteComponent },
      { path: '/product/:id', name: 'product-detail', component: EmptyRouteComponent },
    ],
    initialPath,
    gateways: {
      catalog: createFakeCatalogGateway({ fetchProducts }),
      list: createFakeListGateway({
        fetchListIdsByProductId: (_ownerId, productIds) =>
          Promise.resolve(
            Object.fromEntries(
              productIds.map((productId) => [productId, productId === 'a' ? ['list-1'] : []]),
            ),
          ),
        ...list,
      }),
      auth: createFakeAuthGateway({
        getSession: () => Promise.resolve(viewerId ? createSession(viewerId) : null),
        fetchProfile: () => Promise.resolve(createProfile({})),
      }),
    },
    stubs: { CatalogFilterSheet: true },
  })
  await useAuthStore().init()
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

  describe('given a logged-out visitor', () => {
    it('links each product bookmark to login', async () => {
      const { wrapper } = await mountHomeView(createFetchProducts(['a', 'b']))

      expect(wrapper.findAll('a[aria-label="Listen verwalten"]')).toHaveLength(2)
    })
  })

  describe('given a logged-in user', () => {
    it('fills the bookmark only for products on one of their lists', async () => {
      const { wrapper } = await mountHomeView(createFetchProducts(['a', 'b']), '/', 'user-1')

      await vi.waitFor(() =>
        expect(
          wrapper
            .findAll('button[aria-label="Listen verwalten"] svg')
            .map((icon) => icon.attributes('fill')),
        ).toEqual(['currentColor', 'none']),
      )
    })

    it('loads the lists once for all products and the memberships per page', async () => {
      const listRequests: string[] = []
      const membershipRequests: string[][] = []
      const firstPageIds = Array.from({ length: CATALOG_PAGE_SIZE }, (_, index) => `p${index}`)
      const fetchProducts = vi
        .fn<FetchProducts>()
        .mockResolvedValueOnce({ items: firstPageIds.map(createProductListItem), total: 21 })
        .mockResolvedValueOnce({ items: [createProductListItem('last')], total: 21 })
      const { wrapper } = await mountHomeView(fetchProducts, '/', 'user-1', {
        fetchAllUserLists: (ownerId) => {
          listRequests.push(ownerId)
          return Promise.resolve([])
        },
        fetchListIdsByProductId: (_ownerId, productIds) => {
          membershipRequests.push(productIds)
          return Promise.resolve({})
        },
      })

      await wrapper.get('button[aria-label="Mehr laden"]').trigger('click')

      await vi.waitFor(() => expect(membershipRequests).toHaveLength(2))
      expect(listRequests).toEqual(['user-1'])
      expect(membershipRequests).toEqual([firstPageIds, ['last']])
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

  describe('given the query contains a search', () => {
    it('shows it in the search input', async () => {
      const { wrapper } = await mountHomeView(createFetchProducts(['a']), '/?q=tofu')

      await vi.waitFor(() =>
        expect(wrapper.get<HTMLInputElement>('input[type="search"]').element.value).toBe('tofu'),
      )
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
