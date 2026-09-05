import { describe, expect, it } from 'vitest'
import { formatEnergyInJoulesAsKilojoulesAndKilocalories } from '../formatEnergyInJoulesAsKilojoulesAndKilocalories'

describe('formatEnergyInJoulesAsKilojoulesAndKilocalories', () => {
  it('formats kJ with the converted kcal in parentheses', () =>
    expect(formatEnergyInJoulesAsKilojoulesAndKilocalories(1500000)).toBe('1.500 kJ (359 kcal)'))
  it('rounds kcal to the nearest whole number', () =>
    expect(formatEnergyInJoulesAsKilojoulesAndKilocalories(418400)).toBe('418 kJ (100 kcal)'))
  it('formats zero joules', () =>
    expect(formatEnergyInJoulesAsKilojoulesAndKilocalories(0)).toBe('0 kJ (0 kcal)'))
})
