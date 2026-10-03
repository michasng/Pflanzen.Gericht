import { ALLERGENS, type Allergen } from '@/config/allergens'
import { toQuantityUnit } from '@/lib/toQuantityUnit'
import type { IngredientComparator } from '@/config/ingredients'
import type { Product, ProductIngredient, ProductNutrient } from '@/types'
import type { ProductFormValues } from '@/types/productForm'

const isKnownAllergen = (allergen: string): allergen is Allergen =>
  ALLERGENS.some((known) => known === allergen)

export const toProductFormValues = (
  product: Product,
  ingredients: ProductIngredient[],
  nutrients: ProductNutrient[],
): ProductFormValues => ({
  name: product.name,
  category: product.category,
  base: product.base,
  brand: product.brand,
  description: product.description,
  energyJoules: product.energyJoules,
  allergens: product.allergens.filter(isKnownAllergen),
  isOrganic: product.isOrganic,
  barcode: product.barcode,
  quantityUnit: toQuantityUnit(product.quantityUnit),
  quantityValue: product.quantityValue,
  ingredients: ingredients.map((ingredient) => ({
    name: ingredient.name,
    fractionBasisPoints: ingredient.fractionBasisPoints,
    // The database stores the comparator as plain text; the form only accepts the known values.
    comparator: ingredient.comparator as IngredientComparator,
  })),
  nutrients: nutrients.map((nutrient) => ({
    name: nutrient.name,
    amountMicrograms: nutrient.amountMicrograms,
  })),
})
