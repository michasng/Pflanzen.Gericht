import { extractFraction } from './extractFraction.js'
import {
  FOOTNOTE_MARKER_PATTERN,
  FOOTNOTE_MARKERS_BETWEEN_LETTERS_PATTERN,
  FOOTNOTE_MARKERS_PATTERN,
} from './footnoteMarkers.js'
import type { IngredientCandidate } from './ingredientCandidate.js'
import { maskBrackets } from './maskBrackets.js'

const WHITESPACE_PATTERN = /\s+/g
const LETTER_PATTERN = /\p{L}/u
const SPACE = ' '
const ORGANIC_PREFIX_SEPARATOR = '-'

const findOrganicPrefixLength = (name: string, organicKeywords: string[]): number => {
  const lowerCaseName = name.toLowerCase()
  const organicPrefix = organicKeywords
    .map((keyword) => `${keyword.toLowerCase()}${ORGANIC_PREFIX_SEPARATOR}`)
    .find((prefix) => lowerCaseName.startsWith(prefix))
  return organicPrefix?.length ?? 0
}

export const parseIngredientCandidate = (
  segment: string,
  organicKeywords: string[],
): IngredientCandidate | undefined => {
  const { textWithoutFraction, fractionBasisPoints } = extractFraction(segment)
  const hasFootnoteMarker = FOOTNOTE_MARKER_PATTERN.test(maskBrackets(textWithoutFraction))
  const cleanedName = textWithoutFraction
    .replace(FOOTNOTE_MARKERS_BETWEEN_LETTERS_PATTERN, SPACE)
    .replace(FOOTNOTE_MARKERS_PATTERN, '')
    .replace(WHITESPACE_PATTERN, SPACE)
    .trim()
  const organicPrefixLength = findOrganicPrefixLength(cleanedName, organicKeywords)
  const name = cleanedName.slice(organicPrefixLength)
  if (!LETTER_PATTERN.test(name)) return undefined
  return { name, fractionBasisPoints, hasFootnoteMarker, hasOrganicPrefix: organicPrefixLength > 0 }
}
