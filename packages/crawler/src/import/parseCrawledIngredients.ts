import { ORGANIC_KEYWORDS_DE, parseIngredientsText } from '@pflanzen-gericht/parsers'

const DEFAULT_COMPARATOR = '='

export interface CrawledIngredientRecord {
  name: string
  comparator: string
  fraction_basis_points: number | null
}

export const parseCrawledIngredients = (ingredientsRawText: string): CrawledIngredientRecord[] =>
  parseIngredientsText(ingredientsRawText, ORGANIC_KEYWORDS_DE).map(
    ({ name, fractionBasisPoints }) => ({
      name,
      comparator: DEFAULT_COMPARATOR,
      fraction_basis_points: fractionBasisPoints,
    }),
  )
