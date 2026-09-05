import { describe, expect, it } from 'vitest'
import { parseEnergyInputToKilojoules } from '../parseEnergyInputToKilojoules'
import { EnergyUnit } from '@/config/energy'

describe('parseEnergyInputToKilojoules', () => {
  it('parses kJ input as is', () =>
    expect(parseEnergyInputToKilojoules('1500', EnergyUnit.Kilojoule)).toBe(1500))
  it('converts kcal input to kJ', () =>
    expect(parseEnergyInputToKilojoules('100', EnergyUnit.Kilocalorie)).toBe(418))
  it('parses German comma notation', () =>
    expect(parseEnergyInputToKilojoules('150,5', EnergyUnit.Kilojoule)).toBe(151))
  it('returns null for empty input', () =>
    expect(parseEnergyInputToKilojoules('', EnergyUnit.Kilojoule)).toBeNull())
  it('returns null for text', () =>
    expect(parseEnergyInputToKilojoules('abc', EnergyUnit.Kilojoule)).toBeNull())
  it('returns null for negative values', () =>
    expect(parseEnergyInputToKilojoules('-1', EnergyUnit.Kilojoule)).toBeNull())
})
