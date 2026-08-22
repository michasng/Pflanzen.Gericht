export const formatEuroCents = (cents: number): string =>
  (cents / 100).toFixed(2).replace('.', ',') + ' €'

export const parseEurosToCents = (input: string): number | null => {
  const value = parseFloat(input.trim().replace(',', '.'))
  if (isNaN(value) || value < 0) return null
  return Math.round(value * 100)
}
