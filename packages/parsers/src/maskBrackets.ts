const OPENING_BRACKETS = '([{'
const CLOSING_BRACKETS = ')]}'
const MASK_CHARACTER = ' '

export const maskBrackets = (text: string): string => {
  let depth = 0
  let maskedText = ''
  for (const character of text) {
    if (CLOSING_BRACKETS.includes(character)) depth = Math.max(0, depth - 1)
    maskedText += depth > 0 ? MASK_CHARACTER.repeat(character.length) : character
    if (OPENING_BRACKETS.includes(character)) depth += 1
  }
  return maskedText
}
