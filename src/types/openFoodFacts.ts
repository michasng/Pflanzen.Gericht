export interface OpenFoodFactsIngredient {
  text?: string
  percent_estimate?: number
}

export interface OpenFoodFactsProduct {
  product_name?: string
  brands?: string
  generic_name?: string
  ingredients_text?: string
  labels_tags?: string[]
  allergens_tags?: string[]
  nutriments?: Record<string, number>
  ingredients?: OpenFoodFactsIngredient[]
}

export interface OpenFoodFactsApiResponse {
  status: number
  product?: OpenFoodFactsProduct
}
