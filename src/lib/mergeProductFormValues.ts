import { mergeIngredientsByName } from '@/lib/mergeIngredientsByName'
import { mergeNutrientsByName } from '@/lib/mergeNutrientsByName'
import { mergeScalarField } from '@/lib/mergeScalarField'
import { mergeUnique } from '@/lib/mergeUnique'
import type { ProductFormInitialValues, ProductFormValues } from '@/types/productForm'

const mergeQuantity = (
  a: ProductFormValues,
  b: ProductFormValues,
): Pick<ProductFormInitialValues, 'quantityUnit' | 'quantityValue'> =>
  a.quantityUnit === b.quantityUnit && a.quantityValue === b.quantityValue
    ? { quantityUnit: a.quantityUnit, quantityValue: a.quantityValue }
    : {}

export const mergeProductFormValues = (
  a: ProductFormValues,
  b: ProductFormValues,
): ProductFormInitialValues => ({
  ...mergeQuantity(a, b),
  name: mergeScalarField(a.name, b.name),
  category: mergeScalarField(a.category, b.category),
  base: mergeScalarField(a.base, b.base),
  brand: mergeScalarField(a.brand, b.brand),
  description: mergeScalarField(a.description, b.description),
  energyJoules: mergeScalarField(a.energyJoules, b.energyJoules),
  isOrganic: mergeScalarField(a.isOrganic, b.isOrganic),
  barcode: mergeScalarField(a.barcode, b.barcode),
  allergens: mergeUnique(a.allergens, b.allergens),
  ingredients: mergeIngredientsByName(a.ingredients, b.ingredients),
  nutrients: mergeNutrientsByName(a.nutrients, b.nutrients),
  sourceUrls: mergeUnique(a.sourceUrls, b.sourceUrls),
})
