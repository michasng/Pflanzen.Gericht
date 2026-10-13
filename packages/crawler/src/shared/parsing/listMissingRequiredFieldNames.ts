import type { ParsedQuantity } from '../parsing/parseQuantity.js'

export const listMissingRequiredFieldNames = (fields: {
  brand: string | null
  quantity: ParsedQuantity | null
}): string[] =>
  [fields.brand ? null : 'brand', fields.quantity ? null : 'quantity'].filter(
    (fieldName) => fieldName !== null,
  )
