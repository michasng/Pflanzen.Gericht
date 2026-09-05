import { EnergyUnit, KILOJOULES_PER_KILOCALORIE } from '@/config/energy'

export const parseEnergyInputToKilojoules = (input: string, unit: EnergyUnit): number | null => {
  const normalized = input.trim().replace(',', '.')
  if (!normalized) return null
  const amount = Number(normalized)
  if (!Number.isFinite(amount) || amount < 0) return null
  const kilojoules = unit === EnergyUnit.Kilocalorie ? amount * KILOJOULES_PER_KILOCALORIE : amount
  return Math.round(kilojoules)
}
