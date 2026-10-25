import type { CoverImageCandidate } from '@/lib/CoverImageCandidate'
import type { Product } from '@/types'

export type ProductWithImages = Product & { images: CoverImageCandidate[] }
