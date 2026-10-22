const WORD_CHARACTER_PATTERN = /[\p{L}\d]/u
const NOT_FOUND_INDEX = -1

const isWordCharacter = (character: string | undefined): boolean =>
  character !== undefined && WORD_CHARACTER_PATTERN.test(character)

export const findWholeWordIndex = (text: string, word: string): number => {
  const lowerCaseText = text.toLowerCase()
  const lowerCaseWord = word.toLowerCase()
  let index = lowerCaseText.indexOf(lowerCaseWord)
  while (index !== NOT_FOUND_INDEX) {
    const isStartOfWord = !isWordCharacter(text[index - 1])
    const isEndOfWord = !isWordCharacter(text[index + word.length])
    if (isStartOfWord && isEndOfWord) return index
    index = lowerCaseText.indexOf(lowerCaseWord, index + 1)
  }
  return NOT_FOUND_INDEX
}
