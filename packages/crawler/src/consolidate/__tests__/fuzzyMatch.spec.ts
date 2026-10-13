import { describe, expect, it } from 'vitest'
import {
  areProductsSameByFuzzyMatch,
  getSignificantWordSet,
  normalizeBrandForMatch,
} from '../fuzzyMatch.js'

describe('normalizeBrandForMatch', () => {
  it('given a brand with mixed case and surrounding whitespace, lowercases and trims it', () => {
    expect(normalizeBrandForMatch('  Alpro ')).toBe('alpro')
  })

  it('given a null brand, returns an empty string', () => {
    expect(normalizeBrandForMatch(null)).toBe('')
  })
})

describe('getSignificantWordSet', () => {
  it('given a name with short and long words, drops words with 3 or fewer letters', () => {
    expect(getSignificantWordSet('Bio Tofu Natur mit Kräutern')).toEqual(
      new Set(['tofu', 'natur', 'kräutern']),
    )
  })

  it('given a name with mixed case, lowercases the remaining words', () => {
    expect(getSignificantWordSet('VEGANE SCHNITZEL')).toEqual(new Set(['vegane', 'schnitzel']))
  })
})

describe('areProductsSameByFuzzyMatch', () => {
  it('given identical brand and identical significant words in different order, matches', () => {
    const a = { name: 'Tofu Natur Bio', brand: 'Alpro' }
    const b = { name: 'Bio Tofu Natur', brand: 'alpro' }
    expect(areProductsSameByFuzzyMatch(a, b)).toBe(true)
  })

  it('given both brands blank, still compares by name words', () => {
    const a = { name: 'Vegane Schnitzel', brand: null }
    const b = { name: 'Vegane Schnitzel', brand: '' }
    expect(areProductsSameByFuzzyMatch(a, b)).toBe(true)
  })

  it('given different brands, does not match even with identical names', () => {
    const a = { name: 'Tofu Natur', brand: 'Alpro' }
    const b = { name: 'Tofu Natur', brand: 'Taifun' }
    expect(areProductsSameByFuzzyMatch(a, b)).toBe(false)
  })

  it('given an extra significant word in one name, does not match', () => {
    const a = { name: 'Tofu Natur Bio', brand: 'Alpro' }
    const b = { name: 'Tofu Natur Geräuchert Bio', brand: 'Alpro' }
    expect(areProductsSameByFuzzyMatch(a, b)).toBe(false)
  })
})
