import { MICROGRAMS_PER_UNIT, NUTRIENT_UNIT_LABELS, NutrientUnit } from '@/config/nutrients'

const DISPLAY_UNITS_LARGEST_FIRST = [
  NutrientUnit.Gram,
  NutrientUnit.Milligram,
  NutrientUnit.Microgram,
]
const MINIMUM_DISPLAY_VALUE = 0.1

// each unit is 1000x the next, so dividing the microgram integer amount by it
// always yields an exact decimal with at most this many fraction digits
const MAXIMUM_FRACTION_DIGITS_BY_UNIT: Record<NutrientUnit, number> = {
  [NutrientUnit.Gram]: 6,
  [NutrientUnit.Milligram]: 3,
  [NutrientUnit.Microgram]: 0,
}

export const chooseNutrientDisplayUnit = (amountMicrograms: number): NutrientUnit =>
  DISPLAY_UNITS_LARGEST_FIRST.find(
    (unit) => amountMicrograms / MICROGRAMS_PER_UNIT[unit] >= MINIMUM_DISPLAY_VALUE,
  ) ?? NutrientUnit.Microgram

export const formatNutrientAmountValue = (amountMicrograms: number, unit: NutrientUnit): string => {
  const value = amountMicrograms / MICROGRAMS_PER_UNIT[unit]
  return new Intl.NumberFormat('de-DE', {
    maximumFractionDigits: MAXIMUM_FRACTION_DIGITS_BY_UNIT[unit],
  }).format(value)
}

export const formatNutrientAmount = (amountMicrograms: number): string => {
  const unit = chooseNutrientDisplayUnit(amountMicrograms)
  return `${formatNutrientAmountValue(amountMicrograms, unit)} ${NUTRIENT_UNIT_LABELS[unit]}`
}
