import { QUANTITY_TEXT_SOURCE } from '../../shared/parsing/parseQuantity.js'
import { removeTrailingQuantity } from '../../shared/parsing/removeTrailingQuantity.js'
import { removeBrandPrefix } from './removeBrandPrefix.js'

const TRAILING_MULTIPACK_QUANTITY_PATTERN = new RegExp(
  String.raw`\s+\d+\s*x\s*${QUANTITY_TEXT_SOURCE}\s*$`,
  'i',
)
const TRAILING_VEGAN_PATTERN = /\s+vegan$/i

/** Strips what REWE packs around the actual product name: brand prefix, "vegan" postfix and pack size. */
export const cleanReweProductName = (productName: string, brand: string | null): string => {
  const nameWithoutQuantity = removeTrailingQuantity(
    productName.replace(TRAILING_MULTIPACK_QUANTITY_PATTERN, ''),
  )
  const nameWithoutVegan = nameWithoutQuantity.replace(TRAILING_VEGAN_PATTERN, '')
  return removeBrandPrefix(nameWithoutVegan, brand)
}
