import { DEFAULT_INGREDIENT_COMPARATOR } from '@/config/ingredients'
import { unionByName } from '@/lib/unionByName'
import type { ProductFormIngredient } from '@/types/productForm'

const normalizeName = (name: string): string => name.trim().toLowerCase()

export const mergeIngredientsByName = (
  first: ProductFormIngredient[],
  second: ProductFormIngredient[],
): ProductFormIngredient[] =>
  unionByName(first, second).map((ingredient) => {
    const counterpart = second.find(
      (candidate) => normalizeName(candidate.name) === normalizeName(ingredient.name),
    )
    if (!counterpart || counterpart.fractionBasisPoints === null) return ingredient
    if (ingredient.fractionBasisPoints === null) return { ...counterpart, name: ingredient.name }
    const agrees =
      counterpart.fractionBasisPoints === ingredient.fractionBasisPoints &&
      counterpart.comparator === ingredient.comparator
    return agrees
      ? ingredient
      : {
          name: ingredient.name,
          fractionBasisPoints: null,
          comparator: DEFAULT_INGREDIENT_COMPARATOR,
        }
  })
