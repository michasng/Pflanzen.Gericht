import type { InjectionKey } from 'vue'
import type { ProductBookmarks } from '@/composables/useProductBookmarks'

export const productBookmarksKey: InjectionKey<ProductBookmarks> = Symbol('productBookmarks')
