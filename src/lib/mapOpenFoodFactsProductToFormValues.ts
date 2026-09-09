import { JOULES_PER_KILOJOULE } from '@/config/energy'
import { DEFAULT_INGREDIENT_COMPARATOR } from '@/config/ingredients'
import { MICROGRAMS_PER_UNIT, NutrientUnit } from '@/config/nutrients'
import {
  OPEN_FOOD_FACTS_ALLERGEN_TAG_TO_ALLERGEN,
  OPEN_FOOD_FACTS_ENERGY_NUTRIMENT_FIELD,
  OPEN_FOOD_FACTS_NUTRIENT_FIELD_TO_NAME,
  OPEN_FOOD_FACTS_ORGANIC_LABEL_TAG,
  isOpenFoodFactsEstimatedNutrimentField,
} from '@/config/openFoodFacts'
import type { Allergen } from '@/config/allergens'
import { BASIS_POINTS_PER_PERCENT } from '@/lib/basisPoints'
import { sortNutrientsByHierarchy } from '@/lib/sortNutrientsByHierarchy'
import type { ProductFormValues } from '@/types/productForm'
import type { OpenFoodFactsProduct } from '@/types/openFoodFacts'

const NUTRIMENT_FIELD_SUFFIX = '_100g'
const NUTRIMENT_UNIT_SUFFIX = '_unit'

const isSupportedNutrientUnit = (value: string): value is NutrientUnit =>
  value === NutrientUnit.Gram ||
  value === NutrientUnit.Milligram ||
  value === NutrientUnit.Microgram

const toEnglishNutrientName = (value: string): string =>
  value
    .split(/[-_]/)
    .map((segment) => `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`)
    .join(' ')

const mapName = (product: OpenFoodFactsProduct): string | undefined =>
  product.product_name?.trim() || undefined

const mapBrand = (product: OpenFoodFactsProduct): string | undefined =>
  product.brands?.split(',')[0]?.trim() || undefined

const mapDescription = (product: OpenFoodFactsProduct): string | undefined =>
  product.generic_name?.trim() || product.ingredients_text?.trim() || undefined

const mapEnergyJoules = (product: OpenFoodFactsProduct): number | undefined => {
  const energyKilojoules = product.nutriments?.[OPEN_FOOD_FACTS_ENERGY_NUTRIMENT_FIELD]
  if (typeof energyKilojoules !== 'number') return undefined
  return Math.round(energyKilojoules * JOULES_PER_KILOJOULE)
}

const mapAllergens = (product: OpenFoodFactsProduct): Allergen[] | undefined => {
  const allergens = [
    ...new Set(
      (product.allergens_tags ?? [])
        .map((tag) => OPEN_FOOD_FACTS_ALLERGEN_TAG_TO_ALLERGEN[tag])
        .filter((allergen): allergen is Allergen => allergen !== undefined),
    ),
  ]
  return allergens.length ? allergens : undefined
}

const mapIsOrganic = (product: OpenFoodFactsProduct): true | undefined =>
  product.labels_tags?.includes(OPEN_FOOD_FACTS_ORGANIC_LABEL_TAG) ? true : undefined

const mapIngredients = (
  product: OpenFoodFactsProduct,
): ProductFormValues['ingredients'] | undefined => {
  const ingredients = (product.ingredients ?? [])
    .map((ingredient) => ({
      name: ingredient.text?.trim(),
      percentEstimate: ingredient.percent_estimate,
    }))
    .filter((ingredient): ingredient is { name: string; percentEstimate: number | undefined } =>
      Boolean(ingredient.name),
    )
    .map((ingredient) => ({
      name: ingredient.name,
      fractionBasisPoints:
        typeof ingredient.percentEstimate === 'number'
          ? Math.round(ingredient.percentEstimate * BASIS_POINTS_PER_PERCENT)
          : null,
      comparator: DEFAULT_INGREDIENT_COMPARATOR,
    }))
  return ingredients.length ? ingredients : undefined
}

const mapNutrients = (
  product: OpenFoodFactsProduct,
): ProductFormValues['nutrients'] | undefined => {
  const nutriments = product.nutriments ?? {}
  const nutrients = Object.entries(nutriments)
    .filter(
      ([field, amount]) =>
        field.endsWith(NUTRIMENT_FIELD_SUFFIX) &&
        !field.startsWith('energy-') &&
        !isOpenFoodFactsEstimatedNutrimentField(field) &&
        typeof amount === 'number',
    )
    .map(([field, amount]) => {
      const baseField = field.slice(0, -NUTRIMENT_FIELD_SUFFIX.length)
      const unitValue = nutriments[`${baseField}${NUTRIMENT_UNIT_SUFFIX}`]
      return {
        amount,
        field,
        name: OPEN_FOOD_FACTS_NUTRIENT_FIELD_TO_NAME[field] ?? toEnglishNutrientName(baseField),
        unit: typeof unitValue === 'string' ? unitValue : NutrientUnit.Gram,
      }
    })
    .filter(
      (
        nutrient,
      ): nutrient is {
        amount: number
        field: string
        name: string
        unit: NutrientUnit
      } => isSupportedNutrientUnit(nutrient.unit),
    )
    .map((nutrient) => ({
      name: nutrient.name,
      amountMicrograms: Math.round(nutrient.amount * MICROGRAMS_PER_UNIT[nutrient.unit]),
    }))
  return nutrients.length ? sortNutrientsByHierarchy(nutrients) : undefined
}

export const mapOpenFoodFactsProductToFormValues = (
  product: OpenFoodFactsProduct,
): Partial<ProductFormValues> => {
  const values: Partial<ProductFormValues> = {}

  const name = mapName(product)
  if (name !== undefined) values.name = name

  const brand = mapBrand(product)
  if (brand !== undefined) values.brand = brand

  const description = mapDescription(product)
  if (description !== undefined) values.description = description

  const energyJoules = mapEnergyJoules(product)
  if (energyJoules !== undefined) values.energyJoules = energyJoules

  const allergens = mapAllergens(product)
  if (allergens !== undefined) values.allergens = allergens

  const isOrganic = mapIsOrganic(product)
  if (isOrganic !== undefined) values.isOrganic = isOrganic

  const ingredients = mapIngredients(product)
  if (ingredients !== undefined) values.ingredients = ingredients

  const nutrients = mapNutrients(product)
  if (nutrients !== undefined) values.nutrients = nutrients

  return values
}
