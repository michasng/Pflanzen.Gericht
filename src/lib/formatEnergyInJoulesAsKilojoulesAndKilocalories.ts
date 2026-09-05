import { JOULES_PER_KILOCALORIE, JOULES_PER_KILOJOULE } from '@/config/energy'

export const formatEnergyInJoulesAsKilojoulesAndKilocalories = (energyJoules: number): string => {
  const kilojoules = Math.round(energyJoules / JOULES_PER_KILOJOULE)
  const kilocalories = Math.round(energyJoules / JOULES_PER_KILOCALORIE)
  const formatNumber = new Intl.NumberFormat('de-DE').format
  return `${formatNumber(kilojoules)} kJ (${formatNumber(kilocalories)} kcal)`
}
