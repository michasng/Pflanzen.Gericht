import { BASIS_POINTS_PER_PERCENT } from '@/lib/basisPoints'

export const parsePercentInputToBasisPoints = (input: string): number | null => {
  const normalized = input.trim().replace(',', '.')
  if (!normalized) return null
  const percent = Number(normalized)
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) return null
  return Math.round(percent * BASIS_POINTS_PER_PERCENT)
}
