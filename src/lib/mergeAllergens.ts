import type { Allergen } from '@/config/allergens'

export const mergeAllergens = (first: Allergen[], second: Allergen[]): Allergen[] => [
  ...new Set([...first, ...second]),
]
