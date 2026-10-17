import { afterEach, describe, expect, it, vi } from 'vitest'
import type { VueWrapper } from '@vue/test-utils'
import type { Router } from 'vue-router'
import type { ProductDetail, ReviewWithDetails } from '@/services/catalog'
import type { ProductDetailGateway } from '@/services/ProductDetailGateway'
import { useAuthStore } from '@/stores/auth'
import ProductDetailView from '@/views/ProductDetailView.vue'
import PriceReportForm from '@/components/PriceReportForm.vue'
import { createDeferred } from '@/__tests__/createDeferred'
import { createFakeAuthGateway } from '@/__tests__/createFakeAuthGateway'
import { createFakeProductDetailGateway } from '@/__tests__/createFakeProductDetailGateway'
import { createPriceReport } from '@/__tests__/createPriceReport'
import { createProductDetail } from '@/__tests__/createProductDetail'
import { createSession } from '@/__tests__/createSession'
import { EmptyRouteComponent, mountView } from '@/__tests__/mountView'

const OWNER_ID = 'user-1'
const OTHER_USER_ID = 'user-2'

const createReview = (overrides: Partial<ReviewWithDetails>): ReviewWithDetails => ({
  id: 'review-1',
  productId: 'product-1',
  userId: OTHER_USER_ID,
  overall: 4,
  taste: null,
  consistency: null,
  appearance: null,
  nutrition: null,
  value: null,
  comment: null,
  isCurrent: true,
  createdAt: '2026-09-11T00:00:00.000Z',
  updatedAt: '2026-09-11T00:00:00.000Z',
  profile: { username: 'someone', displayName: null },
  tags: [],
  images: [],
  ...overrides,
})

interface MountOptions {
  productDetail: ProductDetailGateway
  signedInUserId?: string
}

const mountProductDetailView = async ({
  productDetail,
  signedInUserId,
}: MountOptions): Promise<{ wrapper: VueWrapper; router: Router }> => {
  const mounted = await mountView({
    view: ProductDetailView,
    routes: [
      { path: '/', name: 'home', component: EmptyRouteComponent },
      { path: '/login', name: 'login', component: EmptyRouteComponent },
      { path: '/product/:id', name: 'product-detail', component: EmptyRouteComponent },
      { path: '/product/:id/edit', name: 'product-edit', component: EmptyRouteComponent },
      { path: '/product/:id/review', name: 'review-new', component: EmptyRouteComponent },
    ],
    initialPath: '/product/product-1',
    gateways: {
      productDetail,
      auth: createFakeAuthGateway({
        getSession: () => Promise.resolve(signedInUserId ? createSession(signedInUserId) : null),
      }),
    },
    stubs: {
      AppLogo: true,
      PriceReportForm: true,
      ReviewCard: true,
      SimilarProductsSection: true,
      StarDisplay: true,
    },
  })
  await useAuthStore().init()
  return mounted
}

const mountWithProduct = (
  product: ProductDetail,
  options: { signedInUserId?: string; gateway?: Partial<ProductDetailGateway> } = {},
) =>
  mountProductDetailView({
    signedInUserId: options.signedInUserId,
    productDetail: createFakeProductDetailGateway({
      fetchProductDetail: () => Promise.resolve(product),
      ...options.gateway,
    }),
  })

const findButtonByText = (wrapper: VueWrapper, text: string) =>
  vi.waitFor(() => {
    const found = wrapper.findAll('button').find((button) => button.text().includes(text))
    expect(found).toBeDefined()
    return found
  })

