export interface IngredientWrite {
  name: string
  fraction_basis_points: number | null
  comparator: string
}

export interface NutrientWrite {
  name: string
  amount_micrograms: number
}
