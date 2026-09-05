import { describe, expect, it } from 'vitest'
import { parseEnergyInputToJoules } from '../parseEnergyInputToJoules'
import { EnergyUnit } from '@/config/energy'

describe('parseEnergyInputToJoules', () => {
  it('converts kJ input to joules', () =>
    expect(parseEnergyInputToJoules('1500', EnergyUnit.Kilojoule)).toBe(1500000))
  it('converts kcal input to joules', () =>
    expect(parseEnergyInputToJoules('100', EnergyUnit.Kilocalorie)).toBe(418400))
  it('parses German comma notation', () =>
    expect(parseEnergyInputToJoules('150,5', EnergyUnit.Kilojoule)).toBe(150500))
  it('returns null for empty input', () =>
    expect(parseEnergyInputToJoules('', EnergyUnit.Kilojoule)).toBeNull())
  it('returns null for text', () =>
    expect(parseEnergyInputToJoules('abc', EnergyUnit.Kilojoule)).toBeNull())
  it('returns null for negative values', () =>
    expect(parseEnergyInputToJoules('-1', EnergyUnit.Kilojoule)).toBeNull())
  it('returns null for kJ input too precise to represent as whole joules', () =>
    expect(parseEnergyInputToJoules('0,0001', EnergyUnit.Kilojoule)).toBeNull())
  it('returns null for kcal input too precise to represent as whole joules', () =>
    expect(parseEnergyInputToJoules('0,1', EnergyUnit.Kilocalorie)).toBeNull())
})
