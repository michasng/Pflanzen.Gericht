import { describe, expect, it } from 'vitest'
import { formatEnergy } from '../formatEnergy'

describe('formatEnergy', () => {
  it('formats whole kilojoules with rounded kilocalories', () =>
    expect(formatEnergy(1500000)).toBe('1.500 kJ (359 kcal)'))
  it('preserves kilojoule precision up to three decimal places', () =>
    expect(formatEnergy(256789)).toBe('256,789 kJ (61 kcal)'))
  it('omits trailing kilojoule zeroes', () =>
    expect(formatEnergy(256800)).toBe('256,8 kJ (61 kcal)'))
  it('formats zero joules', () => expect(formatEnergy(0)).toBe('0 kJ (0 kcal)'))
})
