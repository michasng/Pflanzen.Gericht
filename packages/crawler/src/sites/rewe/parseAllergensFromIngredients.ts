import type { Allergen } from '@pflanzen-gericht/contracts'

// EU labelling law requires allergenic ingredients to be printed in capitals
// within the ingredient list, so REWE has no separate allergens field.
const ALLERGEN_CAPS_PATTERNS: readonly (readonly [Allergen, RegExp])[] = [
  // Matched anywhere so compounds like VOLLKORNHAFER or HARTWEIZENGRIESS count.
  ['gluten', /WEIZEN|GERSTE|HAFER|ROGGEN|DINKEL|GLUTEN/],
  ['soy', /SOJA/],
  // Compound stems (ERDNUSS, HASELNUSS, ...) are listed explicitly so KOKOSNUSS/MUSKATNUSS don't match.
  ['nuts', /\b(N[ÜU]SS|(ERD|HASEL|WAL|PEKAN|PARA)N[ÜU]SS|MANDEL|CASHEW|PISTAZIE|MACADAMIA)\w*\b/],
]

export const parseAllergensFromIngredients = (ingredientsRawText: string): Allergen[] =>
  ALLERGEN_CAPS_PATTERNS.filter(([, pattern]) => pattern.test(ingredientsRawText)).map(
    ([allergen]) => allergen,
  )
