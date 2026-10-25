import { ImageBucket } from '@/config/imageBucket'
import type { CoverImageCandidate } from '@/lib/CoverImageCandidate'
import type { CoverImageSource } from '@/lib/CoverImageSource'
import { findFirstCoverImageCandidate } from '@/lib/findFirstCoverImageCandidate'

export const resolveProductCoverImage = (
  images: CoverImageCandidate[],
): CoverImageSource | null => {
  const first = findFirstCoverImageCandidate(images)
  if (!first) return null
  return { bucket: ImageBucket.Product, storagePath: first.storagePath }
}
