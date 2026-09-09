import type { Allergen } from '@/config/taxonomy'

export const OPEN_FOOD_FACTS_API_BASE_URL = 'https://world.openfoodfacts.org/api/v2/product'

export const OPEN_FOOD_FACTS_ORGANIC_LABEL_TAG = 'en:organic'

export const OPEN_FOOD_FACTS_ALLERGEN_TAG_TO_ALLERGEN: Record<string, Allergen> = {
  'en:gluten': 'gluten',
  'en:soybeans': 'soy',
  'en:nuts': 'nuts',
  'en:tree-nuts': 'nuts',
}

export const OPEN_FOOD_FACTS_ENERGY_NUTRIMENT_FIELD = 'energy-kj_100g'

export const OPEN_FOOD_FACTS_NUTRIENT_FIELD_TO_NAME: Record<string, string> = {
  fat_100g: 'Fett',
  'saturated-fat_100g': 'Gesättigte Fettsäuren',
  carbohydrates_100g: 'Kohlenhydrate',
  sugars_100g: 'Zucker',
  'added-sugars_100g': 'Zugesetzter Zucker',
  fiber_100g: 'Ballaststoffe',
  proteins_100g: 'Eiweiß',
  salt_100g: 'Salz',
}

export const OPEN_FOOD_FACTS_ESTIMATE_NUTRIMENT_SEGMENT = 'estimate'

export const isOpenFoodFactsEstimatedNutrimentField = (field: string): boolean =>
  field.split(/[-_]/).includes(OPEN_FOOD_FACTS_ESTIMATE_NUTRIMENT_SEGMENT)
