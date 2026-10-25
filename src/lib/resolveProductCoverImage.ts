import { ImageBucket } from '@/config/imageBucket'
import type { CoverImageCandidate } from '@/lib/CoverImageCandidate'
import type { CoverImageSource } from '@/lib/CoverImageSource'

export const resolveProductCoverImage = (
  images: CoverImageCandidate[],
): CoverImageSource | null => {
  const [first] = [...images].sort((a, b) => a.sortOrder - b.sortOrder)
  if (!first) return null
  return { bucket: ImageBucket.Product, storagePath: first.storagePath }
}
