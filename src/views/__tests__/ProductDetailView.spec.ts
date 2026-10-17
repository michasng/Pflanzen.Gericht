import { describe, expect, it, vi } from 'vitest'
import type { ProductDetail } from '@/services/catalog'
import type { ProductDetailGateway } from '@/services/ProductDetailGateway'
import ProductDetailView from '@/views/ProductDetailView.vue'
import { createDeferred } from '@/__tests__/createDeferred'
import { EmptyRouteComponent, mountView } from '@/__tests__/mountView'

const createProductDetail = (id: string, name: string): ProductDetail => ({
  allergens: [],
  avgOverall: 4.2,
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
  ingredients: [],
  isOrganic: false,
  minPriceEuroCents: null,
  name,
  quantityUnit: 'piece',
  quantityValue: 1,
  normalizedName: null,
  nutrients: [],
  priceReports: [],
  reviews: [],
  reviewsCount: 0,
  sources: [],
  tags: [],
  updatedAt: '2026-09-11T00:00:00.000Z',
})

const createFakeProductDetailGateway = (
  overrides: Partial<ProductDetailGateway> = {},
): ProductDetailGateway => ({
  fetchProductDetail: () => Promise.resolve(null),
  upsertPriceReport: () => Promise.reject(new Error('not expected')),
  deletePriceReport: () => Promise.resolve(),
  deleteProduct: () => Promise.resolve(),
  ...overrides,
})

const mountProductDetailView = (productDetail: ProductDetailGateway) =>
  mountView({
    view: ProductDetailView,
    routes: [
      { path: '/', name: 'home', component: EmptyRouteComponent },
      { path: '/login', name: 'login', component: EmptyRouteComponent },
      { path: '/product/:id', name: 'product-detail', component: EmptyRouteComponent },
    ],
    initialPath: '/product/product-1',
    gateways: { productDetail },
    stubs: {
      AlertMessage: true,
      AppLogo: true,
      PriceReportForm: true,
      ReviewCard: true,
      ReviewScoreDimensions: true,
      SimilarProductsSection: true,
      StarDisplay: true,
    },
  })

describe('ProductDetailView', () => {
  describe('given a product with sources', () => {
    it('links each source by its shortened hostname', async () => {
      const sourceUrl = 'https://www.rewe.de/shop/p/nutella/9946679'
      const { wrapper } = await mountProductDetailView(
        createFakeProductDetailGateway({
          fetchProductDetail: () =>
            Promise.resolve({
              ...createProductDetail('product-1', 'First Product'),
              sources: [{ id: 'source-1', productId: 'product-1', url: sourceUrl, createdAt: '' }],
            }),
        }),
      )

      const link = await vi.waitFor(() => {
        const found = wrapper.find(`a[href="${sourceUrl}"]`)
        expect(found.exists()).toBe(true)
        return found
      })
      expect(link.text()).toBe('rewe.de')
      wrapper.unmount()
    })
  })

  describe('given a slower previous request resolves after navigation', () => {
    it('when the newer request finishes first then it keeps the newer product visible', async () => {
      const requestsById = new Map([
        ['product-1', createDeferred<ProductDetail | null>()],
        ['product-2', createDeferred<ProductDetail | null>()],
      ])
      const requestedIds: string[] = []
      const { wrapper, router } = await mountProductDetailView(
        createFakeProductDetailGateway({
          fetchProductDetail: (id) => {
            requestedIds.push(id)
            return requestsById.get(id)?.promise ?? Promise.resolve(null)
          },
        }),
      )
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
