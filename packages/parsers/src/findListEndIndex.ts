import { findWholeWordIndex } from './findWholeWordIndex.js'
import { INLINE_FOOTNOTE_START_PATTERN, LINE_FOOTNOTE_START_PATTERN } from './footnoteMarkers.js'
import type { IngredientLanguage } from './ingredientLanguage.js'

const NOT_FOUND_INDEX = -1
const PERIOD_NOT_BETWEEN_DIGITS_PATTERN = /(?<!\d)\.|\.(?!\d)/g
const BLANK_LINE_PATTERN = /\n\s*\n/
const BULLET_PATTERN = /•/
const STATIC_LIST_END_PATTERNS = [
  BLANK_LINE_PATTERN,
  INLINE_FOOTNOTE_START_PATTERN,
  LINE_FOOTNOTE_START_PATTERN,
  BULLET_PATTERN,
]
const LETTER_PATTERN = /\p{L}/u
const NON_WHITESPACE_PATTERN = /\S/

const isEndOfAbbreviation = (
  maskedText: string,
  periodIndex: number,
  abbreviations: string[],
): boolean => {
  const lowerCaseTextUntilPeriod = maskedText.slice(0, periodIndex + 1).toLowerCase()
  return abbreviations.some((abbreviation) => {
    if (!lowerCaseTextUntilPeriod.endsWith(abbreviation.toLowerCase())) return false
    const characterBeforeAbbreviation =
      lowerCaseTextUntilPeriod[lowerCaseTextUntilPeriod.length - abbreviation.length - 1] ?? ''
    return !LETTER_PATTERN.test(characterBeforeAbbreviation)
  })
}

const findSentenceEndIndex = (maskedText: string, language: IngredientLanguage): number => {
  for (const match of maskedText.matchAll(PERIOD_NOT_BETWEEN_DIGITS_PATTERN)) {
    if (!isEndOfAbbreviation(maskedText, match.index, language.abbreviations)) return match.index
  }
  return NOT_FOUND_INDEX
}

const findListEndCandidateIndices = (
  maskedText: string,
  language: IngredientLanguage,
): number[] => [
  findSentenceEndIndex(maskedText, language),
  ...STATIC_LIST_END_PATTERNS.map((pattern) => maskedText.search(pattern)),
  ...language.listEndKeywords.map((keyword) => findWholeWordIndex(maskedText, keyword)),
]

export const findListEndIndex = (maskedText: string, language: IngredientLanguage): number => {
  const contentStartIndex = maskedText.search(NON_WHITESPACE_PATTERN)
  return Math.min(
    maskedText.length,
    ...findListEndCandidateIndices(maskedText, language).filter(
      (index) => index > contentStartIndex,
    ),
  )
}
