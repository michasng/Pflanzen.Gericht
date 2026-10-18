import { describe, expect, it, vi } from 'vitest'
import ProductMergeView from '@/views/ProductMergeView.vue'
import ProductForm from '@/components/ProductForm.vue'
import type { ProductEditingGateway } from '@/services/ProductEditingGateway'
import type { MergeProductsInput } from '@/services/mergeProducts'
import type { Product, ProductImage } from '@/types'
import type { ProductFormValues } from '@/types/productForm'
import { createFakeProductEditingGateway } from '@/__tests__/createFakeProductEditingGateway'
import { createProduct } from '@/__tests__/createProduct'
import { createProfile } from '@/__tests__/createProfile'
import { EmptyRouteComponent, mountView } from '@/__tests__/mountView'

const createImage = (id: string, productId: string): ProductImage => ({
  id,
  productId,
  storagePath: `${productId}/${id}`,
  sortOrder: 0,
  createdAt: '2026-09-11T00:00:00.000Z',
})

const EARLIER_PRODUCT = createProduct({
  id: 'product-1',
  name: 'Hafermilch',
  createdBy: 'user-1',
  createdAt: '2026-09-01T00:00:00.000Z',
})
const LATER_PRODUCT = createProduct({
  id: 'product-2',
  name: 'Haferdrink',
  createdBy: 'user-2',
  createdAt: '2026-09-02T00:00:00.000Z',
})

const PRODUCTS: Record<string, Product> = {
  [EARLIER_PRODUCT.id]: EARLIER_PRODUCT,
  [LATER_PRODUCT.id]: LATER_PRODUCT,
}

const PROFILES: Record<string, ReturnType<typeof createProfile>> = {
  'user-1': createProfile({ id: 'user-1', displayName: 'Anna' }),
  'user-2': createProfile({ id: 'user-2', username: 'ben' }),
}

const IMAGES: Record<string, ProductImage[]> = {
  'product-1': [createImage('image-1', 'product-1')],
  'product-2': [createImage('image-2', 'product-2'), createImage('image-3', 'product-2')],
}

const mountProductMergeView = (
  query = 'a=product-2&b=product-1',
  productEditing: Partial<ProductEditingGateway> = {},
) =>
  mountView({
    view: ProductMergeView,
    routes: [
      { path: '/merge', name: 'product-merge', component: EmptyRouteComponent },
      { path: '/product/:id', name: 'product-detail', component: EmptyRouteComponent },
    ],
    initialPath: `/merge?${query}`,
    gateways: {
      productEditing: createFakeProductEditingGateway({
        fetchProduct: (id) => Promise.resolve(PRODUCTS[id] ?? null),
        fetchProductImages: (id) => Promise.resolve(IMAGES[id] ?? []),
        fetchPublicProfile: (id) => Promise.resolve(PROFILES[id] ?? null),
        fetchProductActivityCounts: (id) =>
          Promise.resolve(
            id === 'product-1'
              ? { reviewsCount: 1, priceReportsCount: 2, similarityVotesCount: 0 }
              : { reviewsCount: 3, priceReportsCount: 1, similarityVotesCount: 5 },
          ),
        ...productEditing,
      }),
    },
  })

const findLoadedForm = async (productEditing: Partial<ProductEditingGateway> = {}) => {
  const { wrapper, router } = await mountProductMergeView(undefined, productEditing)
  const form = await vi.waitFor(() => wrapper.getComponent(ProductForm))
  // the view always passes complete values, while the prop type allows partial ones
  const initial = form.props('initial') as ProductFormValues
  return { wrapper, router, form, initial }
}

describe('ProductMergeView', () => {
  describe('given fewer than two different products are selected', () => {
    it.each(['a=product-1', 'a=product-1&b=product-1'])('shows an error for %s', async (query) => {
      const { wrapper } = await mountProductMergeView(query)

      await vi.waitFor(() =>
        expect(wrapper.get('[role="alert"]').text()).toBe(
          'Bitte wähle genau zwei verschiedene Produkte aus.',
        ),
      )
    })
  })

  describe('given a product does not exist', () => {
    it('shows a not found message', async () => {
      const { wrapper } = await mountProductMergeView('a=product-1&b=missing')

      await vi.waitFor(() =>
        expect(wrapper.get('[role="alert"]').text()).toBe('Produkt nicht gefunden.'),
      )
    })
  })

  describe('given two products are loaded', () => {
    it('labels the sides by owner, earlier product first', async () => {
      const { wrapper } = await findLoadedForm()

      const owners = wrapper.get('fieldset').findAll('label')
      expect(owners.map((owner) => owner.text())).toEqual(['Anna', 'ben'])
    })

    it('summarizes the activity per side', async () => {
      const { wrapper } = await findLoadedForm()

      expect(wrapper.text()).toContain('Anna: 1 Bewertung, 2 Preise, 0 Ähnliche Produkte')
      expect(wrapper.text()).toContain('ben: 3 Bewertungen, 1 Preis, 5 Ähnliche Produkte')
    })

    it('accepts all images of both products', async () => {
      const { wrapper } = await findLoadedForm()

      const checkboxes = wrapper.findAll<HTMLInputElement>(
        'input[type="checkbox"][aria-label^="Bild"]',
      )
      expect(checkboxes).toHaveLength(3)
      expect(checkboxes.every((checkbox) => checkbox.element.checked)).toBe(true)
    })
  })

  describe('when submitting without choosing an owner', () => {
    it('asks for an owner and does not merge', async () => {
      const mergeProducts = vi.fn<ProductEditingGateway['mergeProducts']>()
      const { wrapper, form, initial } = await findLoadedForm({ mergeProducts })

      form.vm.$emit('submit', initial)

      await vi.waitFor(() =>
        expect(wrapper.get('[role="alert"]').text()).toBe(
          'Bitte wähle aus, wer das zusammengeführte Produkt besitzt.',
        ),
      )
      expect(mergeProducts).not.toHaveBeenCalled()
    })
  })

  describe('when merging with an owner and one image rejected', () => {
    it('merges with the accepted images and opens the merged product', async () => {
      const inputs: MergeProductsInput[] = []
      const { wrapper, router, form, initial } = await findLoadedForm({
        mergeProducts: (input) => {
          inputs.push(input)
          return Promise.resolve(createProduct({ id: 'merged-1' }))
        },
      })

      await wrapper.get('input[type="radio"][name="owner"]:not(:checked)').setValue(true)
      await wrapper.get('input[aria-label="Bild 2 akzeptieren"]').setValue(false)
      form.vm.$emit('submit', initial)

      await vi.waitFor(() => expect(router.currentRoute.value.params.id).toBe('merged-1'))
      expect(inputs).toHaveLength(1)
      expect(inputs[0]).toMatchObject({
        productIds: ['product-1', 'product-2'],
        ownerId: 'user-1',
      })
      expect(inputs[0]?.acceptedImages.map((image) => image.id)).toEqual(['image-1', 'image-3'])
    })
  })

  describe('when merging fails', () => {
    it('shows the error and lets the user retry', async () => {
      const { wrapper, form, initial } = await findLoadedForm({
        mergeProducts: () => Promise.reject(new Error('offline')),
      })

      await wrapper.get('input[type="radio"][name="owner"]').setValue(true)
      form.vm.$emit('submit', initial)

      await vi.waitFor(() => expect(wrapper.get('[role="alert"]').text()).toBe('offline'))
      expect(form.props('submitting')).toBe(false)
    })
  })
})
