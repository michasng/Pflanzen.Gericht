import type { IngredientLike } from '@/config/ingredients'

export const sortIngredientsByFractionDesc = <T extends IngredientLike>(ingredients: T[]): T[] =>
  [...ingredients].sort((a, b) => {
    if (a.fractionBasisPoints === null && b.fractionBasisPoints === null) return 0
    if (a.fractionBasisPoints === null) return 1
    if (b.fractionBasisPoints === null) return -1
    return b.fractionBasisPoints - a.fractionBasisPoints
  })
