import { describe, expect, it, vi } from 'vitest'
import type { ProductEditingGateway } from '@/services/ProductEditingGateway'
import { useAuthStore } from '@/stores/auth'
import ProductEditView from '@/views/ProductEditView.vue'
import ProductForm from '@/components/ProductForm.vue'
import type { ProductFormValues } from '@/types/productForm'
import type { ProductIngredient, ProductNutrient } from '@/types'
import { createDeferred, type Deferred } from '@/__tests__/createDeferred'
import { createFakeAuthGateway } from '@/__tests__/createFakeAuthGateway'
import { createFakeProductEditingGateway } from '@/__tests__/createFakeProductEditingGateway'
import { createProduct } from '@/__tests__/createProduct'
import { createProfile } from '@/__tests__/createProfile'
import { createSession } from '@/__tests__/createSession'
import { EmptyRouteComponent, mountView } from '@/__tests__/mountView'

const OWNER_ID = 'user-1'
const OTHER_USER_ID = 'user-2'

const createIngredient = (name: string): ProductIngredient => ({
  id: name,
  productId: 'product-1',
  name,
  fractionBasisPoints: null,
  comparator: '=',
  sortOrder: 0,
  createdAt: '2026-09-11T00:00:00.000Z',
})

const createNutrient = (name: string): ProductNutrient => ({
  id: name,
  productId: 'product-1',
  name,
  amountMicrograms: 1000,
  createdAt: '2026-09-11T00:00:00.000Z',
})

interface MountOptions {
  signedInUserId?: string
  isAdmin?: boolean
  productEditing?: Partial<ProductEditingGateway>
}

// The view decides about access while loading, so loading waits for the signed-in user.
const gateUntilAuthReady = (
  gateway: ProductEditingGateway,
  authReady: Deferred<void>,
): ProductEditingGateway => ({
  ...gateway,
  fetchProduct: (productId) => authReady.promise.then(() => gateway.fetchProduct(productId)),
})

const mountProductEditView = async ({
  signedInUserId = OWNER_ID,
  isAdmin = false,
  productEditing = {},
}: MountOptions = {}) => {
  const authReady = createDeferred<void>()
  const mounted = await mountView({
    view: ProductEditView,
    routes: [
      { path: '/product/:id', name: 'product-detail', component: EmptyRouteComponent },
      { path: '/product/:id/edit', name: 'product-edit', component: EmptyRouteComponent },
    ],
    initialPath: '/product/product-1/edit',
    gateways: {
      productEditing: gateUntilAuthReady(
        createFakeProductEditingGateway({
          fetchProduct: () => Promise.resolve(createProduct({ createdBy: OWNER_ID })),
          fetchProductIngredients: () =>
            Promise.resolve([createIngredient('Hafer'), createIngredient('Wasser')]),
          fetchProductNutrients: () =>
            Promise.resolve([createNutrient('Fett'), createNutrient('Eiweiß')]),
          fetchProductSources: () =>
            Promise.resolve([
              {
                id: 'source-1',
                productId: 'product-1',
                url: 'https://a.example',
                createdAt: '2026-09-11T00:00:00.000Z',
              },
              {
                id: 'source-2',
                productId: 'product-1',
                url: 'https://b.example',
                createdAt: '2026-09-11T00:00:00.000Z',
              },
            ]),
          ...productEditing,
        }),
        authReady,
      ),
      auth: createFakeAuthGateway({
        getSession: () => Promise.resolve(createSession(signedInUserId)),
        fetchProfile: () => Promise.resolve(createProfile({ id: signedInUserId, isAdmin })),
      }),
    },
    stubs: { ProductForm: true },
  })
  await useAuthStore().init()
  authReady.resolve()
  return mounted
}

const findLoadedForm = async (options: MountOptions = {}) => {
  const { wrapper, router } = await mountProductEditView(options)
  const form = await vi.waitFor(() => wrapper.getComponent(ProductForm))
  // the view always passes complete values, while the prop type allows partial ones
  const initial = form.props('initial') as ProductFormValues
  return { wrapper, router, form, initial }
}

describe('ProductEditView', () => {
  describe('given the product does not exist', () => {
    it('shows a not found message', async () => {
      const { wrapper } = await mountProductEditView({
        productEditing: { fetchProduct: () => Promise.resolve(null) },
      })

      await vi.waitFor(() =>
        expect(wrapper.get('[role="alert"]').text()).toBe('Produkt nicht gefunden.'),
      )
    })
  })

  describe('given the user is neither creator nor admin', () => {
    it('redirects to the product', async () => {
      const { router } = await mountProductEditView({ signedInUserId: OTHER_USER_ID })

      await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('product-detail'))
    })
  })

  describe('given the creator opens the form', () => {
    it('fills the form with the stored product', async () => {
      const { initial } = await findLoadedForm()

      expect(initial.name).toBe('Hafermilch')
      expect(initial.ingredients.map((ingredient) => ingredient.name)).toEqual(['Hafer', 'Wasser'])
      expect(initial.sourceUrls).toEqual(['https://a.example', 'https://b.example'])
    })
  })

  describe('when only the order of ingredients, nutrients and sources changes', () => {
    it('saves nothing but opens the product', async () => {
      const writes: string[] = []
      const { router, form, initial } = await findLoadedForm({
        productEditing: {
          updateProduct: () => Promise.resolve(void writes.push('product')),
          replaceProductIngredients: () => Promise.resolve(void writes.push('ingredients')),
          replaceProductNutrients: () => Promise.resolve(void writes.push('nutrients')),
          replaceProductSources: () => Promise.resolve(void writes.push('sources')),
        },
      })

      form.vm.$emit('submit', {
        ...initial,
        ingredients: [...initial.ingredients].reverse(),
        nutrients: [...initial.nutrients].reverse(),
        sourceUrls: [...initial.sourceUrls].reverse(),
      })

      await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('product-detail'))
      expect(writes).toEqual([])
    })
  })

  describe('when the name and the sources change', () => {
    it('saves only the changed parts', async () => {
      const writes: string[] = []
      const { router, form, initial } = await findLoadedForm({
        productEditing: {
          updateProduct: () => Promise.resolve(void writes.push('product')),
          replaceProductIngredients: () => Promise.resolve(void writes.push('ingredients')),
          replaceProductNutrients: () => Promise.resolve(void writes.push('nutrients')),
          replaceProductSources: () => Promise.resolve(void writes.push('sources')),
        },
      })

      form.vm.$emit('submit', { ...initial, name: 'Sojamilch', sourceUrls: ['https://c.example'] })

      await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('product-detail'))
      expect(writes).toEqual(['product', 'sources'])
    })
  })

  describe('when saving fails', () => {
    it('shows the error and lets the user retry', async () => {
      const { wrapper, form, initial } = await findLoadedForm({
        productEditing: { updateProduct: () => Promise.reject(new Error('offline')) },
      })

      form.vm.$emit('submit', { ...initial, name: 'Sojamilch' })

      await vi.waitFor(() => expect(wrapper.get('[role="alert"]').text()).toBe('offline'))
      expect(form.props('submitting')).toBe(false)
    })
  })
})
