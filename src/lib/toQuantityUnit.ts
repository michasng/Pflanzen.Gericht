import { QuantityUnit } from '@/config/quantity'

export const toQuantityUnit = (unit: string): QuantityUnit => {
  const known = Object.values(QuantityUnit).find((candidate) => candidate === unit)
  if (known === undefined) throw new Error(`Unknown quantity unit: ${unit}`)
  return known
}
