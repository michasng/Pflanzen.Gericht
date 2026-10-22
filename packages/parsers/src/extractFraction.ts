import { maskBrackets } from './maskBrackets.js'

const BASIS_POINTS_PER_PERCENT = 100
const PERCENT_PATTERN = /(\d+(?:[.,]\d+)?)\s*%/
// Content is masked, so this matches exactly the brackets at top level.
const TOP_LEVEL_BRACKETS_PATTERN = /[([{] *[)\]}]/g
// A percentage alone in brackets, optionally prefixed with an abbreviation like "mind.".
const BRACKETED_PERCENT_PATTERN = /^\s*(?:\p{L}+\.\s*)?(\d+(?:[.,]\d+)?)\s*%\s*$/u
const DECIMAL_COMMA = ','
const DECIMAL_POINT = '.'

interface ExtractedFraction {
  textWithoutFraction: string
  fractionBasisPoints: number | null
}

const toBasisPoints = (percentText: string): number =>
  Math.round(
    Number.parseFloat(percentText.replace(DECIMAL_COMMA, DECIMAL_POINT)) * BASIS_POINTS_PER_PERCENT,
  )

const removeRange = (text: string, startIndex: number, endIndex: number): string =>
  `${text.slice(0, startIndex)} ${text.slice(endIndex)}`

const extractTopLevelFraction = (
  segment: string,
  maskedSegment: string,
): ExtractedFraction | undefined => {
  const match = PERCENT_PATTERN.exec(maskedSegment)
  const percentText = match?.[1]
  if (!match || !percentText) return undefined
  return {
    textWithoutFraction: removeRange(segment, match.index, match.index + match[0].length),
    fractionBasisPoints: toBasisPoints(percentText),
  }
}

const extractBracketedFraction = (
  segment: string,
  maskedSegment: string,
): ExtractedFraction | undefined => {
  for (const match of maskedSegment.matchAll(TOP_LEVEL_BRACKETS_PATTERN)) {
    const endIndex = match.index + match[0].length
    const bracketContent = segment.slice(match.index + 1, endIndex - 1)
    const percentText = BRACKETED_PERCENT_PATTERN.exec(bracketContent)?.[1]
    if (!percentText) continue
    return {
      textWithoutFraction: removeRange(segment, match.index, endIndex),
      fractionBasisPoints: toBasisPoints(percentText),
    }
  }
  return undefined
}

export const extractFraction = (segment: string): ExtractedFraction => {
  const maskedSegment = maskBrackets(segment)
  return (
    extractTopLevelFraction(segment, maskedSegment) ??
    extractBracketedFraction(segment, maskedSegment) ?? {
      textWithoutFraction: segment,
      fractionBasisPoints: null,
    }
  )
}
