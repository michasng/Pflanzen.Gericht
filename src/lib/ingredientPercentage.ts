const MIN_INGREDIENT_PERCENTAGE = 0
const MAX_INGREDIENT_PERCENTAGE = 100

export const parsePercentageInput = (input: string): number | null => {
  const trimmed = input.trim()
  if (!trimmed) return null

  const parsed = Number(trimmed.replace(',', '.'))
  if (!Number.isFinite(parsed)) return null

  return Math.min(MAX_INGREDIENT_PERCENTAGE, Math.max(MIN_INGREDIENT_PERCENTAGE, parsed))
}
