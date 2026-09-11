import type { IngredientComparator } from '@/config/ingredients'
import type { Allergen } from '@/config/allergens'

export interface ProductFormIngredient {
  name: string
  fractionBasisPoints: number | null
  comparator: IngredientComparator
}

export interface ProductFormNutrient {
  name: string
  amountMicrograms: number
}

export interface ProductFormValues {
  name: string
  category: string
  base: string | null
  brand: string | null
  description: string | null
  energyJoules: number | null
  allergens: Allergen[]
  isOrganic: boolean
  barcode: string | null
  ingredients: ProductFormIngredient[]
  nutrients: ProductFormNutrient[]
}
