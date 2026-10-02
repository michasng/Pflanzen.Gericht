import type { NutrientWrite } from '@/types/productWrites'
import type { ProductFormValues } from '@/types/productForm'

export const toNutrientWrites = (nutrients: ProductFormValues['nutrients']): NutrientWrite[] =>
  nutrients.map((nutrient) => ({
    name: nutrient.name,
    amount_micrograms: nutrient.amountMicrograms,
  }))
