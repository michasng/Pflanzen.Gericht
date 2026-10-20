import type { CrawledProduct } from '../schema/crawledProduct.js'
import { convertGramsToMicrograms } from '../schema/convertGramsToMicrograms.js'
import { convertKilojoulesToJoules } from '../schema/convertKilojoulesToJoules.js'
import type { ExistingProductSummary } from './loadExistingProductMatches.js'
import type { ExistingProductDetail } from './loadExistingProductDetail.js'
import { isEmptyComparableValue } from './isEmptyComparableValue.js'
import { parseCrawledIngredients, type CrawledIngredientRecord } from './parseCrawledIngredients.js'

export interface DiffEntry {
  field: string
  existingValue: unknown
  candidateValue: unknown
}

interface ComparableRecord {
  name: string
  brand: string | null
  quantityUnit: string | null
  quantityValue: number | null
  description: string | null
  category: string | null
  base: string | null
  allergens: string[]
  isOrganic: boolean
  barcode: string | null
  energyJoules: number | null
  ingredientsSummary: string | null
  nutrientsMicrograms: Record<string, number>
}

const formatIngredientForComparison = (ingredient: CrawledIngredientRecord): string =>
  ingredient.comparator === '=' && ingredient.fraction_basis_points === null
    ? ingredient.name
    : `${ingredient.name} ${ingredient.comparator}${ingredient.fraction_basis_points ?? ''}`

const summarizeIngredients = (ingredients: CrawledIngredientRecord[]): string | null =>
  ingredients.length > 0
    ? ingredients
        .map((ingredient) => formatIngredientForComparison(ingredient))
        .sort()
        .join('; ')
    : null

const toExistingComparable = (
  existing: ExistingProductSummary,
  detail: ExistingProductDetail,
): ComparableRecord => ({
  name: existing.name,
  brand: existing.brand,
  quantityUnit: existing.quantity_unit,
  quantityValue: existing.quantity_value,
  description: existing.description,
  category: existing.category,
  base: existing.base,
  allergens: [...existing.allergens].sort(),
  isOrganic: existing.is_organic,
  barcode: existing.barcode,
  energyJoules: existing.energy_joules,
  ingredientsSummary: summarizeIngredients(detail.ingredients),
  nutrientsMicrograms: Object.fromEntries(
    detail.nutrients.map((nutrient) => [nutrient.name, nutrient.amount_micrograms]),
  ),
})

const toCandidateComparable = (candidate: CrawledProduct): ComparableRecord => ({
  name: candidate.name,
  brand: candidate.brand,
  quantityUnit: candidate.quantityUnit,
  quantityValue: candidate.quantityValue,
  description: candidate.description,
  category: candidate.category,
  base: candidate.base,
  allergens: [...candidate.allergens].sort(),
  isOrganic: candidate.isOrganic,
  barcode: candidate.barcode,
  energyJoules: convertKilojoulesToJoules(candidate.energyKilojoules),
  ingredientsSummary: candidate.ingredientsRawText
    ? summarizeIngredients(parseCrawledIngredients(candidate.ingredientsRawText))
    : null,
  nutrientsMicrograms: Object.fromEntries(
    Object.entries(candidate.nutrientsPer100g).map(([name, grams]) => [
      name,
      convertGramsToMicrograms(grams),
    ]),
  ),
})

export const diffProduct = (
  candidate: CrawledProduct,
  existing: ExistingProductSummary,
  existingDetail: ExistingProductDetail,
): DiffEntry[] => {
  const existingRecord = toExistingComparable(existing, existingDetail)
  const candidateRecord = toCandidateComparable(candidate)

  return (Object.keys(existingRecord) as (keyof ComparableRecord)[])
    .filter((field) => !isEmptyComparableValue(candidateRecord[field]))
    .filter(
      (field) => JSON.stringify(existingRecord[field]) !== JSON.stringify(candidateRecord[field]),
    )
    .map((field) => ({
      field,
      existingValue: existingRecord[field],
      candidateValue: candidateRecord[field],
    }))
}
