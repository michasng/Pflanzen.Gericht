import type { IngredientComparator, IngredientLike } from '@/config/ingredients'

const MINIMUM_GUARANTEED_COMPARATORS: IngredientComparator[] = ['=', '≈', '≥', '>']

export const sumGuaranteedFractionBasisPoints = (ingredients: IngredientLike[]): number =>
  ingredients
    .filter(
      (ingredient) =>
        ingredient.fractionBasisPoints !== null &&
        MINIMUM_GUARANTEED_COMPARATORS.includes(ingredient.comparator),
    )
    .reduce((sum, ingredient) => sum + (ingredient.fractionBasisPoints ?? 0), 0)
