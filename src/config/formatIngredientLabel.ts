import { DEFAULT_INGREDIENT_COMPARATOR, type IngredientLike } from '@/config/ingredients'
import { formatFractionBasisPointsAsPercent } from '@/lib/formatFractionBasisPointsAsPercent'

export const formatIngredientLabel = (ingredient: IngredientLike): string => {
  if (ingredient.fractionBasisPoints === null) return ingredient.name
  const comparatorPrefix =
    ingredient.comparator === DEFAULT_INGREDIENT_COMPARATOR ? '' : `${ingredient.comparator} `
  return `${ingredient.name} ${comparatorPrefix}${formatFractionBasisPointsAsPercent(ingredient.fractionBasisPoints)}`
}
