import type { ProductIngredient, ProductNutrient } from '@/types'

export type IngredientWrite = Pick<ProductIngredient, 'name' | 'fractionBasisPoints' | 'comparator'>

export type NutrientWrite = Pick<ProductNutrient, 'name' | 'amountMicrograms'>
