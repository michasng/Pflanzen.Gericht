import type { Category } from '@pflanzen-gericht/contracts'

// Keyword -> category resolution shared across German grocery delivery sites.
// This is domain knowledge (product taxonomy), not site DOM logic, so it is
// safe to share between otherwise independent site crawlers.
// Order matters: more specific keyword groups are checked before broader ones.
const CATEGORY_KEYWORDS: readonly (readonly [Category, readonly string[]])[] = [
  [
    'meat',
    [
      'fleisch',
      'schnitzel',
      'geschnetzeltes',
      'filet',
      'steak',
      'döner',
      'gyros',
      'hähnchen',
      'chicken',
      'hack',
    ],
  ],
  ['sausage', ['wurst', 'salami', 'schinken', 'speck', 'wiener', 'mortadella', 'bratwurst']],
  ['fish', ['fisch', 'lachs', 'thunfisch', 'garnele', 'shrimp', 'krabbe']],
  ['cheese', ['käse', 'frischkäse', 'mozzarella', 'feta', 'parmesan', 'cheddar', 'halloumi']],
  ['yogurt', ['joghurt', 'skyr', 'quark']],
  ['cream', ['sahne', 'schmand', 'creme fraiche', 'crème fraîche', 'cream cheese']],
  ['milk', ['milch', 'drink', 'barista']],
  ['eggs', ['rührei', 'eiersatz', 'ei-ersatz']],
  // protein bars/sports nutrition are treated as sweets, not "other"
  [
    'sweets',
    [
      'sportnahrung',
      'proteinriegel',
      'protein bar',
      'protein-riegel',
      'schokolade',
      'gummibärchen',
      'keks',
      'kuchen',
      'praline',
      'süßware',
    ],
  ],
  ['ice_cream', ['eis', 'sorbet', 'gelato']],
  [
    'spread',
    [
      'aufstrich',
      'brotaufstrich',
      'streichcreme',
      'hummus',
      'nussmus',
      'mandelmus',
      'cashewmus',
      'erdnussbutter',
      'mandelbutter',
      'nussbutter',
      'tahin',
      'nougat',
      'schokocreme',
      'marmelade',
      'konfitüre',
    ],
  ],
  ['snack', ['chips', 'cracker', 'flips', 'snack']],
  [
    'ready_meal',
    [
      'fertiggericht',
      'pizza',
      'lasagne',
      'bowl',
      'curry',
      'suppe',
      'wrap',
      'bagel',
      'burger',
      'nuggets',
    ],
  ],
  ['other', ['tofu', 'falafel', 'tempeh', 'seitan', 'pesto']],
]

/**
 * Resolves an app Category from free-form site text (breadcrumbs, product
 * name/description). Texts are checked in the given order and the first
 * one that matches any category wins - callers should pass the most
 * specific text (e.g. the product name) first, since broader texts (e.g.
 * breadcrumbs) can contain unrelated keywords. Returns null when no text
 * matches - callers must treat null as a failure to fix, never silently
 * default to "other".
 */
export const resolveCategoryFromKeywords = (
  texts: readonly (string | null | undefined)[],
): Category | null => {
  for (const text of texts) {
    if (!text) continue
    const lowerCaseText = text.toLowerCase()
    for (const [category, keywords] of CATEGORY_KEYWORDS) {
      if (keywords.some((keyword) => lowerCaseText.includes(keyword))) return category
    }
  }
  return null
}
