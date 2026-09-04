import { BASIS_POINTS_PER_PERCENT } from '@/lib/basisPoints'

export const formatFractionBasisPointsAsPercent = (basisPoints: number): string =>
  new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 }).format(
    basisPoints / BASIS_POINTS_PER_PERCENT,
  ) + ' %'
