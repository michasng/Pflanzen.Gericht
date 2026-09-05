import { describe, expect, it } from 'vitest'
import { BASIS_POINTS_PER_WHOLE } from '../basisPoints'
import { formatFractionBasisPointsAsPercent } from '../formatFractionBasisPointsAsPercent'

describe('formatFractionBasisPointsAsPercent', () => {
  it('formats a small fraction using German locale', () =>
    expect(formatFractionBasisPointsAsPercent(50)).toBe('0,5 %'))
  it('formats a whole percent without decimals', () =>
    expect(formatFractionBasisPointsAsPercent(500)).toBe('5 %'))
  it('formats a trace amount with two decimals', () =>
    expect(formatFractionBasisPointsAsPercent(1)).toBe('0,01 %'))
  it('formats 100 %', () =>
    expect(formatFractionBasisPointsAsPercent(BASIS_POINTS_PER_WHOLE)).toBe('100 %'))
})
