// 1 basis point = 0.01 %; storing fractions this way (like price_euro_cents
// for money) keeps small amounts, e.g. "traces of" an ingredient, exact.
export const BASIS_POINTS_PER_PERCENT = 100
export const BASIS_POINTS_PER_WHOLE = 10000

export const formatFractionBasisPointsAsPercent = (basisPoints: number): string =>
  new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 }).format(
    basisPoints / BASIS_POINTS_PER_PERCENT,
  ) + ' %'

export const parsePercentInputToBasisPoints = (input: string): number | null => {
  const normalized = input.trim().replace(',', '.')
  if (!normalized) return null
  const percent = Number(normalized)
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) return null
  return Math.round(percent * BASIS_POINTS_PER_PERCENT)
}
