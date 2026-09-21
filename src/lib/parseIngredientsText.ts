import { OPEN_FOOD_FACTS_ORGANIC_INGREDIENT_SUFFIX } from '@/config/openFoodFacts'
import { BASIS_POINTS_PER_PERCENT } from '@/lib/basisPoints'
import { DEFAULT_INGREDIENT_COMPARATOR, type IngredientLike } from '@/config/ingredients'

const PERCENT_PATTERN = /(\d+(?:[.,]\d+)?)\s*%/
const ASTERISK_PATTERN = /\*/g
const ASTERISK_CHARACTER = '*'
const SENTENCE_SEPARATOR = '.'
const TOP_LEVEL_SEPARATOR = ','

const containsOrganicKeyword = (text: string, organicKeywords: string[]): boolean => {
  const lowerCaseText = text.toLowerCase()
  return organicKeywords.some((keyword) => lowerCaseText.includes(keyword.toLowerCase()))
}

const splitTopLevel = (text: string, separator: string): string[] => {
  const segments: string[] = []
  let depth = 0
  let currentSegment = ''
  for (const character of text) {
    if (character === '(') depth += 1
    if (character === ')') depth = Math.max(0, depth - 1)
    if (character === separator && depth === 0) {
      segments.push(currentSegment)
      currentSegment = ''
      continue
    }
    currentSegment += character
  }
  segments.push(currentSegment)
  return segments
}

const extractPercent = (segment: string): { textWithoutPercent: string; percent?: number } => {
  const match = segment.match(PERCENT_PATTERN)
  const percentText = match?.[1]
  if (!percentText) return { textWithoutPercent: segment }
  const percent = Number.parseFloat(percentText.replace(',', '.'))
  return { textWithoutPercent: segment.replace(PERCENT_PATTERN, ''), percent }
}

const extractName = (rawName: string): { name: string; hasAsterisk: boolean } => {
  const hasAsterisk = rawName.includes(ASTERISK_CHARACTER)
  const name = rawName.replace(ASTERISK_PATTERN, '').trim()
  return { name, hasAsterisk }
}

const applyOrganicSuffix = (name: string, isOrganic: boolean): string =>
  isOrganic ? `${name}${OPEN_FOOD_FACTS_ORGANIC_INGREDIENT_SUFFIX}` : name

const toIngredient = (
  rawName: string,
  isTextOrganic: boolean,
  fractionBasisPoints: number | null,
): IngredientLike | undefined => {
  const { name, hasAsterisk } = extractName(rawName)
  if (!name) return undefined
  return {
    name: applyOrganicSuffix(name, hasAsterisk && isTextOrganic),
    fractionBasisPoints,
    comparator: DEFAULT_INGREDIENT_COMPARATOR,
  }
}

const parseSegment = (segment: string, isTextOrganic: boolean): IngredientLike[] => {
  const { textWithoutPercent, percent } = extractPercent(segment)
  const fractionBasisPoints =
    percent === undefined ? null : Math.round(percent * BASIS_POINTS_PER_PERCENT)

  const ingredient = toIngredient(textWithoutPercent, isTextOrganic, fractionBasisPoints)
  return ingredient ? [ingredient] : []
}

export const parseIngredientsText = (text: string, organicKeywords: string[]): IngredientLike[] => {
  const isTextOrganic = containsOrganicKeyword(text, organicKeywords)
  const mainText = text.split(SENTENCE_SEPARATOR)[0] ?? ''

  return splitTopLevel(mainText, TOP_LEVEL_SEPARATOR).flatMap((segment) =>
    parseSegment(segment, isTextOrganic),
  )
}
