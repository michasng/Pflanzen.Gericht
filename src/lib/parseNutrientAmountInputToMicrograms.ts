import { MICROGRAMS_PER_UNIT, type NutrientUnit } from '@/config/nutrients'

export const parseNutrientAmountInputToMicrograms = (
  input: string,
  unit: NutrientUnit,
): number | null => {
  const normalized = input.trim().replace(',', '.')
  if (!normalized) return null
  const amount = Number(normalized)
  if (!Number.isFinite(amount) || amount < 0) return null
  return Math.round(amount * MICROGRAMS_PER_UNIT[unit])
}
