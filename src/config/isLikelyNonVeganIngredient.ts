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
