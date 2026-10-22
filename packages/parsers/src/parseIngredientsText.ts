import { findListEndIndex } from './findListEndIndex.js'
import { findOrganicDeclaration } from './findOrganicDeclaration.js'
import type { IngredientCandidate } from './ingredientCandidate.js'
import type { IngredientLanguage } from './ingredientLanguage.js'
import { maskBrackets } from './maskBrackets.js'
import { OrganicDeclaration } from './organicDeclaration.js'
import { ORGANIC_INGREDIENT_SUFFIX } from './organicIngredients.js'
import type { ParsedIngredient } from './parsedIngredient.js'
import { parseIngredientCandidate } from './parseIngredientCandidate.js'
import { removeLeadingHeading } from './removeLeadingHeading.js'
import { replaceIngredientsHeadings } from './replaceIngredientsHeadings.js'
import { splitIngredientList } from './splitIngredientList.js'

const isCandidateOrganic = (
  candidate: IngredientCandidate,
  organicDeclaration: OrganicDeclaration,
): boolean => {
  if (candidate.hasOrganicPrefix) return true
  if (organicDeclaration === OrganicDeclaration.AllIngredients) return true
  if (organicDeclaration === OrganicDeclaration.MarkedIngredients)
    return candidate.hasFootnoteMarker
  return false
}

const toParsedIngredient = (
  candidate: IngredientCandidate,
  organicDeclaration: OrganicDeclaration,
): ParsedIngredient => ({
  name: isCandidateOrganic(candidate, organicDeclaration)
    ? `${candidate.name}${ORGANIC_INGREDIENT_SUFFIX}`
    : candidate.name,
  fractionBasisPoints: candidate.fractionBasisPoints,
})

export const parseIngredientsText = (
  text: string,
  language: IngredientLanguage,
): ParsedIngredient[] => {
  const textWithoutHeadings = replaceIngredientsHeadings(text, language.ingredientsHeadingKeyword)
  const listEndIndex = findListEndIndex(maskBrackets(textWithoutHeadings), language)
  const ingredientListText = removeLeadingHeading(textWithoutHeadings.slice(0, listEndIndex))
  const organicDeclaration = findOrganicDeclaration(
    textWithoutHeadings.slice(listEndIndex),
    language,
  )

  return splitIngredientList(ingredientListText)
    .map((segment) => parseIngredientCandidate(segment, language.organicKeywords))
    .filter((candidate) => candidate !== undefined)
    .map((candidate) => toParsedIngredient(candidate, organicDeclaration))
}
