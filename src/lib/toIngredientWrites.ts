import type { IngredientWrite } from '@/types/productWrites'
import type { ProductFormValues } from '@/types/productForm'

export const toIngredientWrites = (
  ingredients: ProductFormValues['ingredients'],
): IngredientWrite[] =>
  ingredients.map((ingredient) => ({
    name: ingredient.name,
    fraction_basis_points: ingredient.fractionBasisPoints,
    comparator: ingredient.comparator,
  }))
