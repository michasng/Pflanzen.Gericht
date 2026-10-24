export interface ReviewCriteriaScores {
  isCurrent: boolean
  taste: number | null
  consistency: number | null
  appearance: number | null
  value: number | null
}

export interface ReviewCriterionAverage {
  label: string
  value: number
}

type ReviewCriterionKey = keyof Omit<ReviewCriteriaScores, 'isCurrent'>

const CRITERIA: readonly { label: string; key: ReviewCriterionKey }[] = [
  { label: 'Geschmack', key: 'taste' },
  { label: 'Konsistenz', key: 'consistency' },
  { label: 'Aussehen', key: 'appearance' },
  { label: 'Preis-Leistung', key: 'value' },
]

export const averageReviewCriteria = (
  reviews: readonly ReviewCriteriaScores[],
): ReviewCriterionAverage[] => {
  const currentReviews = reviews.filter((review) => review.isCurrent)

  return CRITERIA.flatMap(({ label, key }) => {
    const scores = currentReviews
      .map((review) => review[key])
      .filter((score): score is number => score !== null)
    if (scores.length === 0) return []

    const sum = scores.reduce((total, score) => total + score, 0)
    return [{ label, value: sum / scores.length }]
  })
}
