export const ALLERGEN_LABELS = {
  gluten: 'Gluten',
  soy: 'Soja',
  nuts: 'Nüsse',
} as const
export type Allergen = keyof typeof ALLERGEN_LABELS
export const ALLERGENS = Object.keys(ALLERGEN_LABELS) as Allergen[]
export const allergenToLabel = (allergen: string): string =>
  ALLERGEN_LABELS[allergen as Allergen] ?? allergen
