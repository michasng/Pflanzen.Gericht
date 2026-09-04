import { BASIS_POINTS_PER_WHOLE } from '@/lib/basisPoints'

export const INGREDIENT_COMPARATOR_LABELS = {
  '=': '=',
  '≈': '≈',
  '<': '<',
  '≤': '≤',
  '≥': '≥',
  '>': '>',
} as const
export type IngredientComparator = keyof typeof INGREDIENT_COMPARATOR_LABELS
export const INGREDIENT_COMPARATORS = Object.keys(
  INGREDIENT_COMPARATOR_LABELS,
) as IngredientComparator[]
export const DEFAULT_INGREDIENT_COMPARATOR: IngredientComparator = '='

// Comparators whose fraction is guaranteed to be at least the stored value;
// used to detect impossible ingredient lists that would add up to over 100 %.
const MINIMUM_GUARANTEED_COMPARATORS: IngredientComparator[] = ['=', '≈', '≥', '>']

// Heuristic keywords indicating a non-vegan ingredient; not exhaustive, used only for a form warning
export const NON_VEGAN_INGREDIENT_KEYWORDS = [
  'Milch',
  'Sahne',
  'Butter',
  'Käse',
  'Joghurt',
  'Molke',
  'Molkenerzeugnis',
  'Eier',
  'Eiklar',
  'Eigelb',
  'Vollei',
  'Eipulver',
  'Honig',
  'Gelatine',
  'Schmalz',
  'Talg',
  'Fischöl',
  'Bienenwachs',
  'Kasein',
  'Casein',
  'Laktose',
  'Lactose',
  'Karmin',
  'Schellack',
] as const

export const isLikelyNonVeganIngredient = (name: string): boolean => {
  const normalizedName = name.trim().toLowerCase()
  if (!normalizedName) return false
  return NON_VEGAN_INGREDIENT_KEYWORDS.some((keyword) =>
    normalizedName.includes(keyword.toLowerCase()),
  )
}

export interface IngredientLike {
  name: string
  fractionBasisPoints: number | null
  comparator: IngredientComparator
}

export const sortIngredientsByFractionDesc = <T extends IngredientLike>(ingredients: T[]): T[] =>
  [...ingredients].sort((a, b) => {
    if (a.fractionBasisPoints === null && b.fractionBasisPoints === null) return 0
    if (a.fractionBasisPoints === null) return 1
    if (b.fractionBasisPoints === null) return -1
    return b.fractionBasisPoints - a.fractionBasisPoints
  })

export const sumGuaranteedFractionBasisPoints = (ingredients: IngredientLike[]): number =>
  ingredients
    .filter(
      (ingredient) =>
        ingredient.fractionBasisPoints !== null &&
        MINIMUM_GUARANTEED_COMPARATORS.includes(ingredient.comparator),
    )
    .reduce((sum, ingredient) => sum + (ingredient.fractionBasisPoints ?? 0), 0)

export const exceedsWholeFraction = (totalBasisPoints: number): boolean =>
  totalBasisPoints > BASIS_POINTS_PER_WHOLE
