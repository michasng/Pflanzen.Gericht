const WORD_PATTERN = /\S+/g
const NON_ALPHANUMERIC_PATTERN = /[^\p{L}\p{N}]/gu
const DIACRITIC_MARK_PATTERN = /\p{M}/gu
const LEADING_SEPARATORS_PATTERN = /^[\s,\-–:]+/

// Names spell brands loosely, e.g. "MushRoots" for "Mush Roots" or "Rügenwälder" for "Rügenwalder".
const toComparableText = (text: string): string =>
  text
    .normalize('NFD')
    .replace(DIACRITIC_MARK_PATTERN, '')
    .replace(NON_ALPHANUMERIC_PATTERN, '')
    .toLowerCase()

const listWordEndIndices = (text: string): number[] =>
  [...text.matchAll(WORD_PATTERN)].map((match) => match.index + match[0].length)

export const removeBrandPrefix = (name: string, brand: string | null): string => {
  const comparableBrand = toComparableText(brand ?? '')
  if (!comparableBrand) return name
  const brandEndIndex = listWordEndIndices(name).find(
    (wordEndIndex) => toComparableText(name.slice(0, wordEndIndex)) === comparableBrand,
  )
  if (brandEndIndex === undefined) return name
  const nameWithoutBrand = name.slice(brandEndIndex).replace(LEADING_SEPARATORS_PATTERN, '')
  return nameWithoutBrand || name
}
