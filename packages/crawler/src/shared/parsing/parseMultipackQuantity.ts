import { parseFractionalQuantity, parseQuantity, type ParsedQuantity } from './parseQuantity.js'

const MULTIPACK_PATTERN = /^(\d+)\s*x\s*(.+)$/i

/** Parses a single size like "400g" or a multipack like "2x100g", whose total is the product. */
export const parseMultipackQuantity = (text: string): ParsedQuantity | null => {
  const match = MULTIPACK_PATTERN.exec(text.trim())
  const packCountText = match?.[1]
  const packSizeText = match?.[2]
  if (!packCountText || !packSizeText) return parseQuantity(text)

  const packSize = parseFractionalQuantity(packSizeText)
  if (!packSize) return null
  return {
    unit: packSize.unit,
    value: Math.round(packSize.value * Number.parseInt(packCountText, 10)),
  }
}
