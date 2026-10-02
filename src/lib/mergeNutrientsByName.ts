import { unionByName } from '@/lib/unionByName'
import type { ProductFormInitialNutrient, ProductFormNutrient } from '@/types/productForm'

const normalizeName = (name: string): string => name.trim().toLowerCase()

export const mergeNutrientsByName = (
  first: ProductFormNutrient[],
  second: ProductFormNutrient[],
): ProductFormInitialNutrient[] =>
  unionByName(first, second).map((nutrient) => {
    const counterpart = second.find(
      (candidate) => normalizeName(candidate.name) === normalizeName(nutrient.name),
    )
    const agrees = !counterpart || counterpart.amountMicrograms === nutrient.amountMicrograms
    return agrees ? nutrient : { name: nutrient.name, amountMicrograms: null }
  })
