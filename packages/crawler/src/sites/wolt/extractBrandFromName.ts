export interface BrandAndName {
  brand: string
  nameWithoutBrand: string
}

const KNOWN_MULTI_WORD_BRANDS: readonly string[] = [
  'Billie Green',
  'Rügenwalder Mühle',
  'The Vegetarian Butcher',
  'Beyond Meat',
  'Garden Gourmet',
  'Like Meat',
  'Simply V',
]

const LEADING_SEPARATORS_PATTERN = /^[\s,\-–:]+/

const KNOWN_BRANDS_LONGEST_FIRST = [...KNOWN_MULTI_WORD_BRANDS].sort(
  (first, second) => second.length - first.length,
)

const startsWithWords = (name: string, brand: string): boolean => {
  if (!name.toLowerCase().startsWith(brand.toLowerCase())) return false
  const nextCharacter = name.charAt(brand.length)
  return nextCharacter === '' || /\s/.test(nextCharacter)
}

// Wolt has no brand field; the brand is the leading words of the product name.
export const extractBrandFromName = (name: string): BrandAndName | null => {
  const trimmedName = name.trim()
  const knownBrand = KNOWN_BRANDS_LONGEST_FIRST.find((brand) => startsWithWords(trimmedName, brand))
  const brand = knownBrand ?? trimmedName.split(/\s+/)[0]
  if (!brand) return null
  const nameWithoutBrand = trimmedName.slice(brand.length).replace(LEADING_SEPARATORS_PATTERN, '')
  return { brand: trimmedName.slice(0, brand.length), nameWithoutBrand }
}
