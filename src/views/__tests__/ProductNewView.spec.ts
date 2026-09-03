import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ProductNewView from '@/views/ProductNewView.vue'

vi.mock('@/services/products', () => ({
  fetchIngredientNameSuggestions: vi.fn<() => Promise<string[]>>().mockResolvedValue([]),
  searchSimilarProducts: vi.fn<() => Promise<[]>>().mockResolvedValue([]),
  createProduct: vi.fn<() => Promise<{ id: string }>>(),
  uploadProductImage: vi.fn<() => Promise<never>>(),
  replaceProductIngredients: vi.fn<() => Promise<void>>(),
}))
vi.mock('@/services/catalog', () => ({
  getImageUrl: vi.fn<() => string>(),
}))

const routerPush = vi.fn<() => Promise<void>>()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: routerPush }),
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ user: { id: 'user-1' } }),
}))

import { createProduct, replaceProductIngredients } from '@/services/products'

const flushPromises = (): Promise<void> => new Promise((resolve) => setTimeout(resolve))

describe('ProductNewView', () => {
  beforeEach(() => {
    vi.mocked(createProduct).mockReset()
    vi.mocked(replaceProductIngredients).mockReset()
    routerPush.mockClear()
  })

  describe('given saving the ingredients fails unexpectedly', () => {
    it('shows the error message instead of failing silently', async () => {
      vi.mocked(createProduct).mockResolvedValue({ id: 'product-1' } as never)
      vi.mocked(replaceProductIngredients).mockRejectedValue(
        new Error('duplicate key value violates unique constraint'),
      )
      const wrapper = mount(ProductNewView, {
        global: { stubs: { RouterLink: true } },
      })

      await wrapper.find('#pf-name').setValue('Hafermilch Original')
      await wrapper.find('#pf-category').setValue('milk')
      await wrapper.find('button:not([type="submit"])').trigger('click')
      const nameInput = wrapper.find('input[list="pf-ingredient-suggestions"]')
      await nameInput.setValue('Hafer')
      await wrapper.find('form').trigger('submit.prevent')
      await flushPromises()

      expect(wrapper.text()).toContain('duplicate key value violates unique constraint')
      expect(routerPush).not.toHaveBeenCalled()
    })
  })
})
