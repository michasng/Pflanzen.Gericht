export const RATING_CRITERION_LABELS = {
  taste: 'Geschmack',
  consistency: 'Konsistenz',
  appearance: 'Aussehen',
  nutrition: 'Nährwerte',
  value: 'Preis-Leistung',
} as const
export type RatingCriterion = keyof typeof RATING_CRITERION_LABELS
export const RATING_CRITERIA = Object.keys(RATING_CRITERION_LABELS) as RatingCriterion[]
