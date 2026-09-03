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
  percentage: number | null
  comparator: string
}

export const formatIngredientLabel = (ingredient: IngredientLike): string => {
  if (ingredient.percentage === null) return ingredient.name
  const comparator = ingredient.comparator === '=' ? '' : `${ingredient.comparator} `
  return `${ingredient.name} ${comparator}${ingredient.percentage} %`
}

export const sortIngredientsByPercentageDesc = <T extends IngredientLike>(ingredients: T[]): T[] =>
  [...ingredients].sort((a, b) => {
    if (a.percentage === null && b.percentage === null) return 0
    if (a.percentage === null) return 1
    if (b.percentage === null) return -1
    return b.percentage - a.percentage
  })
