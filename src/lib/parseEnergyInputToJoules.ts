import { EnergyUnit, JOULES_PER_ENERGY_UNIT } from '@/config/energy'

const JOULE_ROUNDING_TOLERANCE = 1e-6

export const parseEnergyInputToJoules = (input: string, unit: EnergyUnit): number | null => {
  const normalized = input.trim().replace(',', '.')
  if (!normalized) return null
  const amount = Number(normalized)
  if (!Number.isFinite(amount) || amount < 0) return null
  const joules = amount * JOULES_PER_ENERGY_UNIT[unit]
  const roundedJoules = Math.round(joules)
  const isRepresentableAsWholeJoules = Math.abs(joules - roundedJoules) <= JOULE_ROUNDING_TOLERANCE
  if (!isRepresentableAsWholeJoules) return null
  return roundedJoules
}
