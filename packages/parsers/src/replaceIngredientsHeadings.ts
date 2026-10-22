import { findWholeWordIndex } from './findWholeWordIndex.js'

const NOT_FOUND_INDEX = -1
// Up to a few words between the heading keyword and its colon, e.g. "Zutaten Teig:".
const HEADING_REST_PATTERN = /^(?:[^\S\n]+[\p{L}-]+){0,3}[^\S\n]*:/u
const PRECEDING_LIST_END_PATTERN = /[.\s]*$/
const INGREDIENT_SEPARATOR = ', '

interface ReplacedChunk {
  replacement: string
  consumedLength: number
}

const replaceChunkUntilKeyword = (
  text: string,
  keywordIndex: number,
  keywordLength: number,
): ReplacedChunk => {
  const keywordEndIndex = keywordIndex + keywordLength
  const headingRest = HEADING_REST_PATTERN.exec(text.slice(keywordEndIndex))
  if (!headingRest)
    return { replacement: text.slice(0, keywordEndIndex), consumedLength: keywordEndIndex }

  const textBeforeHeading = text.slice(0, keywordIndex).replace(PRECEDING_LIST_END_PATTERN, '')
  return {
    replacement: textBeforeHeading + INGREDIENT_SEPARATOR,
    consumedLength: keywordEndIndex + headingRest[0].length,
  }
}

export const replaceIngredientsHeadings = (text: string, headingKeyword: string): string => {
  let replacedText = ''
  let remainingText = text
  let keywordIndex = findWholeWordIndex(remainingText, headingKeyword)
  while (keywordIndex !== NOT_FOUND_INDEX) {
    const { replacement, consumedLength } = replaceChunkUntilKeyword(
      remainingText,
      keywordIndex,
      headingKeyword.length,
    )
    replacedText += replacement
    remainingText = remainingText.slice(consumedLength)
    keywordIndex = findWholeWordIndex(remainingText, headingKeyword)
  }
  return replacedText + remainingText
}
