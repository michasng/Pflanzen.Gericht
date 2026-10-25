import { ImageBucket } from '@/config/imageBucket'
import type { CoverImageCandidate } from '@/lib/CoverImageCandidate'
import type { CoverImageSource } from '@/lib/CoverImageSource'
import { findFirstCoverImageCandidate } from '@/lib/findFirstCoverImageCandidate'
import { resolveProductCoverImage } from '@/lib/resolveProductCoverImage'

interface ReviewCoverCandidates {
  images: CoverImageCandidate[]
  product: { images: CoverImageCandidate[] }
}

export const resolveReviewCoverImage = ({
  images,
  product,
}: ReviewCoverCandidates): CoverImageSource | null => {
  const first = findFirstCoverImageCandidate(images)
  if (first) return { bucket: ImageBucket.Review, storagePath: first.storagePath }
  return resolveProductCoverImage(product.images)
}
