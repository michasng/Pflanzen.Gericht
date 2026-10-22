import { maskBrackets } from './maskBrackets.js'

const LEADING_HEADING_PATTERN = /^[^,;.:\n]*:/

export const removeLeadingHeading = (ingredientListText: string): string => {
  const trimmedText = ingredientListText.trimStart()
  const headingLength = LEADING_HEADING_PATTERN.exec(maskBrackets(trimmedText))?.[0].length ?? 0
  return trimmedText.slice(headingLength)
}
