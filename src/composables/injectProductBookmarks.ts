import { inject } from 'vue'
import { productBookmarksKey } from '@/composables/productBookmarksKey'
import type { ProductBookmarks } from '@/composables/useProductBookmarks'

export const injectProductBookmarks = (): ProductBookmarks => {
  const bookmarks = inject(productBookmarksKey)
  if (!bookmarks) throw new Error('No product bookmarks provided.')
  return bookmarks
}
