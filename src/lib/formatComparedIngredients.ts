import { formatIngredientLabel } from '@/config/formatIngredientLabel'
import { EMPTY_COMPARED_VALUE } from '@/lib/formatComparedFieldValue'
import type { ProductFormIngredient } from '@/types/productForm'

export const formatComparedIngredients = (ingredients: ProductFormIngredient[]): string =>
  ingredients.length ? ingredients.map(formatIngredientLabel).join('\n') : EMPTY_COMPARED_VALUE
