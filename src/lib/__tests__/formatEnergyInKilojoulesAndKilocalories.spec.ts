import { describe, expect, it } from 'vitest'
import { formatEnergyInKilojoulesAndKilocalories } from '../formatEnergyInKilojoulesAndKilocalories'

describe('formatEnergyInKilojoulesAndKilocalories', () => {
  it('formats kJ with the converted kcal in parentheses', () =>
    expect(formatEnergyInKilojoulesAndKilocalories(1500)).toBe('1.500 kJ (359 kcal)'))
  it('rounds kcal to the nearest whole number', () =>
    expect(formatEnergyInKilojoulesAndKilocalories(418)).toBe('418 kJ (100 kcal)'))
  it('formats zero kJ', () =>
    expect(formatEnergyInKilojoulesAndKilocalories(0)).toBe('0 kJ (0 kcal)'))
})
