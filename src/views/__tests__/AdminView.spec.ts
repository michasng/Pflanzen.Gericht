import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import type { ProductListItem } from '@/services/catalog'

const { fetchAllProductsForAdmin, fetchAllReviewsForAdmin, deleteProduct } = vi.hoisted(() => ({
  fetchAllProductsForAdmin: vi.fn<() => Promise<ProductListItem[]>>(),
  fetchAllReviewsForAdmin: vi.fn<() => Promise<never[]>>(),
  deleteProduct: vi.fn<(id: string) => Promise<void>>(),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn<() => Promise<void>>(() => Promise.resolve()) }),
}))

vi.mock('@/services/products', () => ({
  ADMIN_PAGE_SIZE: 50,
  fetchAllProductsForAdmin,
  deleteProduct,
}))

vi.mock('@/services/reviews', () => ({
  ADMIN_PAGE_SIZE: 50,
  fetchAllReviewsForAdmin,
}))

vi.mock('@/services/profile', () => ({
  deleteReview: vi.fn<(id: string) => Promise<void>>(),
}))

import AdminView from '@/views/AdminView.vue'

const createProduct = (id: string): ProductListItem => ({
  allergens: [],
  avgOverall: null,
  barcode: null,
  base: null,
  brand: 'Alpro',
  category: 'drink',
  createdAt: '2026-09-11T00:00:00.000Z',
  createdBy: 'user-1',
  description: null,
  energyJoules: null,
  id,
  images: [],
  isOrganic: false,
  minPriceEuroCents: null,
  name: `Product ${id}`,
  normalizedName: null,
  reviewsCount: 0,
  tags: [],
  updatedAt: '2026-09-11T00:00:00.000Z',
})

const mountView = async (productIds: string[]): Promise<VueWrapper> => {
  fetchAllProductsForAdmin.mockResolvedValue(productIds.map(createProduct))
  fetchAllReviewsForAdmin.mockResolvedValue([])
  const wrapper = mount(AdminView, {
    global: { stubs: { RouterLink: true, StarDisplay: true } },
  })
  await vi.waitFor(() => expect(wrapper.find('input[type="checkbox"]').exists()).toBe(true))
  return wrapper
}

describe('AdminView', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    deleteProduct.mockReset()
  })

  describe('given no product is selected', () => {
    it('disables the delete button', async () => {
      const wrapper = await mountView(['a', 'b'])

      const button = wrapper.get('[aria-label="Ausgewählte Produkte löschen"]')

      expect(button.attributes('disabled')).toBeDefined()
    })
  })

  describe('given one product is selected', () => {
    it('enables the delete button and disables the merge button', async () => {
      const wrapper = await mountView(['a', 'b'])

      await wrapper.get('[aria-label="Product a auswählen"]').setValue(true)

      expect(
        wrapper.get('[aria-label="Ausgewählte Produkte löschen"]').attributes('disabled'),
      ).toBeUndefined()
      expect(
        wrapper.get('[aria-label="Produkte zusammenführen"]').attributes('disabled'),
      ).toBeDefined()
    })
  })

  describe('given two products are selected', () => {
    it('enables the merge button', async () => {
      const wrapper = await mountView(['a', 'b'])

      await wrapper.get('[aria-label="Product a auswählen"]').setValue(true)
      await wrapper.get('[aria-label="Product b auswählen"]').setValue(true)

      expect(
        wrapper.get('[aria-label="Produkte zusammenführen"]').attributes('disabled'),
      ).toBeUndefined()
    })
  })

  describe('when deleting the selected products after confirming', () => {
    it('deletes every selected product after a single confirmation', async () => {
      const confirmSpy = vi.fn<() => boolean>(() => true)
      vi.stubGlobal('confirm', confirmSpy)
      deleteProduct.mockResolvedValue(undefined)
      const wrapper = await mountView(['a', 'b', 'c'])
      await wrapper.get('[aria-label="Product a auswählen"]').setValue(true)
      await wrapper.get('[aria-label="Product c auswählen"]').setValue(true)

      await wrapper.get('[aria-label="Ausgewählte Produkte löschen"]').trigger('click')

      await vi.waitFor(() => expect(deleteProduct.mock.calls).toEqual([['a'], ['c']]))
      expect(confirmSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('when deleting the selected products without confirming', () => {
    it('deletes nothing', async () => {
      vi.stubGlobal('confirm', () => false)
      const wrapper = await mountView(['a'])
      await wrapper.get('[aria-label="Product a auswählen"]').setValue(true)

      await wrapper.get('[aria-label="Ausgewählte Produkte löschen"]').trigger('click')

      expect(deleteProduct).not.toHaveBeenCalled()
    })
  })
})
