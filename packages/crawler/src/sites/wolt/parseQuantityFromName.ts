import { parseQuantity, type ParsedQuantity } from '../../shared/parsing/parseQuantity.js'

const NAME_SEGMENT_SEPARATOR = ', '

// Wolt product names end with their size, e.g. "Alpro Haferdrink, ohne Zucker, 1 l".
export const parseQuantityFromName = (name: string): ParsedQuantity | null =>
  parseQuantity(name.split(NAME_SEGMENT_SEPARATOR).at(-1) ?? '')
