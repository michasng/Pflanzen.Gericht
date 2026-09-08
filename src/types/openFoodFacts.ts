export interface OpenFoodFactsIngredient {
  text?: string
  percent_estimate?: number
}

export type OpenFoodFactsNutrimentValue = number | string

export interface OpenFoodFactsProduct {
  product_name?: string
  brands?: string
  generic_name?: string
  ingredients_text?: string
  labels_tags?: string[]
  allergens_tags?: string[]
  nutriments?: Record<string, OpenFoodFactsNutrimentValue>
  ingredients?: OpenFoodFactsIngredient[]
  image_url?: string
}

export interface OpenFoodFactsApiResponse {
  status: number
  product?: OpenFoodFactsProduct
}
