import type { ReviewFields } from '@/services/reviews'
import type { Review } from '@/types'

export const toReviewFields = (review: Review): ReviewFields => ({
  overall: review.overall,
  taste: review.taste,
  consistency: review.consistency,
  appearance: review.appearance,
  nutrition: review.nutrition,
  value: review.value,
  comment: review.comment,
})
