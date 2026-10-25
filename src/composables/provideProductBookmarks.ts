import { provide, watch } from 'vue'
import { injectGateway } from '@/composables/injectGateway'
import { productBookmarksKey } from '@/composables/productBookmarksKey'
import { useProductBookmarks } from '@/composables/useProductBookmarks'
import { listGatewayKey } from '@/services/ListGateway'
import { useAuthStore } from '@/stores/auth'

export const provideProductBookmarks = (shownProductIds: () => string[]): void => {
  const authStore = useAuthStore()
  const bookmarks = useProductBookmarks({
    gateway: injectGateway(listGatewayKey),
    ownerId: () => authStore.user?.id ?? null,
  })
  provide(productBookmarksKey, bookmarks)
  watch([shownProductIds, () => authStore.user?.id], () => bookmarks.load(shownProductIds()), {
    immediate: true,
  })
}
