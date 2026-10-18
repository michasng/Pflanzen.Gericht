import { afterEach, describe, expect, it, vi } from 'vitest'
import type { VueWrapper } from '@vue/test-utils'
import type { Router } from 'vue-router'
import type { AdminGateway } from '@/services/AdminGateway'
import AdminView from '@/views/AdminView.vue'
import { createProductListItem } from '@/__tests__/createProductListItem'
import { SEARCH_DEBOUNCE_MILLISECONDS } from '@/config/catalogSearch'
import { EmptyRouteComponent, mountView } from '@/__tests__/mountView'

const PAGE_SIZE = 50

const createFakeAdminGateway = (overrides: Partial<AdminGateway> = {}): AdminGateway => ({
  productPageSize: PAGE_SIZE,
  reviewPageSize: PAGE_SIZE,
  fetchProductsPage: () => Promise.resolve([]),
  fetchReviewsPage: () => Promise.resolve([]),
  deleteProduct: () => Promise.resolve(),
  deleteReview: () => Promise.resolve(),
  ...overrides,
})

const mountAdminView = (admin: AdminGateway) =>
  mountView({
    view: AdminView,
    routes: [
      { path: '/admin', name: 'admin', component: EmptyRouteComponent },
      { path: '/product-merge', name: 'product-merge', component: EmptyRouteComponent },
      { path: '/product/:id', name: 'product-detail', component: EmptyRouteComponent },
      { path: '/product/:id/edit', name: 'product-edit', component: EmptyRouteComponent },
    ],
    initialPath: '/admin',
    gateways: { admin },
    stubs: { StarDisplay: true },
  })

const mountWithProducts = async (
  productIds: string[],
  overrides: Partial<AdminGateway> = {},
): Promise<{ wrapper: VueWrapper; router: Router }> => {
  const mounted = await mountAdminView(
    createFakeAdminGateway({
      fetchProductsPage: () => Promise.resolve(productIds.map(createProductListItem)),
      ...overrides,
    }),
  )
  await vi.waitFor(() => expect(mounted.wrapper.find('input[type="checkbox"]').exists()).toBe(true))
  return mounted
}

describe('AdminView', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  describe('when searching for products', () => {
    it('shows the matching products and keeps selected ones that are hidden', async () => {
      const fetchProductsPage = vi
        .fn<AdminGateway['fetchProductsPage']>()
        .mockImplementation((_page, search) =>
          Promise.resolve([createProductListItem(search === 'milk' ? 'c' : 'a')]),
        )
      const { wrapper } = await mountWithProducts(['a'], { fetchProductsPage })
      await wrapper.get('[aria-label="Product a auswählen"]').setValue(true)
      vi.useFakeTimers()

      await wrapper.get('input[type="search"]').setValue('milk')
      await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MILLISECONDS)

      await vi.waitFor(() =>
        expect(wrapper.find('[aria-label="Product c auswählen"]').exists()).toBe(true),
      )
      expect(fetchProductsPage).toHaveBeenLastCalledWith(0, 'milk')
      expect(wrapper.text()).toContain('Ausgewählt (1)')
      expect(wrapper.find('[aria-label="Product a auswählen"]').exists()).toBe(true)
    })

    it('merges a selected product hidden by the search with another result', async () => {
      const fetchProductsPage = vi
        .fn<AdminGateway['fetchProductsPage']>()
        .mockImplementation((_page, search) =>
          Promise.resolve([createProductListItem(search === 'milk' ? 'c' : 'a')]),
        )
      const { wrapper, router } = await mountWithProducts(['a'], { fetchProductsPage })
      await wrapper.get('[aria-label="Product a auswählen"]').setValue(true)
      vi.useFakeTimers()
      await wrapper.get('input[type="search"]').setValue('milk')
      await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MILLISECONDS)
      await vi.waitFor(() =>
        expect(wrapper.find('[aria-label="Product c auswählen"]').exists()).toBe(true),
      )
      await wrapper.get('[aria-label="Product c auswählen"]').setValue(true)

      await wrapper.get('[aria-label="Produkte zusammenführen"]').trigger('click')

      await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('product-merge'))
      expect(router.currentRoute.value.query).toEqual({ a: 'a', b: 'c' })
    })
  })

  describe('given loading fails', () => {
    it('shows the error', async () => {
      const { wrapper } = await mountAdminView(
        createFakeAdminGateway({ fetchProductsPage: () => Promise.reject(new Error('offline')) }),
      )

      await vi.waitFor(() => expect(wrapper.text()).toContain('offline'))
    })
  })

  describe('when deleting the selected products after confirming', () => {
    it('deletes every selected product and removes them from the list', async () => {
      vi.stubGlobal('confirm', () => true)
      const deletedIds: string[] = []
      const { wrapper } = await mountWithProducts(['a', 'b', 'c'], {
        deleteProduct: (id) => {
          deletedIds.push(id)
          return Promise.resolve()
        },
      })
      await wrapper.get('[aria-label="Product a auswählen"]').setValue(true)
      await wrapper.get('[aria-label="Product c auswählen"]').setValue(true)

      await wrapper.get('[aria-label="Ausgewählte Produkte löschen"]').trigger('click')

      await vi.waitFor(() => expect(wrapper.text()).toContain('Produkte (1)'))
      expect(deletedIds).toEqual(['a', 'c'])
    })
  })

  describe('given deleting a product fails', () => {
    it('shows the error on the page and keeps the product', async () => {
      vi.stubGlobal('confirm', () => true)
      const { wrapper } = await mountWithProducts(['a'], {
        deleteProduct: () => Promise.reject(new Error('denied')),
      })

      await wrapper.get('[aria-label="Produkt löschen"]').trigger('click')

      await vi.waitFor(() => expect(wrapper.get('[role="alert"]').text()).toBe('denied'))
      expect(wrapper.text()).toContain('Produkte (1)')
    })
  })

  describe('given loading more products fails', () => {
    it('shows the error on the page', async () => {
      const fetchProductsPage = vi
        .fn<AdminGateway['fetchProductsPage']>()
        .mockResolvedValueOnce([createProductListItem('a')])
        .mockRejectedValueOnce(new Error('offline'))
      const { wrapper } = await mountWithProducts(['a'], { productPageSize: 1, fetchProductsPage })

      await wrapper.get('[aria-label="Mehr Produkte laden"]').trigger('click')

      await vi.waitFor(() => expect(wrapper.get('[role="alert"]').text()).toBe('offline'))
    })
  })

  describe('when merging two selected products', () => {
    it('navigates to the merge page with the older product first', async () => {
      const olderProduct = {
        ...createProductListItem('a'),
        createdAt: '2026-01-01T00:00:00.000Z',
      }
      const { wrapper, router } = await mountWithProducts(['a', 'b'], {
        fetchProductsPage: () => Promise.resolve([createProductListItem('b'), olderProduct]),
      })
      await wrapper.get('[aria-label="Product b auswählen"]').setValue(true)
      await wrapper.get('[aria-label="Product a auswählen"]').setValue(true)

      await wrapper.get('[aria-label="Produkte zusammenführen"]').trigger('click')

      await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('product-merge'))
      expect(router.currentRoute.value.query).toEqual({ a: 'a', b: 'b' })
    })
  })
})
