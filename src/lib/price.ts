export function formatEuroCents(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',') + ' €'
}

export function parseEurosToCents(input: string): number | null {
  const value = parseFloat(input.trim().replace(',', '.'))
  if (isNaN(value) || value < 0) return null
  return Math.round(value * 100)
}
