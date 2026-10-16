import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import type { ProductListItem } from '@/services/catalog'
import { createProductListItem } from '@/__tests__/createProductListItem'

const { fetchAllProductsForAdmin, fetchAllReviewsForAdmin, deleteProduct, push } = vi.hoisted(
  () => ({
    fetchAllProductsForAdmin: vi.fn<() => Promise<ProductListItem[]>>(),
    fetchAllReviewsForAdmin: vi.fn<() => Promise<never[]>>(),
    deleteProduct: vi.fn<(id: string) => Promise<void>>(),
    push: vi.fn<() => Promise<void>>(() => Promise.resolve()),
  }),
)

vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
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

const mountView = async (productIds: string[]): Promise<VueWrapper> => {
  fetchAllProductsForAdmin.mockResolvedValue(productIds.map(createProductListItem))
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
    push.mockClear()
  })

  describe('given loading fails', () => {
    it('shows the error', async () => {
      fetchAllProductsForAdmin.mockRejectedValue(new Error('offline'))
      fetchAllReviewsForAdmin.mockResolvedValue([])

      const wrapper = mount(AdminView)

      await vi.waitFor(() => expect(wrapper.text()).toContain('offline'))
    })
  })

  describe('when deleting the selected products after confirming', () => {
    it('deletes every selected product and removes them from the list', async () => {
      vi.stubGlobal('confirm', () => true)
      deleteProduct.mockResolvedValue(undefined)
      const wrapper = await mountView(['a', 'b', 'c'])
      await wrapper.get('[aria-label="Product a auswählen"]').setValue(true)
      await wrapper.get('[aria-label="Product c auswählen"]').setValue(true)

      await wrapper.get('[aria-label="Ausgewählte Produkte löschen"]').trigger('click')

      await vi.waitFor(() => expect(wrapper.text()).toContain('Produkte (1)'))
      expect(deleteProduct.mock.calls).toEqual([['a'], ['c']])
    })
  })

  describe('when merging two selected products', () => {
    it('navigates to the merge page with both products', async () => {
      const wrapper = await mountView(['a', 'b'])
      await wrapper.get('[aria-label="Product b auswählen"]').setValue(true)
      await wrapper.get('[aria-label="Product a auswählen"]').setValue(true)

      await wrapper.get('[aria-label="Produkte zusammenführen"]').trigger('click')

      expect(push).toHaveBeenCalledExactlyOnceWith({
        name: 'product-merge',
        query: { a: 'a', b: 'b' },
      })
    })
  })
})
