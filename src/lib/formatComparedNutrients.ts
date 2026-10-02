import { formatNutrientAmount } from '@/lib/formatNutrientAmount'
import { EMPTY_COMPARED_VALUE } from '@/lib/formatComparedFieldValue'
import type { ProductFormNutrient } from '@/types/productForm'

export const formatComparedNutrients = (nutrients: ProductFormNutrient[]): string =>
  nutrients.length
    ? nutrients
        .map((nutrient) => `${nutrient.name} ${formatNutrientAmount(nutrient.amountMicrograms)}`)
        .join('\n')
    : EMPTY_COMPARED_VALUE
