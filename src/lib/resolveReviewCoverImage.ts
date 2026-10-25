import { ImageBucket } from '@/config/imageBucket'
import type { CoverImageCandidate } from '@/lib/CoverImageCandidate'
import type { CoverImageSource } from '@/lib/CoverImageSource'
import { resolveProductCoverImage } from '@/lib/resolveProductCoverImage'

interface ReviewCoverCandidates {
  images: CoverImageCandidate[]
  product: { images: CoverImageCandidate[] }
}

export const resolveReviewCoverImage = ({
  images,
  product,
}: ReviewCoverCandidates): CoverImageSource | null => {
  const [first] = [...images].sort((a, b) => a.sortOrder - b.sortOrder)
  if (first) return { bucket: ImageBucket.Review, storagePath: first.storagePath }
  return resolveProductCoverImage(product.images)
}
