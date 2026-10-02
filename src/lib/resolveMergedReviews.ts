import type { Review } from '@/types'

export const resolveMergedReviews = <T extends Review>(reviews: T[]): T[] => {
  const newestCurrentReviewByUser = new Map<string, T>()
  for (const review of reviews) {
    if (!review.is_current) continue
    const newest = newestCurrentReviewByUser.get(review.user_id)
    if (!newest || review.created_at >= newest.created_at) {
      newestCurrentReviewByUser.set(review.user_id, review)
    }
  }
  return reviews
    .map((review) => ({
      ...review,
      is_current: newestCurrentReviewByUser.get(review.user_id) === review,
    }))
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
}
