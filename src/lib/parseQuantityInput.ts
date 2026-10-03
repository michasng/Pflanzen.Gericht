import { QUANTITY_INPUT_UNIT_STORAGE, type QuantityInputUnit } from '@/config/quantity'
import type { ProductFormQuantity } from '@/types/productForm'

const ROUNDING_TOLERANCE = 1e-6

export const parseQuantityInput = (
  input: string,
  inputUnit: QuantityInputUnit,
): ProductFormQuantity | null => {
  const normalized = input.trim().replace(',', '.')
  if (!normalized) return null
  const amount = Number(normalized)
  if (!Number.isFinite(amount)) return null
  const { unit, factor } = QUANTITY_INPUT_UNIT_STORAGE[inputUnit]
  const scaledValue = amount * factor
  const value = Math.round(scaledValue)
  if (Math.abs(scaledValue - value) > ROUNDING_TOLERANCE) return null
  if (value <= 0) return null
  return { unit, value }
}
