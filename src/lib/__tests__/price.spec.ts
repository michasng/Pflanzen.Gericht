import { describe, expect, it } from 'vitest'
import { formatEuroCents, parseEurosToCents } from '../price'

describe('formatEuroCents', () => {
  it('formats whole euros', () => expect(formatEuroCents(100)).toBe('1,00 €'))
  it('formats cents', () => expect(formatEuroCents(299)).toBe('2,99 €'))
  it('formats zero', () => expect(formatEuroCents(0)).toBe('0,00 €'))
})

describe('parseEurosToCents', () => {
  it('parses German comma notation', () => expect(parseEurosToCents('2,99')).toBe(299))
  it('parses dot notation', () => expect(parseEurosToCents('2.99')).toBe(299))
  it('parses whole number', () => expect(parseEurosToCents('3')).toBe(300))
  it('returns null for empty string', () => expect(parseEurosToCents('')).toBeNull())
  it('returns null for text', () => expect(parseEurosToCents('abc')).toBeNull())
  it('returns null for negative', () => expect(parseEurosToCents('-1')).toBeNull())
})
