import { maskBrackets } from './maskBrackets.js'

const SEPARATORS = ',;'
const DECIMAL_COMMA = ','
const DIGIT_PATTERN = /\d/

const isDigit = (character: string | undefined): boolean =>
  character !== undefined && DIGIT_PATTERN.test(character)

const isSeparator = (maskedText: string, index: number): boolean => {
  const character = maskedText[index] ?? ''
  if (!SEPARATORS.includes(character)) return false
  const isDecimalComma =
    character === DECIMAL_COMMA && isDigit(maskedText[index - 1]) && isDigit(maskedText[index + 1])
  return !isDecimalComma
}

export const splitIngredientList = (text: string): string[] => {
  const maskedText = maskBrackets(text)
  const segments: string[] = []
  let segmentStartIndex = 0
  for (let index = 0; index < maskedText.length; index += 1) {
    if (!isSeparator(maskedText, index)) continue
    segments.push(text.slice(segmentStartIndex, index))
    segmentStartIndex = index + 1
  }
  segments.push(text.slice(segmentStartIndex))
  return segments
}
