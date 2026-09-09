export const ALLERGEN_LABELS = {
  gluten: 'Gluten',
  soy: 'Soja',
  nuts: 'Nüsse',
} as const
export type Allergen = keyof typeof ALLERGEN_LABELS
const isAllergen = (value: string): value is Allergen =>
  Object.prototype.hasOwnProperty.call(ALLERGEN_LABELS, value)
export const ALLERGENS = Object.keys(ALLERGEN_LABELS).filter(isAllergen)
export const allergenToLabel = (allergen: string): string =>
  isAllergen(allergen) ? ALLERGEN_LABELS[allergen] : allergen
