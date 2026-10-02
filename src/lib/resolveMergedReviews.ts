import type { Review } from '@/types'

export const resolveMergedReviews = <T extends Review>(reviews: T[]): T[] => {
  const newestCurrentReviewByUser = new Map<string, T>()
  for (const review of reviews) {
    if (!review.isCurrent) continue
    const newest = newestCurrentReviewByUser.get(review.userId)
    if (!newest || review.createdAt >= newest.createdAt) {
      newestCurrentReviewByUser.set(review.userId, review)
    }
  }
  return reviews
    .map((review) => ({
      ...review,
      isCurrent: newestCurrentReviewByUser.get(review.userId) === review,
    }))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}
