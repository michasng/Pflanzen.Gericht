export interface OpenFoodFactsIngredient {
  text?: string
  percent_estimate?: number
  labels?: string
}

export type OpenFoodFactsNutrimentValue = number | string

export interface OpenFoodFactsProduct {
  product_name?: string
  product_name_de?: string
  product_name_en?: string
  brands?: string
  generic_name?: string
  lang?: string
  ingredients_text?: string
  ingredients_text_de?: string
  ingredients_text_en?: string
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
