import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createFakeListGateway } from '@/__tests__/createFakeListGateway'
import { EmptyRouteComponent } from '@/__tests__/mountView'
import ProductBookmarkControl from '@/components/product/ProductBookmarkControl.vue'
import { productBookmarksKey } from '@/composables/productBookmarksKey'
import { useProductBookmarks } from '@/composables/useProductBookmarks'

const PRODUCT_PATH = '/product/product-1'
const BOOKMARK_LABEL = 'Listen verwalten'

const mountControl = async (currentUserId: string | null) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', name: 'login', component: EmptyRouteComponent },
      { path: PRODUCT_PATH, name: 'product-detail', component: EmptyRouteComponent },
    ],
  })
  await router.push(PRODUCT_PATH)
  const provide: Record<symbol, unknown> = {
    [productBookmarksKey]: useProductBookmarks({
      gateway: createFakeListGateway(),
      ownerId: () => currentUserId,
    }),
  }
  const wrapper = mount(ProductBookmarkControl, {
    props: { productId: 'product-1', currentUserId },
    global: { plugins: [router], provide },
  })
  return { wrapper, router }
}

describe('ProductBookmarkControl', () => {
  describe('given a logged-out visitor', () => {
    it('links the bookmark to login and back to the product', async () => {
      const { wrapper, router } = await mountControl(null)

      await wrapper.get(`a[aria-label="${BOOKMARK_LABEL}"]`).trigger('click')

      await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('login'))
      expect(router.currentRoute.value.query.redirect).toBe(PRODUCT_PATH)
    })
  })

  describe('given a logged-in user', () => {
    it('offers the bookmark dialog instead of a link', async () => {
      const { wrapper } = await mountControl('user-1')

      expect(wrapper.find(`button[aria-label="${BOOKMARK_LABEL}"]`).exists()).toBe(true)
      expect(wrapper.find(`a[aria-label="${BOOKMARK_LABEL}"]`).exists()).toBe(false)
    })
  })
})
