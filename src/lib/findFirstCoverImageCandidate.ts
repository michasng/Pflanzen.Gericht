import type { CoverImageCandidate } from '@/lib/CoverImageCandidate'

export const findFirstCoverImageCandidate = (
  images: CoverImageCandidate[],
): CoverImageCandidate | undefined => [...images].sort((a, b) => a.sortOrder - b.sortOrder)[0]
