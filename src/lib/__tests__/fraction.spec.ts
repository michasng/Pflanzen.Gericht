import { describe, expect, it } from 'vitest'
import {
  BASIS_POINTS_PER_WHOLE,
  formatFractionBasisPointsAsPercent,
  parsePercentInputToBasisPoints,
} from '../fraction'

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

describe('parsePercentInputToBasisPoints', () => {
  it('parses German comma notation', () => expect(parsePercentInputToBasisPoints('0,5')).toBe(50))
  it('parses dot notation', () => expect(parsePercentInputToBasisPoints('0.5')).toBe(50))
  it('parses whole numbers', () => expect(parsePercentInputToBasisPoints('12')).toBe(1200))
  it('rounds to the nearest basis point', () =>
    expect(parsePercentInputToBasisPoints('12.345')).toBe(1235))
  it('returns null for empty input', () => expect(parsePercentInputToBasisPoints('')).toBeNull())
  it('returns null for text', () => expect(parsePercentInputToBasisPoints('abc')).toBeNull())
  it('returns null for negative values', () =>
    expect(parsePercentInputToBasisPoints('-1')).toBeNull())
  it('returns null for values above 100', () =>
    expect(parsePercentInputToBasisPoints('101')).toBeNull())
})
