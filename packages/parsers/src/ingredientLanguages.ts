import type { IngredientLanguage } from './ingredientLanguage.js'

export const INGREDIENT_LANGUAGE_DE: IngredientLanguage = {
  organicKeywords: ['bio', 'öko'],
  listEndKeywords: [
    'Kann',
    'Hinweis',
    'Warnung',
    'Allergenhinweis',
    'Enthält',
    'Von Natur aus',
    'Demeter-Anteil',
    'Kakao:',
  ],
  allIngredientsOrganicPhrases: ['alle zutaten'],
  abbreviations: ['u.', 'mind.', 'sp.'],
  ingredientsHeadingKeyword: 'Zutaten',
}

export const INGREDIENT_LANGUAGE_EN: IngredientLanguage = {
  organicKeywords: ['organic', 'eco'],
  listEndKeywords: ['may contain'],
  allIngredientsOrganicPhrases: ['all ingredients'],
  abbreviations: ['sp.'],
  ingredientsHeadingKeyword: 'Ingredients',
}
