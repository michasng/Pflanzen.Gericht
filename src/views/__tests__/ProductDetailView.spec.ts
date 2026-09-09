import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { createDeferred } from '@/__tests__/createDeferred'
import type { ProductDetail, ProductReferences } from '@/services/catalog'

const fetchProductDetail = vi.fn<(id: string) => Promise<ProductDetail | null>>()
const fetchProductReferences = vi.fn<(id: string) => Promise<ProductReferences>>()
const routerPush = vi.fn<(location: unknown) => Promise<void>>()

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: 'product-1' } }),
  useRouter: () => ({ push: routerPush }),
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ user: null, isLoggedIn: true }),
}))

vi.mock('@/services/catalog', () => ({
  fetchProductDetail: (id: string) => fetchProductDetail(id),
  fetchProductReferences: (id: string) => fetchProductReferences(id),
  getImageUrl: () => '',
}))

vi.mock('@/services/prices', () => ({
  upsertPriceReport: vi.fn<() => Promise<void>>(),
  deletePriceReport: vi.fn<() => Promise<void>>(),
}))

vi.mock('@/services/products', () => ({
  deleteProduct: vi.fn<() => Promise<void>>(),
}))

import ProductDetailView from '../ProductDetailView.vue'

const AlertMessageStub = defineComponent({
  props: { message: { type: String, required: true } },
  template: '<p>{{ message }}</p>',
})

const RouterLinkStub = defineComponent({
  template: '<a><slot /></a>',
})

const productDetail = {
  id: 'product-1',
  name: 'Test Produkt',
  normalized_name: null,
  category: 'schnitzel',
  brand: null,
  base: null,
  description: null,
  created_at: '2026-09-09T00:00:00Z',
  created_by: 'user-1',
  updated_at: '2026-09-09T00:00:00Z',
  allergens: [],
  avg_overall: null,
  energy_joules: null,
  is_organic: false,
  min_price_euro_cents: null,
  ratings_count: 0,
  tags: [],
  images: [],
  ingredients: [],
  nutrients: [],
  ratings: [],
  priceReports: [],
} satisfies ProductDetail

describe('ProductDetailView', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('given product references fail to load, keeps the product detail visible', async () => {
    const productPromise = Promise.resolve(productDetail)
    const referencesPromise = createDeferred<ProductReferences>()
    fetchProductDetail.mockReturnValueOnce(productPromise)
    fetchProductReferences.mockReturnValueOnce(referencesPromise.promise)

    const wrapper = mount(ProductDetailView, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
          StarDisplay: true,
          RatingCard: true,
          PriceReportForm: true,
          AppLogo: true,
          AlertMessage: AlertMessageStub,
        },
      },
    })

    await productPromise

    referencesPromise.reject(new Error('kaputt'))
    await referencesPromise.promise.catch(() => undefined)

    expect(wrapper.text()).toContain('Test Produkt')
    expect(wrapper.text()).toContain('Vorbild-Bezüge konnten nicht geladen werden.')
    expect(wrapper.text()).not.toContain('Produkt konnte nicht geladen werden.')
  })
})
