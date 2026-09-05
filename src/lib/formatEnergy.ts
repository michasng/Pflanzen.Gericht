import { JOULES_PER_KILOCALORIE, JOULES_PER_KILOJOULE } from '@/config/energy'

export const formatEnergy = (energyJoules: number): string => {
  const kilojoules = energyJoules / JOULES_PER_KILOJOULE
  const kilocalories = Math.round(energyJoules / JOULES_PER_KILOCALORIE)
  const formatKilojoules = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 3 }).format
  const formatKilocalories = new Intl.NumberFormat('de-DE').format
  return `${formatKilojoules(kilojoules)} kJ (${formatKilocalories(kilocalories)} kcal)`
}
