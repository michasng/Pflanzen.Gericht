import type { IngredientLanguage } from './ingredientLanguage.js'
import { OrganicDeclaration } from './organicDeclaration.js'

const WHITESPACE_PATTERN = /\s+/g
const SPACE = ' '

const containsAny = (lowerCaseText: string, phrases: string[]): boolean =>
  phrases.some((phrase) => lowerCaseText.includes(phrase.toLowerCase()))

export const findOrganicDeclaration = (
  textAfterList: string,
  language: IngredientLanguage,
): OrganicDeclaration => {
  const lowerCaseText = textAfterList.replace(WHITESPACE_PATTERN, SPACE).toLowerCase()
  if (!containsAny(lowerCaseText, language.organicKeywords)) return OrganicDeclaration.None
  if (containsAny(lowerCaseText, language.allIngredientsOrganicPhrases))
    return OrganicDeclaration.AllIngredients
  return OrganicDeclaration.MarkedIngredients
}
