import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import type { ProductDetail } from '@/services/catalog'

const { fetchProductDetail } = vi.hoisted(() => ({
  fetchProductDetail: vi.fn<(id: string) => Promise<ProductDetail | null>>(),
}))

vi.mock('vue-router', async () => {
  const { reactive } = await import('vue')
  const route = reactive({
    params: {
      id: 'product-1',
    },
    fullPath: '/product/product-1',
  })

  return {
    useRoute: () => route,
    useRouter: () => ({
      push: vi.fn<() => Promise<void>>(() => Promise.resolve()),
    }),
  }
})

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    user: null,
    isAdmin: false,
    isLoggedIn: false,
  }),
}))

vi.mock('@/services/catalog', () => ({
  fetchProductDetail,
  getImageUrl: () => '',
}))

vi.mock('@/services/prices', () => ({
  upsertPriceReport: vi.fn<(...args: never[]) => Promise<void>>(() => Promise.resolve()),
  deletePriceReport: vi.fn<(...args: never[]) => Promise<void>>(() => Promise.resolve()),
}))

vi.mock('@/services/products', () => ({
  deleteProduct: vi.fn<(id: string) => Promise<void>>(() => Promise.resolve()),
}))

import ProductDetailView from '@/views/ProductDetailView.vue'
import { useRoute } from 'vue-router'

interface Deferred<T> {
  promise: Promise<T>
  reject: (reason?: unknown) => void
  resolve: (value: T) => void
}

const createDeferred = <T>(): Deferred<T> => {
  let resolve = (_value: T): void => {}
  let reject = (_reason?: unknown): void => {}
  const promise = new Promise<T>((innerResolve, innerReject) => {
    resolve = innerResolve
    reject = innerReject
  })
  return { promise, reject, resolve }
}

const createProductDetail = (id: string, name: string): ProductDetail => ({
  allergens: [],
  avg_overall: 4.2,
  barcode: null,
  base: null,
  brand: null,
  category: 'drink',
  created_at: '2026-09-11T00:00:00.000Z',
  created_by: 'user-1',
  description: null,
  energy_joules: null,
  id,
  images: [],
  ingredients: [],
  is_organic: false,
  min_price_euro_cents: null,
  name,
  normalized_name: null,
  nutrients: [],
  priceReports: [],
  reviews: [],
  reviews_count: 0,
  tags: [],
  updated_at: '2026-09-11T00:00:00.000Z',
})

describe('ProductDetailView', () => {
  afterEach(() => {
    const route = useRoute()
    route.params.id = 'product-1'
    route.fullPath = '/product/product-1'
    fetchProductDetail.mockReset()
  })

  describe('given a slower previous request resolves after navigation', () => {
    it('when the newer request finishes first then it keeps the newer product visible', async () => {
      const firstRequest = createDeferred<ProductDetail | null>()
      const secondRequest = createDeferred<ProductDetail | null>()

      fetchProductDetail
        .mockImplementationOnce(() => firstRequest.promise)
        .mockImplementationOnce(() => secondRequest.promise)

      const route = useRoute()
      const wrapper = mount(ProductDetailView, {
        global: {
          mocks: {
            $route: route,
          },
          stubs: {
            AlertMessage: true,
            AppLogo: true,
            PriceReportForm: true,
            ReviewCard: true,
            ReviewScoreDimensions: true,
            RouterLink: true,
            SimilarProductsSection: true,
            StarDisplay: true,
          },
        },
      })

      await vi.waitFor(() => {
        expect(fetchProductDetail).toHaveBeenCalledWith('product-1')
      })

      route.params.id = 'product-2'
      route.fullPath = '/product/product-2'

      await vi.waitFor(() => {
        expect(fetchProductDetail).toHaveBeenCalledWith('product-2')
      })

      secondRequest.resolve(createProductDetail('product-2', 'Second Product'))

      await vi.waitFor(() => {
        expect(wrapper.text()).toContain('Second Product')
      })

      firstRequest.resolve(createProductDetail('product-1', 'First Product'))

      await vi.waitFor(() => {
        expect(wrapper.text()).toContain('Second Product')
        expect(wrapper.text()).not.toContain('First Product')
        expect(wrapper.text()).not.toContain('Wird geladen …')
      })
    })
  })
})
