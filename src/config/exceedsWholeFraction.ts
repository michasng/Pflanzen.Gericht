import { BASIS_POINTS_PER_WHOLE } from '@/lib/basisPoints'

export const exceedsWholeFraction = (totalBasisPoints: number): boolean =>
  totalBasisPoints > BASIS_POINTS_PER_WHOLE