describe('ProductDetailView', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('given the product does not exist', () => {
    it('shows a not found message with a link back to the overview', async () => {
      const { wrapper } = await mountProductDetailView({
        productDetail: createFakeProductDetailGateway(),
      })

      await vi.waitFor(() => expect(wrapper.text()).toContain('Produkt nicht gefunden.'))
      expect(wrapper.get('a[href="/"]').text()).toBe('Zurück zur Übersicht')
    })
  })

  describe('given loading fails', () => {
    it('shows the error', async () => {
      const { wrapper } = await mountProductDetailView({
        productDetail: createFakeProductDetailGateway({
          fetchProductDetail: () => Promise.reject(new Error('offline')),
        }),
      })

      await vi.waitFor(() => expect(wrapper.get('[role="alert"]').text()).toBe('offline'))
    })
  })

  describe('given a product with details', () => {
    it('shows chips, title with quantity, brand and description', async () => {
      const { wrapper } = await mountWithProduct({
        ...createProductDetail('product-1', 'Hafermilch'),
        isOrganic: true,
        description: 'Cremig',
        barcode: '4000000000000',
      })

      await vi.waitFor(() => expect(wrapper.get('h1').text()).toBe('Hafermilch, 1 St'))
      expect(wrapper.text()).toContain('von Alpro')
      expect(wrapper.text()).toContain('Cremig')
      expect(wrapper.text()).toContain('Bio')
      expect(wrapper.text()).toContain('Barcode: 4000000000000')
    })

    it('lists ingredients ordered by share', async () => {
      const ingredient = (id: string, name: string, fractionBasisPoints: number | null) => ({
        id,
        name,
        fractionBasisPoints,
        comparator: 'exactly',
        productId: 'product-1',
        createdAt: '',
      })
      const { wrapper } = await mountWithProduct({
        ...createProductDetail('product-1', 'Hafermilch'),
        ingredients: [
          ingredient('a', 'Salz', 100),
          ingredient('b', 'Wasser', 8000),
          ingredient('c', 'Dinkel', 1000),
        ],
      })

      await vi.waitFor(() => expect(wrapper.text()).toContain('Zutaten'))
      const text = wrapper.text()
      expect(text.indexOf('Wasser')).toBeLessThan(text.indexOf('Dinkel'))
      expect(text.indexOf('Dinkel')).toBeLessThan(text.indexOf('Salz'))
    })

    it('indents sub-nutrients under their parent', async () => {
      const nutrient = (id: string, name: string) => ({
        id,
        name,
        amountMicrograms: 1_000_000,
        productId: 'product-1',
        createdAt: '',
      })
      const { wrapper } = await mountWithProduct({
        ...createProductDetail('product-1', 'Hafermilch'),
        nutrients: [
          nutrient('1', 'Zugesetzter Zucker'),
          nutrient('2', 'Kohlenhydrate'),
          nutrient('3', 'Zucker'),
        ],
      })

      await vi.waitFor(() => expect(wrapper.text()).toContain('Nährwerte'))
      const labelCells = wrapper.findAll('td:first-child')
      expect(labelCells.map((cell) => cell.text())).toEqual([
        'Kohlenhydrate',
        'davon Zucker',
        'davon Zugesetzter Zucker',
      ])
      expect(labelCells[0]?.classes()).not.toContain('pl-4')
      expect(labelCells[1]?.classes()).toContain('pl-4')
      expect(labelCells[2]?.classes()).toContain('pl-8')
    })

    it('shows the criterion averages of current reviews only', async () => {
      const { wrapper } = await mountWithProduct({
        ...createProductDetail('product-1', 'Hafermilch'),
        reviewsCount: 3,
        reviews: [
          createReview({ id: 'a', taste: 5, value: 2 }),
          createReview({ id: 'b', taste: 3 }),
          createReview({ id: 'c', taste: 1, isCurrent: false }),
        ],
      })

      await vi.waitFor(() => expect(wrapper.text()).toContain('Geschmack'))
      expect(wrapper.text()).toContain('4.0')
      expect(wrapper.text()).toContain('Preis-Leistung')
      expect(wrapper.text()).not.toContain('Konsistenz')
    })
  })

  describe('given a product with sources', () => {
    it('links each source by its shortened hostname', async () => {
      const sourceUrl = 'https://www.rewe.de/shop/p/nutella/9946679'
      const { wrapper } = await mountWithProduct({
        ...createProductDetail('product-1', 'First Product'),
        sources: [{ id: 'source-1', productId: 'product-1', url: sourceUrl, createdAt: '' }],
      })

      const link = await vi.waitFor(() => {
        const found = wrapper.find(`a[href="${sourceUrl}"]`)
        expect(found.exists()).toBe(true)
        return found
      })
      expect(link.text()).toBe('rewe.de')
      wrapper.unmount()
    })
  })

  describe('given a visitor who is not signed in', () => {
    it('offers to sign in for rating and for entering prices', async () => {
      const { wrapper } = await mountWithProduct(createProductDetail('product-1', 'Hafermilch'))

      await vi.waitFor(() => expect(wrapper.text()).toContain('Anmelden zum Bewerten'))
      expect(wrapper.text()).toContain('Noch keine Preise eingetragen.')
      expect(wrapper.text()).toContain('zum Eintragen.')
      expect(wrapper.text()).not.toContain('Preis eintragen')
      expect(wrapper.text()).not.toContain('Löschen')
    })
  })

  describe('given the signed-in owner of the product', () => {
    it('offers rating, editing and deleting', async () => {
      const { wrapper } = await mountWithProduct(createProductDetail('product-1', 'Hafermilch'), {
        signedInUserId: OWNER_ID,
      })

      await vi.waitFor(() => expect(wrapper.text()).toContain('Produkt bewerten'))
      expect(wrapper.text()).toContain('Bearbeiten')
      expect(wrapper.text()).toContain('Löschen')
    })

    it('when deleting after confirming then deletes the product and returns to the overview', async () => {
      vi.stubGlobal('confirm', () => true)
      const deletedIds: string[] = []
      const { wrapper, router } = await mountWithProduct(
        createProductDetail('product-1', 'Hafermilch'),
        {
          signedInUserId: OWNER_ID,
          gateway: {
            deleteProduct: (id) => {
              deletedIds.push(id)
              return Promise.resolve()
            },
          },
        },
      )

      await (await findButtonByText(wrapper, 'Löschen'))?.trigger('click')

      await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('home'))
      expect(deletedIds).toEqual(['product-1'])
    })

    it('when deleting without confirming then keeps the product', async () => {
      vi.stubGlobal('confirm', () => false)
      const deletedIds: string[] = []
      const { wrapper } = await mountWithProduct(createProductDetail('product-1', 'Hafermilch'), {
        signedInUserId: OWNER_ID,
        gateway: {
          deleteProduct: (id) => {
            deletedIds.push(id)
            return Promise.resolve()
          },
        },
      })

      await (await findButtonByText(wrapper, 'Löschen'))?.trigger('click')

      expect(deletedIds).toEqual([])
    })
  })

  describe('given a signed-in visitor entering a price', () => {
    const submitPrice = async (wrapper: VueWrapper): Promise<void> => {
      await (await findButtonByText(wrapper, 'Preis eintragen'))?.trigger('click')
      wrapper.getComponent(PriceReportForm).vm.$emit('submit', {
        store: 'Rewe',
        cityName: 'Berlin',
        priceEuroCents: 249,
        salePriceEuroCents: null,
        observedAt: '2026-09-12',
      })
    }

    it('when saving then lists the report and closes the form', async () => {
      const saved = createPriceReport({
        id: 'new',
        userId: OTHER_USER_ID,
        priceEuroCents: 249,
        effectivePriceEuroCents: 249,
      })
      const { wrapper } = await mountWithProduct(createProductDetail('product-1', 'Hafermilch'), {
        signedInUserId: OTHER_USER_ID,
        gateway: { upsertPriceReport: () => Promise.resolve(saved) },
      })

      await submitPrice(wrapper)

      await vi.waitFor(() => expect(wrapper.text()).toMatch(/Preise\s+\(1\)/))
      expect(wrapper.text()).toContain('2,49')
      expect(wrapper.findComponent(PriceReportForm).exists()).toBe(false)
    })

    it('when saving again for the same store and city then replaces the earlier report', async () => {
      const earlier = createPriceReport({ id: 'old', userId: OTHER_USER_ID })
      const replacement = createPriceReport({
        id: 'new',
        userId: OTHER_USER_ID,
        priceEuroCents: 249,
        effectivePriceEuroCents: 249,
      })
      const { wrapper } = await mountWithProduct(
        { ...createProductDetail('product-1', 'Hafermilch'), priceReports: [earlier] },
        {
          signedInUserId: OTHER_USER_ID,
          gateway: { upsertPriceReport: () => Promise.resolve(replacement) },
        },
      )

      await submitPrice(wrapper)

      await vi.waitFor(() => expect(wrapper.text()).toContain('2,49'))
      expect(wrapper.text()).toMatch(/Preise\s+\(1\)/)
    })

    it('when saving fails then shows the error and keeps the form', async () => {
      const { wrapper } = await mountWithProduct(createProductDetail('product-1', 'Hafermilch'), {
        signedInUserId: OTHER_USER_ID,
        gateway: { upsertPriceReport: () => Promise.reject(new Error('no permission')) },
      })

      await submitPrice(wrapper)

      await vi.waitFor(() => expect(wrapper.get('[role="alert"]').text()).toBe('no permission'))
      expect(wrapper.findComponent(PriceReportForm).exists()).toBe(true)
    })
  })

  describe('given own and foreign price reports', () => {
    const createReports = () => [
      createPriceReport({ id: 'own', userId: OTHER_USER_ID, store: 'Edeka' }),
      createPriceReport({ id: 'foreign', userId: OWNER_ID, store: 'Lidl' }),
    ]

    it('lets a visitor delete only their own report', async () => {
      const deletedIds: string[] = []
      const { wrapper } = await mountWithProduct(
        { ...createProductDetail('product-1', 'Hafermilch'), priceReports: createReports() },
        {
          signedInUserId: OTHER_USER_ID,
          gateway: {
            deletePriceReport: (id) => {
              deletedIds.push(id)
              return Promise.resolve()
            },
          },
        },
      )
      const deleteButton = await vi.waitFor(() => {
        const buttons = wrapper.findAll('[aria-label="Eintrag löschen"]')
        expect(buttons).toHaveLength(1)
        return buttons[0]
      })

      await deleteButton?.trigger('click')

      await vi.waitFor(() => expect(wrapper.text()).toMatch(/Preise\s+\(1\)/))
      expect(deletedIds).toEqual(['own'])
      expect(wrapper.text()).toContain('Lidl')
      expect(wrapper.text()).not.toContain('Edeka')
    })

    it('when deleting fails then shows the error and keeps the report', async () => {
      const { wrapper } = await mountWithProduct(
        { ...createProductDetail('product-1', 'Hafermilch'), priceReports: createReports() },
        {
          signedInUserId: OTHER_USER_ID,
          gateway: { deletePriceReport: () => Promise.reject(new Error('no permission')) },
        },
      )
      const deleteButton = await vi.waitFor(() => {
        const found = wrapper.find('[aria-label="Eintrag löschen"]')
        expect(found.exists()).toBe(true)
        return found
      })

      await deleteButton.trigger('click')

      await vi.waitFor(() => expect(wrapper.get('[role="alert"]').text()).toBe('no permission'))
      expect(wrapper.text()).toContain('Edeka')
    })
  })

  describe('given a slower previous request resolves after navigation', () => {
    it('when the newer request finishes first then it keeps the newer product visible', async () => {
      const requestsById = new Map([
        ['product-1', createDeferred<ProductDetail | null>()],
        ['product-2', createDeferred<ProductDetail | null>()],
      ])
      const requestedIds: string[] = []
      const { wrapper, router } = await mountProductDetailView({
        productDetail: createFakeProductDetailGateway({
          fetchProductDetail: (id) => {
            requestedIds.push(id)
            return requestsById.get(id)?.promise ?? Promise.resolve(null)
          },
        }),
      })
      await vi.waitFor(() => expect(requestedIds).toContain('product-1'))

      await router.push('/product/product-2')
      await vi.waitFor(() => expect(requestedIds).toContain('product-2'))
      requestsById.get('product-2')?.resolve(createProductDetail('product-2', 'Second Product'))
      await vi.waitFor(() => expect(wrapper.text()).toContain('Second Product'))
      requestsById.get('product-1')?.resolve(createProductDetail('product-1', 'First Product'))

      await vi.waitFor(() => {
        expect(wrapper.text()).toContain('Second Product')
        expect(wrapper.text()).not.toContain('First Product')
        expect(wrapper.text()).not.toContain('Wird geladen …')
      })
    })
  })
})
