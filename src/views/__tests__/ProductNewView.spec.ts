import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ProductNewView from '@/views/ProductNewView.vue'
import type { Product, ProductImage, ProductIngredientInsert, ProductInsert } from '@/types'

vi.mock('@/services/products', () => ({
  fetchIngredientNameSuggestions: vi.fn<() => Promise<string[]>>().mockResolvedValue([]),
  searchSimilarProducts: vi
    .fn<(name: string) => Promise<Pick<Product, 'id' | 'name' | 'brand' | 'category'>[]>>()
    .mockResolvedValue([]),
  createProduct: vi
    .fn<
      (
        fields: Pick<ProductInsert, 'name' | 'category' | 'base' | 'brand' | 'description'>,
        userId: string,
      ) => Promise<Product>
    >(),
  uploadProductImage: vi
    .fn<
      (productId: string, userId: string, file: File, sortOrder: number) => Promise<ProductImage>
    >(),
  replaceProductIngredients: vi
    .fn<
      (
        productId: string,
        ingredients: Pick<ProductIngredientInsert, 'name' | 'percentage' | 'comparator'>[],
      ) => Promise<void>
    >(),
}))
vi.mock('@/services/catalog', () => ({
  getImageUrl: vi.fn<(bucket: string, path: string) => string>(),
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
const createdProduct: Product = {
  avg_overall: null,
  base: null,
  brand: null,
  category: 'milk',
  created_at: '2026-09-03T00:00:00Z',
  created_by: 'user-1',
  description: null,
  id: 'product-1',
  min_price_euro_cents: null,
  name: 'Hafermilch Original',
  normalized_name: 'hafermilch original',
  ratings_count: 0,
  tags: [],
  updated_at: '2026-09-03T00:00:00Z',
}

describe('ProductNewView', () => {
  beforeEach(() => {
    vi.mocked(createProduct).mockReset()
    vi.mocked(replaceProductIngredients).mockReset()
    routerPush.mockClear()
  })

  describe('given saving the ingredients fails unexpectedly', () => {
    it('shows the error message instead of failing silently', async () => {
      vi.mocked(createProduct).mockResolvedValue(createdProduct)
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
