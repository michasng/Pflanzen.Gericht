export enum NutrientUnit {
  Gram = 'g',
  Milligram = 'mg',
  Microgram = 'µg',
}

export const NUTRIENT_UNIT_LABELS: Record<NutrientUnit, string> = {
  [NutrientUnit.Gram]: 'g',
  [NutrientUnit.Milligram]: 'mg',
  [NutrientUnit.Microgram]: 'µg',
}
export const NUTRIENT_UNITS = Object.values(NutrientUnit)
export const DEFAULT_NUTRIENT_UNIT = NutrientUnit.Gram

export const MICROGRAMS_PER_UNIT: Record<NutrientUnit, number> = {
  [NutrientUnit.Gram]: 1_000_000,
  [NutrientUnit.Milligram]: 1_000,
  [NutrientUnit.Microgram]: 1,
}

export interface NutrientLike {
  name: string
  amountMicrograms: number
}
