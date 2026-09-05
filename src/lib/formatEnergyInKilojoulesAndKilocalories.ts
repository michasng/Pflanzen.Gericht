import { KILOJOULES_PER_KILOCALORIE } from '@/config/energy'

export const formatEnergyInKilojoulesAndKilocalories = (kilojoules: number): string => {
  const kilocalories = Math.round(kilojoules / KILOJOULES_PER_KILOCALORIE)
  const formatNumber = new Intl.NumberFormat('de-DE').format
  return `${formatNumber(kilojoules)} kJ (${formatNumber(kilocalories)} kcal)`
}
