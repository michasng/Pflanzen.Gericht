import type { ProductImage } from '@/types'

export type CoverImageCandidate = Pick<ProductImage, 'storagePath' | 'sortOrder'>
