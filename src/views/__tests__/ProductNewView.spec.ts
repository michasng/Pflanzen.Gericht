import { describe, expect, it, vi } from 'vitest'
import type { ProductEditingGateway } from '@/services/ProductEditingGateway'
import { QuantityUnit } from '@/config/quantity'
import { CELEBRATION_QUERY_KEY } from '@/lib/celebrationQueryKey'
import { useAuthStore } from '@/stores/auth'
import ProductNewView from '@/views/ProductNewView.vue'
import ProductForm from '@/components/ProductForm.vue'
import type { ProductFormValues } from '@/types/productForm'
import { createFakeAuthGateway } from '@/__tests__/createFakeAuthGateway'
import { createFakeProductEditingGateway } from '@/__tests__/createFakeProductEditingGateway'
import { createProduct } from '@/__tests__/createProduct'
import { createSession } from '@/__tests__/createSession'
import { EmptyRouteComponent, mountView } from '@/__tests__/mountView'

const USER_ID = 'user-1'

const formValues: ProductFormValues = {
  name: 'Hafermilch',
  category: 'drink',
  base: null,
  brand: 'Alpro',
  description: null,
  energyJoules: null,
  allergens: [],
  isOrganic: false,
  barcode: null,
  quantityUnit: QuantityUnit.Piece,
  quantityValue: 1,
  ingredients: [],
  nutrients: [],
  sourceUrls: ['https://example.com'],
}

const mountProductNewView = async (productEditing: Partial<ProductEditingGateway>) => {
  const mounted = await mountView({
    view: ProductNewView,
    routes: [
      { path: '/product/new', name: 'product-new', component: EmptyRouteComponent },
      { path: '/product/:id', name: 'product-detail', component: EmptyRouteComponent },
    ],
    initialPath: '/product/new',
    gateways: {
      productEditing: createFakeProductEditingGateway(productEditing),
      auth: createFakeAuthGateway({ getSession: () => Promise.resolve(createSession(USER_ID)) }),
    },
    stubs: { ProductForm: true },
  })
  await useAuthStore().init()
  return mounted
}

describe('ProductNewView', () => {
  describe('when the product is submitted', () => {
    it('creates the product with its sources and opens it', async () => {
      const writtenSources: { productId: string; urls: string[] }[] = []
      const { wrapper, router } = await mountProductNewView({
        createProduct: () => Promise.resolve(createProduct({ id: 'new-product' })),
        replaceProductSources: (productId, urls) => {
          writtenSources.push({ productId, urls })
          return Promise.resolve()
        },
      })
      const form = await vi.waitFor(() => wrapper.getComponent(ProductForm))

      form.vm.$emit('submit', formValues)

      await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('product-detail'))
      expect(router.currentRoute.value.params.id).toBe('new-product')
      expect(router.currentRoute.value.query).toEqual({ [CELEBRATION_QUERY_KEY]: '1' })
      expect(writtenSources).toEqual([{ productId: 'new-product', urls: ['https://example.com'] }])
    })
  })

  describe('when saving fails', () => {
    it('shows the error and lets the user retry', async () => {
      const { wrapper } = await mountProductNewView({
        createProduct: () => Promise.reject(new Error('offline')),
      })
      const form = await vi.waitFor(() => wrapper.getComponent(ProductForm))

      form.vm.$emit('submit', formValues)

      await vi.waitFor(() => expect(wrapper.get('[role="alert"]').text()).toBe('offline'))
      expect(form.props('submitting')).toBe(false)
    })
  })
})
