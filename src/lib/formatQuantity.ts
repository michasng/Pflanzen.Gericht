import {
  QUANTITY_UNIT_LABELS,
  QuantityUnit,
  UNITS_PER_LARGE_QUANTITY_UNIT,
} from '@/config/quantity'
import type { ProductFormQuantity } from '@/types/productForm'

const LARGE_UNIT_LABELS: Partial<Record<QuantityUnit, string>> = {
  [QuantityUnit.Milliliter]: 'l',
  [QuantityUnit.Gram]: 'kg',
}

const formatNumber = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 3 }).format

export const formatQuantity = ({ unit, value }: ProductFormQuantity): string => {
  const largeUnitLabel = LARGE_UNIT_LABELS[unit]
  if (largeUnitLabel && value >= UNITS_PER_LARGE_QUANTITY_UNIT) {
    return `${formatNumber(value / UNITS_PER_LARGE_QUANTITY_UNIT)} ${largeUnitLabel}`
  }
  return `${formatNumber(value)} ${QUANTITY_UNIT_LABELS[unit]}`
}
