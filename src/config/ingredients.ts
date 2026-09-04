export const INGREDIENT_COMPARATOR_LABELS = {
  '=': '=',
  '≈': '≈',
  '<': '<',
  '≤': '≤',
  '≥': '≥',
  '>': '>',
} as const
export type IngredientComparator = keyof typeof INGREDIENT_COMPARATOR_LABELS
export const INGREDIENT_COMPARATORS = Object.keys(
  INGREDIENT_COMPARATOR_LABELS,
) as IngredientComparator[]
export const DEFAULT_INGREDIENT_COMPARATOR: IngredientComparator = '='

export interface IngredientLike {
  name: string
  fractionBasisPoints: number | null
  comparator: IngredientComparator
}
