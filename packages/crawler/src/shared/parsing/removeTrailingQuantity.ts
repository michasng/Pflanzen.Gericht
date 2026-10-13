import { QUANTITY_TEXT_SOURCE } from './parseQuantity.js'

const TRAILING_QUANTITY_PATTERN = new RegExp(`(?:^|[,\\s]+)${QUANTITY_TEXT_SOURCE}\\s*$`, 'i')

export const removeTrailingQuantity = (name: string): string =>
  name.replace(TRAILING_QUANTITY_PATTERN, '').trim()
