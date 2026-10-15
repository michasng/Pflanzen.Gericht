import type { Base } from '@pflanzen-gericht/contracts'

// Checked per word in this order, so compounds resolve to the more specific base
// (e.g. "Kichererbsen" is chickpea, not pea).
const BASE_KEYWORDS: readonly (readonly [Base, readonly string[]])[] = [
  ['mycoprotein', ['mykoprotein', 'mycoprotein']],
  ['chickpea', ['kichererbse']],
  ['pea', ['erbse']],
  ['soy', ['soja', 'tofu', 'tempeh', 'edamame']],
  ['oat', ['hafer']],
  ['wheat', ['weizen', 'seitan']],
  ['lupin', ['lupin']],
  ['lentil', ['linse']],
  ['fava', ['ackerbohne', 'favabohne']],
  ['mung', ['mungbohne']],
  ['almond', ['mandel']],
  ['cashew', ['cashew']],
  ['peanut', ['erdnuss', 'erdnüss', 'erdnuß', 'peanut']],
  ['hazelnut', ['haselnuss', 'haselnüss', 'haselnuß']],
  ['pistachio', ['pistazie']],
  ['walnut', ['walnuss', 'walnüss', 'walnuß']],
  ['coconut', ['kokos']],
  ['rice', ['reis']],
  ['hemp', ['hanf']],
  ['sunflower', ['sonnenblumenkern']],
  ['sesame', ['sesam']],
  ['jackfruit', ['jackfrucht', 'jackfruit']],
  ['sugar', ['zucker', 'dextrose', 'sugar']],
]

// Words containing these are additives, condiments or false friends, not the product's base.
const IGNORED_WORD_PARTS = [
  'lecithin',
  'sirup',
  'soße',
  'sauce',
  'essig',
  'buchweizen',
  'preisel',
  'zuckermais',
  'polydextrose',
]

// Precautionary statements ("Kann Spuren von Soja enthalten") follow the actual ingredient list.
const TRACE_STATEMENT_PATTERN = /\b(?:kann|spuren|hergestellt)\b/i
const WORD_SEPARATOR_PATTERN = /[^\p{L}]+/u

const resolveBaseFromWord = (word: string): Base | null => {
  if (IGNORED_WORD_PARTS.some((part) => word.includes(part))) return null
  const match = BASE_KEYWORDS.find(([, keywords]) =>
    keywords.some((keyword) => word.includes(keyword)),
  )
  return match?.[0] ?? null
}

/**
 * Ingredients are declared in descending order of weight, so the first
 * ingredient naming a base is the dominant one.
 */
export const resolveBaseFromIngredients = (ingredientsRawText: string | null): Base | null => {
  if (!ingredientsRawText) return null
  const [declaredIngredients = ''] = ingredientsRawText.split(TRACE_STATEMENT_PATTERN)
  for (const word of declaredIngredients.toLowerCase().split(WORD_SEPARATOR_PATTERN)) {
    const base = resolveBaseFromWord(word)
    if (base) return base
  }
  return null
}
